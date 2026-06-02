from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.cashbox import Cashbox, CashSession
from app.models.sale import Sale
from app.schemas.cashboxes import (
    CashboxCreate,
    CashboxResponse,
    CashboxUpdate,
    CashSessionCloseRequest,
    CashSessionOpenRequest,
    CashSessionResponse,
)

cashboxes_router = APIRouter(prefix="/api/v1/cashboxes", tags=["cashboxes"])
sessions_router = APIRouter(prefix="/api/v1/cash-sessions", tags=["cash-sessions"])


async def _get_cashbox_or_404(cashbox_id: str, owner_id: str, db: AsyncSession) -> Cashbox:
    result = await db.execute(
        select(Cashbox).where(
            Cashbox.id == cashbox_id,
            Cashbox.owner_id == owner_id,
            Cashbox.active == True,
        )
    )
    cb = result.scalar_one_or_none()
    if cb is None:
        raise HTTPException(status_code=404, detail="caja no encontrada")
    return cb


# ── Cashboxes ─────────────────────────────────────────────────────────────────

@cashboxes_router.get("", response_model=list[CashboxResponse])
async def list_cashboxes(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Cashbox)
        .where(Cashbox.owner_id == user.owner_id, Cashbox.active == True)
        .order_by(Cashbox.created_at.desc())
    )
    return result.scalars().all()


@cashboxes_router.post("", response_model=CashboxResponse, status_code=201)
async def create_cashbox(
    body: CashboxCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cb = Cashbox(owner_id=user.owner_id, **body.model_dump())
    db.add(cb)
    await db.commit()
    await db.refresh(cb)
    return cb


@cashboxes_router.patch("/{cashbox_id}", response_model=CashboxResponse)
async def update_cashbox(
    cashbox_id: str,
    body: CashboxUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cb = await _get_cashbox_or_404(cashbox_id, user.owner_id, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(cb, field, value)
    await db.commit()
    await db.refresh(cb)
    return cb


@cashboxes_router.delete("/{cashbox_id}", status_code=204)
async def delete_cashbox(
    cashbox_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cb = await _get_cashbox_or_404(cashbox_id, user.owner_id, db)
    cb.active = False
    await db.commit()


@cashboxes_router.get("/{cashbox_id}/balance")
async def cashbox_balance(
    cashbox_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_cashbox_or_404(cashbox_id, user.owner_id, db)
    stmt = select(Sale).where(
        Sale.owner_id == user.owner_id,
        Sale.cashbox_id == cashbox_id,
        Sale.status == "paid",
    )
    if start_date:
        stmt = stmt.where(Sale.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Sale.created_at <= end_date)
    result = await db.execute(stmt)
    sales = result.scalars().all()

    total = round(sum(s.total for s in sales), 2)
    count = len(sales)
    by_method: dict = {}
    for s in sales:
        by_method[s.payment_method] = round(by_method.get(s.payment_method, 0) + s.total, 2)

    return {"total": total, "count": count, "by_payment_method": by_method}


# ── Cash Sessions ─────────────────────────────────────────────────────────────

@sessions_router.post("/open", response_model=CashSessionResponse, status_code=201)
async def open_session(
    body: CashSessionOpenRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check for existing open session with same cashbox_id
    existing_stmt = select(CashSession).where(
        CashSession.owner_id == user.owner_id,
        CashSession.status == "open",
        CashSession.cashbox_id == body.cashbox_id,
    )
    existing_result = await db.execute(existing_stmt)
    existing = existing_result.scalar_one_or_none()
    if existing:
        if body.cashbox_id:
            msg = f"ya hay una sesión abierta para esta caja por {existing.cashier_name or 'un cajero'}"
        else:
            msg = "ya hay una sesión abierta sin caja asignada"
        raise HTTPException(status_code=400, detail=msg)

    # Calculate pending debt at open
    pending_result = await db.execute(
        select(Sale).where(Sale.owner_id == user.owner_id, Sale.status == "pending")
    )
    pending_debt = sum(s.total for s in pending_result.scalars().all())

    session = CashSession(
        owner_id=user.owner_id,
        cashbox_id=body.cashbox_id,
        cashier_id=user.id,
        cashier_name=user.name,
        opening_balance=body.opening_balance,
        debt_pending_at_open=round(pending_debt, 2),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@sessions_router.get("/current", response_model=CashSessionResponse)
async def get_current_session(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CashSession)
        .where(CashSession.owner_id == user.owner_id, CashSession.status == "open")
        .order_by(CashSession.opened_at.desc())
    )
    session = result.scalars().first()
    if session is None:
        raise HTTPException(status_code=404, detail="no hay sesión abierta")
    return session


@sessions_router.get("", response_model=list[CashSessionResponse])
async def list_sessions(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CashSession)
        .where(CashSession.owner_id == user.owner_id)
        .order_by(CashSession.opened_at.desc())
    )
    return result.scalars().all()


@sessions_router.post("/{session_id}/close", response_model=CashSessionResponse)
async def close_session(
    session_id: str,
    body: CashSessionCloseRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CashSession).where(
            CashSession.id == session_id,
            CashSession.owner_id == user.owner_id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="sesión no encontrada")
    if session.status == "closed":
        raise HTTPException(status_code=400, detail="la sesión ya está cerrada")

    # Calculate totals from sales since opened_at
    sales_result = await db.execute(
        select(Sale).where(
            Sale.owner_id == user.owner_id,
            Sale.created_at >= session.opened_at,
            Sale.status == "paid",
        )
    )
    paid_sales = sales_result.scalars().all()
    total_sales = round(sum(s.total for s in paid_sales), 2)
    by_method: dict = {}
    for s in paid_sales:
        by_method[s.payment_method] = round(by_method.get(s.payment_method, 0) + s.total, 2)

    # Debt collected = pending debts that were paid since session opened
    paid_debts_result = await db.execute(
        select(Sale).where(
            Sale.owner_id == user.owner_id,
            Sale.created_at >= session.opened_at,
            Sale.status == "paid",
            Sale.payment_method != "cash",
        )
    )

    # Current pending
    pending_result = await db.execute(
        select(Sale).where(Sale.owner_id == user.owner_id, Sale.status == "pending")
    )
    pending_debt = round(sum(s.total for s in pending_result.scalars().all()), 2)

    debt_collected = 0.0
    if session.debt_pending_at_open is not None:
        debt_collected = max(0.0, round(session.debt_pending_at_open - pending_debt, 2))

    session.status = "closed"
    session.closed_at = datetime.now(timezone.utc)
    session.total_sales = total_sales
    session.total_by_method = by_method
    session.debt_collected = debt_collected
    session.debt_pending_at_close = pending_debt
    session.notes = body.notes
    session.discrepancies = body.discrepancies
    await db.commit()
    await db.refresh(session)
    return session


@sessions_router.get("/{session_id}/stats")
async def session_stats(
    session_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CashSession).where(
            CashSession.id == session_id,
            CashSession.owner_id == user.owner_id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="sesión no encontrada")

    sales_result = await db.execute(
        select(Sale).where(
            Sale.owner_id == user.owner_id,
            Sale.created_at >= session.opened_at,
            Sale.status != "cancelled",
        )
    )
    sales = sales_result.scalars().all()
    paid = [s for s in sales if s.status == "paid"]
    pending = [s for s in sales if s.status == "pending"]

    total_sales = round(sum(s.total for s in paid), 2)
    by_method: dict = {}
    for s in paid:
        by_method[s.payment_method] = round(by_method.get(s.payment_method, 0) + s.total, 2)

    return {
        "total_sales": total_sales,
        "total_by_method": by_method,
        "sales_count": len(sales),
        "paid_count": len(paid),
        "pending_count": len(pending),
    }

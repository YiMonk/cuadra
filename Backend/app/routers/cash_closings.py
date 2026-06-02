from datetime import datetime, timezone
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.closing import CashClosing
from app.models.sale import Sale
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/cash-closings", tags=["cash-closings"])


class CashClosingCreate(BaseModel):
    cashbox_ids: list[str] = Field(default_factory=list)
    includes_unassigned: bool = False
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    notes: Optional[str] = None


class CashClosingResponse(BaseModel):
    id: str
    owner_id: str
    cashier_id: Optional[str] = None
    cashbox_ids: Optional[Any] = None
    includes_unassigned: Any = False
    total: float
    total_by_method: Optional[Any] = None
    sales_count: int
    notes: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    closed_at: datetime

    model_config = {"from_attributes": True}


@router.post("", response_model=CashClosingResponse, status_code=201)
async def create_closing(
    body: CashClosingCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Sale).where(
        Sale.owner_id == user.owner_id,
        Sale.status != "cancelled",
        Sale.closed_in_closing_id == None,
    )
    if body.period_start:
        stmt = stmt.where(Sale.created_at >= body.period_start)
    if body.period_end:
        stmt = stmt.where(Sale.created_at <= body.period_end)

    result = await db.execute(stmt)
    all_sales = result.scalars().all()

    # Filter by cashbox_ids
    sales = []
    for s in all_sales:
        if s.cashbox_id in body.cashbox_ids:
            sales.append(s)
        elif body.includes_unassigned and s.cashbox_id is None:
            sales.append(s)

    total = round(sum(s.total for s in sales), 2)
    by_method: dict = {}
    for s in sales:
        by_method[s.payment_method] = round(by_method.get(s.payment_method, 0) + s.total, 2)

    closing = CashClosing(
        owner_id=user.owner_id,
        cashier_id=user.id,
        cashbox_ids=body.cashbox_ids,
        includes_unassigned=body.includes_unassigned,
        total=total,
        total_by_method=by_method,
        sales_count=len(sales),
        notes=body.notes,
        period_start=body.period_start,
        period_end=body.period_end,
    )
    db.add(closing)
    await db.flush()

    for s in sales:
        s.closed_in_closing_id = closing.id

    await db.commit()
    await db.refresh(closing)
    return closing


@router.get("", response_model=list[CashClosingResponse])
async def list_closings(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CashClosing)
        .where(CashClosing.owner_id == user.owner_id)
        .order_by(CashClosing.closed_at.desc())
    )
    return result.scalars().all()


@router.get("/today/last", response_model=CashClosingResponse)
async def last_closing_today(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import date
    today = date.today()
    start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
    result = await db.execute(
        select(CashClosing)
        .where(CashClosing.owner_id == user.owner_id, CashClosing.closed_at >= start)
        .order_by(CashClosing.closed_at.desc())
    )
    closing = result.scalars().first()
    if closing is None:
        raise HTTPException(status_code=404, detail="no hay cierres hoy")
    return closing


@router.get("/{closing_id}", response_model=CashClosingResponse)
async def get_closing(
    closing_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CashClosing).where(
            CashClosing.id == closing_id,
            CashClosing.owner_id == user.owner_id,
        )
    )
    closing = result.scalar_one_or_none()
    if closing is None:
        raise HTTPException(status_code=404, detail="cierre no encontrado")
    return closing

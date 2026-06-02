from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.expense import Expense
from app.schemas.expenses import ExpenseCreate, ExpenseResponse, ExpenseUpdate

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


async def _get_expense_or_404(expense_id: str, owner_id: str, db: AsyncSession) -> Expense:
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.owner_id == owner_id,
        )
    )
    expense = result.scalar_one_or_none()
    if expense is None:
        raise HTTPException(status_code=404, detail="gasto no encontrado")
    return expense


@router.get("", response_model=list[ExpenseResponse])
async def list_expenses(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Expense).where(Expense.owner_id == user.owner_id)
    if start_date:
        stmt = stmt.where(Expense.paid_at >= start_date)
    if end_date:
        stmt = stmt.where(Expense.paid_at <= end_date)
    stmt = stmt.order_by(Expense.paid_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    body: ExpenseCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = body.model_dump()
    if data.get("paid_at") is None:
        from datetime import timezone
        data["paid_at"] = datetime.now(timezone.utc)
    expense = Expense(owner_id=user.owner_id, created_by=user.id, **data)
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.patch("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    body: ExpenseUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expense = await _get_expense_or_404(expense_id, user.owner_id, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expense = await _get_expense_or_404(expense_id, user.owner_id, db)
    await db.delete(expense)
    await db.commit()

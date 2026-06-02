from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.closing import Return
from app.models.product import Product, StockMovement
from app.models.sale import Sale, SaleItem
from pydantic import BaseModel, Field

router = APIRouter(tags=["returns"])


class ReturnItemRequest(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


class ReturnCreate(BaseModel):
    sale_id: str
    items: list[ReturnItemRequest] = Field(min_length=1)
    reason: str = Field(min_length=1)


class ReturnResponse(BaseModel):
    id: str
    owner_id: str
    sale_id: str
    created_by: Optional[str] = None
    reason: str
    total_refund: float
    items: Optional[Any] = None

    model_config = {"from_attributes": True}


@router.post("/api/v1/returns", response_model=ReturnResponse, status_code=201)
async def create_return(
    body: ReturnCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get sale
    sale_result = await db.execute(
        select(Sale).where(Sale.id == body.sale_id, Sale.owner_id == user.owner_id)
    )
    sale = sale_result.scalar_one_or_none()
    if sale is None:
        raise HTTPException(status_code=404, detail="venta no encontrada")
    if sale.status != "paid":
        raise HTTPException(status_code=400, detail="solo se pueden devolver ventas pagadas")

    # Get sale items indexed by product_id
    items_result = await db.execute(select(SaleItem).where(SaleItem.sale_id == sale.id))
    sale_items_map: dict[str, SaleItem] = {si.product_id: si for si in items_result.scalars().all()}

    # Validate return items
    for item in body.items:
        si = sale_items_map.get(item.product_id)
        if si is None:
            raise HTTPException(
                status_code=400,
                detail=f"{item.product_id} no está en esta venta",
            )
        if item.quantity > si.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"no puedes devolver {item.quantity} de {si.product_name} (vendidos: {si.quantity})",
            )

    # Restore stock and build return record
    total_refund = 0.0
    serialized_items = []
    movements = []
    for item in body.items:
        si = sale_items_map[item.product_id]
        prod_result = await db.execute(
            select(Product).where(Product.id == item.product_id)
        )
        prod = prod_result.scalar_one_or_none()
        if prod:
            prod.stock += item.quantity
            movements.append(StockMovement(
                owner_id=user.owner_id,
                product_id=prod.id,
                adjustment=item.quantity,
                reason="return",
                user_id=user.id,
            ))
        total_refund += item.quantity * si.unit_price
        serialized_items.append({
            "product_id": item.product_id,
            "product_name": si.product_name,
            "quantity": item.quantity,
            "unit_price": si.unit_price,
        })

    db.add_all(movements)
    sale.has_returns = True

    ret = Return(
        owner_id=user.owner_id,
        sale_id=sale.id,
        created_by=user.id,
        reason=body.reason,
        total_refund=round(total_refund, 2),
        items=serialized_items,
    )
    db.add(ret)
    await db.commit()
    await db.refresh(ret)
    return ret


@router.get("/api/v1/sales/{sale_id}/returns", response_model=list[ReturnResponse])
async def list_returns_for_sale(
    sale_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Return).where(Return.sale_id == sale_id, Return.owner_id == user.owner_id)
    )
    return result.scalars().all()

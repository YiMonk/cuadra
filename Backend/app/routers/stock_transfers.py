from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.closing import StockTransfer
from app.models.location import Location
from app.models.product import Product, StockMovement
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/stock-transfers", tags=["stock-transfers"])


class TransferItemRequest(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


class StockTransferCreate(BaseModel):
    from_location_id: str
    to_location_id: str
    items: list[TransferItemRequest] = Field(min_length=1)
    notes: Optional[str] = None


class StockTransferResponse(BaseModel):
    id: str
    owner_id: str
    from_location_id: str
    to_location_id: str
    created_by: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[Any] = None

    model_config = {"from_attributes": True}


async def _get_location_or_404(loc_id: str, owner_id: str, db: AsyncSession) -> Location:
    result = await db.execute(
        select(Location).where(
            Location.id == loc_id,
            Location.owner_id == owner_id,
            Location.active == True,
        )
    )
    loc = result.scalar_one_or_none()
    if loc is None:
        raise HTTPException(status_code=404, detail=f"sucursal {loc_id} no encontrada")
    return loc


@router.post("", response_model=StockTransferResponse, status_code=201)
async def create_transfer(
    body: StockTransferCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.from_location_id == body.to_location_id:
        raise HTTPException(
            status_code=400, detail="origen y destino no pueden ser la misma sucursal"
        )

    await _get_location_or_404(body.from_location_id, user.owner_id, db)
    await _get_location_or_404(body.to_location_id, user.owner_id, db)

    # Load all products and check stock
    products: dict[str, Product] = {}
    for item in body.items:
        result = await db.execute(
            select(Product).where(
                Product.id == item.product_id,
                Product.owner_id == user.owner_id,
                Product.active == True,
            )
        )
        prod = result.scalar_one_or_none()
        if prod is None:
            raise HTTPException(status_code=404, detail=f"producto {item.product_id} no encontrado")
        products[item.product_id] = prod

    # Validate stock before mutating
    for item in body.items:
        prod = products[item.product_id]
        if prod.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"stock insuficiente en origen para {prod.name}",
            )

    # Apply transfers
    movements = []
    serialized_items = []
    for item in body.items:
        prod = products[item.product_id]
        prod.stock -= item.quantity
        movements.append(StockMovement(
            owner_id=user.owner_id,
            product_id=prod.id,
            adjustment=-item.quantity,
            reason="transfer_out",
            user_id=user.id,
        ))
        movements.append(StockMovement(
            owner_id=user.owner_id,
            product_id=prod.id,
            adjustment=item.quantity,
            reason="transfer_in",
            user_id=user.id,
        ))
        # We add to stock for destination — in a real multi-location setup
        # you'd use stock_by_location; for now we just add back to main stock
        prod.stock += item.quantity
        serialized_items.append({"product_id": item.product_id, "quantity": item.quantity})

    db.add_all(movements)

    transfer = StockTransfer(
        owner_id=user.owner_id,
        from_location_id=body.from_location_id,
        to_location_id=body.to_location_id,
        created_by=user.id,
        notes=body.notes,
        items=serialized_items,
    )
    db.add(transfer)
    await db.commit()
    await db.refresh(transfer)
    return transfer


@router.get("", response_model=list[StockTransferResponse])
async def list_transfers(
    limit: int = 100,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StockTransfer)
        .where(StockTransfer.owner_id == user.owner_id)
        .order_by(StockTransfer.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{transfer_id}", response_model=StockTransferResponse)
async def get_transfer(
    transfer_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StockTransfer).where(
            StockTransfer.id == transfer_id,
            StockTransfer.owner_id == user.owner_id,
        )
    )
    transfer = result.scalar_one_or_none()
    if transfer is None:
        raise HTTPException(status_code=404, detail="transferencia no encontrada")
    return transfer

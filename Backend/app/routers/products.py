from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.product import Product, StockMovement
from app.schemas.products import (
    BulkProductRequest,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    StockAdjustRequest,
)
from app.services import audit_service

router = APIRouter(prefix="/api/v1/products", tags=["products"])


async def _get_product_or_404(product_id: str, owner_id: str, db: AsyncSession) -> Product:
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.owner_id == owner_id,
            Product.active == True,
        )
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="producto no encontrado")
    return product


@router.get("", response_model=list[ProductResponse])
async def list_products(
    location_id: Optional[str] = None,
    category: Optional[str] = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product).where(
        Product.owner_id == user.owner_id,
        Product.active == True,
    )
    if location_id:
        stmt = stmt.where(Product.location_id == location_id)
    if category:
        stmt = stmt.where(Product.category == category)
    stmt = stmt.order_by(Product.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_product_or_404(product_id, user.owner_id, db)


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    body: ProductCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    product = Product(owner_id=user.owner_id, **body.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    body: ProductUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
):
    product = await _get_product_or_404(product_id, user.owner_id, db)
    before = audit_service.snapshot(product)
    old_price = product.price
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    after = audit_service.snapshot(product)

    if old_price != product.price:
        await audit_service.log(
            db,
            action="product.updated",
            entity_type="product",
            entity_id=product_id,
            user=user,
            request=request,
            before=before,
            after=after,
        )

    return product


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    product = await _get_product_or_404(product_id, user.owner_id, db)
    product.active = False
    await db.commit()


@router.post("/{product_id}/adjust-stock", response_model=ProductResponse)
async def adjust_stock(
    product_id: str,
    body: StockAdjustRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    product = await _get_product_or_404(product_id, user.owner_id, db)
    new_stock = product.stock + body.adjustment
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="stock insuficiente")
    product.stock = new_stock
    movement = StockMovement(
        owner_id=user.owner_id,
        product_id=product.id,
        adjustment=body.adjustment,
        reason=body.reason,
        variant_id=body.variant_id,
        note=body.note,
        user_id=user.id,
    )
    db.add(movement)
    await db.commit()
    await db.refresh(product)
    return product


@router.post("/bulk", response_model=dict, status_code=201)
async def bulk_create_products(
    body: BulkProductRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    products = [
        Product(owner_id=user.owner_id, **p.model_dump())
        for p in body.products
    ]
    db.add_all(products)
    await db.commit()
    return {"inserted": len(products)}

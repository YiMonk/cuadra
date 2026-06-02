from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.supplier import Supplier
from app.schemas.suppliers import SupplierCreate, SupplierResponse, SupplierUpdate

router = APIRouter(prefix="/api/v1/suppliers", tags=["suppliers"])


async def _get_supplier_or_404(supplier_id: str, owner_id: str, db: AsyncSession) -> Supplier:
    result = await db.execute(
        select(Supplier).where(
            Supplier.id == supplier_id,
            Supplier.owner_id == owner_id,
            Supplier.active == True,
        )
    )
    supplier = result.scalar_one_or_none()
    if supplier is None:
        raise HTTPException(status_code=404, detail="proveedor no encontrado")
    return supplier


@router.get("", response_model=list[SupplierResponse])
async def list_suppliers(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Supplier)
        .where(Supplier.owner_id == user.owner_id, Supplier.active == True)
        .order_by(Supplier.name)
    )
    return result.scalars().all()


@router.post("", response_model=SupplierResponse, status_code=201)
async def create_supplier(
    body: SupplierCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    supplier = Supplier(owner_id=user.owner_id, **body.model_dump())
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return supplier


@router.patch("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: str,
    body: SupplierUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    supplier = await _get_supplier_or_404(supplier_id, user.owner_id, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    await db.commit()
    await db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}", status_code=204)
async def delete_supplier(
    supplier_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    supplier = await _get_supplier_or_404(supplier_id, user.owner_id, db)
    supplier.active = False
    await db.commit()

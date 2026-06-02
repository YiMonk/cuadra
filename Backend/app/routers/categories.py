from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.category import Category
from app.schemas.categories import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


async def _get_category_or_404(category_id: str, owner_id: str, db: AsyncSession) -> Category:
    result = await db.execute(
        select(Category).where(
            Category.id == category_id,
            Category.owner_id == owner_id,
        )
    )
    cat = result.scalar_one_or_none()
    if cat is None:
        raise HTTPException(status_code=404, detail="categoría no encontrada")
    return cat


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category)
        .where(Category.owner_id == user.owner_id)
        .order_by(Category.name)
    )
    return result.scalars().all()


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(
    body: CategoryCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.parent_id:
        parent = await db.execute(
            select(Category).where(
                Category.id == body.parent_id,
                Category.owner_id == user.owner_id,
            )
        )
        if parent.scalar_one_or_none() is None:
            raise HTTPException(status_code=400, detail="categoría padre no encontrada")

    cat = Category(owner_id=user.owner_id, **body.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    body: CategoryUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cat = await _get_category_or_404(category_id, user.owner_id, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cat = await _get_category_or_404(category_id, user.owner_id, db)
    children = await db.execute(
        select(Category).where(
            Category.parent_id == cat.id,
            Category.owner_id == user.owner_id,
        )
    )
    if children.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=400,
            detail="la categoría tiene subcategorías, elimínalas primero",
        )
    await db.delete(cat)
    await db.commit()

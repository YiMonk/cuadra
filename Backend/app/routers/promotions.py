from typing import Any, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.promotion import Coupon, PriceList, Promotion
from pydantic import BaseModel, Field

promotions_router = APIRouter(prefix="/api/v1/promotions", tags=["promotions"])
price_lists_router = APIRouter(prefix="/api/v1/price-lists", tags=["price-lists"])
coupons_router = APIRouter(prefix="/api/v1/coupons", tags=["coupons"])

PROMO_TYPES = Literal["percentage", "fixed", "buy_x_get_y"]


class PromotionCreate(BaseModel):
    name: str = Field(min_length=1)
    type: PROMO_TYPES
    value: Optional[float] = None
    min_purchase: Optional[float] = None
    applies_to: Optional[Any] = None


class PromotionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    type: Optional[PROMO_TYPES] = None
    value: Optional[float] = None
    min_purchase: Optional[float] = None
    applies_to: Optional[Any] = None
    active: Optional[bool] = None


class PromotionResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    type: str
    value: Optional[float] = None
    min_purchase: Optional[float] = None
    applies_to: Optional[Any] = None
    active: bool
    model_config = {"from_attributes": True}


class PriceListCreate(BaseModel):
    name: str = Field(min_length=1)
    items: Optional[Any] = None


class PriceListUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    items: Optional[Any] = None


class PriceListResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    items: Optional[Any] = None
    model_config = {"from_attributes": True}


class CouponCreate(BaseModel):
    code: str = Field(min_length=1)
    discount_type: str = "percentage"
    discount_value: float = Field(ge=0)
    min_purchase: Optional[float] = None
    max_uses: Optional[int] = None
    expires_at: Optional[Any] = None


class CouponUpdate(BaseModel):
    code: Optional[str] = Field(default=None, min_length=1)
    discount_type: Optional[str] = None
    discount_value: Optional[float] = Field(default=None, ge=0)
    min_purchase: Optional[float] = None
    max_uses: Optional[int] = None
    active: Optional[bool] = None


class CouponResponse(BaseModel):
    id: str
    owner_id: str
    code: str
    discount_type: str
    discount_value: float
    min_purchase: Optional[float] = None
    max_uses: Optional[int] = None
    used_count: int
    active: bool
    model_config = {"from_attributes": True}


# ── Promotions ────────────────────────────────────────────────────────────────

@promotions_router.get("", response_model=list[PromotionResponse])
async def list_promotions(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Promotion).where(Promotion.owner_id == user.owner_id)
    )
    return result.scalars().all()


@promotions_router.post("", response_model=PromotionResponse, status_code=201)
async def create_promotion(
    body: PromotionCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    promo = Promotion(owner_id=user.owner_id, **body.model_dump())
    db.add(promo)
    await db.commit()
    await db.refresh(promo)
    return promo


@promotions_router.patch("/{promo_id}", response_model=PromotionResponse)
async def update_promotion(
    promo_id: str,
    body: PromotionUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Promotion).where(Promotion.id == promo_id, Promotion.owner_id == user.owner_id)
    )
    promo = result.scalar_one_or_none()
    if promo is None:
        raise HTTPException(status_code=404, detail="promoción no encontrada")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(promo, field, value)
    await db.commit()
    await db.refresh(promo)
    return promo


@promotions_router.delete("/{promo_id}", status_code=204)
async def delete_promotion(
    promo_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Promotion).where(Promotion.id == promo_id, Promotion.owner_id == user.owner_id)
    )
    promo = result.scalar_one_or_none()
    if promo is None:
        raise HTTPException(status_code=404, detail="promoción no encontrada")
    promo.active = False
    await db.commit()


# ── Price Lists ───────────────────────────────────────────────────────────────

@price_lists_router.get("", response_model=list[PriceListResponse])
async def list_price_lists(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PriceList).where(PriceList.owner_id == user.owner_id)
    )
    return result.scalars().all()


@price_lists_router.post("", response_model=PriceListResponse, status_code=201)
async def create_price_list(
    body: PriceListCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pl = PriceList(owner_id=user.owner_id, **body.model_dump())
    db.add(pl)
    await db.commit()
    await db.refresh(pl)
    return pl


@price_lists_router.patch("/{pl_id}", response_model=PriceListResponse)
async def update_price_list(
    pl_id: str,
    body: PriceListUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PriceList).where(PriceList.id == pl_id, PriceList.owner_id == user.owner_id)
    )
    pl = result.scalar_one_or_none()
    if pl is None:
        raise HTTPException(status_code=404, detail="lista de precio no encontrada")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(pl, field, value)
    await db.commit()
    await db.refresh(pl)
    return pl


@price_lists_router.delete("/{pl_id}", status_code=204)
async def delete_price_list(
    pl_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PriceList).where(PriceList.id == pl_id, PriceList.owner_id == user.owner_id)
    )
    pl = result.scalar_one_or_none()
    if pl is None:
        raise HTTPException(status_code=404, detail="lista de precio no encontrada")
    await db.delete(pl)
    await db.commit()


# ── Coupons ───────────────────────────────────────────────────────────────────

@coupons_router.get("", response_model=list[CouponResponse])
async def list_coupons(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Coupon).where(Coupon.owner_id == user.owner_id)
    )
    return result.scalars().all()


@coupons_router.post("", response_model=CouponResponse, status_code=201)
async def create_coupon(
    body: CouponCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    code = body.code.upper().strip().replace(" ", "")
    # Check uniqueness
    existing = await db.execute(
        select(Coupon).where(Coupon.owner_id == user.owner_id, Coupon.code == code)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="código ya en uso")
    data = body.model_dump()
    data["code"] = code
    coupon = Coupon(owner_id=user.owner_id, **data)
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return coupon


@coupons_router.get("/lookup", response_model=CouponResponse)
async def lookup_coupon(
    code: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    normalized = code.upper().strip()
    result = await db.execute(
        select(Coupon).where(
            Coupon.owner_id == user.owner_id,
            Coupon.code == normalized,
            Coupon.active == True,
        )
    )
    coupon = result.scalar_one_or_none()
    if coupon is None:
        raise HTTPException(status_code=404, detail="cupón no encontrado o inactivo")
    return coupon


@coupons_router.post("/{coupon_id}/increment-usage", response_model=CouponResponse)
async def increment_usage(
    coupon_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Coupon).where(Coupon.id == coupon_id, Coupon.owner_id == user.owner_id)
    )
    coupon = result.scalar_one_or_none()
    if coupon is None:
        raise HTTPException(status_code=404, detail="cupón no encontrado")
    coupon.used_count += 1
    await db.commit()
    await db.refresh(coupon)
    return coupon


@coupons_router.patch("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: str,
    body: CouponUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Coupon).where(Coupon.id == coupon_id, Coupon.owner_id == user.owner_id)
    )
    coupon = result.scalar_one_or_none()
    if coupon is None:
        raise HTTPException(status_code=404, detail="cupón no encontrado")
    data = body.model_dump(exclude_unset=True)
    if "code" in data:
        data["code"] = data["code"].upper().strip().replace(" ", "")
    for field, value in data.items():
        setattr(coupon, field, value)
    await db.commit()
    await db.refresh(coupon)
    return coupon


@coupons_router.delete("/{coupon_id}", status_code=204)
async def delete_coupon(
    coupon_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Coupon).where(Coupon.id == coupon_id, Coupon.owner_id == user.owner_id)
    )
    coupon = result.scalar_one_or_none()
    if coupon is None:
        raise HTTPException(status_code=404, detail="cupón no encontrado")
    await db.delete(coupon)
    await db.commit()

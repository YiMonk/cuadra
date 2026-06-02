from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator


class ProductCreate(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(gt=0)
    description: Optional[str] = None
    cost: Optional[float] = Field(default=None, ge=0)
    stock: int = Field(default=0, ge=0)
    min_stock: Optional[int] = None
    category: Optional[str] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    unit: Optional[str] = None
    location_id: Optional[str] = None
    tags: Optional[Any] = None
    variants: Optional[Any] = None
    stock_by_location: Optional[Any] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    price: Optional[float] = Field(default=None, gt=0)
    description: Optional[str] = None
    cost: Optional[float] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    min_stock: Optional[int] = None
    category: Optional[str] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    unit: Optional[str] = None
    location_id: Optional[str] = None
    tags: Optional[Any] = None
    variants: Optional[Any] = None
    stock_by_location: Optional[Any] = None


class ProductResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    price: float
    description: Optional[str] = None
    cost: Optional[float] = None
    stock: int
    min_stock: Optional[int] = None
    category: Optional[str] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    unit: Optional[str] = None
    location_id: Optional[str] = None
    tags: Optional[Any] = None
    variants: Optional[Any] = None
    stock_by_location: Optional[Any] = None
    active: bool

    model_config = {"from_attributes": True}


class StockAdjustRequest(BaseModel):
    adjustment: int
    reason: str = Field(min_length=1)
    variant_id: Optional[str] = None
    note: Optional[str] = None

    @field_validator("adjustment")
    @classmethod
    def must_not_be_zero(cls, v: int) -> int:
        if v == 0:
            raise ValueError("adjustment must not be zero")
        return v


class BulkProductRequest(BaseModel):
    products: list[ProductCreate] = Field(min_length=1)

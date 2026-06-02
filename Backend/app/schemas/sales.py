from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


PAYMENT_METHODS = Literal["cash", "transfer", "mobile_pay", "credit"]


class SaleItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)
    unit_price: float = Field(gt=0)
    variant_id: Optional[str] = None


class SaleCreate(BaseModel):
    items: list[SaleItemCreate] = Field(min_length=1)
    payment_method: PAYMENT_METHODS
    client_id: Optional[str] = None
    discount: Optional[float] = Field(default=None, ge=0)
    exchange_rate_at_sale: Optional[float] = None
    notes: Optional[str] = None
    cashbox_id: Optional[str] = None


class SaleItemResponse(BaseModel):
    id: str
    sale_id: str
    product_id: str
    product_name: str
    variant_id: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class SaleResponse(BaseModel):
    id: str
    owner_id: str
    client_id: Optional[str] = None
    cashier_id: Optional[str] = None
    status: str
    payment_method: str
    total: float
    discount: Optional[float] = None
    exchange_rate_at_sale: Optional[float] = None
    notes: Optional[str] = None
    cancel_reason: Optional[str] = None
    cashbox_id: Optional[str] = None
    has_returns: bool
    paid_at: Optional[datetime] = None
    created_at: datetime
    items: list[SaleItemResponse] = []

    model_config = {"from_attributes": True}


class SaleStatusUpdate(BaseModel):
    status: Literal["paid"]
    payment_method: PAYMENT_METHODS


class CancelRequest(BaseModel):
    reason: str = Field(min_length=1)


class PayAllDebtsRequest(BaseModel):
    payment_method: PAYMENT_METHODS
    cashbox_id: Optional[str] = None

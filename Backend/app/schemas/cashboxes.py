from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class CashboxCreate(BaseModel):
    name: str = Field(min_length=1)
    location_id: Optional[str] = None
    assigned_user_id: Optional[str] = None


class CashboxUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    location_id: Optional[str] = None
    assigned_user_id: Optional[str] = None


class CashboxResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    location_id: Optional[str] = None
    assigned_user_id: Optional[str] = None
    active: bool

    model_config = {"from_attributes": True}


class CashSessionOpenRequest(BaseModel):
    cashbox_id: Optional[str] = None
    opening_balance: Optional[float] = None


class CashSessionCloseRequest(BaseModel):
    notes: Optional[str] = None
    discrepancies: Optional[float] = None


class CashSessionResponse(BaseModel):
    id: str
    owner_id: str
    cashbox_id: Optional[str] = None
    cashier_id: Optional[str] = None
    cashier_name: Optional[str] = None
    status: str
    opened_at: datetime
    closed_at: Optional[datetime] = None
    opening_balance: Optional[float] = None
    total_sales: Optional[float] = None
    total_by_method: Optional[Any] = None
    debt_collected: Optional[float] = None
    debt_pending_at_open: Optional[float] = None
    debt_pending_at_close: Optional[float] = None
    discrepancies: Optional[float] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}

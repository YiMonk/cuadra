from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    description: str = Field(min_length=1)
    amount: float = Field(gt=0)
    category: Optional[str] = None
    notes: Optional[str] = None
    paid_at: Optional[datetime] = None


class ExpenseUpdate(BaseModel):
    description: Optional[str] = Field(default=None, min_length=1)
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = None
    notes: Optional[str] = None
    paid_at: Optional[datetime] = None


class ExpenseResponse(BaseModel):
    id: str
    owner_id: str
    description: str
    amount: float
    category: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    paid_at: datetime

    model_config = {"from_attributes": True}

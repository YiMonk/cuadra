from typing import Optional
from pydantic import BaseModel, Field


class ClientCreate(BaseModel):
    name: str = Field(min_length=1)
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    total_debt: float
    active: bool

    model_config = {"from_attributes": True}

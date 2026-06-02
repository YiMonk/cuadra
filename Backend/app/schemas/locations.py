from typing import Optional
from pydantic import BaseModel, Field


class LocationCreate(BaseModel):
    name: str = Field(min_length=1)
    address: Optional[str] = None
    phone: Optional[str] = None


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    address: Optional[str] = None
    phone: Optional[str] = None


class LocationResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    active: bool

    model_config = {"from_attributes": True}

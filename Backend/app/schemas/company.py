from pydantic import BaseModel, ConfigDict, Field, field_validator
import json
from datetime import datetime


class CompanyCreate(BaseModel):
    name: str = Field(min_length=1)
    rif: str | None = None
    modules_enabled: list[str] = Field(default=["operativo"], min_length=1)


class CompanyUpdate(BaseModel):
    name: str | None = None
    rif: str | None = None
    modules_enabled: list[str] | None = Field(default=None, min_length=1)
    plan: str | None = None


class CompanySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    owner_user_id: str
    name: str
    rif: str | None = None
    plan: str
    modules_enabled: list[str]
    subscription_ends_at: datetime | None = None
    created_at: datetime

    @field_validator("modules_enabled", mode="before")
    @classmethod
    def parse_modules(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v

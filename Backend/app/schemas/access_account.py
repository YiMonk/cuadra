from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
import json
from typing import Literal


class AccessAccountCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1)
    role: Literal["cashier", "viewer"]
    module_access: list[str] = Field(min_length=1)


class AccessAccountUpdate(BaseModel):
    name: str | None = None
    role: Literal["cashier", "viewer"] | None = None
    module_access: list[str] | None = Field(default=None, min_length=1)


class AccessAccountPasswordUpdate(BaseModel):
    new_password: str = Field(min_length=8)


class AccessAccountStatusUpdate(BaseModel):
    active: bool


class AccessAccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    name: str
    role: str
    module_access: list[str]
    active: bool
    company_id: str | None = None

    @field_validator("module_access", mode="before")
    @classmethod
    def parse_modules(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v or []

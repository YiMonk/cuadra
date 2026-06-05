from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    role: str
    owner_id: Optional[str] = None
    active: bool
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    commission_pct: Optional[float] = None
    default_location_id: Optional[str] = None
    terms_accepted: bool = False
    onboarding_completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateMeRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    terms_accepted: Optional[bool] = None
    onboarding_completed_at: Optional[datetime] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("name cannot be empty")
        return v.strip() if v else v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v


class InviteTeamMemberRequest(BaseModel):
    email: EmailStr
    name: str
    role: str
    commission_pct: Optional[float] = None
    default_location_id: Optional[str] = None
    password: Optional[str] = None  # si no se envía, se genera aleatoriamente

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        allowed = {"admin", "cashier", "viewer"}
        if v not in allowed:
            raise ValueError(f"role must be one of: {', '.join(allowed)}")
        return v


class UpdateTeamMemberRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    commission_pct: Optional[float] = None
    default_location_id: Optional[str] = None
    active: Optional[bool] = None

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in {"admin", "cashier", "viewer"}:
            raise ValueError("role inválido (no puede ser owner)")
        return v

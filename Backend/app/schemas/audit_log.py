from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

EntityType = Literal[
    "sale",
    "user",
    "product",
    "stock_adjustment",
    "expense",
    "cash_closing",
    "payment",
]


class AuditLogEntry(BaseModel):
    id: str
    company_id: str
    user_id: str
    user_name: str
    action: str
    entity_type: str
    entity_id: str
    payload_before: Optional[str] = None
    payload_after: Optional[str] = None
    ip: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    entries: list[AuditLogEntry]
    next_cursor: Optional[str] = None

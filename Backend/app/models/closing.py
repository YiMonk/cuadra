import uuid
from datetime import datetime, timezone
from typing import Any, Optional
from sqlalchemy import DateTime, Float, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_id() -> str:
    return str(uuid.uuid4())


class CashClosing(Base):
    __tablename__ = "cash_closings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    owner_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    cashier_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cashbox_ids: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    includes_unassigned: Mapped[bool] = mapped_column(
        String, default=False, nullable=False
    )
    total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_by_method: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    sales_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


class StockTransfer(Base):
    __tablename__ = "stock_transfers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    owner_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    from_location_id: Mapped[str] = mapped_column(String, nullable=False)
    to_location_id: Mapped[str] = mapped_column(String, nullable=False)
    created_by: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    items: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


class Return(Base):
    __tablename__ = "returns"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    owner_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    sale_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    created_by: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    total_refund: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    items: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    owner_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    user_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    action: Mapped[str] = mapped_column(String, nullable=False)
    entity_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    extra_data: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

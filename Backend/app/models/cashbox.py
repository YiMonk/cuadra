import uuid
from datetime import datetime, timezone
from typing import Any, Optional
from sqlalchemy import Boolean, DateTime, Float, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_id() -> str:
    return str(uuid.uuid4())


class Cashbox(Base):
    __tablename__ = "cashboxes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    owner_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    location_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    assigned_user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )


class CashSession(Base):
    __tablename__ = "cash_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    owner_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    cashbox_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cashier_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cashier_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="open", nullable=False)
    opened_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    opening_balance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_sales: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_by_method: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    debt_collected: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    debt_pending_at_open: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    debt_pending_at_close: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    discrepancies: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)

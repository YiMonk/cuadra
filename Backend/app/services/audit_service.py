"""
Audit service — fire-and-forget logging of business actions.

Only exposes `log()` (insert) and `snapshot()` (read ORM state).
No update/delete methods exist by design.
"""
import json
import logging
from typing import Any

from fastapi import Request
from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

_ALWAYS_EXCLUDE = {"password_hash"}


def snapshot(entity: Any, exclude: list[str] | None = None) -> dict:
    """Serialize an ORM instance to a plain dict.

    Excludes ``password_hash`` and any additional field names in *exclude*.
    Works with SQLAlchemy 2 mapped classes by reading column attributes via
    ``sqlalchemy.inspect()``.
    """
    excluded = _ALWAYS_EXCLUDE | set(exclude or [])
    try:
        mapper = inspect(type(entity))
        result: dict = {}
        for attr in mapper.column_attrs:
            key = attr.key
            if key in excluded:
                continue
            value = getattr(entity, key, None)
            # Convert non-JSON-serializable types to strings
            if hasattr(value, "isoformat"):
                value = value.isoformat()
            result[key] = value
        return result
    except Exception:
        # Fallback: try __dict__ and filter internal SQLAlchemy keys
        return {
            k: v
            for k, v in vars(entity).items()
            if not k.startswith("_") and k not in excluded
        }


async def log(
    db: AsyncSession,
    *,
    action: str,
    entity_type: str,
    entity_id: str,
    user: Any,
    request: Request | None = None,
    before: dict | None = None,
    after: dict | None = None,
) -> None:
    """Insert an audit log entry. Fire-and-forget: never raises.

    If the DB insert fails, the error is logged at WARNING level and swallowed
    so the main operation response is not affected.
    """
    from app.models.audit_log import AuditLog  # local import to avoid circular

    company_id: str = getattr(user, "owner_id", None) or user.id
    ip: str | None = None
    if request is not None:
        try:
            ip = request.client.host if request.client else None
        except Exception:
            ip = None

    try:
        entry = AuditLog(
            company_id=company_id,
            user_id=user.id,
            user_name=user.name,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            payload_before=json.dumps(before, default=str) if before is not None else None,
            payload_after=json.dumps(after, default=str) if after is not None else None,
            ip=ip,
        )
        db.add(entry)
        await db.commit()
    except Exception:
        logger.warning(
            "audit_service.log failed — action=%s entity_type=%s entity_id=%s",
            action,
            entity_type,
            entity_id,
            exc_info=True,
        )

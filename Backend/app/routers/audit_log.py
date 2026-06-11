from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db, require_roles
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogEntry, AuditLogListResponse, EntityType

router = APIRouter(prefix="/api/v1/audit-log", tags=["audit-log"])


@router.get(
    "",
    response_model=AuditLogListResponse,
    dependencies=[Depends(require_roles("owner"))],
)
async def list_audit_log(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    user_id: Optional[str] = None,
    entity_type: Optional[EntityType] = None,
    page_size: int = 100,
    before_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Cap page_size at 100
    page_size = min(max(page_size, 1), 100)

    company_id = user.owner_id or user.id

    stmt = (
        select(AuditLog)
        .where(AuditLog.company_id == company_id)
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
    )

    if from_date is not None:
        from_dt = datetime(from_date.year, from_date.month, from_date.day, tzinfo=timezone.utc)
        stmt = stmt.where(AuditLog.created_at >= from_dt)

    if to_date is not None:
        to_dt = datetime(to_date.year, to_date.month, to_date.day, 23, 59, 59, tzinfo=timezone.utc)
        stmt = stmt.where(AuditLog.created_at <= to_dt)

    if user_id is not None:
        stmt = stmt.where(AuditLog.user_id == user_id)

    if entity_type is not None:
        stmt = stmt.where(AuditLog.entity_type == entity_type)

    # Cursor-based pagination: fetch one extra to determine if there is a next page
    stmt = stmt.limit(page_size + 1)

    result = await db.execute(stmt)
    rows = result.scalars().all()

    has_next = len(rows) > page_size
    entries = rows[:page_size]
    next_cursor = entries[-1].id if has_next and entries else None

    return AuditLogListResponse(
        entries=entries,
        next_cursor=next_cursor,
    )

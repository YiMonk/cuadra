from typing import Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db, require_roles
from app.models.closing import Activity

router = APIRouter(prefix="/api/v1/activity", tags=["activity"])


@router.get("", response_model=list[dict])
async def list_activity(
    limit: int = 100,
    user_id: Optional[str] = None,
    user=Depends(require_roles("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    limit = min(limit, 500)
    stmt = select(Activity).where(Activity.owner_id == user.owner_id)
    if user_id:
        stmt = stmt.where(Activity.user_id == user_id)
    stmt = stmt.order_by(Activity.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    activities = result.scalars().all()
    return [
        {
            "id": a.id,
            "owner_id": a.owner_id,
            "user_id": a.user_id,
            "user_name": a.user_name,
            "action": a.action,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "metadata": a.extra_data,
            "created_at": a.created_at.isoformat(),
        }
        for a in activities
    ]


async def log_activity(
    db: AsyncSession,
    owner_id: str,
    user_id: str,
    user_name: str,
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    extra_data: Optional[Any] = None,
) -> None:
    try:
        activity = Activity(
            owner_id=owner_id,
            user_id=user_id,
            user_name=user_name,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            extra_data=extra_data,
        )
        db.add(activity)
        await db.flush()
    except Exception:
        pass  # fire-and-forget: never fail the main operation

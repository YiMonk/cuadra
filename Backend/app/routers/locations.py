from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db, require_roles
from app.models.location import Location
from app.schemas.locations import LocationCreate, LocationResponse, LocationUpdate

router = APIRouter(prefix="/api/v1/locations", tags=["locations"])


async def _get_location_or_404(location_id: str, owner_id: str, db: AsyncSession) -> Location:
    result = await db.execute(
        select(Location).where(
            Location.id == location_id,
            Location.owner_id == owner_id,
            Location.active == True,
        )
    )
    loc = result.scalar_one_or_none()
    if loc is None:
        raise HTTPException(status_code=404, detail="sucursal no encontrada")
    return loc


@router.get("", response_model=list[LocationResponse])
async def list_locations(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Location).where(Location.owner_id == user.owner_id, Location.active == True)
    )
    return result.scalars().all()


@router.post("", response_model=LocationResponse, status_code=201)
async def create_location(
    body: LocationCreate,
    user=Depends(require_roles("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    loc = Location(owner_id=user.owner_id, **body.model_dump())
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return loc


@router.patch("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: str,
    body: LocationUpdate,
    user=Depends(require_roles("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    loc = await _get_location_or_404(location_id, user.owner_id, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(loc, field, value)
    await db.commit()
    await db.refresh(loc)
    return loc


@router.delete("/{location_id}", status_code=204)
async def delete_location(
    location_id: str,
    user=Depends(require_roles("owner")),
    db: AsyncSession = Depends(get_db),
):
    loc = await _get_location_or_404(location_id, user.owner_id, db)
    loc.active = False
    await db.commit()

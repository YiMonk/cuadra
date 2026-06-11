from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_current_user, get_db, require_roles
from app.models.user import User
from app.models.location import Location
from app.schemas.locations import LocationCreate, LocationOut, LocationUpdate
from app.services import company_service

router = APIRouter(prefix="/api/v1/companies/{company_id}/locations", tags=["company-locations"])


@router.post(
    "",
    response_model=LocationOut,
    status_code=201,
    dependencies=[Depends(require_roles("owner"))],
)
async def create_location(
    company_id: str,
    body: LocationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify company exists and belongs to owner
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(status_code=404, detail="empresa no encontrada")

    location = Location(
        owner_id=company_id,
        name=body.name,
        address=body.address,
        phone=body.phone,
    )
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location


@router.get(
    "",
    response_model=list[LocationOut],
    dependencies=[Depends(require_roles("owner"))],
)
async def list_locations(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify company exists and belongs to owner
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(status_code=404, detail="empresa no encontrada")

    result = await db.execute(
        select(Location)
        .where(Location.owner_id == company_id, Location.active == True)
        .order_by(Location.created_at)
    )
    return result.scalars().all()


@router.get(
    "/{location_id}",
    response_model=LocationOut,
    dependencies=[Depends(require_roles("owner"))],
)
async def get_location(
    company_id: str,
    location_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify company exists and belongs to owner
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(status_code=404, detail="empresa no encontrada")

    result = await db.execute(
        select(Location).where(
            Location.id == location_id,
            Location.owner_id == company_id,
            Location.active == True,
        )
    )
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=404, detail="ubicación no encontrada")

    return location


@router.patch(
    "/{location_id}",
    response_model=LocationOut,
    dependencies=[Depends(require_roles("owner"))],
)
async def update_location(
    company_id: str,
    location_id: str,
    body: LocationUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify company exists and belongs to owner
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(status_code=404, detail="empresa no encontrada")

    result = await db.execute(
        select(Location).where(
            Location.id == location_id,
            Location.owner_id == company_id,
            Location.active == True,
        )
    )
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=404, detail="ubicación no encontrada")

    updates = body.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(location, k, v)
    await db.commit()
    await db.refresh(location)
    return location


@router.delete(
    "/{location_id}",
    status_code=204,
    dependencies=[Depends(require_roles("owner"))],
)
async def deactivate_location(
    company_id: str,
    location_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify company exists and belongs to owner
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(status_code=404, detail="empresa no encontrada")

    result = await db.execute(
        select(Location).where(
            Location.id == location_id,
            Location.owner_id == company_id,
            Location.active == True,
        )
    )
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=404, detail="ubicación no encontrada")

    location.active = False
    await db.commit()

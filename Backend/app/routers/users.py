import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db, require_roles
from app.models.user import User
from app.schemas.users import (
    ChangePasswordRequest,
    InviteTeamMemberRequest,
    UpdateMeRequest,
    UpdateTeamMemberRequest,
    UserProfile,
)
from app.services.auth_service import hash_password, verify_password
from app.services import audit_service

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=UserProfile)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserProfile)
async def update_me(
    body: UpdateMeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/me/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="contraseña actual incorrecta")
    user.password_hash = hash_password(body.new_password)
    await db.commit()
    return {"message": "contraseña actualizada"}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.active = False
    await db.commit()


# ── Team ────────────────────────────────────────────────────────────────────


@router.get(
    "/team",
    response_model=list[UserProfile],
    dependencies=[Depends(require_roles("owner", "admin"))],
)
async def list_team(
    include_archived: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = (
        select(User)
        .where(User.owner_id == user.owner_id, User.id != user.id)
        .order_by(User.created_at.desc())
    )
    if not include_archived:
        stmt = stmt.where(User.archived == False)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/team/invite",
    response_model=UserProfile,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("owner"))],
)
async def invite_team_member(
    body: InviteTeamMemberRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="email already registered")

    raw_password = body.password or secrets.token_urlsafe(12)
    member = User(
        email=body.email,
        name=body.name,
        password_hash=hash_password(raw_password),
        role=body.role,
        owner_id=user.owner_id,
        commission_pct=body.commission_pct,
        default_location_id=body.default_location_id,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    after = audit_service.snapshot(member, exclude=["password_hash"])
    await audit_service.log(
        db,
        action="user.invited",
        entity_type="user",
        entity_id=member.id,
        user=user,
        request=request,
        after=after,
    )

    return member


@router.put(
    "/team/{user_id}",
    response_model=UserProfile,
    dependencies=[Depends(require_roles("owner", "admin"))],
)
async def update_team_member(
    user_id: str,
    body: UpdateTeamMemberRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    if user.role == "admingod":
        result = await db.execute(select(User).where(User.id == user_id))
    else:
        result = await db.execute(
            select(User).where(User.id == user_id, User.owner_id == user.owner_id)
        )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="usuario no encontrado")

    # Admin cannot update other admins
    if user.role == "admin" and member.role == "admin" and member.id != user.id:
        raise HTTPException(status_code=403, detail="sin permisos suficientes")

    before = audit_service.snapshot(member)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    await db.commit()
    await db.refresh(member)
    after = audit_service.snapshot(member)

    await audit_service.log(
        db,
        action="user.updated",
        entity_type="user",
        entity_id=user_id,
        user=user,
        request=request,
        before=before,
        after=after,
    )

    return member


@router.delete(
    "/team/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles("owner"))],
)
async def deactivate_team_member(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User).where(User.id == user_id, User.owner_id == user.owner_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="usuario no encontrado")
    member.active = False
    await db.commit()


@router.post(
    "/team/{user_id}/archive",
    response_model=UserProfile,
    dependencies=[Depends(require_roles("owner"))],
)
async def archive_team_member(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="no puedes archivarte a ti mismo")

    result = await db.execute(
        select(User).where(User.id == user_id, User.owner_id == user.owner_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="usuario no encontrado")

    if member.archived:
        raise HTTPException(status_code=409, detail="usuario ya archivado")

    before = audit_service.snapshot(member)
    member.archived = True
    member.active = False
    await db.commit()
    await db.refresh(member)
    after = audit_service.snapshot(member)

    await audit_service.log(
        db,
        action="user.archived",
        entity_type="user",
        entity_id=user_id,
        user=user,
        request=request,
        before=before,
        after=after,
    )

    return member


@router.post(
    "/team/{user_id}/unarchive",
    response_model=UserProfile,
    dependencies=[Depends(require_roles("owner"))],
)
async def unarchive_team_member(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.owner_id == user.owner_id,
            User.archived == True,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="usuario no encontrado o no archivado")

    before = audit_service.snapshot(member)
    member.archived = False
    await db.commit()
    await db.refresh(member)
    after = audit_service.snapshot(member)

    await audit_service.log(
        db,
        action="user.unarchived",
        entity_type="user",
        entity_id=user_id,
        user=user,
        request=request,
        before=before,
        after=after,
    )

    return member

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.deps import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenRefreshResponse,
    UserOut,
)
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from jose import JWTError

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

_EXPIRE_SECONDS = settings.jwt_expire_hours * 3600


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="email already registered")

    user = User(
        email=body.email,
        name=body.name,
        password_hash=hash_password(body.password),
        role="owner",
    )
    db.add(user)
    await db.flush()
    user.owner_id = user.id  # owner references itself
    await db.commit()
    await db.refresh(user)

    return AuthResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        expires_in=_EXPIRE_SECONDS,
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    # same error for wrong password and non-existent email (security)
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="credenciales inválidas")

    if not user.active:
        raise HTTPException(status_code=401, detail="account disabled")

    return AuthResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        expires_in=_EXPIRE_SECONDS,
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        user_id = decode_token(body.refresh_token, expected_type="refresh")
    except JWTError:
        raise HTTPException(status_code=401, detail="refresh token inválido o expirado")

    result = await db.execute(select(User).where(User.id == user_id, User.active == True))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=401, detail="usuario no encontrado")

    return TokenRefreshResponse(
        access_token=create_access_token(user_id),
        expires_in=_EXPIRE_SECONDS,
    )

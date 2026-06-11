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
    SelectCompanyRequest,
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
from app.models.company import Company
from app.deps import get_current_user
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
        companies=[],
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

    # Determine company context
    company_id = None
    companies_list = None

    # If user is an access account (has company_id), use that
    if user.company_id is not None:
        company_id = user.company_id
    # If user is an owner, check how many companies they own
    elif user.role == "owner":
        result = await db.execute(
            select(Company).where(Company.owner_user_id == user.id).order_by(Company.created_at)
        )
        companies = result.scalars().all()
        if len(companies) == 1:
            company_id = companies[0].id
        elif len(companies) > 1:
            companies_list = [{"id": c.id, "name": c.name} for c in companies]
        else:
            companies_list = []

    return AuthResponse(
        access_token=create_access_token(user.id, company_id=company_id),
        refresh_token=create_refresh_token(user.id, company_id=company_id),
        expires_in=_EXPIRE_SECONDS,
        user=UserOut.model_validate(user),
        companies=companies_list,
    )


@router.post("/select-company", response_model=AuthResponse)
async def select_company(
    body: SelectCompanyRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Company).where(
            Company.id == body.company_id,
            Company.owner_user_id == user.id,
        )
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=403, detail="company not found or access denied")

    return AuthResponse(
        access_token=create_access_token(user.id, company_id=body.company_id),
        refresh_token=create_refresh_token(user.id, company_id=body.company_id),
        expires_in=_EXPIRE_SECONDS,
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        user_id, company_id = decode_token(body.refresh_token, expected_type="refresh")
    except JWTError:
        raise HTTPException(status_code=401, detail="refresh token inválido o expirado")

    result = await db.execute(select(User).where(User.id == user_id, User.active == True))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=401, detail="usuario no encontrado")

    return TokenRefreshResponse(
        access_token=create_access_token(user_id, company_id=company_id),
        expires_in=_EXPIRE_SECONDS,
    )

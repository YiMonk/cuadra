from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.services.auth_service import decode_token

_bearer = HTTPBearer()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import User

    try:
        user_id, company_id = decode_token(credentials.credentials, expected_type="access")
    except JWTError as exc:
        detail = "token expired" if "expired" in str(exc).lower() else "token inválido"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

    result = await db.execute(
        select(User).where(User.id == user_id, User.active == True)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="usuario no encontrado")
    return user


def require_roles(*roles: str):
    async def _check(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="sin permisos suficientes")
        return user
    return _check


async def get_jwt_company_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str | None:
    """Extract company_id from JWT token, returns None if not present."""
    try:
        _, company_id = decode_token(credentials.credentials, expected_type="access")
        return company_id
    except JWTError:
        return None


async def get_current_company(
    user=Depends(get_current_user),
    company_id: str | None = Depends(get_jwt_company_id),
    db: AsyncSession = Depends(get_db),
):
    """Get the current company context. Requires company_id in JWT or assumes single company."""
    from app.models.company import Company

    if company_id:
        result = await db.execute(select(Company).where(Company.id == company_id))
        company = result.scalar_one_or_none()
        if not company:
            raise HTTPException(status_code=403, detail="company not found")
        if company.owner_user_id != user.id and user.company_id != company_id:
            raise HTTPException(status_code=403, detail="company access denied")
        return company
    if user.role == "owner":
        result = await db.execute(select(Company).where(Company.owner_user_id == user.id))
        companies = result.scalars().all()
        if len(companies) == 1:
            return companies[0]
        raise HTTPException(status_code=403, detail="company context required")
    raise HTTPException(status_code=403, detail="company context required")


def require_module_access(module: str, action: str = "read"):
    """Check if user has access to a specific module."""
    async def _check(
        user=Depends(get_current_user),
        company=Depends(get_current_company),
    ):
        import json as _json
        from app.models.company import Company

        modules = _json.loads(company.modules_enabled)
        if module not in modules:
            raise HTTPException(
                status_code=403,
                detail="module not enabled for this company",
            )
        if user.role == "owner":
            return user
        user_modules = _json.loads(user.module_access or "[]")
        if module not in user_modules:
            raise HTTPException(status_code=403, detail="module access denied")
        if action == "write" and user.role == "viewer":
            raise HTTPException(status_code=403, detail="read-only access")
        return user

    return _check

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
        user_id = decode_token(credentials.credentials, expected_type="access")
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

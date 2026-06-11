from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def _make_token(payload: dict, expire_delta: timedelta) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + expire_delta
    return jwt.encode(data, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str, company_id: str | None = None) -> str:
    payload = {"sub": user_id, "type": "access"}
    if company_id is not None:
        payload["cid"] = company_id
    return _make_token(
        payload,
        timedelta(hours=settings.jwt_expire_hours),
    )


def create_refresh_token(user_id: str, company_id: str | None = None) -> str:
    payload = {"sub": user_id, "type": "refresh"}
    if company_id is not None:
        payload["cid"] = company_id
    return _make_token(
        payload,
        timedelta(days=settings.jwt_refresh_expire_days),
    )


def decode_token(token: str, expected_type: str = "access") -> tuple[str, str | None]:
    """Returns (user_id, company_id) or raises JWTError."""
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != expected_type:
        raise JWTError("wrong token type")
    user_id: str = payload.get("sub")
    if not user_id:
        raise JWTError("missing sub")
    company_id: str | None = payload.get("cid")
    return user_id, company_id

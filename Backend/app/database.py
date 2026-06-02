from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _build_engine(url: str):
    kwargs: dict = {}
    if "postgresql" in url:
        kwargs = {"pool_size": 10, "max_overflow": 20}
    return create_async_engine(url, echo=not settings.is_production, **kwargs)


engine = _build_engine(settings.async_database_url)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass

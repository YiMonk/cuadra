from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _strip_asyncpg_params(url: str) -> tuple[str, dict]:
    """Remove psycopg-style query params asyncpg can't handle; return clean URL + connect_args."""
    parsed = urlparse(url)
    params = parse_qs(parsed.query, keep_blank_values=True)
    connect_args: dict = {}

    sslmode = params.pop("sslmode", [None])[0]
    params.pop("channel_binding", None)

    if sslmode and sslmode != "disable":
        connect_args["ssl"] = "require"

    clean_query = urlencode({k: v[0] for k, v in params.items()})
    clean_url = urlunparse(parsed._replace(query=clean_query))
    return clean_url, connect_args


def _build_engine(url: str):
    if "postgresql" in url:
        clean_url, connect_args = _strip_asyncpg_params(url)
        if settings.is_production:
            # Serverless (Vercel): NullPool — no persistent connections between invocations
            return create_async_engine(
                clean_url, echo=False, connect_args=connect_args, poolclass=NullPool
            )
        return create_async_engine(
            clean_url, echo=True,
            pool_size=5, max_overflow=10, connect_args=connect_args
        )
    return create_async_engine(url, echo=not settings.is_production)


engine = _build_engine(settings.async_database_url)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass

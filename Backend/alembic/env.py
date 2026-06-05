import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool

from app.config import settings
from app.database import Base, _strip_asyncpg_params
import app.models  # noqa: F401 — registers all models

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    context.configure(
        url=settings.async_database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    from sqlalchemy.ext.asyncio import create_async_engine
    raw_url = settings.async_database_url
    if "postgresql" in raw_url:
        clean_url, connect_args = _strip_asyncpg_params(raw_url)
    else:
        clean_url, connect_args = raw_url, {}
    connectable = create_async_engine(clean_url, poolclass=pool.NullPool, connect_args=connect_args)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

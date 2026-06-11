"""Tests para el servicio de auditoría."""
import json
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from app.models.user import User
from app.models.audit_log import AuditLog
from app.services import audit_service


@pytest.mark.asyncio
async def test_snapshot_excludes_password_hash():
    """snapshot() debe excluir password_hash."""
    user = User(
        id="test-id",
        email="test@example.com",
        name="Test User",
        password_hash="secret_hash",
        owner_id="owner-id",
    )
    result = audit_service.snapshot(user)
    assert "password_hash" not in result
    assert result["name"] == "Test User"
    assert result["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_snapshot_custom_exclude():
    """snapshot() debe excluir campos personalizados en exclude."""
    user = User(
        id="test-id",
        email="test@example.com",
        name="Test User",
        password_hash="secret_hash",
        owner_id="owner-id",
        phone="123456",
    )
    result = audit_service.snapshot(user, exclude=["phone"])
    assert "password_hash" not in result
    assert "phone" not in result
    assert result["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_snapshot_datetime_isoformat():
    """snapshot() debe convertir datetime a ISO format."""
    now = datetime.now(timezone.utc)
    user = User(
        id="test-id",
        email="test@example.com",
        name="Test User",
        password_hash="secret_hash",
        owner_id="owner-id",
        created_at=now,
    )
    result = audit_service.snapshot(user)
    assert isinstance(result["created_at"], str)
    assert result["created_at"] == now.isoformat()


@pytest.mark.asyncio
async def test_log_inserts_audit_entry(db_engine):
    """log() debe insertar un registro de auditoría correctamente."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    TestSession = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async with TestSession() as db:
        # Crear un usuario
        user = User(
            id="user-id",
            email="test@example.com",
            name="Test User",
            password_hash="hashed",
            owner_id="owner-id",
        )
        db.add(user)
        await db.commit()

        # Registrar una acción de auditoría
        await audit_service.log(
            db,
            action="test.action",
            entity_type="test",
            entity_id="entity-id",
            user=user,
            request=None,
            before={"field": "old"},
            after={"field": "new"},
        )

        # Verificar que se insertó correctamente
        from sqlalchemy import select
        result = await db.execute(select(AuditLog))
        entries = result.scalars().all()
        assert len(entries) == 1
        entry = entries[0]
        assert entry.action == "test.action"
        assert entry.entity_type == "test"
        assert entry.entity_id == "entity-id"
        assert entry.company_id == "owner-id"
        assert entry.user_id == "user-id"
        assert entry.user_name == "Test User"
        assert json.loads(entry.payload_before) == {"field": "old"}
        assert json.loads(entry.payload_after) == {"field": "new"}


@pytest.mark.asyncio
async def test_log_handles_db_error_gracefully(db_engine):
    """log() no debe relanzar si hay error de DB, solo loguear."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    TestSession = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async with TestSession() as db:
        user = User(
            id="user-id",
            email="test@example.com",
            name="Test User",
            password_hash="hashed",
            owner_id="owner-id",
        )
        db.add(user)
        await db.commit()

        # Simular que el commit falla en audit_service.log
        with patch.object(db, "commit", side_effect=Exception("DB error")):
            # No debe relanzar la excepción
            await audit_service.log(
                db,
                action="test.action",
                entity_type="test",
                entity_id="entity-id",
                user=user,
                request=None,
            )


@pytest.mark.asyncio
async def test_log_uses_owner_id_as_company_id(db_engine):
    """log() debe usar owner_id del usuario como company_id."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    TestSession = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async with TestSession() as db:
        user = User(
            id="user-id",
            email="test@example.com",
            name="Test User",
            password_hash="hashed",
            owner_id="my-company-id",
        )
        db.add(user)
        await db.commit()

        await audit_service.log(
            db,
            action="test.action",
            entity_type="test",
            entity_id="entity-id",
            user=user,
            request=None,
        )

        from sqlalchemy import select
        result = await db.execute(select(AuditLog))
        entry = result.scalars().first()
        assert entry.company_id == "my-company-id"

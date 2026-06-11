"""Tests para el router de auditoría."""
import pytest
from datetime import datetime, timezone
from httpx import AsyncClient

from tests.conftest import register_user, login_user, auth_headers
from app.models.user import User
from app.models.audit_log import AuditLog
from app.services import audit_service


@pytest.mark.asyncio
async def test_audit_log_owner_can_access(async_client: AsyncClient):
    """Un owner debe poder acceder a GET /api/v1/audit-log."""
    # Registrar un owner
    data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await async_client.get("/api/v1/audit-log", headers=headers)
    assert resp.status_code == 200
    assert "entries" in resp.json()
    assert "next_cursor" in resp.json()


@pytest.mark.asyncio
async def test_audit_log_admin_forbidden(async_client: AsyncClient):
    """Un admin no debe poder acceder a GET /api/v1/audit-log."""
    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_headers = {"Authorization": f"Bearer {owner_data['access_token']}"}

    # Invitar un admin
    invite_resp = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "admin@example.com",
            "name": "Admin User",
            "password": "password123",
            "role": "admin",
        }
    )
    assert invite_resp.status_code == 201

    # Login como admin
    admin_token = await login_user(async_client, "admin@example.com", "password123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Intentar acceder a audit log como admin
    resp = await async_client.get("/api/v1/audit-log", headers=admin_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_audit_log_cashier_forbidden(async_client: AsyncClient):
    """Un cashier no debe poder acceder a GET /api/v1/audit-log."""
    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_headers = {"Authorization": f"Bearer {owner_data['access_token']}"}

    # Invitar un cashier
    invite_resp = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "cashier@example.com",
            "name": "Cashier User",
            "password": "password123",
            "role": "cashier",
        }
    )
    assert invite_resp.status_code == 201

    # Login como cashier
    cashier_token = await login_user(async_client, "cashier@example.com", "password123")
    cashier_headers = {"Authorization": f"Bearer {cashier_token}"}

    # Intentar acceder a audit log como cashier
    resp = await async_client.get("/api/v1/audit-log", headers=cashier_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_audit_log_filter_by_entity_type(async_client: AsyncClient, db_engine):
    """Filtrar por entity_type debe funcionar."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_id = owner_data["user"]["id"]
    token = owner_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Crear entradas de auditoría directamente en DB
    TestSession = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with TestSession() as db:
        user = await db.get(User, owner_id)
        # Agregar algunas entradas
        db.add(AuditLog(
            company_id=owner_id,
            user_id=owner_id,
            user_name=user.name,
            action="sale.created",
            entity_type="sale",
            entity_id="sale-1",
        ))
        db.add(AuditLog(
            company_id=owner_id,
            user_id=owner_id,
            user_name=user.name,
            action="product.updated",
            entity_type="product",
            entity_id="product-1",
        ))
        await db.commit()

    # Filtrar por entity_type=sale
    resp = await async_client.get(
        "/api/v1/audit-log?entity_type=sale",
        headers=headers
    )
    assert resp.status_code == 200
    entries = resp.json()["entries"]
    assert len(entries) == 1
    assert entries[0]["entity_type"] == "sale"


@pytest.mark.asyncio
async def test_audit_log_filter_by_user_id(async_client: AsyncClient, db_engine):
    """Filtrar por user_id debe funcionar."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_id = owner_data["user"]["id"]
    token = owner_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Invitar otro usuario
    invite_resp = await async_client.post(
        "/api/v1/users/team/invite",
        headers=headers,
        json={
            "email": "other@example.com",
            "name": "Other User",
            "password": "password123",
            "role": "cashier",
        }
    )
    other_id = invite_resp.json()["id"]

    # Crear entradas de auditoría directamente en DB
    TestSession = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with TestSession() as db:
        user = await db.get(User, owner_id)
        db.add(AuditLog(
            company_id=owner_id,
            user_id=owner_id,
            user_name=user.name,
            action="sale.created",
            entity_type="sale",
            entity_id="sale-1",
        ))
        db.add(AuditLog(
            company_id=owner_id,
            user_id=other_id,
            user_name="Other User",
            action="product.updated",
            entity_type="product",
            entity_id="product-1",
        ))
        await db.commit()

    # Filtrar por user_id=other_id
    resp = await async_client.get(
        f"/api/v1/audit-log?user_id={other_id}",
        headers=headers
    )
    assert resp.status_code == 200
    entries = resp.json()["entries"]
    assert len(entries) == 1
    assert entries[0]["user_id"] == other_id


@pytest.mark.asyncio
async def test_audit_log_filter_by_date_range(async_client: AsyncClient, db_engine):
    """Filtrar por rango de fechas debe funcionar."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
    from datetime import datetime, timezone, timedelta

    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_id = owner_data["user"]["id"]
    token = owner_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Crear entradas con diferentes fechas
    TestSession = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with TestSession() as db:
        user = await db.get(User, owner_id)
        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(days=1)
        tomorrow = now + timedelta(days=1)

        db.add(AuditLog(
            company_id=owner_id,
            user_id=owner_id,
            user_name=user.name,
            action="sale.created",
            entity_type="sale",
            entity_id="sale-1",
            created_at=yesterday,
        ))
        db.add(AuditLog(
            company_id=owner_id,
            user_id=owner_id,
            user_name=user.name,
            action="sale.created",
            entity_type="sale",
            entity_id="sale-2",
            created_at=now,
        ))
        await db.commit()

    # Filtrar desde hoy
    today = now.date().isoformat()
    resp = await async_client.get(
        f"/api/v1/audit-log?from_date={today}",
        headers=headers
    )
    assert resp.status_code == 200
    entries = resp.json()["entries"]
    assert len(entries) == 1  # solo la de hoy


@pytest.mark.asyncio
async def test_audit_log_no_mutating_endpoints(async_client: AsyncClient):
    """No deben existir endpoints mutantes (DELETE, PUT, PATCH) para auditoría."""
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    token = owner_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # DELETE no debe existir
    delete_resp = await async_client.delete(
        "/api/v1/audit-log/some-id",
        headers=headers
    )
    assert delete_resp.status_code in [404, 405]

    # PUT no debe existir
    put_resp = await async_client.put(
        "/api/v1/audit-log/some-id",
        headers=headers,
        json={}
    )
    assert put_resp.status_code in [404, 405]

    # PATCH no debe existir
    patch_resp = await async_client.patch(
        "/api/v1/audit-log/some-id",
        headers=headers,
        json={}
    )
    assert patch_resp.status_code in [404, 405]

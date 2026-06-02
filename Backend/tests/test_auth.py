"""
TDD — specs/auth.md
Cada test corresponde a un Given/When/Then del spec.
"""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers, login_user, register_user

pytestmark = pytest.mark.asyncio


# ── Registro ──────────────────────────────────────────────────────────────────

async def test_register_success(async_client: AsyncClient):
    resp = await async_client.post("/api/v1/auth/register", json={
        "email": "owner@test.com",
        "password": "password123",
        "name": "Test Owner",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["user"]["email"] == "owner@test.com"
    assert data["user"]["role"] == "owner"
    assert data["user"]["owner_id"] == data["user"]["id"]
    assert "access_token" in data
    assert "refresh_token" in data
    assert "password_hash" not in str(data)


async def test_register_duplicate_email(async_client: AsyncClient):
    payload = {"email": "dup@test.com", "password": "password123", "name": "User"}
    await async_client.post("/api/v1/auth/register", json=payload)
    resp = await async_client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409
    assert "email already registered" in resp.json()["detail"]


async def test_register_short_password(async_client: AsyncClient):
    resp = await async_client.post("/api/v1/auth/register", json={
        "email": "short@test.com",
        "password": "123",  # < 8 chars
        "name": "User",
    })
    assert resp.status_code == 422


async def test_register_invalid_email(async_client: AsyncClient):
    resp = await async_client.post("/api/v1/auth/register", json={
        "email": "not-an-email",
        "password": "password123",
        "name": "User",
    })
    assert resp.status_code == 422


async def test_register_empty_name(async_client: AsyncClient):
    resp = await async_client.post("/api/v1/auth/register", json={
        "email": "ok@test.com",
        "password": "password123",
        "name": "   ",
    })
    assert resp.status_code == 422


# ── Login ──────────────────────────────────────────────────────────────────────

async def test_login_success(async_client: AsyncClient):
    await register_user(async_client, "login@test.com", "password123", "Login User")
    resp = await async_client.post("/api/v1/auth/login", json={
        "email": "login@test.com",
        "password": "password123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "login@test.com"


async def test_login_wrong_password(async_client: AsyncClient):
    await register_user(async_client, "wrong@test.com", "password123", "User")
    resp = await async_client.post("/api/v1/auth/login", json={
        "email": "wrong@test.com",
        "password": "incorrect",
    })
    assert resp.status_code == 401
    assert "access_token" not in resp.json()


async def test_login_nonexistent_email(async_client: AsyncClient):
    resp = await async_client.post("/api/v1/auth/login", json={
        "email": "ghost@test.com",
        "password": "password123",
    })
    assert resp.status_code == 401
    # mismo mensaje que wrong_password (no revela si el email existe)
    resp2 = await async_client.post("/api/v1/auth/login", json={
        "email": "ghost@test.com",
        "password": "otraClave",
    })
    assert resp.json()["detail"] == resp2.json()["detail"]


async def test_login_inactive_user(async_client: AsyncClient):
    data = await register_user(async_client, "inactive@test.com", "password123", "User")
    token = data["access_token"]
    # Desactivar la cuenta
    await async_client.delete("/api/v1/users/me", headers=auth_headers(token))
    resp = await async_client.post("/api/v1/auth/login", json={
        "email": "inactive@test.com",
        "password": "password123",
    })
    assert resp.status_code == 401
    assert resp.json()["detail"] == "account disabled"


# ── Refresh Token ──────────────────────────────────────────────────────────────

async def test_refresh_token_success(async_client: AsyncClient):
    data = await register_user(async_client, "refresh@test.com", "password123", "User")
    resp = await async_client.post("/api/v1/auth/refresh", json={
        "refresh_token": data["refresh_token"],
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_refresh_token_invalid(async_client: AsyncClient):
    resp = await async_client.post("/api/v1/auth/refresh", json={
        "refresh_token": "token.invalido.aqui",
    })
    assert resp.status_code == 401


async def test_refresh_with_access_token_fails(async_client: AsyncClient):
    """El access token NO debe funcionar como refresh token."""
    data = await register_user(async_client, "wrongtype@test.com", "password123", "User")
    resp = await async_client.post("/api/v1/auth/refresh", json={
        "refresh_token": data["access_token"],  # tipo incorrecto
    })
    assert resp.status_code == 401


# ── Rutas protegidas ───────────────────────────────────────────────────────────

async def test_protected_route_no_token(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/users/me")
    assert resp.status_code in (401, 403)  # HTTPBearer sin credenciales


async def test_protected_route_malformed_token(async_client: AsyncClient):
    resp = await async_client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer tokenbasura"},
    )
    assert resp.status_code == 401


async def test_protected_route_valid_token(async_client: AsyncClient):
    data = await register_user(async_client, "protected@test.com", "password123", "User")
    resp = await async_client.get(
        "/api/v1/users/me",
        headers=auth_headers(data["access_token"]),
    )
    assert resp.status_code == 200


# ── Health ─────────────────────────────────────────────────────────────────────

async def test_health(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

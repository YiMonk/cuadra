from httpx import AsyncClient
from tests.conftest import register_user


async def _invite_and_login(async_client: AsyncClient, owner_headers: dict, role: str) -> dict:
    email = f"{role}_loc@test.com"
    await async_client.post(
        "/api/v1/users/team/invite",
        json={"email": email, "name": role.title(), "role": role, "password": "password123"},
        headers=owner_headers,
    )
    resp = await async_client.post(
        "/api/v1/auth/login", json={"email": email, "password": "password123"}
    )
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


# ── list ───────────────────────────────────────────────────────────────────────

async def test_list_locations_empty(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/locations", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json() == []


# ── create ─────────────────────────────────────────────────────────────────────

async def test_create_location_as_owner(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/locations",
        json={"name": "Sucursal Centro", "address": "Calle 1"},
        headers=owner_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "Sucursal Centro"


async def test_create_location_as_admin(async_client: AsyncClient, owner_headers: dict):
    admin_headers = await _invite_and_login(async_client, owner_headers, "admin")
    resp = await async_client.post(
        "/api/v1/locations",
        json={"name": "Sucursal Admin"},
        headers=admin_headers,
    )
    assert resp.status_code == 201


async def test_create_location_as_cashier_forbidden(async_client: AsyncClient, owner_headers: dict):
    cashier_headers = await _invite_and_login(async_client, owner_headers, "cashier")
    resp = await async_client.post(
        "/api/v1/locations",
        json={"name": "Intento"},
        headers=cashier_headers,
    )
    assert resp.status_code == 403


async def test_create_location_missing_name(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/locations", json={"address": "Sin nombre"}, headers=owner_headers
    )
    assert resp.status_code == 422


# ── update ─────────────────────────────────────────────────────────────────────

async def test_update_location(async_client: AsyncClient, owner_headers: dict):
    create_resp = await async_client.post(
        "/api/v1/locations", json={"name": "Original"}, headers=owner_headers
    )
    loc_id = create_resp.json()["id"]
    resp = await async_client.patch(
        f"/api/v1/locations/{loc_id}",
        json={"name": "Modificada", "phone": "555"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Modificada"


async def test_update_location_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.patch(
        "/api/v1/locations/nonexistent", json={"name": "X"}, headers=owner_headers
    )
    assert resp.status_code == 404


# ── delete ─────────────────────────────────────────────────────────────────────

async def test_delete_location_as_owner(async_client: AsyncClient, owner_headers: dict):
    create_resp = await async_client.post(
        "/api/v1/locations", json={"name": "A Eliminar"}, headers=owner_headers
    )
    loc_id = create_resp.json()["id"]
    resp = await async_client.delete(f"/api/v1/locations/{loc_id}", headers=owner_headers)
    assert resp.status_code == 204
    list_resp = await async_client.get("/api/v1/locations", headers=owner_headers)
    ids = [l["id"] for l in list_resp.json()]
    assert loc_id not in ids


async def test_delete_location_as_admin_forbidden(async_client: AsyncClient, owner_headers: dict):
    create_resp = await async_client.post(
        "/api/v1/locations", json={"name": "Solo Owner"}, headers=owner_headers
    )
    loc_id = create_resp.json()["id"]
    admin_headers = await _invite_and_login(async_client, owner_headers, "admin")
    resp = await async_client.delete(f"/api/v1/locations/{loc_id}", headers=admin_headers)
    assert resp.status_code == 403


async def test_delete_location_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.delete("/api/v1/locations/nonexistent", headers=owner_headers)
    assert resp.status_code == 404

from httpx import AsyncClient
from tests.conftest import register_user


async def test_list_activity_as_owner(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/activity", headers=owner_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_list_activity_as_cashier_forbidden(async_client: AsyncClient, owner_headers: dict):
    await async_client.post(
        "/api/v1/users/team/invite",
        json={"email": "cashier_act@test.com", "name": "Cashier", "role": "cashier", "password": "password123"},
        headers=owner_headers,
    )
    login_resp = await async_client.post(
        "/api/v1/auth/login", json={"email": "cashier_act@test.com", "password": "password123"}
    )
    cashier_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}
    resp = await async_client.get("/api/v1/activity", headers=cashier_headers)
    assert resp.status_code == 403


async def test_list_activity_limit(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/activity?limit=10", headers=owner_headers)
    assert resp.status_code == 200

from httpx import AsyncClient
from tests.conftest import register_user


async def create_supplier(client: AsyncClient, headers: dict, **overrides) -> dict:
    payload = {"name": "Proveedor Test", **overrides}
    resp = await client.post("/api/v1/suppliers", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_list_suppliers_empty(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/suppliers", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_suppliers_ordered(async_client: AsyncClient, owner_headers: dict):
    await create_supplier(async_client, owner_headers, name="Zeta Corp")
    await create_supplier(async_client, owner_headers, name="Alpha SA")
    resp = await async_client.get("/api/v1/suppliers", headers=owner_headers)
    names = [s["name"] for s in resp.json()]
    assert names == ["Alpha SA", "Zeta Corp"]


async def test_create_supplier_success(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/suppliers",
        json={"name": "ABC Dist", "contact_name": "Juan", "phone": "555"},
        headers=owner_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "ABC Dist"


async def test_create_supplier_missing_name(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/suppliers", json={"phone": "555"}, headers=owner_headers
    )
    assert resp.status_code == 422


async def test_update_supplier_partial(async_client: AsyncClient, owner_headers: dict):
    created = await create_supplier(async_client, owner_headers)
    resp = await async_client.patch(
        f"/api/v1/suppliers/{created['id']}",
        json={"contact_name": "Maria", "email": "maria@sup.com"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["contact_name"] == "Maria"


async def test_update_supplier_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.patch(
        "/api/v1/suppliers/nonexistent", json={"name": "X"}, headers=owner_headers
    )
    assert resp.status_code == 404


async def test_delete_supplier_soft(async_client: AsyncClient, owner_headers: dict):
    created = await create_supplier(async_client, owner_headers)
    resp = await async_client.delete(
        f"/api/v1/suppliers/{created['id']}", headers=owner_headers
    )
    assert resp.status_code == 204
    list_resp = await async_client.get("/api/v1/suppliers", headers=owner_headers)
    ids = [s["id"] for s in list_resp.json()]
    assert created["id"] not in ids


async def test_delete_supplier_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.delete("/api/v1/suppliers/nonexistent", headers=owner_headers)
    assert resp.status_code == 404


async def test_supplier_tenant_isolation(async_client: AsyncClient):
    data_a = await register_user(async_client, "ownerA_sup@test.com", "password123", "A")
    headers_a = {"Authorization": f"Bearer {data_a['access_token']}"}
    data_b = await register_user(async_client, "ownerB_sup@test.com", "password123", "B")
    headers_b = {"Authorization": f"Bearer {data_b['access_token']}"}

    sup_a = await create_supplier(async_client, headers_a)
    resp = await async_client.get(f"/api/v1/suppliers/{sup_a['id']}", headers=headers_b)
    # GET by ID no existe en el router, usamos list — el supplier de A no debe aparecer para B
    list_resp = await async_client.get("/api/v1/suppliers", headers=headers_b)
    ids = [s["id"] for s in list_resp.json()]
    assert sup_a["id"] not in ids

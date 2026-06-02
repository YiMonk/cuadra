from httpx import AsyncClient


async def create_category(client: AsyncClient, headers: dict, **overrides) -> dict:
    payload = {"name": "Categoria Test", **overrides}
    resp = await client.post("/api/v1/categories", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_list_categories_empty(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/categories", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_categories_ordered(async_client: AsyncClient, owner_headers: dict):
    await create_category(async_client, owner_headers, name="Zeta")
    await create_category(async_client, owner_headers, name="Alpha")
    resp = await async_client.get("/api/v1/categories", headers=owner_headers)
    names = [c["name"] for c in resp.json()]
    assert names == ["Alpha", "Zeta"]


async def test_create_category_success(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/categories",
        json={"name": "Bebidas", "color": "#FF0000"},
        headers=owner_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["color"] == "#FF0000"


async def test_create_category_missing_name(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/categories", json={"color": "#FFF"}, headers=owner_headers
    )
    assert resp.status_code == 422


async def test_create_subcategory(async_client: AsyncClient, owner_headers: dict):
    parent = await create_category(async_client, owner_headers, name="Padre")
    child_resp = await async_client.post(
        "/api/v1/categories",
        json={"name": "Hijo", "parent_id": parent["id"]},
        headers=owner_headers,
    )
    assert child_resp.status_code == 201
    assert child_resp.json()["parent_id"] == parent["id"]


async def test_create_subcategory_invalid_parent(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/categories",
        json={"name": "Hijo", "parent_id": "nonexistent"},
        headers=owner_headers,
    )
    assert resp.status_code == 400
    assert "padre" in resp.json()["detail"]


async def test_update_category(async_client: AsyncClient, owner_headers: dict):
    created = await create_category(async_client, owner_headers)
    resp = await async_client.patch(
        f"/api/v1/categories/{created['id']}",
        json={"name": "Modificada"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Modificada"


async def test_update_category_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.patch(
        "/api/v1/categories/nonexistent", json={"name": "X"}, headers=owner_headers
    )
    assert resp.status_code == 404


async def test_delete_category_no_children(async_client: AsyncClient, owner_headers: dict):
    created = await create_category(async_client, owner_headers)
    resp = await async_client.delete(
        f"/api/v1/categories/{created['id']}", headers=owner_headers
    )
    assert resp.status_code == 204
    list_resp = await async_client.get("/api/v1/categories", headers=owner_headers)
    ids = [c["id"] for c in list_resp.json()]
    assert created["id"] not in ids


async def test_delete_category_with_children_blocked(async_client: AsyncClient, owner_headers: dict):
    parent = await create_category(async_client, owner_headers, name="Padre")
    await async_client.post(
        "/api/v1/categories",
        json={"name": "Hijo", "parent_id": parent["id"]},
        headers=owner_headers,
    )
    resp = await async_client.delete(
        f"/api/v1/categories/{parent['id']}", headers=owner_headers
    )
    assert resp.status_code == 400
    assert "subcategorías" in resp.json()["detail"]


async def test_delete_category_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.delete("/api/v1/categories/nonexistent", headers=owner_headers)
    assert resp.status_code == 404

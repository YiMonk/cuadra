import pytest
from httpx import AsyncClient


# ── helpers ────────────────────────────────────────────────────────────────────

async def create_product(client: AsyncClient, headers: dict, **overrides) -> dict:
    payload = {"name": "Producto Test", "price": 10.0, **overrides}
    resp = await client.post("/api/v1/products", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


# ── list ───────────────────────────────────────────────────────────────────────

async def test_list_products_empty(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/products", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_products_returns_own(async_client: AsyncClient, owner_headers: dict):
    await create_product(async_client, owner_headers, name="Alpha")
    await create_product(async_client, owner_headers, name="Beta")
    resp = await async_client.get("/api/v1/products", headers=owner_headers)
    assert resp.status_code == 200
    names = [p["name"] for p in resp.json()]
    assert names == ["Alpha", "Beta"]  # ordenado ASC


async def test_list_products_filter_category(async_client: AsyncClient, owner_headers: dict):
    await create_product(async_client, owner_headers, name="Cat A", category="bebidas")
    await create_product(async_client, owner_headers, name="Cat B", category="comida")
    resp = await async_client.get("/api/v1/products?category=bebidas", headers=owner_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["category"] == "bebidas"


async def test_list_products_filter_location(async_client: AsyncClient, owner_headers: dict):
    await create_product(async_client, owner_headers, name="Loc A", location_id="loc-1")
    await create_product(async_client, owner_headers, name="Loc B", location_id="loc-2")
    resp = await async_client.get("/api/v1/products?location_id=loc-1", headers=owner_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["location_id"] == "loc-1"


# ── get by id ──────────────────────────────────────────────────────────────────

async def test_get_product_success(async_client: AsyncClient, owner_headers: dict):
    created = await create_product(async_client, owner_headers)
    resp = await async_client.get(f"/api/v1/products/{created['id']}", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


async def test_get_product_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/products/nonexistent", headers=owner_headers)
    assert resp.status_code == 404


# ── create ─────────────────────────────────────────────────────────────────────

async def test_create_product_success(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/products",
        json={"name": "Nuevo", "price": 5.5},
        headers=owner_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Nuevo"
    assert data["price"] == 5.5
    assert data["stock"] == 0  # default


async def test_create_product_default_stock(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/products",
        json={"name": "Sin stock", "price": 1.0},
        headers=owner_headers,
    )
    assert resp.json()["stock"] == 0


async def test_create_product_missing_name(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/products", json={"price": 5.0}, headers=owner_headers
    )
    assert resp.status_code == 422


async def test_create_product_missing_price(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/products", json={"name": "Sin precio"}, headers=owner_headers
    )
    assert resp.status_code == 422


async def test_create_product_negative_price(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/products",
        json={"name": "Negativo", "price": -1.0},
        headers=owner_headers,
    )
    assert resp.status_code == 422


# ── update ─────────────────────────────────────────────────────────────────────

async def test_update_product_partial(async_client: AsyncClient, owner_headers: dict):
    created = await create_product(async_client, owner_headers, name="Original", price=10.0)
    resp = await async_client.patch(
        f"/api/v1/products/{created['id']}",
        json={"name": "Modificado"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Modificado"
    assert data["price"] == 10.0  # no cambia


async def test_update_product_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.patch(
        "/api/v1/products/nonexistent",
        json={"name": "X"},
        headers=owner_headers,
    )
    assert resp.status_code == 404


# ── delete ─────────────────────────────────────────────────────────────────────

async def test_delete_product_soft(async_client: AsyncClient, owner_headers: dict):
    created = await create_product(async_client, owner_headers)
    resp = await async_client.delete(
        f"/api/v1/products/{created['id']}", headers=owner_headers
    )
    assert resp.status_code == 204
    # ya no aparece en la lista
    list_resp = await async_client.get("/api/v1/products", headers=owner_headers)
    ids = [p["id"] for p in list_resp.json()]
    assert created["id"] not in ids


async def test_delete_product_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.delete("/api/v1/products/nonexistent", headers=owner_headers)
    assert resp.status_code == 404


# ── adjust-stock ───────────────────────────────────────────────────────────────

async def test_adjust_stock_increment(async_client: AsyncClient, owner_headers: dict):
    created = await create_product(async_client, owner_headers, stock=10)
    resp = await async_client.post(
        f"/api/v1/products/{created['id']}/adjust-stock",
        json={"adjustment": 5, "reason": "restock"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["stock"] == 15


async def test_adjust_stock_decrement(async_client: AsyncClient, owner_headers: dict):
    created = await create_product(async_client, owner_headers, stock=10)
    resp = await async_client.post(
        f"/api/v1/products/{created['id']}/adjust-stock",
        json={"adjustment": -3, "reason": "waste"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["stock"] == 7


async def test_adjust_stock_negative_result(async_client: AsyncClient, owner_headers: dict):
    created = await create_product(async_client, owner_headers, stock=2)
    resp = await async_client.post(
        f"/api/v1/products/{created['id']}/adjust-stock",
        json={"adjustment": -5, "reason": "waste"},
        headers=owner_headers,
    )
    assert resp.status_code == 400
    assert "stock" in resp.json()["detail"].lower()
    # stock no debe haber cambiado
    get_resp = await async_client.get(
        f"/api/v1/products/{created['id']}", headers=owner_headers
    )
    assert get_resp.json()["stock"] == 2


async def test_adjust_stock_zero_is_422(async_client: AsyncClient, owner_headers: dict):
    created = await create_product(async_client, owner_headers, stock=5)
    resp = await async_client.post(
        f"/api/v1/products/{created['id']}/adjust-stock",
        json={"adjustment": 0, "reason": "nada"},
        headers=owner_headers,
    )
    assert resp.status_code == 422


# ── bulk ───────────────────────────────────────────────────────────────────────

async def test_bulk_create_products(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/products/bulk",
        json={
            "products": [
                {"name": "Bulk A", "price": 1.0},
                {"name": "Bulk B", "price": 2.0},
                {"name": "Bulk C", "price": 3.0},
            ]
        },
        headers=owner_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["inserted"] == 3
    # aparecen en la lista
    list_resp = await async_client.get("/api/v1/products", headers=owner_headers)
    names = [p["name"] for p in list_resp.json()]
    assert "Bulk A" in names


async def test_bulk_create_empty_list(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/products/bulk",
        json={"products": []},
        headers=owner_headers,
    )
    assert resp.status_code == 422


# ── tenant isolation ───────────────────────────────────────────────────────────

async def test_product_tenant_isolation(async_client: AsyncClient):
    from tests.conftest import register_user

    data_a = await register_user(async_client, "ownerA@test.com", "password123", "Owner A")
    headers_a = {"Authorization": f"Bearer {data_a['access_token']}"}

    data_b = await register_user(async_client, "ownerB@test.com", "password123", "Owner B")
    headers_b = {"Authorization": f"Bearer {data_b['access_token']}"}

    product_a = await create_product(async_client, headers_a, name="Producto A")

    # B no puede acceder al producto de A
    resp = await async_client.get(
        f"/api/v1/products/{product_a['id']}", headers=headers_b
    )
    assert resp.status_code == 404

from httpx import AsyncClient


async def create_location(client: AsyncClient, headers: dict, name: str) -> str:
    resp = await client.post("/api/v1/locations", json={"name": name}, headers=headers)
    assert resp.status_code == 201
    return resp.json()["id"]


async def create_product(client: AsyncClient, headers: dict, stock=10) -> str:
    resp = await client.post(
        "/api/v1/products", json={"name": "Prod", "price": 5.0, "stock": stock}, headers=headers
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def test_create_transfer_success(async_client: AsyncClient, owner_headers: dict):
    loc_a = await create_location(async_client, owner_headers, "Almacén")
    loc_b = await create_location(async_client, owner_headers, "Tienda")
    prod_id = await create_product(async_client, owner_headers, stock=10)

    resp = await async_client.post(
        "/api/v1/stock-transfers",
        json={
            "from_location_id": loc_a,
            "to_location_id": loc_b,
            "items": [{"product_id": prod_id, "quantity": 3}],
        },
        headers=owner_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["from_location_id"] == loc_a
    assert len(data["items"]) == 1


async def test_transfer_same_location_fails(async_client: AsyncClient, owner_headers: dict):
    loc = await create_location(async_client, owner_headers, "Misma")
    prod_id = await create_product(async_client, owner_headers)

    resp = await async_client.post(
        "/api/v1/stock-transfers",
        json={
            "from_location_id": loc,
            "to_location_id": loc,
            "items": [{"product_id": prod_id, "quantity": 1}],
        },
        headers=owner_headers,
    )
    assert resp.status_code == 400
    assert "misma sucursal" in resp.json()["detail"]


async def test_transfer_insufficient_stock_rollback(async_client: AsyncClient, owner_headers: dict):
    loc_a = await create_location(async_client, owner_headers, "Origen")
    loc_b = await create_location(async_client, owner_headers, "Destino")
    prod_id = await create_product(async_client, owner_headers, stock=2)

    resp = await async_client.post(
        "/api/v1/stock-transfers",
        json={
            "from_location_id": loc_a,
            "to_location_id": loc_b,
            "items": [{"product_id": prod_id, "quantity": 5}],
        },
        headers=owner_headers,
    )
    assert resp.status_code == 400
    assert "insuficiente" in resp.json()["detail"]
    # Stock unchanged
    prod_resp = await async_client.get(f"/api/v1/products/{prod_id}", headers=owner_headers)
    assert prod_resp.json()["stock"] == 2


async def test_transfer_location_not_found(async_client: AsyncClient, owner_headers: dict):
    prod_id = await create_product(async_client, owner_headers)
    resp = await async_client.post(
        "/api/v1/stock-transfers",
        json={
            "from_location_id": "nonexistent",
            "to_location_id": "nonexistent2",
            "items": [{"product_id": prod_id, "quantity": 1}],
        },
        headers=owner_headers,
    )
    assert resp.status_code == 404


async def test_list_transfers(async_client: AsyncClient, owner_headers: dict):
    loc_a = await create_location(async_client, owner_headers, "L1")
    loc_b = await create_location(async_client, owner_headers, "L2")
    prod_id = await create_product(async_client, owner_headers, stock=10)
    await async_client.post(
        "/api/v1/stock-transfers",
        json={
            "from_location_id": loc_a,
            "to_location_id": loc_b,
            "items": [{"product_id": prod_id, "quantity": 1}],
        },
        headers=owner_headers,
    )
    resp = await async_client.get("/api/v1/stock-transfers", headers=owner_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


async def test_get_transfer_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/stock-transfers/nonexistent", headers=owner_headers)
    assert resp.status_code == 404

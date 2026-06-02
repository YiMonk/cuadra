from httpx import AsyncClient


async def test_create_closing_empty(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/cash-closings",
        json={"cashbox_ids": [], "includes_unassigned": False},
        headers=owner_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["sales_count"] == 0
    assert resp.json()["total"] == 0.0


async def test_create_closing_with_sales(async_client: AsyncClient, owner_headers: dict):
    cb_resp = await async_client.post(
        "/api/v1/cashboxes", json={"name": "Caja Cierre"}, headers=owner_headers
    )
    cb_id = cb_resp.json()["id"]

    prod_resp = await async_client.post(
        "/api/v1/products", json={"name": "P", "price": 10.0, "stock": 5}, headers=owner_headers
    )
    prod_id = prod_resp.json()["id"]

    await async_client.post(
        "/api/v1/sales",
        json={
            "items": [{"product_id": prod_id, "quantity": 1, "unit_price": 10.0}],
            "payment_method": "cash",
            "cashbox_id": cb_id,
        },
        headers=owner_headers,
    )

    resp = await async_client.post(
        "/api/v1/cash-closings",
        json={"cashbox_ids": [cb_id]},
        headers=owner_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["sales_count"] == 1
    assert data["total"] == 10.0


async def test_list_closings(async_client: AsyncClient, owner_headers: dict):
    await async_client.post(
        "/api/v1/cash-closings", json={"cashbox_ids": []}, headers=owner_headers
    )
    resp = await async_client.get("/api/v1/cash-closings", headers=owner_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


async def test_get_closing(async_client: AsyncClient, owner_headers: dict):
    create_resp = await async_client.post(
        "/api/v1/cash-closings", json={"cashbox_ids": []}, headers=owner_headers
    )
    closing_id = create_resp.json()["id"]
    resp = await async_client.get(f"/api/v1/cash-closings/{closing_id}", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == closing_id


async def test_get_closing_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/cash-closings/nonexistent", headers=owner_headers)
    assert resp.status_code == 404


async def test_today_last_no_closings(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/cash-closings/today/last", headers=owner_headers)
    assert resp.status_code == 404


async def test_today_last_closing(async_client: AsyncClient, owner_headers: dict):
    await async_client.post(
        "/api/v1/cash-closings", json={"cashbox_ids": []}, headers=owner_headers
    )
    resp = await async_client.get("/api/v1/cash-closings/today/last", headers=owner_headers)
    assert resp.status_code == 200

from httpx import AsyncClient


async def setup_sale(client: AsyncClient, headers: dict):
    prod_resp = await client.post(
        "/api/v1/products", json={"name": "Zapato", "price": 50.0, "stock": 10}, headers=headers
    )
    prod_id = prod_resp.json()["id"]

    sale_resp = await client.post(
        "/api/v1/sales",
        json={
            "items": [{"product_id": prod_id, "quantity": 2, "unit_price": 50.0}],
            "payment_method": "cash",
        },
        headers=headers,
    )
    return prod_id, sale_resp.json()["id"]


async def test_create_return_success(async_client: AsyncClient, owner_headers: dict):
    prod_id, sale_id = await setup_sale(async_client, owner_headers)

    resp = await async_client.post(
        "/api/v1/returns",
        json={
            "sale_id": sale_id,
            "items": [{"product_id": prod_id, "quantity": 1}],
            "reason": "defecto de fábrica",
        },
        headers=owner_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["total_refund"] == 50.0
    assert data["sale_id"] == sale_id
    # stock restored by 1
    prod_resp = await async_client.get(f"/api/v1/products/{prod_id}", headers=owner_headers)
    assert prod_resp.json()["stock"] == 9  # 10 - 2 sold + 1 returned


async def test_return_marks_sale_has_returns(async_client: AsyncClient, owner_headers: dict):
    prod_id, sale_id = await setup_sale(async_client, owner_headers)
    await async_client.post(
        "/api/v1/returns",
        json={"sale_id": sale_id, "items": [{"product_id": prod_id, "quantity": 1}], "reason": "X"},
        headers=owner_headers,
    )
    sale_resp = await async_client.get(f"/api/v1/sales/{sale_id}", headers=owner_headers)
    assert sale_resp.json()["has_returns"] is True


async def test_return_sale_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/returns",
        json={"sale_id": "nonexistent", "items": [{"product_id": "x", "quantity": 1}], "reason": "X"},
        headers=owner_headers,
    )
    assert resp.status_code == 404


async def test_return_pending_sale_fails(async_client: AsyncClient, owner_headers: dict):
    prod_resp = await async_client.post(
        "/api/v1/products", json={"name": "P", "price": 10.0, "stock": 5}, headers=owner_headers
    )
    prod_id = prod_resp.json()["id"]
    sale_resp = await async_client.post(
        "/api/v1/sales",
        json={
            "items": [{"product_id": prod_id, "quantity": 1, "unit_price": 10.0}],
            "payment_method": "credit",
        },
        headers=owner_headers,
    )
    sale_id = sale_resp.json()["id"]
    resp = await async_client.post(
        "/api/v1/returns",
        json={"sale_id": sale_id, "items": [{"product_id": prod_id, "quantity": 1}], "reason": "X"},
        headers=owner_headers,
    )
    assert resp.status_code == 400
    assert "pagadas" in resp.json()["detail"]


async def test_return_item_not_in_sale(async_client: AsyncClient, owner_headers: dict):
    _, sale_id = await setup_sale(async_client, owner_headers)
    resp = await async_client.post(
        "/api/v1/returns",
        json={"sale_id": sale_id, "items": [{"product_id": "otro_prod", "quantity": 1}], "reason": "X"},
        headers=owner_headers,
    )
    assert resp.status_code == 400


async def test_return_quantity_exceeds_sold(async_client: AsyncClient, owner_headers: dict):
    prod_id, sale_id = await setup_sale(async_client, owner_headers)
    resp = await async_client.post(
        "/api/v1/returns",
        json={"sale_id": sale_id, "items": [{"product_id": prod_id, "quantity": 10}], "reason": "X"},
        headers=owner_headers,
    )
    assert resp.status_code == 400


async def test_return_missing_reason(async_client: AsyncClient, owner_headers: dict):
    _, sale_id = await setup_sale(async_client, owner_headers)
    resp = await async_client.post(
        "/api/v1/returns",
        json={"sale_id": sale_id, "items": [{"product_id": "x", "quantity": 1}]},
        headers=owner_headers,
    )
    assert resp.status_code == 422


async def test_list_returns_for_sale(async_client: AsyncClient, owner_headers: dict):
    prod_id, sale_id = await setup_sale(async_client, owner_headers)
    await async_client.post(
        "/api/v1/returns",
        json={"sale_id": sale_id, "items": [{"product_id": prod_id, "quantity": 1}], "reason": "test"},
        headers=owner_headers,
    )
    resp = await async_client.get(f"/api/v1/sales/{sale_id}/returns", headers=owner_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_list_returns_empty(async_client: AsyncClient, owner_headers: dict):
    _, sale_id = await setup_sale(async_client, owner_headers)
    resp = await async_client.get(f"/api/v1/sales/{sale_id}/returns", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json() == []

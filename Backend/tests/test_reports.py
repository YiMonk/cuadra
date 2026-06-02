from httpx import AsyncClient


async def setup_data(client: AsyncClient, headers: dict):
    prod_resp = await client.post(
        "/api/v1/products",
        json={"name": "Widget", "price": 20.0, "cost": 10.0, "stock": 50, "min_stock": 5},
        headers=headers,
    )
    prod_id = prod_resp.json()["id"]

    await client.post(
        "/api/v1/sales",
        json={"items": [{"product_id": prod_id, "quantity": 2, "unit_price": 20.0}], "payment_method": "cash"},
        headers=headers,
    )
    await client.post(
        "/api/v1/sales",
        json={"items": [{"product_id": prod_id, "quantity": 1, "unit_price": 20.0}], "payment_method": "transfer"},
        headers=headers,
    )
    await client.post(
        "/api/v1/expenses", json={"description": "Alquiler", "amount": 100.0}, headers=headers
    )
    return prod_id


async def test_sales_summary(async_client: AsyncClient, owner_headers: dict):
    await setup_data(async_client, owner_headers)
    resp = await async_client.get("/api/v1/reports/sales-summary", headers=owner_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 2
    assert data["revenue"] == 60.0  # 2*20 + 1*20


async def test_inventory_report(async_client: AsyncClient, owner_headers: dict):
    await setup_data(async_client, owner_headers)
    resp = await async_client.get("/api/v1/reports/inventory", headers=owner_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_products"] >= 1
    assert "low_stock" in data
    assert "total_inventory_value" in data


async def test_profit_report(async_client: AsyncClient, owner_headers: dict):
    await setup_data(async_client, owner_headers)
    resp = await async_client.get("/api/v1/reports/profit", headers=owner_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["revenue"] == 60.0
    assert data["expenses"] == 100.0
    assert data["cost_of_goods"] == 30.0  # 3 units * cost 10
    assert data["gross_profit"] == 30.0   # 60 - 30
    assert data["net_profit"] == -70.0    # 30 - 100


async def test_by_payment_method(async_client: AsyncClient, owner_headers: dict):
    await setup_data(async_client, owner_headers)
    resp = await async_client.get("/api/v1/reports/by-payment-method", headers=owner_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["cash"] == 40.0
    assert data["transfer"] == 20.0


async def test_top_products(async_client: AsyncClient, owner_headers: dict):
    prod_id = await setup_data(async_client, owner_headers)
    resp = await async_client.get("/api/v1/reports/top-products?limit=5", headers=owner_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert data[0]["total_quantity"] >= 1

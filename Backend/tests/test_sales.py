from httpx import AsyncClient
from tests.conftest import register_user


async def create_product_with_stock(client: AsyncClient, headers: dict, name="Prod", price=10.0, stock=20) -> dict:
    resp = await client.post(
        "/api/v1/products",
        json={"name": name, "price": price, "stock": stock},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def create_sale(client: AsyncClient, headers: dict, items: list, payment_method="cash", **kwargs) -> dict:
    payload = {"items": items, "payment_method": payment_method, **kwargs}
    resp = await client.post("/api/v1/sales", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


# ── create ─────────────────────────────────────────────────────────────────────

async def test_create_sale_cash(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers, stock=10)
    sale = await create_sale(
        async_client, owner_headers,
        items=[{"product_id": prod["id"], "quantity": 2, "unit_price": 10.0}],
    )
    assert sale["status"] == "paid"
    assert sale["paid_at"] is not None
    assert sale["total"] == 20.0
    assert len(sale["items"]) == 1
    # stock should be decremented
    prod_resp = await async_client.get(f"/api/v1/products/{prod['id']}", headers=owner_headers)
    assert prod_resp.json()["stock"] == 8


async def test_create_sale_credit_is_pending(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers, stock=5)
    sale = await create_sale(
        async_client, owner_headers,
        items=[{"product_id": prod["id"], "quantity": 1, "unit_price": 15.0}],
        payment_method="credit",
    )
    assert sale["status"] == "pending"
    assert sale["paid_at"] is None


async def test_create_sale_insufficient_stock(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers, stock=2)
    resp = await async_client.post(
        "/api/v1/sales",
        json={
            "items": [{"product_id": prod["id"], "quantity": 5, "unit_price": 10.0}],
            "payment_method": "cash",
        },
        headers=owner_headers,
    )
    assert resp.status_code == 400
    assert "stock insuficiente" in resp.json()["detail"]
    # stock must not have changed
    prod_resp = await async_client.get(f"/api/v1/products/{prod['id']}", headers=owner_headers)
    assert prod_resp.json()["stock"] == 2


async def test_create_sale_empty_items_fails(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/sales",
        json={"items": [], "payment_method": "cash"},
        headers=owner_headers,
    )
    assert resp.status_code == 422  # min_length=1 on items field


async def test_create_sale_invalid_payment_method(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers)
    resp = await async_client.post(
        "/api/v1/sales",
        json={
            "items": [{"product_id": prod["id"], "quantity": 1, "unit_price": 10.0}],
            "payment_method": "bitcoin",
        },
        headers=owner_headers,
    )
    assert resp.status_code == 422


async def test_create_sale_rollback_if_second_item_fails(async_client: AsyncClient, owner_headers: dict):
    prod_ok = await create_product_with_stock(async_client, owner_headers, name="OK", stock=5)
    prod_bad = await create_product_with_stock(async_client, owner_headers, name="Bad", stock=0)
    resp = await async_client.post(
        "/api/v1/sales",
        json={
            "items": [
                {"product_id": prod_ok["id"], "quantity": 1, "unit_price": 10.0},
                {"product_id": prod_bad["id"], "quantity": 1, "unit_price": 10.0},
            ],
            "payment_method": "cash",
        },
        headers=owner_headers,
    )
    assert resp.status_code == 400
    # Neither product's stock should have changed
    ok_resp = await async_client.get(f"/api/v1/products/{prod_ok['id']}", headers=owner_headers)
    assert ok_resp.json()["stock"] == 5


# ── list ───────────────────────────────────────────────────────────────────────

async def test_list_sales(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers, stock=10)
    await create_sale(async_client, owner_headers,
                      items=[{"product_id": prod["id"], "quantity": 1, "unit_price": 10.0}])
    resp = await async_client.get("/api/v1/sales", headers=owner_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


async def test_list_sales_filter_status(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers, stock=10)
    await create_sale(async_client, owner_headers, payment_method="cash",
                      items=[{"product_id": prod["id"], "quantity": 1, "unit_price": 10.0}])
    await create_sale(async_client, owner_headers, payment_method="credit",
                      items=[{"product_id": prod["id"], "quantity": 1, "unit_price": 10.0}])
    resp = await async_client.get("/api/v1/sales?status=pending", headers=owner_headers)
    assert all(s["status"] == "pending" for s in resp.json())


# ── get by id ──────────────────────────────────────────────────────────────────

async def test_get_sale_success(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers, stock=5)
    sale = await create_sale(async_client, owner_headers,
                             items=[{"product_id": prod["id"], "quantity": 1, "unit_price": 10.0}])
    resp = await async_client.get(f"/api/v1/sales/{sale['id']}", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == sale["id"]


async def test_get_sale_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/sales/nonexistent", headers=owner_headers)
    assert resp.status_code == 404


# ── update status ──────────────────────────────────────────────────────────────

async def test_update_sale_status_pending_to_paid(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers, stock=5)
    sale = await create_sale(
        async_client, owner_headers, payment_method="credit",
        items=[{"product_id": prod["id"], "quantity": 1, "unit_price": 10.0}],
    )
    assert sale["status"] == "pending"
    resp = await async_client.patch(
        f"/api/v1/sales/{sale['id']}/status",
        json={"status": "paid", "payment_method": "cash"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "paid"
    assert resp.json()["paid_at"] is not None


async def test_update_cancelled_sale_status_fails(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers, stock=5)
    sale = await create_sale(async_client, owner_headers,
                             items=[{"product_id": prod["id"], "quantity": 1, "unit_price": 10.0}])
    await async_client.post(
        f"/api/v1/sales/{sale['id']}/cancel",
        json={"reason": "error"},
        headers=owner_headers,
    )
    resp = await async_client.patch(
        f"/api/v1/sales/{sale['id']}/status",
        json={"status": "paid", "payment_method": "cash"},
        headers=owner_headers,
    )
    assert resp.status_code == 400


# ── cancel ─────────────────────────────────────────────────────────────────────

async def test_cancel_sale_restores_stock(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers, stock=10)
    sale = await create_sale(async_client, owner_headers,
                             items=[{"product_id": prod["id"], "quantity": 3, "unit_price": 10.0}])
    # stock is now 7
    prod_resp = await async_client.get(f"/api/v1/products/{prod['id']}", headers=owner_headers)
    assert prod_resp.json()["stock"] == 7

    resp = await async_client.post(
        f"/api/v1/sales/{sale['id']}/cancel",
        json={"reason": "cliente arrepentido"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "cancelled"
    # stock restored
    prod_resp2 = await async_client.get(f"/api/v1/products/{prod['id']}", headers=owner_headers)
    assert prod_resp2.json()["stock"] == 10


async def test_cancel_already_cancelled_fails(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers, stock=5)
    sale = await create_sale(async_client, owner_headers,
                             items=[{"product_id": prod["id"], "quantity": 1, "unit_price": 10.0}])
    await async_client.post(f"/api/v1/sales/{sale['id']}/cancel",
                            json={"reason": "primera"}, headers=owner_headers)
    resp = await async_client.post(f"/api/v1/sales/{sale['id']}/cancel",
                                   json={"reason": "segunda"}, headers=owner_headers)
    assert resp.status_code == 400
    assert "cancelada" in resp.json()["detail"]


# ── pay-all-debts ──────────────────────────────────────────────────────────────

async def test_pay_all_debts(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers, stock=20)
    client_resp = await async_client.post(
        "/api/v1/clients", json={"name": "Deudor"}, headers=owner_headers
    )
    client_id = client_resp.json()["id"]

    for _ in range(3):
        await create_sale(
            async_client, owner_headers, payment_method="credit", client_id=client_id,
            items=[{"product_id": prod["id"], "quantity": 1, "unit_price": 10.0}],
        )

    resp = await async_client.post(
        f"/api/v1/sales/clients/{client_id}/pay-all-debts",
        json={"payment_method": "cash"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["updated"] == 3

    # All sales are now paid
    sales_resp = await async_client.get(
        f"/api/v1/sales?client_id={client_id}&status=pending", headers=owner_headers
    )
    assert sales_resp.json() == []


async def test_pay_all_debts_no_pending(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/sales/clients/nonexistent/pay-all-debts",
        json={"payment_method": "cash"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["updated"] == 0


# ── daily-summary ──────────────────────────────────────────────────────────────

async def test_daily_summary(async_client: AsyncClient, owner_headers: dict):
    prod = await create_product_with_stock(async_client, owner_headers, stock=20)
    await create_sale(async_client, owner_headers,
                      items=[{"product_id": prod["id"], "quantity": 2, "unit_price": 10.0}])
    resp = await async_client.get("/api/v1/sales/daily-summary", headers=owner_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "revenue" in data
    assert "count" in data
    assert data["count"] >= 1

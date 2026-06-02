from httpx import AsyncClient


async def create_cashbox(client: AsyncClient, headers: dict, name="Caja Principal") -> dict:
    resp = await client.post("/api/v1/cashboxes", json={"name": name}, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


# ── cashboxes ──────────────────────────────────────────────────────────────────

async def test_list_cashboxes_empty(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/cashboxes", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_cashbox(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/cashboxes", json={"name": "Caja 1"}, headers=owner_headers
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "Caja 1"


async def test_create_cashbox_missing_name(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/cashboxes", json={}, headers=owner_headers
    )
    assert resp.status_code == 422


async def test_update_cashbox(async_client: AsyncClient, owner_headers: dict):
    cb = await create_cashbox(async_client, owner_headers)
    resp = await async_client.patch(
        f"/api/v1/cashboxes/{cb['id']}",
        json={"name": "Modificada"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Modificada"


async def test_delete_cashbox(async_client: AsyncClient, owner_headers: dict):
    cb = await create_cashbox(async_client, owner_headers)
    resp = await async_client.delete(f"/api/v1/cashboxes/{cb['id']}", headers=owner_headers)
    assert resp.status_code == 204
    list_resp = await async_client.get("/api/v1/cashboxes", headers=owner_headers)
    ids = [c["id"] for c in list_resp.json()]
    assert cb["id"] not in ids


async def test_cashbox_balance(async_client: AsyncClient, owner_headers: dict):
    cb = await create_cashbox(async_client, owner_headers)
    # Create a product and a sale assigned to this cashbox
    prod_resp = await async_client.post(
        "/api/v1/products",
        json={"name": "Prod", "price": 10.0, "stock": 5},
        headers=owner_headers,
    )
    prod_id = prod_resp.json()["id"]
    await async_client.post(
        "/api/v1/sales",
        json={
            "items": [{"product_id": prod_id, "quantity": 1, "unit_price": 10.0}],
            "payment_method": "cash",
            "cashbox_id": cb["id"],
        },
        headers=owner_headers,
    )
    resp = await async_client.get(
        f"/api/v1/cashboxes/{cb['id']}/balance", headers=owner_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 10.0
    assert data["count"] == 1
    assert "cash" in data["by_payment_method"]


async def test_cashbox_balance_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/cashboxes/nonexistent/balance", headers=owner_headers)
    assert resp.status_code == 404


# ── cash sessions ──────────────────────────────────────────────────────────────

async def test_open_session(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/cash-sessions/open", json={}, headers=owner_headers
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == "open"


async def test_open_duplicate_session_fails(async_client: AsyncClient, owner_headers: dict):
    await async_client.post("/api/v1/cash-sessions/open", json={}, headers=owner_headers)
    resp = await async_client.post("/api/v1/cash-sessions/open", json={}, headers=owner_headers)
    assert resp.status_code == 400
    assert "sesión abierta" in resp.json()["detail"]


async def test_get_current_session(async_client: AsyncClient, owner_headers: dict):
    await async_client.post("/api/v1/cash-sessions/open", json={}, headers=owner_headers)
    resp = await async_client.get("/api/v1/cash-sessions/current", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "open"


async def test_get_current_no_open_session(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/cash-sessions/current", headers=owner_headers)
    assert resp.status_code == 404


async def test_list_sessions(async_client: AsyncClient, owner_headers: dict):
    await async_client.post("/api/v1/cash-sessions/open", json={}, headers=owner_headers)
    resp = await async_client.get("/api/v1/cash-sessions", headers=owner_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


async def test_close_session(async_client: AsyncClient, owner_headers: dict):
    open_resp = await async_client.post(
        "/api/v1/cash-sessions/open", json={}, headers=owner_headers
    )
    session_id = open_resp.json()["id"]
    resp = await async_client.post(
        f"/api/v1/cash-sessions/{session_id}/close",
        json={"notes": "todo correcto"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "closed"
    assert data["closed_at"] is not None
    assert data["total_sales"] is not None


async def test_close_already_closed_fails(async_client: AsyncClient, owner_headers: dict):
    open_resp = await async_client.post(
        "/api/v1/cash-sessions/open", json={}, headers=owner_headers
    )
    session_id = open_resp.json()["id"]
    await async_client.post(
        f"/api/v1/cash-sessions/{session_id}/close", json={}, headers=owner_headers
    )
    resp = await async_client.post(
        f"/api/v1/cash-sessions/{session_id}/close", json={}, headers=owner_headers
    )
    assert resp.status_code == 400


async def test_session_stats(async_client: AsyncClient, owner_headers: dict):
    open_resp = await async_client.post(
        "/api/v1/cash-sessions/open", json={}, headers=owner_headers
    )
    session_id = open_resp.json()["id"]
    resp = await async_client.get(
        f"/api/v1/cash-sessions/{session_id}/stats", headers=owner_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "total_sales" in data
    assert "sales_count" in data

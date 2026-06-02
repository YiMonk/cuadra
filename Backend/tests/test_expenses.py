from httpx import AsyncClient


async def create_expense(client: AsyncClient, headers: dict, **overrides) -> dict:
    payload = {"description": "Gasto Test", "amount": 50.0, **overrides}
    resp = await client.post("/api/v1/expenses", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_list_expenses_empty(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/expenses", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_expense_success(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/expenses",
        json={"description": "Luz", "amount": 120.5},
        headers=owner_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["description"] == "Luz"
    assert data["amount"] == 120.5
    assert data["created_by"] is not None


async def test_create_expense_missing_description(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/expenses", json={"amount": 10.0}, headers=owner_headers
    )
    assert resp.status_code == 422


async def test_create_expense_missing_amount(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/expenses", json={"description": "Sin monto"}, headers=owner_headers
    )
    assert resp.status_code == 422


async def test_create_expense_zero_amount(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/expenses",
        json={"description": "Cero", "amount": 0},
        headers=owner_headers,
    )
    assert resp.status_code == 422


async def test_create_expense_negative_amount(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/expenses",
        json={"description": "Negativo", "amount": -5.0},
        headers=owner_headers,
    )
    assert resp.status_code == 422


async def test_list_expenses_ordered_desc(async_client: AsyncClient, owner_headers: dict):
    await create_expense(async_client, owner_headers, description="Primero")
    await create_expense(async_client, owner_headers, description="Segundo")
    resp = await async_client.get("/api/v1/expenses", headers=owner_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_update_expense_partial(async_client: AsyncClient, owner_headers: dict):
    created = await create_expense(async_client, owner_headers, description="Original")
    resp = await async_client.patch(
        f"/api/v1/expenses/{created['id']}",
        json={"description": "Modificado", "amount": 99.9},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["description"] == "Modificado"
    assert data["amount"] == 99.9


async def test_update_expense_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.patch(
        "/api/v1/expenses/nonexistent",
        json={"description": "X"},
        headers=owner_headers,
    )
    assert resp.status_code == 404


async def test_delete_expense(async_client: AsyncClient, owner_headers: dict):
    created = await create_expense(async_client, owner_headers)
    resp = await async_client.delete(
        f"/api/v1/expenses/{created['id']}", headers=owner_headers
    )
    assert resp.status_code == 204
    list_resp = await async_client.get("/api/v1/expenses", headers=owner_headers)
    ids = [e["id"] for e in list_resp.json()]
    assert created["id"] not in ids


async def test_delete_expense_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.delete("/api/v1/expenses/nonexistent", headers=owner_headers)
    assert resp.status_code == 404

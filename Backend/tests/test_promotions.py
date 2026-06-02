from httpx import AsyncClient


# ── promotions ─────────────────────────────────────────────────────────────────

async def test_list_promotions_empty(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/promotions", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_promotion_success(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/promotions",
        json={"name": "10% OFF", "type": "percentage", "value": 10.0},
        headers=owner_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["type"] == "percentage"


async def test_create_promotion_invalid_type(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/promotions",
        json={"name": "Bad", "type": "invalid_type"},
        headers=owner_headers,
    )
    assert resp.status_code == 422


async def test_create_promotion_missing_name(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/promotions", json={"type": "fixed"}, headers=owner_headers
    )
    assert resp.status_code == 422


async def test_update_promotion(async_client: AsyncClient, owner_headers: dict):
    create_resp = await async_client.post(
        "/api/v1/promotions",
        json={"name": "Original", "type": "fixed", "value": 5.0},
        headers=owner_headers,
    )
    promo_id = create_resp.json()["id"]
    resp = await async_client.patch(
        f"/api/v1/promotions/{promo_id}",
        json={"name": "Modificada"},
        headers=owner_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Modificada"


async def test_delete_promotion_soft(async_client: AsyncClient, owner_headers: dict):
    create_resp = await async_client.post(
        "/api/v1/promotions",
        json={"name": "A Desactivar", "type": "fixed"},
        headers=owner_headers,
    )
    promo_id = create_resp.json()["id"]
    resp = await async_client.delete(f"/api/v1/promotions/{promo_id}", headers=owner_headers)
    assert resp.status_code == 204


# ── price lists ─────────────────────────────────────────────────────────────────

async def test_create_price_list(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/price-lists",
        json={"name": "Lista Mayorista", "items": [{"product_id": "x", "price": 8.0}]},
        headers=owner_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "Lista Mayorista"


async def test_list_price_lists(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/price-lists", headers=owner_headers)
    assert resp.status_code == 200


async def test_delete_price_list(async_client: AsyncClient, owner_headers: dict):
    create_resp = await async_client.post(
        "/api/v1/price-lists", json={"name": "Borrar"}, headers=owner_headers
    )
    pl_id = create_resp.json()["id"]
    resp = await async_client.delete(f"/api/v1/price-lists/{pl_id}", headers=owner_headers)
    assert resp.status_code == 204


# ── coupons ────────────────────────────────────────────────────────────────────

async def test_create_coupon_normalizes_code(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.post(
        "/api/v1/coupons",
        json={"code": "  summer 2025  ", "discount_type": "percentage", "discount_value": 15.0},
        headers=owner_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["code"] == "SUMMER2025"


async def test_create_coupon_duplicate_fails(async_client: AsyncClient, owner_headers: dict):
    await async_client.post(
        "/api/v1/coupons",
        json={"code": "UNIQUE", "discount_type": "fixed", "discount_value": 5.0},
        headers=owner_headers,
    )
    resp = await async_client.post(
        "/api/v1/coupons",
        json={"code": "unique", "discount_type": "fixed", "discount_value": 5.0},
        headers=owner_headers,
    )
    assert resp.status_code == 409
    assert "código ya en uso" in resp.json()["detail"]


async def test_lookup_coupon(async_client: AsyncClient, owner_headers: dict):
    await async_client.post(
        "/api/v1/coupons",
        json={"code": "LOOKUP10", "discount_type": "percentage", "discount_value": 10.0},
        headers=owner_headers,
    )
    resp = await async_client.get("/api/v1/coupons/lookup?code=lookup10", headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json()["code"] == "LOOKUP10"


async def test_lookup_coupon_not_found(async_client: AsyncClient, owner_headers: dict):
    resp = await async_client.get("/api/v1/coupons/lookup?code=NOTEXIST", headers=owner_headers)
    assert resp.status_code == 404


async def test_increment_coupon_usage(async_client: AsyncClient, owner_headers: dict):
    create_resp = await async_client.post(
        "/api/v1/coupons",
        json={"code": "INCR1", "discount_type": "fixed", "discount_value": 1.0},
        headers=owner_headers,
    )
    coupon_id = create_resp.json()["id"]
    resp = await async_client.post(
        f"/api/v1/coupons/{coupon_id}/increment-usage", headers=owner_headers
    )
    assert resp.status_code == 200
    assert resp.json()["used_count"] == 1


async def test_delete_coupon(async_client: AsyncClient, owner_headers: dict):
    create_resp = await async_client.post(
        "/api/v1/coupons",
        json={"code": "TOREMOVE", "discount_type": "fixed", "discount_value": 0.0},
        headers=owner_headers,
    )
    coupon_id = create_resp.json()["id"]
    resp = await async_client.delete(f"/api/v1/coupons/{coupon_id}", headers=owner_headers)
    assert resp.status_code == 204

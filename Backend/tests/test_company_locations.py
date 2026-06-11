import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.conftest import register_user, auth_headers

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def owner_with_company(async_client: AsyncClient):
    """Create an owner with one company."""
    # Register owner
    owner_data = await register_user(async_client, "owner@test.com", "password123", "Owner User")
    owner_token = owner_data["access_token"]

    # Create a company
    company_resp = await async_client.post(
        "/api/v1/companies",
        json={
            "name": "Test Company",
            "rif": "12345678",
            "modules_enabled": ["operativo", "finanzas"],
        },
        headers=auth_headers(owner_token),
    )
    assert company_resp.status_code == 201
    company_id = company_resp.json()["id"]

    return owner_token, company_id


class TestCreateLocation:
    async def test_create_location_success(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company
        resp = await async_client.post(
            f"/api/v1/companies/{company_id}/locations",
            json={
                "name": "Main Store",
                "address": "Calle Principal 123",
                "phone": "2126666666",
            },
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Main Store"
        assert data["address"] == "Calle Principal 123"
        assert data["phone"] == "2126666666"
        assert data["active"] is True
        assert data["owner_id"] == company_id

    async def test_create_location_minimal(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company
        resp = await async_client.post(
            f"/api/v1/companies/{company_id}/locations",
            json={"name": "Store"},
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Store"
        assert data["address"] is None
        assert data["phone"] is None

    async def test_create_location_no_name(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company
        resp = await async_client.post(
            f"/api/v1/companies/{company_id}/locations",
            json={"name": ""},
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 422

    async def test_create_location_wrong_company(self, async_client: AsyncClient):
        # Owner 1
        owner1_data = await register_user(async_client, "owner1@test.com", "password123", "Owner 1")
        token1 = owner1_data["access_token"]

        company_resp1 = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Company 1",
                "modules_enabled": ["operativo"],
            },
            headers=auth_headers(token1),
        )
        company_id1 = company_resp1.json()["id"]

        # Owner 2
        owner2_data = await register_user(async_client, "owner2@test.com", "password123", "Owner 2")
        token2 = owner2_data["access_token"]

        # Owner 2 tries to create location in Owner 1's company
        resp = await async_client.post(
            f"/api/v1/companies/{company_id1}/locations",
            json={"name": "Store"},
            headers=auth_headers(token2),
        )
        assert resp.status_code == 404


class TestListLocations:
    async def test_list_locations_empty(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company
        resp = await async_client.get(
            f"/api/v1/companies/{company_id}/locations",
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_locations_multiple(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create two locations
        for i in range(2):
            await async_client.post(
                f"/api/v1/companies/{company_id}/locations",
                json={
                    "name": f"Store {i+1}",
                    "address": f"Address {i+1}",
                },
                headers=auth_headers(owner_token),
            )

        resp = await async_client.get(
            f"/api/v1/companies/{company_id}/locations",
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 200
        locations = resp.json()
        assert len(locations) == 2

    async def test_list_locations_excludes_inactive(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create two locations
        location_ids = []
        for i in range(2):
            create_resp = await async_client.post(
                f"/api/v1/companies/{company_id}/locations",
                json={"name": f"Store {i+1}"},
                headers=auth_headers(owner_token),
            )
            location_ids.append(create_resp.json()["id"])

        # Deactivate one location
        await async_client.delete(
            f"/api/v1/companies/{company_id}/locations/{location_ids[0]}",
            headers=auth_headers(owner_token),
        )

        # List should only show active locations
        resp = await async_client.get(
            f"/api/v1/companies/{company_id}/locations",
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 200
        locations = resp.json()
        assert len(locations) == 1
        assert locations[0]["id"] == location_ids[1]


class TestGetLocation:
    async def test_get_location_success(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create location
        create_resp = await async_client.post(
            f"/api/v1/companies/{company_id}/locations",
            json={"name": "Store"},
            headers=auth_headers(owner_token),
        )
        location_id = create_resp.json()["id"]

        # Get location
        get_resp = await async_client.get(
            f"/api/v1/companies/{company_id}/locations/{location_id}",
            headers=auth_headers(owner_token),
        )
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["id"] == location_id
        assert data["name"] == "Store"

    async def test_get_location_not_found(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company
        resp = await async_client.get(
            f"/api/v1/companies/{company_id}/locations/nonexistent-id",
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 404


class TestUpdateLocation:
    async def test_update_location_success(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create location
        create_resp = await async_client.post(
            f"/api/v1/companies/{company_id}/locations",
            json={
                "name": "Original Name",
                "address": "Original Address",
            },
            headers=auth_headers(owner_token),
        )
        location_id = create_resp.json()["id"]

        # Update location
        update_resp = await async_client.patch(
            f"/api/v1/companies/{company_id}/locations/{location_id}",
            json={
                "name": "Updated Name",
                "address": "Updated Address",
                "phone": "2126666666",
            },
            headers=auth_headers(owner_token),
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["name"] == "Updated Name"
        assert data["address"] == "Updated Address"
        assert data["phone"] == "2126666666"

    async def test_update_location_partial(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create location
        create_resp = await async_client.post(
            f"/api/v1/companies/{company_id}/locations",
            json={
                "name": "Store",
                "address": "Address",
            },
            headers=auth_headers(owner_token),
        )
        location_id = create_resp.json()["id"]

        # Update only name
        update_resp = await async_client.patch(
            f"/api/v1/companies/{company_id}/locations/{location_id}",
            json={"name": "New Name"},
            headers=auth_headers(owner_token),
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["name"] == "New Name"
        assert data["address"] == "Address"  # unchanged

    async def test_update_location_empty_name(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create location
        create_resp = await async_client.post(
            f"/api/v1/companies/{company_id}/locations",
            json={"name": "Store"},
            headers=auth_headers(owner_token),
        )
        location_id = create_resp.json()["id"]

        # Try to update with empty name
        update_resp = await async_client.patch(
            f"/api/v1/companies/{company_id}/locations/{location_id}",
            json={"name": ""},
            headers=auth_headers(owner_token),
        )
        assert update_resp.status_code == 422

    async def test_update_location_not_found(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company
        resp = await async_client.patch(
            f"/api/v1/companies/{company_id}/locations/nonexistent-id",
            json={"name": "New Name"},
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 404


class TestDeactivateLocation:
    async def test_deactivate_location_success(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create location
        create_resp = await async_client.post(
            f"/api/v1/companies/{company_id}/locations",
            json={"name": "Store"},
            headers=auth_headers(owner_token),
        )
        location_id = create_resp.json()["id"]

        # Deactivate location
        delete_resp = await async_client.delete(
            f"/api/v1/companies/{company_id}/locations/{location_id}",
            headers=auth_headers(owner_token),
        )
        assert delete_resp.status_code == 204

        # Verify location is inactive
        get_resp = await async_client.get(
            f"/api/v1/companies/{company_id}/locations/{location_id}",
            headers=auth_headers(owner_token),
        )
        # Should 404 because list only shows active ones
        assert get_resp.status_code == 404

    async def test_deactivate_location_not_found(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company
        resp = await async_client.delete(
            f"/api/v1/companies/{company_id}/locations/nonexistent-id",
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 404

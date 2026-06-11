import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.conftest import register_user, login_user, auth_headers

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def owner_token(async_client: AsyncClient):
    """Create an owner user and return their access token."""
    data = await register_user(async_client, "owner@test.com", "password123", "Owner User")
    return data["access_token"]


@pytest_asyncio.fixture
async def cashier_token_with_company(async_client: AsyncClient):
    """Create an owner with a company, then create a cashier account."""
    # Register owner
    owner_data = await register_user(async_client, "owner2@test.com", "password123", "Owner 2")
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

    # Create cashier account
    cashier_resp = await async_client.post(
        f"/api/v1/companies/{company_id}/access-accounts",
        json={
            "email": "cashier@test.com",
            "password": "password123",
            "name": "Cashier User",
            "role": "cashier",
            "module_access": ["operativo"],
        },
        headers=auth_headers(owner_token),
    )
    assert cashier_resp.status_code == 201

    # Login cashier
    cashier_token = await login_user(async_client, "cashier@test.com", "password123")

    return cashier_token, company_id, owner_token


class TestCreateCompany:
    async def test_create_company_success(self, async_client: AsyncClient, owner_token):
        resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "New Company",
                "rif": "V12345678",
                "modules_enabled": ["operativo", "finanzas"],
            },
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "New Company"
        assert data["rif"] == "V12345678"
        assert set(data["modules_enabled"]) == {"operativo", "finanzas"}
        assert data["plan"] == "free"
        assert data["owner_user_id"]

    async def test_create_company_no_name(self, async_client: AsyncClient, owner_token):
        resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "",
                "modules_enabled": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 422

    async def test_create_company_empty_modules(self, async_client: AsyncClient, owner_token):
        resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Company",
                "modules_enabled": [],
            },
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 422

    async def test_create_company_default_modules(self, async_client: AsyncClient, owner_token):
        resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Company Default Modules",
            },
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["modules_enabled"] == ["operativo"]

    async def test_create_company_as_cashier(self, async_client: AsyncClient, cashier_token_with_company):
        cashier_token, _, _ = cashier_token_with_company
        resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Company",
                "modules_enabled": ["operativo"],
            },
            headers=auth_headers(cashier_token),
        )
        assert resp.status_code == 403


class TestListCompanies:
    async def test_list_companies_empty(self, async_client: AsyncClient, owner_token):
        resp = await async_client.get(
            "/api/v1/companies",
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_companies_own_only(self, async_client: AsyncClient):
        # Owner 1: register and create company
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
        assert company_resp1.status_code == 201

        # Owner 2: register and create company
        owner2_data = await register_user(async_client, "owner2@test.com", "password123", "Owner 2")
        token2 = owner2_data["access_token"]

        company_resp2 = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Company 2",
                "modules_enabled": ["operativo"],
            },
            headers=auth_headers(token2),
        )
        assert company_resp2.status_code == 201

        # Owner 1 should only see their own company
        list_resp1 = await async_client.get(
            "/api/v1/companies",
            headers=auth_headers(token1),
        )
        assert list_resp1.status_code == 200
        companies1 = list_resp1.json()
        assert len(companies1) == 1
        assert companies1[0]["name"] == "Company 1"

        # Owner 2 should only see their own company
        list_resp2 = await async_client.get(
            "/api/v1/companies",
            headers=auth_headers(token2),
        )
        assert list_resp2.status_code == 200
        companies2 = list_resp2.json()
        assert len(companies2) == 1
        assert companies2[0]["name"] == "Company 2"


class TestGetCompany:
    async def test_get_company_success(self, async_client: AsyncClient, owner_token):
        # Create a company
        create_resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Test Company",
                "modules_enabled": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        company_id = create_resp.json()["id"]

        # Get the company
        get_resp = await async_client.get(
            f"/api/v1/companies/{company_id}",
            headers=auth_headers(owner_token),
        )
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["name"] == "Test Company"

    async def test_get_company_not_found(self, async_client: AsyncClient, owner_token):
        resp = await async_client.get(
            "/api/v1/companies/nonexistent-id",
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 404

    async def test_get_company_different_owner(self, async_client: AsyncClient):
        # Owner 1 creates a company
        owner1_data = await register_user(async_client, "owner1@test.com", "password123", "Owner 1")
        token1 = owner1_data["access_token"]

        company_resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Company 1",
                "modules_enabled": ["operativo"],
            },
            headers=auth_headers(token1),
        )
        company_id = company_resp.json()["id"]

        # Owner 2 tries to get Owner 1's company
        owner2_data = await register_user(async_client, "owner2@test.com", "password123", "Owner 2")
        token2 = owner2_data["access_token"]

        get_resp = await async_client.get(
            f"/api/v1/companies/{company_id}",
            headers=auth_headers(token2),
        )
        assert get_resp.status_code == 404


class TestUpdateCompany:
    async def test_update_company_success(self, async_client: AsyncClient, owner_token):
        # Create a company
        create_resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Original Name",
                "modules_enabled": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        company_id = create_resp.json()["id"]

        # Update the company
        update_resp = await async_client.patch(
            f"/api/v1/companies/{company_id}",
            json={
                "name": "Updated Name",
                "modules_enabled": ["operativo", "finanzas"],
            },
            headers=auth_headers(owner_token),
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["name"] == "Updated Name"
        assert set(data["modules_enabled"]) == {"operativo", "finanzas"}

    async def test_update_company_partial(self, async_client: AsyncClient, owner_token):
        # Create a company
        create_resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Company",
                "rif": "V12345678",
                "modules_enabled": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        company_id = create_resp.json()["id"]

        # Update only name
        update_resp = await async_client.patch(
            f"/api/v1/companies/{company_id}",
            json={"name": "New Name"},
            headers=auth_headers(owner_token),
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["name"] == "New Name"
        assert data["rif"] == "V12345678"  # unchanged

    async def test_update_company_empty_modules(self, async_client: AsyncClient, owner_token):
        # Create a company
        create_resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Company",
                "modules_enabled": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        company_id = create_resp.json()["id"]

        # Try to update with empty modules
        update_resp = await async_client.patch(
            f"/api/v1/companies/{company_id}",
            json={"modules_enabled": []},
            headers=auth_headers(owner_token),
        )
        assert update_resp.status_code == 422

    async def test_update_company_not_found(self, async_client: AsyncClient, owner_token):
        resp = await async_client.patch(
            "/api/v1/companies/nonexistent-id",
            json={"name": "New Name"},
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 404


class TestDeleteCompany:
    async def test_delete_company_not_allowed(self, async_client: AsyncClient, owner_token):
        # Create a company
        create_resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Company",
                "modules_enabled": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        company_id = create_resp.json()["id"]

        # Try to delete
        delete_resp = await async_client.delete(
            f"/api/v1/companies/{company_id}",
            headers=auth_headers(owner_token),
        )
        assert delete_resp.status_code == 405

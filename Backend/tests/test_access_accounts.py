import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.conftest import register_user, login_user, auth_headers

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


class TestCreateAccessAccount:
    async def test_create_access_account_success(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company
        resp = await async_client.post(
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
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "cashier@test.com"
        assert data["name"] == "Cashier User"
        assert data["role"] == "cashier"
        assert data["module_access"] == ["operativo"]
        assert data["active"] is True

    async def test_create_access_account_duplicate_email(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create first account
        resp1 = await async_client.post(
            f"/api/v1/companies/{company_id}/access-accounts",
            json={
                "email": "cashier@test.com",
                "password": "password123",
                "name": "Cashier 1",
                "role": "cashier",
                "module_access": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        assert resp1.status_code == 201

        # Try to create second account with same email
        resp2 = await async_client.post(
            f"/api/v1/companies/{company_id}/access-accounts",
            json={
                "email": "cashier@test.com",
                "password": "password456",
                "name": "Cashier 2",
                "role": "viewer",
                "module_access": ["finanzas"],
            },
            headers=auth_headers(owner_token),
        )
        assert resp2.status_code == 409

    async def test_create_access_account_empty_modules(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company
        resp = await async_client.post(
            f"/api/v1/companies/{company_id}/access-accounts",
            json={
                "email": "user@test.com",
                "password": "password123",
                "name": "User",
                "role": "cashier",
                "module_access": [],
            },
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 422

    async def test_create_access_account_invalid_role(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company
        resp = await async_client.post(
            f"/api/v1/companies/{company_id}/access-accounts",
            json={
                "email": "user@test.com",
                "password": "password123",
                "name": "User",
                "role": "owner",
                "module_access": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 422

    async def test_create_access_account_short_password(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company
        resp = await async_client.post(
            f"/api/v1/companies/{company_id}/access-accounts",
            json={
                "email": "user@test.com",
                "password": "short",
                "name": "User",
                "role": "cashier",
                "module_access": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 422

    async def test_create_access_account_wrong_company(self, async_client: AsyncClient):
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

        # Owner 2 tries to create account in Owner 1's company
        resp = await async_client.post(
            f"/api/v1/companies/{company_id1}/access-accounts",
            json={
                "email": "user@test.com",
                "password": "password123",
                "name": "User",
                "role": "cashier",
                "module_access": ["operativo"],
            },
            headers=auth_headers(token2),
        )
        assert resp.status_code == 404


class TestListAccessAccounts:
    async def test_list_access_accounts_empty(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company
        resp = await async_client.get(
            f"/api/v1/companies/{company_id}/access-accounts",
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_access_accounts_multiple(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create two accounts
        for i in range(2):
            await async_client.post(
                f"/api/v1/companies/{company_id}/access-accounts",
                json={
                    "email": f"user{i}@test.com",
                    "password": "password123",
                    "name": f"User {i}",
                    "role": "cashier" if i == 0 else "viewer",
                    "module_access": ["operativo"],
                },
                headers=auth_headers(owner_token),
            )

        resp = await async_client.get(
            f"/api/v1/companies/{company_id}/access-accounts",
            headers=auth_headers(owner_token),
        )
        assert resp.status_code == 200
        accounts = resp.json()
        assert len(accounts) == 2


class TestUpdateAccessAccount:
    async def test_update_access_account_success(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create account
        create_resp = await async_client.post(
            f"/api/v1/companies/{company_id}/access-accounts",
            json={
                "email": "user@test.com",
                "password": "password123",
                "name": "Original Name",
                "role": "cashier",
                "module_access": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        account_id = create_resp.json()["id"]

        # Update account
        update_resp = await async_client.patch(
            f"/api/v1/companies/{company_id}/access-accounts/{account_id}",
            json={
                "name": "Updated Name",
                "role": "viewer",
                "module_access": ["operativo", "finanzas"],
            },
            headers=auth_headers(owner_token),
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["name"] == "Updated Name"
        assert data["role"] == "viewer"
        assert set(data["module_access"]) == {"operativo", "finanzas"}

    async def test_update_access_account_partial(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create account
        create_resp = await async_client.post(
            f"/api/v1/companies/{company_id}/access-accounts",
            json={
                "email": "user@test.com",
                "password": "password123",
                "name": "User",
                "role": "cashier",
                "module_access": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        account_id = create_resp.json()["id"]

        # Update only name
        update_resp = await async_client.patch(
            f"/api/v1/companies/{company_id}/access-accounts/{account_id}",
            json={"name": "New Name"},
            headers=auth_headers(owner_token),
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["name"] == "New Name"
        assert data["role"] == "cashier"  # unchanged


class TestAccessAccountPassword:
    async def test_set_account_password_success(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create account
        create_resp = await async_client.post(
            f"/api/v1/companies/{company_id}/access-accounts",
            json={
                "email": "user@test.com",
                "password": "oldpassword123",
                "name": "User",
                "role": "cashier",
                "module_access": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        account_id = create_resp.json()["id"]

        # Update password
        update_resp = await async_client.patch(
            f"/api/v1/companies/{company_id}/access-accounts/{account_id}/password",
            json={"new_password": "newpassword123"},
            headers=auth_headers(owner_token),
        )
        assert update_resp.status_code == 200

        # Try login with new password
        login_resp = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "user@test.com",
                "password": "newpassword123",
            },
        )
        assert login_resp.status_code == 200
        assert login_resp.json()["access_token"]

    async def test_set_account_password_old_password_fails(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create account
        create_resp = await async_client.post(
            f"/api/v1/companies/{company_id}/access-accounts",
            json={
                "email": "user@test.com",
                "password": "oldpassword123",
                "name": "User",
                "role": "cashier",
                "module_access": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        account_id = create_resp.json()["id"]

        # Update password
        update_resp = await async_client.patch(
            f"/api/v1/companies/{company_id}/access-accounts/{account_id}/password",
            json={"new_password": "newpassword123"},
            headers=auth_headers(owner_token),
        )
        assert update_resp.status_code == 200

        # Try login with old password
        login_resp = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "user@test.com",
                "password": "oldpassword123",
            },
        )
        assert login_resp.status_code == 401


class TestAccessAccountStatus:
    async def test_set_account_status_disabled(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create account
        create_resp = await async_client.post(
            f"/api/v1/companies/{company_id}/access-accounts",
            json={
                "email": "user@test.com",
                "password": "password123",
                "name": "User",
                "role": "cashier",
                "module_access": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        account_id = create_resp.json()["id"]

        # Disable account
        status_resp = await async_client.patch(
            f"/api/v1/companies/{company_id}/access-accounts/{account_id}/status",
            json={"active": False},
            headers=auth_headers(owner_token),
        )
        assert status_resp.status_code == 200
        assert status_resp.json()["active"] is False

        # Try login with disabled account
        login_resp = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "user@test.com",
                "password": "password123",
            },
        )
        assert login_resp.status_code == 401
        assert "disabled" in login_resp.json()["detail"].lower()

    async def test_set_account_status_enabled(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create account
        create_resp = await async_client.post(
            f"/api/v1/companies/{company_id}/access-accounts",
            json={
                "email": "user@test.com",
                "password": "password123",
                "name": "User",
                "role": "cashier",
                "module_access": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        account_id = create_resp.json()["id"]

        # Disable then enable
        await async_client.patch(
            f"/api/v1/companies/{company_id}/access-accounts/{account_id}/status",
            json={"active": False},
            headers=auth_headers(owner_token),
        )

        status_resp = await async_client.patch(
            f"/api/v1/companies/{company_id}/access-accounts/{account_id}/status",
            json={"active": True},
            headers=auth_headers(owner_token),
        )
        assert status_resp.status_code == 200
        assert status_resp.json()["active"] is True

        # Login should work again
        login_resp = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "user@test.com",
                "password": "password123",
            },
        )
        assert login_resp.status_code == 200


class TestAccessAccountLogin:
    async def test_access_account_login_with_cid(self, async_client: AsyncClient, owner_with_company):
        owner_token, company_id = owner_with_company

        # Create account
        create_resp = await async_client.post(
            f"/api/v1/companies/{company_id}/access-accounts",
            json={
                "email": "cashier@test.com",
                "password": "password123",
                "name": "Cashier",
                "role": "cashier",
                "module_access": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        assert create_resp.status_code == 201

        # Login with access account
        login_resp = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "cashier@test.com",
                "password": "password123",
            },
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]

        # Decode token to verify cid is present
        from app.services.auth_service import decode_token

        user_id, decoded_company_id = decode_token(token, expected_type="access")
        assert decoded_company_id == company_id

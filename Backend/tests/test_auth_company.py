import pytest
from httpx import AsyncClient

from app.services.auth_service import decode_token
from tests.conftest import register_user, auth_headers

pytestmark = pytest.mark.asyncio


class TestLoginWithCompany:
    async def test_login_owner_with_one_company(self, async_client: AsyncClient):
        """Owner with one company should receive cid in access token."""
        # Register owner
        owner_data = await register_user(async_client, "owner@test.com", "password123", "Owner")
        owner_token = owner_data["access_token"]

        # Create a company
        company_resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Company 1",
                "modules_enabled": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        assert company_resp.status_code == 201
        company_id = company_resp.json()["id"]

        # Login again
        login_resp = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "owner@test.com",
                "password": "password123",
            },
        )
        assert login_resp.status_code == 200
        login_data = login_resp.json()
        token = login_data["access_token"]

        # Verify token contains cid
        user_id, decoded_company_id = decode_token(token, expected_type="access")
        assert decoded_company_id == company_id

        # Verify companies is not in response (implicit cid)
        assert login_data.get("companies") is None

    async def test_login_owner_with_no_company(self, async_client: AsyncClient):
        """Owner with no companies should not receive cid."""
        # Register owner
        register_resp = await register_user(async_client, "owner@test.com", "password123", "Owner")
        login_data = register_resp

        # Verify companies is empty list
        assert login_data.get("companies") == []

        # Verify token does not contain cid
        token = login_data["access_token"]
        user_id, decoded_company_id = decode_token(token, expected_type="access")
        assert decoded_company_id is None

    async def test_login_owner_with_multiple_companies(self, async_client: AsyncClient):
        """Owner with multiple companies should not receive cid, but should get companies list."""
        # Register owner
        owner_data = await register_user(async_client, "owner@test.com", "password123", "Owner")
        owner_token = owner_data["access_token"]

        # Create two companies
        company_ids = []
        for i in range(2):
            company_resp = await async_client.post(
                "/api/v1/companies",
                json={
                    "name": f"Company {i+1}",
                    "modules_enabled": ["operativo"],
                },
                headers=auth_headers(owner_token),
            )
            assert company_resp.status_code == 201
            company_ids.append(company_resp.json()["id"])

        # Login
        login_resp = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "owner@test.com",
                "password": "password123",
            },
        )
        assert login_resp.status_code == 200
        login_data = login_resp.json()
        token = login_data["access_token"]

        # Verify token does not contain cid
        user_id, decoded_company_id = decode_token(token, expected_type="access")
        assert decoded_company_id is None

        # Verify companies list is present
        assert "companies" in login_data
        assert len(login_data["companies"]) == 2
        assert set(c["id"] for c in login_data["companies"]) == set(company_ids)


class TestSelectCompany:
    async def test_select_company_success(self, async_client: AsyncClient):
        """Owner should be able to select a company."""
        # Register owner and create companies
        owner_data = await register_user(async_client, "owner@test.com", "password123", "Owner")
        owner_token = owner_data["access_token"]

        # Create two companies
        company_ids = []
        for i in range(2):
            company_resp = await async_client.post(
                "/api/v1/companies",
                json={
                    "name": f"Company {i+1}",
                    "modules_enabled": ["operativo"],
                },
                headers=auth_headers(owner_token),
            )
            company_ids.append(company_resp.json()["id"])

        # Select first company
        select_resp = await async_client.post(
            "/api/v1/auth/select-company",
            json={"company_id": company_ids[0]},
            headers=auth_headers(owner_token),
        )
        assert select_resp.status_code == 200
        select_data = select_resp.json()
        token = select_data["access_token"]

        # Verify token contains cid
        user_id, decoded_company_id = decode_token(token, expected_type="access")
        assert decoded_company_id == company_ids[0]

    async def test_select_company_multiple_calls(self, async_client: AsyncClient):
        """Owner should be able to select different companies."""
        # Register owner and create companies
        owner_data = await register_user(async_client, "owner@test.com", "password123", "Owner")
        owner_token = owner_data["access_token"]

        # Create two companies
        company_ids = []
        for i in range(2):
            company_resp = await async_client.post(
                "/api/v1/companies",
                json={
                    "name": f"Company {i+1}",
                    "modules_enabled": ["operativo"],
                },
                headers=auth_headers(owner_token),
            )
            company_ids.append(company_resp.json()["id"])

        # Select first company
        select_resp1 = await async_client.post(
            "/api/v1/auth/select-company",
            json={"company_id": company_ids[0]},
            headers=auth_headers(owner_token),
        )
        assert select_resp1.status_code == 200
        token1 = select_resp1.json()["access_token"]
        _, cid1 = decode_token(token1, expected_type="access")
        assert cid1 == company_ids[0]

        # Select second company
        select_resp2 = await async_client.post(
            "/api/v1/auth/select-company",
            json={"company_id": company_ids[1]},
            headers=auth_headers(owner_token),
        )
        assert select_resp2.status_code == 200
        token2 = select_resp2.json()["access_token"]
        _, cid2 = decode_token(token2, expected_type="access")
        assert cid2 == company_ids[1]

    async def test_select_company_wrong_owner(self, async_client: AsyncClient):
        """Owner should not be able to select another owner's company."""
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

        # Owner 2 tries to select Owner 1's company
        select_resp = await async_client.post(
            "/api/v1/auth/select-company",
            json={"company_id": company_id1},
            headers=auth_headers(token2),
        )
        assert select_resp.status_code == 403

    async def test_select_company_not_found(self, async_client: AsyncClient):
        """Selecting non-existent company should fail."""
        # Register owner
        owner_data = await register_user(async_client, "owner@test.com", "password123", "Owner")
        owner_token = owner_data["access_token"]

        # Try to select non-existent company
        select_resp = await async_client.post(
            "/api/v1/auth/select-company",
            json={"company_id": "nonexistent-id"},
            headers=auth_headers(owner_token),
        )
        assert select_resp.status_code == 403


class TestRefreshTokenWithCompany:
    async def test_refresh_preserves_company_id(self, async_client: AsyncClient):
        """Refresh token should preserve company_id from original access token."""
        # Register owner and create company
        owner_data = await register_user(async_client, "owner@test.com", "password123", "Owner")
        owner_token = owner_data["access_token"]
        owner_refresh = owner_data["refresh_token"]

        # Create company
        company_resp = await async_client.post(
            "/api/v1/companies",
            json={
                "name": "Company",
                "modules_enabled": ["operativo"],
            },
            headers=auth_headers(owner_token),
        )
        company_id = company_resp.json()["id"]

        # Select company to get tokens with cid
        select_resp = await async_client.post(
            "/api/v1/auth/select-company",
            json={"company_id": company_id},
            headers=auth_headers(owner_token),
        )
        refresh_token = select_resp.json()["refresh_token"]

        # Refresh
        refresh_resp = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert refresh_resp.status_code == 200
        new_token = refresh_resp.json()["access_token"]

        # Verify company_id is preserved
        _, decoded_company_id = decode_token(new_token, expected_type="access")
        assert decoded_company_id == company_id

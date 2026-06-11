"""Tests para archivado de usuarios."""
import pytest
from httpx import AsyncClient

from tests.conftest import register_user, login_user, auth_headers

pytestmark = pytest.mark.asyncio


async def test_archive_team_member_success(async_client: AsyncClient):
    """Un owner debe poder archivar a un miembro del equipo."""
    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_id = owner_data["user"]["id"]
    owner_token = owner_data["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # Invitar un cashier
    invite_resp = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "cashier@example.com",
            "name": "Cashier User",
            "password": "password123",
            "role": "cashier",
        }
    )
    cashier_id = invite_resp.json()["id"]

    # Archivar al cashier
    archive_resp = await async_client.post(
        f"/api/v1/users/team/{cashier_id}/archive",
        headers=owner_headers,
    )
    assert archive_resp.status_code == 200
    profile = archive_resp.json()
    assert profile["archived"] is True
    assert profile["active"] is False


async def test_archive_self_not_allowed(async_client: AsyncClient):
    """Un owner no puede archivarse a sí mismo."""
    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_id = owner_data["user"]["id"]
    owner_token = owner_data["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # Intentar archivarse a sí mismo
    archive_resp = await async_client.post(
        f"/api/v1/users/team/{owner_id}/archive",
        headers=owner_headers,
    )
    assert archive_resp.status_code == 400
    assert "no puedes archivarte" in archive_resp.json()["detail"]


async def test_archive_already_archived_conflict(async_client: AsyncClient):
    """Archivar un usuario ya archivado debe retornar 409."""
    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_headers = {"Authorization": f"Bearer {owner_data['access_token']}"}

    # Invitar un cashier
    invite_resp = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "cashier@example.com",
            "name": "Cashier User",
            "password": "password123",
            "role": "cashier",
        }
    )
    cashier_id = invite_resp.json()["id"]

    # Archivar al cashier
    archive_resp = await async_client.post(
        f"/api/v1/users/team/{cashier_id}/archive",
        headers=owner_headers,
    )
    assert archive_resp.status_code == 200

    # Intentar archivar nuevamente
    archive_again = await async_client.post(
        f"/api/v1/users/team/{cashier_id}/archive",
        headers=owner_headers,
    )
    assert archive_again.status_code == 409
    assert "ya archivado" in archive_again.json()["detail"]


async def test_unarchive_success(async_client: AsyncClient):
    """Un owner debe poder desarchivar a un usuario."""
    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_headers = {"Authorization": f"Bearer {owner_data['access_token']}"}

    # Invitar un cashier
    invite_resp = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "cashier@example.com",
            "name": "Cashier User",
            "password": "password123",
            "role": "cashier",
        }
    )
    cashier_id = invite_resp.json()["id"]

    # Archivar al cashier
    await async_client.post(
        f"/api/v1/users/team/{cashier_id}/archive",
        headers=owner_headers,
    )

    # Desarchivar
    unarchive_resp = await async_client.post(
        f"/api/v1/users/team/{cashier_id}/unarchive",
        headers=owner_headers,
    )
    assert unarchive_resp.status_code == 200
    profile = unarchive_resp.json()
    assert profile["archived"] is False


async def test_unarchive_not_archived_not_found(async_client: AsyncClient):
    """Intentar desarchivar un usuario no archivado debe retornar 404."""
    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_headers = {"Authorization": f"Bearer {owner_data['access_token']}"}

    # Invitar un cashier
    invite_resp = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "cashier@example.com",
            "name": "Cashier User",
            "password": "password123",
            "role": "cashier",
        }
    )
    cashier_id = invite_resp.json()["id"]

    # Intentar desarchivar sin haber archivado
    unarchive_resp = await async_client.post(
        f"/api/v1/users/team/{cashier_id}/unarchive",
        headers=owner_headers,
    )
    assert unarchive_resp.status_code == 404


async def test_archive_admin_forbidden(async_client: AsyncClient):
    """Un admin no debe poder archivar usuarios."""
    # Registrar owner y admin
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_headers = {"Authorization": f"Bearer {owner_data['access_token']}"}

    invite_resp = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "admin@example.com",
            "name": "Admin User",
            "password": "password123",
            "role": "admin",
        }
    )
    admin_id = invite_resp.json()["id"]

    # Invitar otro cashier
    cashier_resp = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "cashier@example.com",
            "name": "Cashier User",
            "password": "password123",
            "role": "cashier",
        }
    )
    cashier_id = cashier_resp.json()["id"]

    # Login como admin
    admin_token = await login_user(async_client, "admin@example.com", "password123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Intentar archivar como admin
    archive_resp = await async_client.post(
        f"/api/v1/users/team/{cashier_id}/archive",
        headers=admin_headers,
    )
    assert archive_resp.status_code == 403


async def test_list_team_excludes_archived_by_default(async_client: AsyncClient):
    """GET /api/v1/users/team debe excluir usuarios archivados por defecto."""
    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_headers = {"Authorization": f"Bearer {owner_data['access_token']}"}

    # Invitar dos cashiers
    invite1 = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "cashier1@example.com",
            "name": "Cashier 1",
            "password": "password123",
            "role": "cashier",
        }
    )
    cashier1_id = invite1.json()["id"]

    invite2 = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "cashier2@example.com",
            "name": "Cashier 2",
            "password": "password123",
            "role": "cashier",
        }
    )
    cashier2_id = invite2.json()["id"]

    # Archivar uno
    await async_client.post(
        f"/api/v1/users/team/{cashier1_id}/archive",
        headers=owner_headers,
    )

    # Listar equipo
    list_resp = await async_client.get(
        "/api/v1/users/team",
        headers=owner_headers,
    )
    assert list_resp.status_code == 200
    members = list_resp.json()
    assert len(members) == 1
    assert members[0]["id"] == cashier2_id


async def test_list_team_includes_archived_with_flag(async_client: AsyncClient):
    """GET /api/v1/users/team?include_archived=true debe incluir archivados."""
    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_headers = {"Authorization": f"Bearer {owner_data['access_token']}"}

    # Invitar dos cashiers
    invite1 = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "cashier1@example.com",
            "name": "Cashier 1",
            "password": "password123",
            "role": "cashier",
        }
    )
    cashier1_id = invite1.json()["id"]

    invite2 = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "cashier2@example.com",
            "name": "Cashier 2",
            "password": "password123",
            "role": "cashier",
        }
    )
    cashier2_id = invite2.json()["id"]

    # Archivar uno
    await async_client.post(
        f"/api/v1/users/team/{cashier1_id}/archive",
        headers=owner_headers,
    )

    # Listar equipo con include_archived=true
    list_resp = await async_client.get(
        "/api/v1/users/team?include_archived=true",
        headers=owner_headers,
    )
    assert list_resp.status_code == 200
    members = list_resp.json()
    assert len(members) == 2
    # Verificar que uno está archivado
    archived = [m for m in members if m["archived"]]
    assert len(archived) == 1
    assert archived[0]["id"] == cashier1_id


async def test_archived_user_cannot_login(async_client: AsyncClient):
    """Un usuario archivado no debe poder hacer login."""
    # Registrar owner
    owner_data = await register_user(async_client, "owner@example.com", "password123", "Owner")
    owner_headers = {"Authorization": f"Bearer {owner_data['access_token']}"}

    # Invitar un cashier
    invite_resp = await async_client.post(
        "/api/v1/users/team/invite",
        headers=owner_headers,
        json={
            "email": "cashier@example.com",
            "name": "Cashier User",
            "password": "password123",
            "role": "cashier",
        }
    )
    cashier_id = invite_resp.json()["id"]

    # Verificar que puede hacer login antes de archivar
    login_before = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "cashier@example.com", "password": "password123"}
    )
    assert login_before.status_code == 200

    # Archivar al cashier
    await async_client.post(
        f"/api/v1/users/team/{cashier_id}/archive",
        headers=owner_headers,
    )

    # Intentar login después de archivar
    login_after = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "cashier@example.com", "password": "password123"}
    )
    assert login_after.status_code == 401

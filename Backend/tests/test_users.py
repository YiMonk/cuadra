"""
TDD — specs/users.md
"""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers, register_user

pytestmark = pytest.mark.asyncio


# ── Perfil propio ─────────────────────────────────────────────────────────────

async def test_get_me(async_client: AsyncClient):
    data = await register_user(async_client, "me@test.com", "password123", "Me User")
    resp = await async_client.get("/api/v1/users/me", headers=auth_headers(data["access_token"]))
    assert resp.status_code == 200
    profile = resp.json()
    assert profile["email"] == "me@test.com"
    assert profile["name"] == "Me User"
    assert profile["active"] is True
    assert "password_hash" not in profile


async def test_update_me(async_client: AsyncClient):
    data = await register_user(async_client, "update@test.com", "password123", "Old Name")
    resp = await async_client.put(
        "/api/v1/users/me",
        json={"name": "New Name"},
        headers=auth_headers(data["access_token"]),
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


async def test_update_me_empty_name(async_client: AsyncClient):
    data = await register_user(async_client, "noname@test.com", "password123", "Has Name")
    resp = await async_client.put(
        "/api/v1/users/me",
        json={"name": ""},
        headers=auth_headers(data["access_token"]),
    )
    assert resp.status_code == 422


async def test_update_me_cannot_change_role(async_client: AsyncClient):
    """El endpoint PUT /me no tiene campo role — ignorado o rechazado."""
    data = await register_user(async_client, "role@test.com", "password123", "Role User")
    resp = await async_client.put(
        "/api/v1/users/me",
        json={"name": "Same", "role": "admin"},  # campo ignorado
        headers=auth_headers(data["access_token"]),
    )
    # Debe responder 200 pero el role no cambia (UpdateMeRequest no tiene role)
    assert resp.status_code == 200
    assert resp.json()["role"] == "owner"


# ── Cambiar contraseña ────────────────────────────────────────────────────────

async def test_change_password_success(async_client: AsyncClient):
    data = await register_user(async_client, "changepwd@test.com", "OldPass1!", "User")
    resp = await async_client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": "OldPass1!", "new_password": "NewPass2@"},
        headers=auth_headers(data["access_token"]),
    )
    assert resp.status_code == 200
    # Ahora puede hacer login con la nueva contraseña
    login_resp = await async_client.post("/api/v1/auth/login", json={
        "email": "changepwd@test.com",
        "password": "NewPass2@",
    })
    assert login_resp.status_code == 200


async def test_change_password_wrong_current(async_client: AsyncClient):
    data = await register_user(async_client, "wrongpwd@test.com", "password123", "User")
    resp = await async_client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": "WRONGPASSWORD", "new_password": "NewPass2@"},
        headers=auth_headers(data["access_token"]),
    )
    assert resp.status_code == 401


async def test_change_password_short_new(async_client: AsyncClient):
    data = await register_user(async_client, "short@test.com", "password123", "User")
    resp = await async_client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": "password123", "new_password": "123"},
        headers=auth_headers(data["access_token"]),
    )
    assert resp.status_code == 422


# ── Desactivar cuenta ─────────────────────────────────────────────────────────

async def test_delete_me_soft(async_client: AsyncClient):
    data = await register_user(async_client, "bye@test.com", "password123", "Bye User")
    token = data["access_token"]
    resp = await async_client.delete("/api/v1/users/me", headers=auth_headers(token))
    assert resp.status_code == 204
    # Ya no puede usar el token para acceder
    resp2 = await async_client.get("/api/v1/users/me", headers=auth_headers(token))
    assert resp2.status_code == 401


# ── Equipo ────────────────────────────────────────────────────────────────────

async def test_list_team_as_owner(async_client: AsyncClient):
    data = await register_user(async_client, "boss@test.com", "password123", "Boss")
    token = data["access_token"]
    # Invitar un miembro
    await async_client.post(
        "/api/v1/users/team/invite",
        json={"email": "emp@test.com", "name": "Employee", "role": "cashier", "password": "password123"},
        headers=auth_headers(token),
    )
    resp = await async_client.get("/api/v1/users/team", headers=auth_headers(token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["email"] == "emp@test.com"


async def test_list_team_as_cashier_forbidden(async_client: AsyncClient):
    owner = await register_user(async_client, "boss2@test.com", "password123", "Boss2")
    await async_client.post(
        "/api/v1/users/team/invite",
        json={"email": "cashier@test.com", "name": "Cashier", "role": "cashier", "password": "password123"},
        headers=auth_headers(owner["access_token"]),
    )
    login = await async_client.post("/api/v1/auth/login", json={
        "email": "cashier@test.com", "password": "password123",
    })
    cashier_token = login.json()["access_token"]
    resp = await async_client.get("/api/v1/users/team", headers=auth_headers(cashier_token))
    assert resp.status_code == 403


async def test_invite_team_member(async_client: AsyncClient):
    data = await register_user(async_client, "inviter@test.com", "password123", "Inviter")
    resp = await async_client.post(
        "/api/v1/users/team/invite",
        json={"email": "newmember@test.com", "name": "New Member", "role": "admin", "password": "password123"},
        headers=auth_headers(data["access_token"]),
    )
    assert resp.status_code == 201
    member = resp.json()
    assert member["role"] == "admin"
    assert member["owner_id"] == data["user"]["id"]


async def test_invite_duplicate_email(async_client: AsyncClient):
    data = await register_user(async_client, "dup2@test.com", "password123", "Boss")
    await async_client.post(
        "/api/v1/users/team/invite",
        json={"email": "same@test.com", "name": "First", "role": "cashier", "password": "password123"},
        headers=auth_headers(data["access_token"]),
    )
    resp = await async_client.post(
        "/api/v1/users/team/invite",
        json={"email": "same@test.com", "name": "Second", "role": "cashier", "password": "password123"},
        headers=auth_headers(data["access_token"]),
    )
    assert resp.status_code == 409


async def test_invite_invalid_role(async_client: AsyncClient):
    data = await register_user(async_client, "badrol@test.com", "password123", "Boss")
    resp = await async_client.post(
        "/api/v1/users/team/invite",
        json={"email": "x@test.com", "name": "X", "role": "owner"},  # no permitido
        headers=auth_headers(data["access_token"]),
    )
    assert resp.status_code == 422


async def test_update_team_member(async_client: AsyncClient):
    owner = await register_user(async_client, "upd_boss@test.com", "password123", "Boss")
    member_resp = await async_client.post(
        "/api/v1/users/team/invite",
        json={"email": "upd_member@test.com", "name": "Old", "role": "cashier", "password": "password123"},
        headers=auth_headers(owner["access_token"]),
    )
    member_id = member_resp.json()["id"]
    resp = await async_client.put(
        f"/api/v1/users/team/{member_id}",
        json={"name": "Updated", "role": "admin"},
        headers=auth_headers(owner["access_token"]),
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated"
    assert resp.json()["role"] == "admin"


async def test_update_team_member_not_found(async_client: AsyncClient):
    owner = await register_user(async_client, "nf_boss@test.com", "password123", "Boss")
    resp = await async_client.put(
        "/api/v1/users/team/nonexistent-id",
        json={"name": "X"},
        headers=auth_headers(owner["access_token"]),
    )
    assert resp.status_code == 404


async def test_deactivate_team_member(async_client: AsyncClient):
    owner = await register_user(async_client, "del_boss@test.com", "password123", "Boss")
    member_resp = await async_client.post(
        "/api/v1/users/team/invite",
        json={"email": "del_member@test.com", "name": "ToDelete", "role": "cashier", "password": "password123"},
        headers=auth_headers(owner["access_token"]),
    )
    member_id = member_resp.json()["id"]
    resp = await async_client.delete(
        f"/api/v1/users/team/{member_id}",
        headers=auth_headers(owner["access_token"]),
    )
    assert resp.status_code == 204

    # Verificar que ya no puede hacer login
    login_resp = await async_client.post("/api/v1/auth/login", json={
        "email": "del_member@test.com",
        "password": "password123",
    })
    assert login_resp.status_code == 401


async def test_tenant_isolation(async_client: AsyncClient):
    """Un owner NO puede ver/editar miembros de otro owner."""
    owner_a = await register_user(async_client, "ownerA@test.com", "password123", "Owner A")
    owner_b = await register_user(async_client, "ownerB@test.com", "password123", "Owner B")

    # Owner A invita a un miembro
    member_resp = await async_client.post(
        "/api/v1/users/team/invite",
        json={"email": "memberA@test.com", "name": "Member A", "role": "cashier", "password": "password123"},
        headers=auth_headers(owner_a["access_token"]),
    )
    member_id = member_resp.json()["id"]

    # Owner B intenta editar ese miembro — debe 404
    resp = await async_client.put(
        f"/api/v1/users/team/{member_id}",
        json={"name": "Hijacked"},
        headers=auth_headers(owner_b["access_token"]),
    )
    assert resp.status_code == 404

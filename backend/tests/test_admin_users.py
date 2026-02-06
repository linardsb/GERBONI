"""
Tests for admin user management endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, UserRole


class TestListUsers:
    """Tests for GET /api/admin/users"""

    async def test_list_users_requires_admin(self, auth_client: AsyncClient):
        """Regular users cannot list admin users."""
        response = await auth_client.get("/api/admin/users")
        assert response.status_code == 403

    async def test_list_users_unauthenticated(self, client: AsyncClient):
        """Unauthenticated users cannot list users."""
        response = await client.get("/api/admin/users")
        assert response.status_code == 401

    async def test_list_users_success(
        self, admin_client: AsyncClient, test_user
    ):
        """Admin can list users with order stats."""
        response = await admin_client.get("/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert data["total"] >= 1

    async def test_list_users_role_filter(
        self, admin_client: AsyncClient, test_admin_user
    ):
        """Admin can filter users by role."""
        response = await admin_client.get(
            "/api/admin/users", params={"role": "admin"}
        )
        assert response.status_code == 200
        data = response.json()
        for user in data["users"]:
            assert user["role"] == "admin"

    async def test_list_users_pagination(self, admin_client: AsyncClient):
        """Admin can paginate users."""
        response = await admin_client.get(
            "/api/admin/users", params={"limit": 5, "offset": 0}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 5
        assert data["offset"] == 0


class TestGetUser:
    """Tests for GET /api/admin/users/{user_id}"""

    async def test_get_user_success(
        self, admin_client: AsyncClient, test_user
    ):
        """Admin can get user details with order stats."""
        response = await admin_client.get(f"/api/admin/users/{test_user.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == "test@example.com"
        assert "order_count" in data
        assert "total_spent" in data
        assert "recent_orders" in data

    async def test_get_user_not_found(self, admin_client: AsyncClient):
        """Returns 404 for non-existent user."""
        response = await admin_client.get("/api/admin/users/99999")
        assert response.status_code == 404


class TestUpdateUserRole:
    """Tests for PUT /api/admin/users/{user_id}/role"""

    async def test_role_change_requires_super_admin(
        self, admin_client: AsyncClient, test_user
    ):
        """Regular admins cannot change roles."""
        response = await admin_client.put(
            f"/api/admin/users/{test_user.id}/role",
            json={"role": "admin"},
        )
        assert response.status_code == 403

    async def test_promote_to_admin(
        self, super_admin_client: AsyncClient, test_user
    ):
        """Super admin can promote user to admin."""
        response = await super_admin_client.put(
            f"/api/admin/users/{test_user.id}/role",
            json={"role": "admin"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"

    async def test_demote_to_customer(
        self,
        super_admin_client: AsyncClient,
        test_admin_user,
    ):
        """Super admin can demote admin to customer."""
        response = await super_admin_client.put(
            f"/api/admin/users/{test_admin_user.id}/role",
            json={"role": "customer"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "customer"

    async def test_cannot_demote_self(
        self,
        super_admin_client: AsyncClient,
        test_super_admin_user,
    ):
        """Super admin cannot demote themselves."""
        response = await super_admin_client.put(
            f"/api/admin/users/{test_super_admin_user.id}/role",
            json={"role": "customer"},
        )
        assert response.status_code == 400

    async def test_cannot_demote_last_super_admin(
        self,
        super_admin_client: AsyncClient,
        test_super_admin_user,
    ):
        """Cannot demote the last super admin."""
        response = await super_admin_client.put(
            f"/api/admin/users/{test_super_admin_user.id}/role",
            json={"role": "admin"},
        )
        assert response.status_code == 400

    async def test_invalid_role_rejected(
        self, super_admin_client: AsyncClient, test_user
    ):
        """Invalid role value returns 400."""
        response = await super_admin_client.put(
            f"/api/admin/users/{test_user.id}/role",
            json={"role": "god_mode"},
        )
        assert response.status_code == 400

    async def test_user_not_found(self, super_admin_client: AsyncClient):
        """Returns 404 for non-existent user."""
        response = await super_admin_client.put(
            "/api/admin/users/99999/role",
            json={"role": "admin"},
        )
        assert response.status_code == 404


class TestActivateUser:
    """Tests for PUT /api/admin/users/{user_id}/activate"""

    async def test_activate_user(
        self,
        admin_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
    ):
        """Admin can activate a deactivated user."""
        test_user.is_active = False
        await db_session.commit()

        response = await admin_client.put(
            f"/api/admin/users/{test_user.id}/activate"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is True

    async def test_activate_user_not_found(self, admin_client: AsyncClient):
        """Returns 404 for non-existent user."""
        response = await admin_client.put("/api/admin/users/99999/activate")
        assert response.status_code == 404


class TestDeactivateUser:
    """Tests for PUT /api/admin/users/{user_id}/deactivate"""

    async def test_deactivate_user(
        self, admin_client: AsyncClient, test_user
    ):
        """Admin can deactivate a user."""
        response = await admin_client.put(
            f"/api/admin/users/{test_user.id}/deactivate"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False

    async def test_cannot_deactivate_self(
        self, admin_client: AsyncClient, test_admin_user
    ):
        """Admin cannot deactivate themselves."""
        response = await admin_client.put(
            f"/api/admin/users/{test_admin_user.id}/deactivate"
        )
        assert response.status_code == 400

    async def test_admin_cannot_deactivate_super_admin(
        self,
        admin_client: AsyncClient,
        test_super_admin_user,
    ):
        """Regular admin cannot deactivate a super admin."""
        response = await admin_client.put(
            f"/api/admin/users/{test_super_admin_user.id}/deactivate"
        )
        assert response.status_code == 403

    async def test_deactivate_user_not_found(self, admin_client: AsyncClient):
        """Returns 404 for non-existent user."""
        response = await admin_client.put("/api/admin/users/99999/deactivate")
        assert response.status_code == 404

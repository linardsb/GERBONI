"""
Tests for authentication endpoints.
"""

import pytest
from httpx import AsyncClient

from app.models import User
from app.services import AuthService


class TestRegister:
    """Tests for POST /api/auth/register"""

    async def test_register_success(self, client: AsyncClient):
        """Test successful user registration."""
        response = await client.post(
            "/api/auth/register",
            json={"email": "new@example.com", "password": "NewPass123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "new@example.com"
        assert data["is_guest"] is False
        assert data["is_active"] is True
        assert "id" in data

    async def test_register_duplicate_email(self, client: AsyncClient, test_user: User):
        """Test registration with existing email fails."""
        response = await client.post(
            "/api/auth/register",
            json={"email": test_user.email, "password": "NewPass123"},
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    async def test_register_weak_password(self, client: AsyncClient):
        """Test registration with weak password fails."""
        response = await client.post(
            "/api/auth/register",
            json={"email": "weak@example.com", "password": "weak"},
        )
        assert response.status_code == 422  # Validation error

    async def test_register_no_uppercase(self, client: AsyncClient):
        """Test password requires uppercase letter."""
        response = await client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "lowercase123"},
        )
        assert response.status_code == 422

    async def test_register_no_lowercase(self, client: AsyncClient):
        """Test password requires lowercase letter."""
        response = await client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "UPPERCASE123"},
        )
        assert response.status_code == 422

    async def test_register_no_digit(self, client: AsyncClient):
        """Test password requires digit."""
        response = await client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "NoDigitsHere"},
        )
        assert response.status_code == 422


class TestLogin:
    """Tests for POST /api/auth/login"""

    async def test_login_success(self, client: AsyncClient, test_user: User):
        """Test successful login."""
        response = await client.post(
            "/api/auth/login",
            json={"email": test_user.email, "password": "TestPass123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient, test_user: User):
        """Test login with wrong password fails."""
        response = await client.post(
            "/api/auth/login",
            json={"email": test_user.email, "password": "WrongPass123"},
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with non-existent email fails."""
        response = await client.post(
            "/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "SomePass123"},
        )
        assert response.status_code == 401


class TestMe:
    """Tests for GET /api/auth/me"""

    async def test_get_me_authenticated(self, auth_client: AsyncClient, test_user: User):
        """Test getting current user when authenticated."""
        response = await auth_client.get("/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == test_user.id

    async def test_get_me_unauthenticated(self, client: AsyncClient):
        """Test getting current user without auth fails."""
        response = await client.get("/api/auth/me")
        assert response.status_code == 401


class TestGuestSession:
    """Tests for POST /api/auth/guest-session"""

    async def test_create_guest_session(self, client: AsyncClient):
        """Test creating a guest session."""
        response = await client.post("/api/auth/guest-session", json={})
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        assert data["email"] is None

    async def test_create_guest_session_with_email(self, client: AsyncClient):
        """Test creating a guest session with email."""
        response = await client.post(
            "/api/auth/guest-session",
            json={"email": "guest@example.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        assert data["email"] == "guest@example.com"


class TestChangePassword:
    """Tests for POST /api/auth/me/change-password"""

    async def test_change_password_success(self, auth_client: AsyncClient):
        """Test successful password change."""
        response = await auth_client.post(
            "/api/auth/me/change-password",
            json={
                "current_password": "TestPass123",
                "new_password": "NewPass456",
            },
        )
        assert response.status_code == 200
        assert "successfully" in response.json()["message"].lower()

    async def test_change_password_wrong_current(self, auth_client: AsyncClient):
        """Test password change with wrong current password fails."""
        response = await auth_client.post(
            "/api/auth/me/change-password",
            json={
                "current_password": "WrongPass123",
                "new_password": "NewPass456",
            },
        )
        assert response.status_code == 400
        assert "incorrect" in response.json()["detail"].lower()

    async def test_change_password_weak_new(self, auth_client: AsyncClient):
        """Test password change with weak new password fails."""
        response = await auth_client.post(
            "/api/auth/me/change-password",
            json={
                "current_password": "TestPass123",
                "new_password": "weak",
            },
        )
        assert response.status_code == 422

    async def test_change_password_unauthenticated(self, client: AsyncClient):
        """Test password change without auth fails."""
        response = await client.post(
            "/api/auth/me/change-password",
            json={
                "current_password": "TestPass123",
                "new_password": "NewPass456",
            },
        )
        assert response.status_code == 401

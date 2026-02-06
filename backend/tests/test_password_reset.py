"""
Tests for password reset endpoints.
"""

import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PasswordResetToken


class TestForgotPassword:
    """Tests for POST /api/auth/forgot-password"""

    async def test_forgot_password_existing_email(
        self, client: AsyncClient, test_user
    ):
        """Returns success for existing email (creates reset token)."""
        response = await client.post(
            "/api/auth/forgot-password",
            json={"email": "test@example.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    async def test_forgot_password_nonexistent_email(
        self, client: AsyncClient
    ):
        """Returns same success for non-existent email (prevents enumeration)."""
        response = await client.post(
            "/api/auth/forgot-password",
            json={"email": "nonexistent@example.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    async def test_forgot_password_same_response(
        self, client: AsyncClient, test_user
    ):
        """Both existing and non-existing emails get identical responses."""
        resp_existing = await client.post(
            "/api/auth/forgot-password",
            json={"email": "test@example.com"},
        )
        resp_nonexistent = await client.post(
            "/api/auth/forgot-password",
            json={"email": "nobody@example.com"},
        )
        # Both should succeed with same message structure
        assert resp_existing.status_code == resp_nonexistent.status_code == 200
        assert resp_existing.json()["message"] == resp_nonexistent.json()["message"]


class TestVerifyResetToken:
    """Tests for GET /api/auth/verify-reset-token"""

    async def test_verify_valid_token(
        self, client: AsyncClient, test_reset_token
    ):
        """Valid reset token is verified."""
        response = await client.get(
            "/api/auth/verify-reset-token",
            params={"token": test_reset_token.token},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True

    async def test_verify_invalid_token(self, client: AsyncClient):
        """Invalid token returns valid=false."""
        response = await client.get(
            "/api/auth/verify-reset-token",
            params={"token": "invalid_token_12345"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False

    async def test_verify_expired_token(
        self, client: AsyncClient, db_session: AsyncSession, test_reset_token
    ):
        """Expired token returns valid=false."""
        test_reset_token.expires_at = datetime.utcnow() - timedelta(hours=1)
        await db_session.commit()

        response = await client.get(
            "/api/auth/verify-reset-token",
            params={"token": test_reset_token.token},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False

    async def test_verify_used_token(
        self, client: AsyncClient, db_session: AsyncSession, test_reset_token
    ):
        """Used token returns valid=false."""
        test_reset_token.used = True
        await db_session.commit()

        response = await client.get(
            "/api/auth/verify-reset-token",
            params={"token": test_reset_token.token},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False


class TestResetPassword:
    """Tests for POST /api/auth/reset-password"""

    async def test_reset_password_success(
        self, client: AsyncClient, test_reset_token
    ):
        """Successfully reset password with valid token."""
        response = await client.post(
            "/api/auth/reset-password",
            json={
                "token": test_reset_token.token,
                "password": "NewPassword123!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    async def test_reset_password_can_login(
        self, client: AsyncClient, test_reset_token
    ):
        """After reset, can log in with new password."""
        await client.post(
            "/api/auth/reset-password",
            json={
                "token": test_reset_token.token,
                "password": "BrandNewPass123!",
            },
        )

        # Login with new password
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "BrandNewPass123!",
            },
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    async def test_reset_password_invalid_token(self, client: AsyncClient):
        """Invalid token returns 400."""
        response = await client.post(
            "/api/auth/reset-password",
            json={
                "token": "invalid_token",
                "password": "NewPassword123!",
            },
        )
        assert response.status_code == 400

    async def test_reset_password_expired_token(
        self, client: AsyncClient, db_session: AsyncSession, test_reset_token
    ):
        """Expired token returns 400."""
        test_reset_token.expires_at = datetime.utcnow() - timedelta(hours=1)
        await db_session.commit()

        response = await client.post(
            "/api/auth/reset-password",
            json={
                "token": test_reset_token.token,
                "password": "NewPassword123!",
            },
        )
        assert response.status_code == 400

    async def test_reset_password_used_token(
        self, client: AsyncClient, db_session: AsyncSession, test_reset_token
    ):
        """Used token cannot be reused."""
        test_reset_token.used = True
        await db_session.commit()

        response = await client.post(
            "/api/auth/reset-password",
            json={
                "token": test_reset_token.token,
                "password": "NewPassword123!",
            },
        )
        assert response.status_code == 400


class TestChangePassword:
    """Tests for POST /api/auth/me/change-password"""

    async def test_change_password_success(self, auth_client: AsyncClient):
        """Authenticated user can change their password."""
        response = await auth_client.post(
            "/api/auth/me/change-password",
            json={
                "current_password": "TestPass123",
                "new_password": "UpdatedPass456!",
            },
        )
        assert response.status_code == 200

    async def test_change_password_wrong_current(
        self, auth_client: AsyncClient
    ):
        """Wrong current password returns 400."""
        response = await auth_client.post(
            "/api/auth/me/change-password",
            json={
                "current_password": "WrongPassword",
                "new_password": "UpdatedPass456!",
            },
        )
        assert response.status_code == 400

    async def test_change_password_unauthenticated(
        self, client: AsyncClient
    ):
        """Unauthenticated users cannot change password."""
        response = await client.post(
            "/api/auth/me/change-password",
            json={
                "current_password": "TestPass123",
                "new_password": "UpdatedPass456!",
            },
        )
        assert response.status_code == 401

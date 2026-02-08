"""
Tests for 2FA (TOTP) authentication.
"""

import pytest
import pyotp
from unittest.mock import patch

from app.services import AuthService


# ── Unit Tests: AuthService TOTP Methods ──────────────────────────────


class TestTOTPMethods:
    """Test the TOTP helper methods on AuthService."""

    def test_generate_totp_secret(self):
        secret = AuthService.generate_totp_secret()
        assert len(secret) == 32
        # Should be valid base32
        assert secret.isalnum()

    def test_get_provisioning_uri(self):
        secret = AuthService.generate_totp_secret()
        uri = AuthService.get_totp_provisioning_uri(secret, "user@example.com")
        assert uri.startswith("otpauth://totp/")
        assert "GERBONI" in uri
        assert "user%40example.com" in uri or "user@example.com" in uri

    def test_verify_totp_valid(self):
        secret = AuthService.generate_totp_secret()
        totp = pyotp.TOTP(secret)
        code = totp.now()
        assert AuthService.verify_totp(secret, code) is True

    def test_verify_totp_invalid(self):
        secret = AuthService.generate_totp_secret()
        assert AuthService.verify_totp(secret, "000000") is False

    def test_generate_backup_codes(self):
        codes = AuthService.generate_backup_codes(10)
        assert len(codes) == 10
        for code in codes:
            assert len(code) == 8
            assert code.isalnum()
        # All codes should be unique
        assert len(set(codes)) == 10

    def test_hash_and_verify_backup_code(self):
        codes = AuthService.generate_backup_codes(5)
        hashed = AuthService.hash_backup_codes(codes)

        # Verify first code works
        success, updated = AuthService.verify_backup_code(hashed, codes[0])
        assert success is True
        assert updated is not None

        # Verify used code no longer works
        success2, _ = AuthService.verify_backup_code(updated, codes[0])
        assert success2 is False

        # Verify second code still works
        success3, _ = AuthService.verify_backup_code(updated, codes[1])
        assert success3 is True

    def test_verify_backup_code_invalid(self):
        codes = AuthService.generate_backup_codes(3)
        hashed = AuthService.hash_backup_codes(codes)
        success, _ = AuthService.verify_backup_code(hashed, "INVALID1")
        assert success is False

    def test_verify_backup_code_bad_json(self):
        success, updated = AuthService.verify_backup_code("not-json", "code")
        assert success is False
        assert updated is None

    def test_generate_qr_code_base64(self):
        secret = AuthService.generate_totp_secret()
        uri = AuthService.get_totp_provisioning_uri(secret, "user@test.com")
        qr = AuthService.generate_qr_code_base64(uri)
        # Should be base64 encoded
        assert len(qr) > 100
        import base64
        # Should decode without error
        base64.b64decode(qr)

    def test_create_and_decode_2fa_temp_token(self):
        token = AuthService.create_2fa_temp_token(42)
        user_id = AuthService.decode_2fa_temp_token(token)
        assert user_id == 42

    def test_decode_regular_token_as_2fa_fails(self):
        """A regular access token should not be accepted as a 2FA temp token."""
        token = AuthService.create_access_token(data={"sub": "42"})
        user_id = AuthService.decode_2fa_temp_token(token)
        assert user_id is None

    def test_decode_invalid_2fa_temp_token(self):
        assert AuthService.decode_2fa_temp_token("invalid") is None


# ── Integration Tests: 2FA API Endpoints ─────────────────────────────


class TestSetup2FA:
    """Test POST /api/auth/2fa/setup"""

    @pytest.mark.asyncio
    async def test_setup_returns_qr_and_secret(self, auth_client):
        resp = await auth_client.post("/api/auth/2fa/setup")
        assert resp.status_code == 200
        data = resp.json()
        assert "secret" in data
        assert "provisioning_uri" in data
        assert "qr_code" in data
        assert data["provisioning_uri"].startswith("otpauth://")

    @pytest.mark.asyncio
    async def test_setup_requires_auth(self, client):
        resp = await client.post("/api/auth/2fa/setup")
        assert resp.status_code in (401, 403)


class TestEnable2FA:
    """Test POST /api/auth/2fa/enable"""

    @pytest.mark.asyncio
    async def test_enable_with_valid_code(self, auth_client):
        # Setup first
        setup_resp = await auth_client.post("/api/auth/2fa/setup")
        secret = setup_resp.json()["secret"]

        # Generate valid TOTP code
        code = pyotp.TOTP(secret).now()

        # Enable
        resp = await auth_client.post(
            "/api/auth/2fa/enable",
            json={"code": code},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "backup_codes" in data
        assert len(data["backup_codes"]) == 10

    @pytest.mark.asyncio
    async def test_enable_with_invalid_code(self, auth_client):
        # Setup first
        await auth_client.post("/api/auth/2fa/setup")

        resp = await auth_client.post(
            "/api/auth/2fa/enable",
            json={"code": "000000"},
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_enable_without_setup(self, auth_client, db_session, test_user):
        """Cannot enable 2FA without calling setup first."""
        # Ensure no secret is set
        test_user.two_factor_secret = None
        await db_session.commit()

        resp = await auth_client.post(
            "/api/auth/2fa/enable",
            json={"code": "123456"},
        )
        assert resp.status_code == 400


class TestLoginWith2FA:
    """Test the full 2FA login flow."""

    @pytest.mark.asyncio
    async def test_login_returns_temp_token(self, client, auth_client):
        """When 2FA is enabled, login returns requires_2fa=true."""
        # Enable 2FA
        setup_resp = await auth_client.post("/api/auth/2fa/setup")
        secret = setup_resp.json()["secret"]
        code = pyotp.TOTP(secret).now()
        await auth_client.post("/api/auth/2fa/enable", json={"code": code})

        # Login with password
        resp = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "TestPass123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["requires_2fa"] is True
        assert data["temp_token"] is not None
        assert data["access_token"] is None

    @pytest.mark.asyncio
    async def test_verify_with_totp(self, client, auth_client):
        """Verify 2FA with TOTP code after login."""
        # Enable 2FA
        setup_resp = await auth_client.post("/api/auth/2fa/setup")
        secret = setup_resp.json()["secret"]
        code = pyotp.TOTP(secret).now()
        await auth_client.post("/api/auth/2fa/enable", json={"code": code})

        # Login
        login_resp = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "TestPass123"},
        )
        temp_token = login_resp.json()["temp_token"]

        # Verify with fresh TOTP code
        verify_code = pyotp.TOTP(secret).now()
        resp = await client.post(
            f"/api/auth/2fa/verify?temp_token={temp_token}",
            json={"code": verify_code},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["access_token"] is not None
        assert data["requires_2fa"] is False

    @pytest.mark.asyncio
    async def test_verify_with_backup_code(self, client, auth_client):
        """Verify 2FA with backup code."""
        # Enable 2FA
        setup_resp = await auth_client.post("/api/auth/2fa/setup")
        secret = setup_resp.json()["secret"]
        code = pyotp.TOTP(secret).now()
        enable_resp = await auth_client.post("/api/auth/2fa/enable", json={"code": code})
        backup_codes = enable_resp.json()["backup_codes"]

        # Login
        login_resp = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "TestPass123"},
        )
        temp_token = login_resp.json()["temp_token"]

        # Verify with backup code
        resp = await client.post(
            f"/api/auth/2fa/verify?temp_token={temp_token}",
            json={"code": backup_codes[0]},
        )
        assert resp.status_code == 200
        assert resp.json()["access_token"] is not None

    @pytest.mark.asyncio
    async def test_verify_with_invalid_code(self, client, auth_client):
        """Invalid code returns 400."""
        # Enable 2FA
        setup_resp = await auth_client.post("/api/auth/2fa/setup")
        secret = setup_resp.json()["secret"]
        code = pyotp.TOTP(secret).now()
        await auth_client.post("/api/auth/2fa/enable", json={"code": code})

        # Login
        login_resp = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "TestPass123"},
        )
        temp_token = login_resp.json()["temp_token"]

        # Verify with wrong code
        resp = await client.post(
            f"/api/auth/2fa/verify?temp_token={temp_token}",
            json={"code": "000000"},
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_verify_with_invalid_temp_token(self, client):
        """Invalid temp token returns 401."""
        resp = await client.post(
            "/api/auth/2fa/verify?temp_token=invalid",
            json={"code": "123456"},
        )
        assert resp.status_code == 401


class TestDisable2FA:
    """Test POST /api/auth/2fa/disable"""

    @pytest.mark.asyncio
    async def test_disable_2fa(self, auth_client):
        """Disable 2FA with valid password + code."""
        # Enable 2FA first
        setup_resp = await auth_client.post("/api/auth/2fa/setup")
        secret = setup_resp.json()["secret"]
        code = pyotp.TOTP(secret).now()
        await auth_client.post("/api/auth/2fa/enable", json={"code": code})

        # Disable with fresh code
        disable_code = pyotp.TOTP(secret).now()
        resp = await auth_client.post(
            "/api/auth/2fa/disable",
            json={"password": "TestPass123", "code": disable_code},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_disable_wrong_password(self, auth_client):
        """Cannot disable 2FA with wrong password."""
        # Enable 2FA
        setup_resp = await auth_client.post("/api/auth/2fa/setup")
        secret = setup_resp.json()["secret"]
        code = pyotp.TOTP(secret).now()
        await auth_client.post("/api/auth/2fa/enable", json={"code": code})

        disable_code = pyotp.TOTP(secret).now()
        resp = await auth_client.post(
            "/api/auth/2fa/disable",
            json={"password": "WrongPass123", "code": disable_code},
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_disable_not_enabled(self, auth_client):
        """Cannot disable 2FA if it's not enabled."""
        resp = await auth_client.post(
            "/api/auth/2fa/disable",
            json={"password": "TestPass123", "code": "123456"},
        )
        assert resp.status_code == 400

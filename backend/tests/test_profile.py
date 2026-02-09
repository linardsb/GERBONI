"""Tests for user profile endpoints (GET/PATCH /api/auth/me/profile)."""

import pytest


class TestGetProfile:
    """Tests for GET /api/auth/me/profile."""

    @pytest.mark.asyncio
    async def test_get_profile_unauthenticated(self, client):
        """Unauthenticated requests return 401."""
        response = await client.get("/api/auth/me/profile")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_profile_empty(self, auth_client):
        """New user profile has null preference fields."""
        response = await auth_client.get("/api/auth/me/profile")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["display_name"] is None
        assert data["phone"] is None
        assert data["birthday"] is None
        assert data["preferred_size"] is None
        assert data["preferred_colors"] == []
        assert data["preferred_cities"] == []

    @pytest.mark.asyncio
    async def test_get_profile_has_base_fields(self, auth_client):
        """Profile includes id, email, role, is_active, created_at."""
        response = await auth_client.get("/api/auth/me/profile")
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "role" in data
        assert "is_active" in data
        assert "created_at" in data


class TestUpdateProfile:
    """Tests for PATCH /api/auth/me/profile."""

    @pytest.mark.asyncio
    async def test_update_all_fields(self, auth_client):
        """Update all profile fields at once."""
        response = await auth_client.patch(
            "/api/auth/me/profile",
            json={
                "display_name": "John Doe",
                "phone": "+371 12345678",
                "birthday": "1990-06-15",
                "preferred_size": "M",
                "preferred_colors": ["Black", "White"],
                "preferred_cities": ["Riga", "Jurmala"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "John Doe"
        assert data["phone"] == "+371 12345678"
        assert data["birthday"] is not None
        assert data["preferred_size"] == "M"
        assert data["preferred_colors"] == ["Black", "White"]
        assert data["preferred_cities"] == ["Riga", "Jurmala"]

    @pytest.mark.asyncio
    async def test_partial_update(self, auth_client):
        """Update only some fields — others remain unchanged."""
        # Set initial values
        await auth_client.patch(
            "/api/auth/me/profile",
            json={"display_name": "Jane", "phone": "+371 99999999"},
        )

        # Update only display_name
        response = await auth_client.patch(
            "/api/auth/me/profile",
            json={"display_name": "Jane Updated"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Jane Updated"
        assert data["phone"] == "+371 99999999"  # unchanged

    @pytest.mark.asyncio
    async def test_clear_field(self, auth_client):
        """Setting a field to empty string clears it."""
        # Set initial value
        await auth_client.patch(
            "/api/auth/me/profile",
            json={"display_name": "SomeName"},
        )

        # Clear it
        response = await auth_client.patch(
            "/api/auth/me/profile",
            json={"display_name": ""},
        )
        assert response.status_code == 200
        assert response.json()["display_name"] is None

    @pytest.mark.asyncio
    async def test_invalid_size_rejected(self, auth_client):
        """Invalid size value is rejected with 422."""
        response = await auth_client.patch(
            "/api/auth/me/profile",
            json={"preferred_size": "XXXL"},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_color_rejected(self, auth_client):
        """Invalid color value is rejected with 422."""
        response = await auth_client.patch(
            "/api/auth/me/profile",
            json={"preferred_colors": ["Black", "Purple"]},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_city_rejected(self, auth_client):
        """Invalid city value is rejected with 422."""
        response = await auth_client.patch(
            "/api/auth/me/profile",
            json={"preferred_cities": ["Riga", "Tallinn"]},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_birthday_format(self, auth_client):
        """Invalid date format returns 400."""
        response = await auth_client.patch(
            "/api/auth/me/profile",
            json={"birthday": "not-a-date"},
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_update_unauthenticated(self, client):
        """Unauthenticated PATCH returns 401."""
        response = await client.patch(
            "/api/auth/me/profile",
            json={"display_name": "Hacker"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_roundtrip_persists(self, auth_client):
        """Values set via PATCH are returned by subsequent GET."""
        await auth_client.patch(
            "/api/auth/me/profile",
            json={
                "preferred_colors": ["Red"],
                "preferred_cities": ["Ventspils"],
            },
        )

        response = await auth_client.get("/api/auth/me/profile")
        data = response.json()
        assert data["preferred_colors"] == ["Red"]
        assert data["preferred_cities"] == ["Ventspils"]

"""
Tests for address endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Address


class TestListAddresses:
    """Tests for GET /api/addresses"""

    async def test_list_addresses_requires_auth(self, client: AsyncClient):
        """Test that listing addresses requires authentication."""
        response = await client.get("/api/addresses")
        assert response.status_code == 401

    async def test_list_addresses_empty(self, auth_client: AsyncClient):
        """Test listing addresses when none exist."""
        response = await auth_client.get("/api/addresses")
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_addresses_with_data(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_user
    ):
        """Test listing addresses with data."""
        # Create address
        address = Address(
            user_id=test_user.id,
            name="John Doe",
            address_line1="123 Main St",
            city="Riga",
            postal_code="LV-1001",
            country="Latvia",
            is_default=True,
        )
        db_session.add(address)
        await db_session.commit()

        response = await auth_client.get("/api/addresses")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "John Doe"
        assert data[0]["is_default"] is True


class TestCreateAddress:
    """Tests for POST /api/addresses"""

    async def test_create_address_requires_auth(self, client: AsyncClient):
        """Test that creating address requires authentication."""
        response = await client.post(
            "/api/addresses",
            json={
                "name": "John Doe",
                "address_line1": "123 Main St",
                "city": "Riga",
                "postal_code": "LV-1001",
                "country": "Latvia",
            },
        )
        assert response.status_code == 401

    async def test_create_address_success(self, auth_client: AsyncClient):
        """Test creating an address."""
        response = await auth_client.post(
            "/api/addresses",
            json={
                "name": "John Doe",
                "address_line1": "123 Main St",
                "city": "Riga",
                "postal_code": "LV-1001",
                "country": "Latvia",
                "phone": "+37120000000",
                "label": "Home",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "John Doe"
        assert data["city"] == "Riga"
        assert data["label"] == "Home"

    async def test_create_first_address_becomes_default(
        self, auth_client: AsyncClient
    ):
        """Test that the first address automatically becomes default."""
        response = await auth_client.post(
            "/api/addresses",
            json={
                "name": "John Doe",
                "address_line1": "123 Main St",
                "city": "Riga",
                "postal_code": "LV-1001",
                "country": "Latvia",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["is_default"] is True


class TestGetAddress:
    """Tests for GET /api/addresses/{id}"""

    async def test_get_address_success(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_user
    ):
        """Test getting a specific address."""
        address = Address(
            user_id=test_user.id,
            name="John Doe",
            address_line1="123 Main St",
            city="Riga",
            postal_code="LV-1001",
            country="Latvia",
        )
        db_session.add(address)
        await db_session.commit()
        await db_session.refresh(address)

        response = await auth_client.get(f"/api/addresses/{address.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "John Doe"
        assert data["id"] == address.id

    async def test_get_address_not_found(self, auth_client: AsyncClient):
        """Test getting a non-existent address."""
        response = await auth_client.get("/api/addresses/99999")
        assert response.status_code == 404

    async def test_get_address_requires_auth(self, client: AsyncClient):
        """Test that getting address requires authentication."""
        response = await client.get("/api/addresses/1")
        assert response.status_code == 401


class TestUpdateAddress:
    """Tests for PUT /api/addresses/{id}"""

    async def test_update_address_success(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_user
    ):
        """Test updating an address."""
        address = Address(
            user_id=test_user.id,
            name="John Doe",
            address_line1="123 Main St",
            city="Riga",
            postal_code="LV-1001",
            country="Latvia",
        )
        db_session.add(address)
        await db_session.commit()
        await db_session.refresh(address)

        response = await auth_client.put(
            f"/api/addresses/{address.id}",
            json={
                "name": "Jane Doe",
                "address_line1": "456 Oak Ave",
                "city": "Liepaja",
                "postal_code": "LV-3401",
                "country": "Latvia",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Jane Doe"
        assert data["city"] == "Liepaja"

    async def test_update_address_requires_auth(self, client: AsyncClient):
        """Test that updating address requires authentication."""
        response = await client.put(
            "/api/addresses/1",
            json={
                "name": "Jane Doe",
                "address_line1": "456 Oak Ave",
                "city": "Liepaja",
                "postal_code": "LV-3401",
                "country": "Latvia",
            },
        )
        assert response.status_code == 401


class TestDeleteAddress:
    """Tests for DELETE /api/addresses/{id}"""

    async def test_delete_address_success(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_user
    ):
        """Test deleting an address."""
        address = Address(
            user_id=test_user.id,
            name="John Doe",
            address_line1="123 Main St",
            city="Riga",
            postal_code="LV-1001",
            country="Latvia",
        )
        db_session.add(address)
        await db_session.commit()
        await db_session.refresh(address)

        response = await auth_client.delete(f"/api/addresses/{address.id}")
        assert response.status_code == 204

    async def test_delete_default_address_reassigns_default(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_user
    ):
        """Test that deleting default address reassigns default to another."""
        # Create two addresses
        address1 = Address(
            user_id=test_user.id,
            name="Address 1",
            address_line1="123 Main St",
            city="Riga",
            postal_code="LV-1001",
            country="Latvia",
            is_default=True,
        )
        address2 = Address(
            user_id=test_user.id,
            name="Address 2",
            address_line1="456 Oak Ave",
            city="Liepaja",
            postal_code="LV-3401",
            country="Latvia",
            is_default=False,
        )
        db_session.add_all([address1, address2])
        await db_session.commit()
        await db_session.refresh(address1)
        await db_session.refresh(address2)

        # Delete default address
        response = await auth_client.delete(f"/api/addresses/{address1.id}")
        assert response.status_code == 204

        # Check that address2 is now default
        response = await auth_client.get(f"/api/addresses/{address2.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["is_default"] is True

    async def test_delete_address_requires_auth(self, client: AsyncClient):
        """Test that deleting address requires authentication."""
        response = await client.delete("/api/addresses/1")
        assert response.status_code == 401


class TestSetDefaultAddress:
    """Tests for POST /api/addresses/{id}/set-default"""

    async def test_set_default_address_success(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_user
    ):
        """Test setting an address as default."""
        # Create two addresses
        address1 = Address(
            user_id=test_user.id,
            name="Address 1",
            address_line1="123 Main St",
            city="Riga",
            postal_code="LV-1001",
            country="Latvia",
            is_default=True,
        )
        address2 = Address(
            user_id=test_user.id,
            name="Address 2",
            address_line1="456 Oak Ave",
            city="Liepaja",
            postal_code="LV-3401",
            country="Latvia",
            is_default=False,
        )
        db_session.add_all([address1, address2])
        await db_session.commit()
        await db_session.refresh(address1)
        await db_session.refresh(address2)

        # Set address2 as default
        response = await auth_client.post(f"/api/addresses/{address2.id}/set-default")
        assert response.status_code == 200
        data = response.json()
        assert data["is_default"] is True

        # Verify address1 is no longer default
        response = await auth_client.get(f"/api/addresses/{address1.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["is_default"] is False

    async def test_set_default_address_requires_auth(self, client: AsyncClient):
        """Test that setting default address requires authentication."""
        response = await client.post("/api/addresses/1/set-default")
        assert response.status_code == 401

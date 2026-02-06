"""
Tests for admin product management endpoints.
"""

import pytest
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestListProducts:
    """Tests for GET /api/admin/products"""

    async def test_list_products_requires_admin(self, auth_client: AsyncClient):
        """Regular users cannot access admin products."""
        response = await auth_client.get("/api/admin/products")
        assert response.status_code == 403

    async def test_list_products_unauthenticated(self, client: AsyncClient):
        """Unauthenticated users cannot access admin products."""
        response = await client.get("/api/admin/products")
        assert response.status_code == 401

    async def test_list_products_success(
        self, admin_client: AsyncClient, test_product
    ):
        """Admin can list products with stock info."""
        response = await admin_client.get("/api/admin/products")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) >= 1
        product = data["products"][0]
        assert "id" in product
        assert "city_name" in product
        assert "variant_count" in product
        assert "total_stock" in product
        assert "low_stock_count" in product


class TestGetProduct:
    """Tests for GET /api/admin/products/{product_id}"""

    async def test_get_product_success(
        self, admin_client: AsyncClient, test_product
    ):
        """Admin can get product with variants."""
        response = await admin_client.get(
            f"/api/admin/products/{test_product.id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_product.id
        assert "variants" in data
        assert len(data["variants"]) > 0

    async def test_get_product_not_found(self, admin_client: AsyncClient):
        """Returns 404 for non-existent product."""
        response = await admin_client.get("/api/admin/products/99999")
        assert response.status_code == 404


class TestListVariants:
    """Tests for GET /api/admin/products/{product_id}/variants"""

    async def test_list_variants_success(
        self, admin_client: AsyncClient, test_product
    ):
        """Admin can list variants for a product."""
        response = await admin_client.get(
            f"/api/admin/products/{test_product.id}/variants"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        variant = data[0]
        assert "color" in variant
        assert "size" in variant
        assert "price" in variant
        assert "stock" in variant

    async def test_list_variants_product_not_found(
        self, admin_client: AsyncClient
    ):
        """Returns 404 when product doesn't exist."""
        response = await admin_client.get(
            "/api/admin/products/99999/variants"
        )
        assert response.status_code == 404


class TestUpdateVariant:
    """Tests for PUT /api/admin/products/{product_id}/variants/{variant_id}"""

    async def test_update_variant_price(
        self, admin_client: AsyncClient, test_product, test_variant
    ):
        """Admin can update variant price."""
        response = await admin_client.put(
            f"/api/admin/products/{test_product.id}/variants/{test_variant.id}",
            json={"price": 29.99},
        )
        assert response.status_code == 200
        data = response.json()
        assert float(data["price"]) == 29.99

    async def test_update_variant_stock(
        self, admin_client: AsyncClient, test_product, test_variant
    ):
        """Admin can update variant stock."""
        response = await admin_client.put(
            f"/api/admin/products/{test_product.id}/variants/{test_variant.id}",
            json={"stock": 50},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["stock"] == 50

    async def test_update_variant_negative_stock_rejected(
        self, admin_client: AsyncClient, test_product, test_variant
    ):
        """Cannot set negative stock."""
        response = await admin_client.put(
            f"/api/admin/products/{test_product.id}/variants/{test_variant.id}",
            json={"stock": -1},
        )
        assert response.status_code == 400

    async def test_update_variant_not_found(
        self, admin_client: AsyncClient, test_product
    ):
        """Returns 404 for non-existent variant."""
        response = await admin_client.put(
            f"/api/admin/products/{test_product.id}/variants/99999",
            json={"price": 29.99},
        )
        assert response.status_code == 404

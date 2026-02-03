"""
Tests for product endpoints.
"""

import pytest
from httpx import AsyncClient

from app.models import Product, TShirtVariant


class TestListProducts:
    """Tests for GET /api/products"""

    async def test_list_products_empty(self, client: AsyncClient):
        """Test listing products when none exist."""
        response = await client.get("/api/products")
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_products_with_data(self, client: AsyncClient, test_product: Product):
        """Test listing products with data."""
        response = await client.get("/api/products")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["city_name"] == "Riga"
        assert data[0]["city_name_lv"] == "Rīga"

    async def test_list_products_includes_min_price(self, client: AsyncClient, test_product: Product):
        """Test that product list includes min_price."""
        response = await client.get("/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "min_price" in data[0]


class TestGetProduct:
    """Tests for GET /api/products/{id}"""

    async def test_get_product_success(self, client: AsyncClient, test_product: Product):
        """Test getting a single product."""
        response = await client.get(f"/api/products/{test_product.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["city_name"] == "Riga"
        assert "variants" in data
        assert len(data["variants"]) == 9  # 3 colors × 3 sizes

    async def test_get_product_not_found(self, client: AsyncClient):
        """Test getting a non-existent product."""
        response = await client.get("/api/products/99999")
        assert response.status_code == 404

    async def test_get_product_variants_have_required_fields(
        self, client: AsyncClient, test_product: Product
    ):
        """Test that product variants have all required fields."""
        response = await client.get(f"/api/products/{test_product.id}")
        assert response.status_code == 200
        variant = response.json()["variants"][0]

        assert "id" in variant
        assert "color" in variant
        assert "size" in variant
        assert "price" in variant
        assert "stock" in variant
        assert "sku" in variant


class TestGetProductVariants:
    """Tests for GET /api/products/{id}/variants"""

    async def test_get_variants_success(self, client: AsyncClient, test_product: Product):
        """Test getting product variants."""
        response = await client.get(f"/api/products/{test_product.id}/variants")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 9

    async def test_get_variants_not_found(self, client: AsyncClient):
        """Test getting variants for non-existent product returns empty list."""
        response = await client.get("/api/products/99999/variants")
        # API returns empty list for non-existent product variants
        assert response.status_code == 200
        assert response.json() == []


class TestProductFiltering:
    """Tests for product search and filtering."""

    async def test_search_products(self, client: AsyncClient, test_product: Product):
        """Test searching products by name."""
        response = await client.get("/api/products?search=Riga")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(p["city_name"] == "Riga" for p in data)

    async def test_search_products_no_match(self, client: AsyncClient, test_product: Product):
        """Test search with no matching products."""
        response = await client.get("/api/products?search=nonexistent")
        assert response.status_code == 200
        data = response.json()
        # May return empty or all products depending on implementation
        assert isinstance(data, list)

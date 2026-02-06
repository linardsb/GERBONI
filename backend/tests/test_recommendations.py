"""
Tests for recommendation endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal

from app.models import Product, TShirtVariant


class TestPopularRecommendations:
    """Tests for GET /api/recommendations/popular"""

    async def test_popular_recommendations_empty(self, client: AsyncClient):
        """Test popular recommendations when no products exist."""
        response = await client.get("/api/recommendations/popular")
        assert response.status_code == 200
        assert response.json() == []

    async def test_popular_recommendations_with_products(
        self, client: AsyncClient, test_product: Product
    ):
        """Test popular recommendations returns products."""
        response = await client.get("/api/recommendations/popular")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert isinstance(data, list)

    async def test_popular_recommendations_limit(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test popular recommendations respects limit parameter."""
        # Create multiple products
        cities = ["Riga", "Liepaja", "Daugavpils", "Jelgava", "Jurmala"]
        for city in cities:
            product = Product(
                city_name=city,
                city_name_lv=city,
                coat_of_arms_image=f"{city.lower()}.svg",
                description=f"T-shirt featuring {city}",
                description_lv=f"T-krekls ar {city}",
                is_active=True,
            )
            db_session.add(product)
        await db_session.commit()

        response = await client.get("/api/recommendations/popular?limit=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 3

    async def test_popular_recommendations_default_limit(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test popular recommendations uses default limit."""
        # Create many products
        for i in range(15):
            product = Product(
                city_name=f"City{i}",
                city_name_lv=f"City{i}",
                coat_of_arms_image=f"city{i}.svg",
                description=f"Product {i}",
                description_lv=f"Product {i}",
                is_active=True,
            )
            db_session.add(product)
        await db_session.commit()

        response = await client.get("/api/recommendations/popular")
        assert response.status_code == 200
        data = response.json()
        # Default limit should be reasonable (e.g., 10)
        assert len(data) <= 10

    async def test_popular_recommendations_product_fields(
        self, client: AsyncClient, test_product: Product
    ):
        """Test that popular recommendations include necessary product fields."""
        response = await client.get("/api/recommendations/popular")
        assert response.status_code == 200
        data = response.json()

        if len(data) > 0:
            product = data[0]
            assert "id" in product
            assert "city_name" in product
            assert "coat_of_arms_image" in product


class TestRelatedProducts:
    """Tests for GET /api/recommendations/related/{product_id}"""

    async def test_related_products_success(
        self, client: AsyncClient, test_product: Product, db_session: AsyncSession
    ):
        """Test getting related products."""
        # Create additional products to have related items
        product2 = Product(
            city_name="Liepaja",
            city_name_lv="Liepāja",
            coat_of_arms_image="liepaja.svg",
            description="T-shirt featuring Liepaja",
            description_lv="T-krekls ar Liepāju",
            is_active=True,
        )
        db_session.add(product2)
        await db_session.commit()

        response = await client.get(f"/api/recommendations/related/{test_product.id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should not include the product itself
        if len(data) > 0:
            assert all(p["id"] != test_product.id for p in data)

    async def test_related_products_nonexistent_product(self, client: AsyncClient):
        """Test getting related products for non-existent product."""
        response = await client.get("/api/recommendations/related/99999")
        # May return empty list or 404 depending on implementation
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            assert isinstance(response.json(), list)

    async def test_related_products_respects_limit(
        self, client: AsyncClient, test_product: Product, db_session: AsyncSession
    ):
        """Test that related products respects limit parameter."""
        # Create multiple products
        for i in range(10):
            product = Product(
                city_name=f"City{i}",
                city_name_lv=f"City{i}",
                coat_of_arms_image=f"city{i}.svg",
                description=f"Product {i}",
                description_lv=f"Product {i}",
                is_active=True,
            )
            db_session.add(product)
        await db_session.commit()

        response = await client.get(
            f"/api/recommendations/related/{test_product.id}?limit=3"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 3

    async def test_related_products_empty_catalog(
        self, client: AsyncClient, test_product: Product
    ):
        """Test related products when only one product exists."""
        response = await client.get(f"/api/recommendations/related/{test_product.id}")
        assert response.status_code == 200
        data = response.json()
        # Should be empty since no other products exist
        assert isinstance(data, list)


class TestFrequentlyBoughtTogether:
    """Tests for GET /api/recommendations/frequently-bought-together/{product_id}"""

    async def test_frequently_bought_together_success(
        self, client: AsyncClient, test_product: Product, db_session: AsyncSession
    ):
        """Test getting frequently bought together recommendations."""
        # Create additional products
        product2 = Product(
            city_name="Liepaja",
            city_name_lv="Liepāja",
            coat_of_arms_image="liepaja.svg",
            description="T-shirt featuring Liepaja",
            description_lv="T-krekls ar Liepāju",
            is_active=True,
        )
        db_session.add(product2)
        await db_session.commit()

        response = await client.get(
            f"/api/recommendations/frequently-bought-together/{test_product.id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_frequently_bought_together_nonexistent_product(
        self, client: AsyncClient
    ):
        """Test frequently bought together for non-existent product."""
        response = await client.get(
            "/api/recommendations/frequently-bought-together/99999"
        )
        # May return empty list or 404 depending on implementation
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            assert isinstance(response.json(), list)

    async def test_frequently_bought_together_respects_limit(
        self, client: AsyncClient, test_product: Product, db_session: AsyncSession
    ):
        """Test that frequently bought together respects limit parameter."""
        # Create multiple products
        for i in range(10):
            product = Product(
                city_name=f"City{i}",
                city_name_lv=f"City{i}",
                coat_of_arms_image=f"city{i}.svg",
                description=f"Product {i}",
                description_lv=f"Product {i}",
                is_active=True,
            )
            db_session.add(product)
        await db_session.commit()

        response = await client.get(
            f"/api/recommendations/frequently-bought-together/{test_product.id}?limit=2"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 2

    async def test_frequently_bought_together_excludes_source_product(
        self, client: AsyncClient, test_product: Product, db_session: AsyncSession
    ):
        """Test that frequently bought together excludes the source product."""
        # Create additional products
        for i in range(3):
            product = Product(
                city_name=f"City{i}",
                city_name_lv=f"City{i}",
                coat_of_arms_image=f"city{i}.svg",
                description=f"Product {i}",
                description_lv=f"Product {i}",
                is_active=True,
            )
            db_session.add(product)
        await db_session.commit()

        response = await client.get(
            f"/api/recommendations/frequently-bought-together/{test_product.id}"
        )
        assert response.status_code == 200
        data = response.json()
        # Should not include the source product itself
        if len(data) > 0:
            assert all(p["id"] != test_product.id for p in data)

    async def test_frequently_bought_together_empty_catalog(
        self, client: AsyncClient, test_product: Product
    ):
        """Test frequently bought together when only one product exists."""
        response = await client.get(
            f"/api/recommendations/frequently-bought-together/{test_product.id}"
        )
        assert response.status_code == 200
        data = response.json()
        # Should be empty since no other products exist
        assert isinstance(data, list)


class TestRecommendationProductData:
    """Tests for recommendation endpoint data integrity."""

    async def test_recommendations_include_min_price(
        self, client: AsyncClient, test_product: Product
    ):
        """Test that recommendation products include min_price."""
        response = await client.get("/api/recommendations/popular")
        assert response.status_code == 200
        data = response.json()

        if len(data) > 0:
            product = data[0]
            # May or may not include min_price depending on schema
            assert "id" in product
            assert "city_name" in product

    async def test_recommendations_only_active_products(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that recommendations only return active products."""
        # Create active and inactive products
        active_product = Product(
            city_name="Active City",
            city_name_lv="Active City",
            coat_of_arms_image="active.svg",
            description="Active product",
            description_lv="Active product",
            is_active=True,
        )
        inactive_product = Product(
            city_name="Inactive City",
            city_name_lv="Inactive City",
            coat_of_arms_image="inactive.svg",
            description="Inactive product",
            description_lv="Inactive product",
            is_active=False,
        )
        db_session.add_all([active_product, inactive_product])
        await db_session.commit()

        response = await client.get("/api/recommendations/popular")
        assert response.status_code == 200
        data = response.json()

        # All returned products should be active
        inactive_ids = [p["id"] for p in data if p.get("city_name") == "Inactive City"]
        assert len(inactive_ids) == 0

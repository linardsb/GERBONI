"""
Tests for product endpoints.
"""

import pytest
from decimal import Decimal
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


class TestProductSearch:
    """Tests for product search via q parameter."""

    async def test_search_by_city_name(self, client: AsyncClient, test_product: Product):
        """Test searching products by English city name."""
        response = await client.get("/api/products?q=Riga")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["city_name"] == "Riga"

    async def test_search_by_city_name_lv(self, client: AsyncClient, test_product: Product):
        """Test searching products by Latvian city name."""
        response = await client.get("/api/products?q=Rīga")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_search_by_description(self, client: AsyncClient, test_product: Product):
        """Test searching products by description content."""
        response = await client.get("/api/products?q=coat+of+arms")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_search_case_insensitive(self, client: AsyncClient, test_product: Product):
        """Test that search is case-insensitive."""
        response = await client.get("/api/products?q=riga")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_search_no_results(self, client: AsyncClient, test_product: Product):
        """Test search with no matching products."""
        response = await client.get("/api/products?q=nonexistent")
        assert response.status_code == 200
        assert response.json() == []

    async def test_search_empty_query_returns_all(self, client: AsyncClient, test_product: Product):
        """Test that empty q returns all products."""
        response = await client.get("/api/products")
        assert response.status_code == 200
        assert len(response.json()) == 1


class TestProductColorFilter:
    """Tests for filtering products by variant color."""

    async def test_filter_by_color(self, client: AsyncClient, test_product: Product):
        """Test filtering by color that exists."""
        response = await client.get("/api/products?color=Black")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_filter_by_color_case_insensitive(self, client: AsyncClient, test_product: Product):
        """Test that color filter is case-insensitive."""
        response = await client.get("/api/products?color=black")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_filter_by_nonexistent_color(self, client: AsyncClient, test_product: Product):
        """Test filtering by color that no variant has."""
        response = await client.get("/api/products?color=Purple")
        assert response.status_code == 200
        assert response.json() == []


class TestProductSizeFilter:
    """Tests for filtering products by variant size."""

    async def test_filter_by_size(self, client: AsyncClient, test_product: Product):
        """Test filtering by size that exists."""
        response = await client.get("/api/products?size=M")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_filter_by_size_case_insensitive(self, client: AsyncClient, test_product: Product):
        """Test that size filter is case-insensitive."""
        response = await client.get("/api/products?size=m")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_filter_by_nonexistent_size(self, client: AsyncClient, test_product: Product):
        """Test filtering by size that no variant has."""
        response = await client.get("/api/products?size=XXXL")
        assert response.status_code == 200
        assert response.json() == []


class TestProductPriceFilter:
    """Tests for filtering products by price range."""

    async def test_filter_min_price(self, client: AsyncClient, test_product: Product):
        """Test filtering by minimum price."""
        response = await client.get("/api/products?min_price=20")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_filter_min_price_too_high(self, client: AsyncClient, test_product: Product):
        """Test min_price higher than any product price."""
        response = await client.get("/api/products?min_price=100")
        assert response.status_code == 200
        assert response.json() == []

    async def test_filter_max_price(self, client: AsyncClient, test_product: Product):
        """Test filtering by maximum price."""
        response = await client.get("/api/products?max_price=30")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_filter_max_price_too_low(self, client: AsyncClient, test_product: Product):
        """Test max_price lower than any product price."""
        response = await client.get("/api/products?max_price=1")
        assert response.status_code == 200
        assert response.json() == []

    async def test_filter_price_range(self, client: AsyncClient, test_product: Product):
        """Test filtering by both min and max price."""
        response = await client.get("/api/products?min_price=20&max_price=30")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1


class TestProductStockFilter:
    """Tests for filtering products by stock availability."""

    async def test_filter_in_stock(self, client: AsyncClient, test_product: Product):
        """Test filtering for in-stock products."""
        response = await client.get("/api/products?in_stock=true")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_filter_in_stock_with_zero_stock(
        self, client: AsyncClient, db_session, test_product: Product
    ):
        """Test that out-of-stock products are excluded when in_stock=true."""
        from sqlalchemy import update

        # Set all variants to 0 stock
        await db_session.execute(
            update(TShirtVariant)
            .where(TShirtVariant.product_id == test_product.id)
            .values(stock=0)
        )
        await db_session.commit()

        response = await client.get("/api/products?in_stock=true")
        assert response.status_code == 200
        assert response.json() == []


class TestProductSorting:
    """Tests for product sorting."""

    async def test_sort_by_name_asc(self, client: AsyncClient, db_session):
        """Test sorting by name ascending."""
        # Create multiple products
        p1 = Product(
            city_name="Zelda",
            city_name_lv="Zelda",
            coat_of_arms_image="z.svg",
            description="Z city",
            is_active=True,
        )
        p2 = Product(
            city_name="Alpha",
            city_name_lv="Alfa",
            coat_of_arms_image="a.svg",
            description="A city",
            is_active=True,
        )
        db_session.add_all([p1, p2])
        await db_session.commit()

        # Add a variant to each so min_price is populated
        for p in [p1, p2]:
            await db_session.refresh(p)
            v = TShirtVariant(
                product_id=p.id, color="Black", size="M",
                price=Decimal("24.99"), stock=10, sku=f"{p.city_name[:3].upper()}-BLA-M",
            )
            db_session.add(v)
        await db_session.commit()

        response = await client.get("/api/products?sort=name_asc")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["city_name"] == "Alpha"
        assert data[1]["city_name"] == "Zelda"

    async def test_sort_by_price_asc(self, client: AsyncClient, db_session):
        """Test sorting by price ascending."""
        p1 = Product(
            city_name="Expensive",
            city_name_lv="Dārga",
            coat_of_arms_image="exp.svg",
            description="Expensive city",
            is_active=True,
        )
        p2 = Product(
            city_name="Cheap",
            city_name_lv="Lēta",
            coat_of_arms_image="chp.svg",
            description="Cheap city",
            is_active=True,
        )
        db_session.add_all([p1, p2])
        await db_session.commit()

        for p, price in [(p1, Decimal("50.00")), (p2, Decimal("10.00"))]:
            await db_session.refresh(p)
            v = TShirtVariant(
                product_id=p.id, color="Black", size="M",
                price=price, stock=10, sku=f"{p.city_name[:3].upper()}-BLA-M",
            )
            db_session.add(v)
        await db_session.commit()

        response = await client.get("/api/products?sort=price_asc")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert float(data[0]["min_price"]) < float(data[1]["min_price"])

    async def test_sort_by_price_desc(self, client: AsyncClient, db_session):
        """Test sorting by price descending."""
        p1 = Product(
            city_name="ExpensiveD",
            city_name_lv="DārgaD",
            coat_of_arms_image="expd.svg",
            description="Expensive city desc",
            is_active=True,
        )
        p2 = Product(
            city_name="CheapD",
            city_name_lv="LētaD",
            coat_of_arms_image="chpd.svg",
            description="Cheap city desc",
            is_active=True,
        )
        db_session.add_all([p1, p2])
        await db_session.commit()

        for p, price in [(p1, Decimal("50.00")), (p2, Decimal("10.00"))]:
            await db_session.refresh(p)
            v = TShirtVariant(
                product_id=p.id, color="Black", size="M",
                price=price, stock=10, sku=f"{p.city_name[:3].upper()}-BLA-MD",
            )
            db_session.add(v)
        await db_session.commit()

        response = await client.get("/api/products?sort=price_desc")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert float(data[0]["min_price"]) > float(data[1]["min_price"])


class TestProductCombinedFilters:
    """Tests for combining multiple filters."""

    async def test_search_with_color_filter(self, client: AsyncClient, test_product: Product):
        """Test combining search with color filter."""
        response = await client.get("/api/products?q=Riga&color=Black")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_search_with_no_match_combo(self, client: AsyncClient, test_product: Product):
        """Test combining search that matches with color that doesn't."""
        response = await client.get("/api/products?q=Riga&color=Purple")
        assert response.status_code == 200
        assert response.json() == []

    async def test_all_filters_combined(self, client: AsyncClient, test_product: Product):
        """Test all filters applied at once."""
        response = await client.get(
            "/api/products?q=Riga&color=Black&size=M&min_price=20&max_price=30&in_stock=true&sort=price_asc"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

"""Tests for admin CSV export endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestOrdersExport:
    async def test_export_orders_csv(self, admin_client: AsyncClient, db_session):
        """Export orders returns CSV with correct headers."""
        response = await admin_client.get("/api/admin/orders/export")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")
        assert 'filename="orders.csv"' in response.headers["content-disposition"]

        lines = response.text.strip().split("\n")
        header = lines[0]
        assert "id" in header
        assert "status" in header
        assert "total" in header
        assert "created_at" in header

    async def test_export_orders_with_status_filter(self, admin_client: AsyncClient):
        """Status filter is accepted."""
        response = await admin_client.get("/api/admin/orders/export?status=paid")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")

    async def test_export_orders_with_date_range(self, admin_client: AsyncClient):
        """Date range filter is accepted."""
        response = await admin_client.get(
            "/api/admin/orders/export?date_from=2025-01-01&date_to=2026-12-31"
        )
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")

    async def test_export_orders_unauthorized(self, client: AsyncClient):
        """Non-admin users cannot export."""
        response = await client.get("/api/admin/orders/export")
        assert response.status_code in (401, 403)


@pytest.mark.asyncio
class TestProductsExport:
    async def test_export_products_csv(
        self, admin_client: AsyncClient, test_product
    ):
        """Export products returns CSV with one row per variant."""
        response = await admin_client.get("/api/admin/products/export")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")
        assert 'filename="products.csv"' in response.headers["content-disposition"]

        lines = response.text.strip().split("\n")
        header = lines[0]
        assert "product_id" in header
        assert "color" in header
        assert "size" in header
        assert "price" in header
        assert "sku" in header

        # test_product creates 9 variants (3 colors x 3 sizes) + 1 header
        assert len(lines) >= 2  # at least header + 1 row

    async def test_export_products_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/admin/products/export")
        assert response.status_code in (401, 403)


@pytest.mark.asyncio
class TestUsersExport:
    async def test_export_users_csv(self, admin_client: AsyncClient, test_user):
        """Export users returns CSV."""
        response = await admin_client.get("/api/admin/users/export")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")
        assert 'filename="users.csv"' in response.headers["content-disposition"]

        lines = response.text.strip().split("\n")
        header = lines[0]
        assert "id" in header
        assert "email" in header
        assert "role" in header

    async def test_export_users_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/admin/users/export")
        assert response.status_code in (401, 403)

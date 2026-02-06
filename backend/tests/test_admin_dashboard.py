"""
Tests for admin dashboard endpoints.
"""

import pytest
from httpx import AsyncClient


class TestDashboardStats:
    """Tests for GET /api/admin/dashboard/stats"""

    async def test_stats_requires_admin(self, auth_client: AsyncClient):
        """Regular users cannot access dashboard stats."""
        response = await auth_client.get("/api/admin/dashboard/stats")
        assert response.status_code == 403

    async def test_stats_unauthenticated(self, client: AsyncClient):
        """Unauthenticated users cannot access dashboard stats."""
        response = await client.get("/api/admin/dashboard/stats")
        assert response.status_code == 401

    async def test_stats_success(self, admin_client: AsyncClient):
        """Admin can get dashboard stats."""
        response = await admin_client.get("/api/admin/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert "pending_orders" in data
        assert "total_revenue" in data
        assert "total_customers" in data
        assert "orders_today" in data
        assert "revenue_today" in data
        assert "low_stock_variants" in data

    async def test_stats_counts_orders(
        self, admin_client: AsyncClient, test_order
    ):
        """Stats correctly count orders."""
        response = await admin_client.get("/api/admin/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["total_orders"] >= 1
        assert data["pending_orders"] >= 1

    async def test_stats_counts_revenue(
        self, admin_client: AsyncClient, test_paid_order
    ):
        """Stats correctly sum revenue from paid orders."""
        response = await admin_client.get("/api/admin/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert float(data["total_revenue"]) > 0

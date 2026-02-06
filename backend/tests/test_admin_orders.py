"""
Tests for admin order management endpoints.
Includes regression tests for BUG-004: Admin orders API calling wrong OrderService methods.
"""

import pytest
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Order, OrderItem, OrderStatus


class TestListOrders:
    """Tests for GET /api/admin/orders"""

    async def test_list_orders_requires_admin(self, auth_client: AsyncClient):
        """Regular users cannot access admin orders."""
        response = await auth_client.get("/api/admin/orders")
        assert response.status_code == 403

    async def test_list_orders_unauthenticated(self, client: AsyncClient):
        """Unauthenticated users cannot access admin orders."""
        response = await client.get("/api/admin/orders")
        assert response.status_code == 401

    async def test_list_orders_empty(self, admin_client: AsyncClient):
        """Admin can list orders when none exist."""
        response = await admin_client.get("/api/admin/orders")
        assert response.status_code == 200
        data = response.json()
        assert data["orders"] == []
        assert data["total"] == 0

    async def test_list_orders_with_data(
        self, admin_client: AsyncClient, test_order
    ):
        """Admin can list orders."""
        response = await admin_client.get("/api/admin/orders")
        assert response.status_code == 200
        data = response.json()
        assert len(data["orders"]) >= 1
        assert data["total"] >= 1

    async def test_list_orders_status_filter(
        self, admin_client: AsyncClient, test_order
    ):
        """Admin can filter orders by status."""
        response = await admin_client.get(
            "/api/admin/orders", params={"status": "pending"}
        )
        assert response.status_code == 200
        data = response.json()
        for order in data["orders"]:
            assert order["status"] == "pending"

    async def test_list_orders_pagination(self, admin_client: AsyncClient):
        """Admin can paginate orders."""
        response = await admin_client.get(
            "/api/admin/orders", params={"limit": 10, "offset": 0}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 10
        assert data["offset"] == 0


class TestGetOrder:
    """Tests for GET /api/admin/orders/{order_id}"""

    async def test_get_order_requires_admin(
        self, auth_client: AsyncClient, test_order
    ):
        """Regular users cannot access admin order detail."""
        response = await auth_client.get(f"/api/admin/orders/{test_order.id}")
        assert response.status_code == 403

    async def test_get_order_success(
        self, admin_client: AsyncClient, test_order
    ):
        """Admin can get order details."""
        response = await admin_client.get(f"/api/admin/orders/{test_order.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_order.id
        assert data["status"] == "pending"
        assert "items" in data

    async def test_get_order_not_found(self, admin_client: AsyncClient):
        """Returns 404 for non-existent order."""
        response = await admin_client.get("/api/admin/orders/99999")
        assert response.status_code == 404


class TestUpdateOrderStatus:
    """Tests for PUT /api/admin/orders/{order_id}/status

    BUG-004 regression: This endpoint previously called wrong OrderService methods
    (e.g., mark_processing, cancel_order, mark_refunded which don't exist).
    """

    async def test_update_status_requires_admin(
        self, auth_client: AsyncClient, test_order
    ):
        """Regular users cannot update order status."""
        response = await auth_client.put(
            f"/api/admin/orders/{test_order.id}/status",
            json={"status": "paid"},
        )
        assert response.status_code == 403

    async def test_update_status_pending_to_paid(
        self, admin_client: AsyncClient, test_order
    ):
        """BUG-004 regression: mark_paid must use order_id, not order object."""
        response = await admin_client.put(
            f"/api/admin/orders/{test_order.id}/status",
            json={"status": "paid"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "paid"

    async def test_update_status_paid_to_processing(
        self, admin_client: AsyncClient, test_paid_order
    ):
        """BUG-004 regression: mark_processing doesn't exist, must use transition_status."""
        response = await admin_client.put(
            f"/api/admin/orders/{test_paid_order.id}/status",
            json={"status": "processing"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processing"

    async def test_update_status_processing_to_shipped(
        self,
        admin_client: AsyncClient,
        db_session: AsyncSession,
        test_paid_order,
    ):
        """BUG-004 regression: mark_shipped doesn't exist, must use ship_order."""
        # First move to processing
        test_paid_order.status = OrderStatus.PROCESSING.value
        await db_session.commit()

        response = await admin_client.put(
            f"/api/admin/orders/{test_paid_order.id}/status",
            json={"status": "shipped"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "shipped"

    async def test_update_status_shipped_to_delivered(
        self,
        admin_client: AsyncClient,
        db_session: AsyncSession,
        test_paid_order,
    ):
        """BUG-004 regression: mark_delivered must use order_id, not order object."""
        test_paid_order.status = OrderStatus.SHIPPED.value
        await db_session.commit()

        response = await admin_client.put(
            f"/api/admin/orders/{test_paid_order.id}/status",
            json={"status": "delivered"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "delivered"

    async def test_update_status_cancel(
        self, admin_client: AsyncClient, test_order
    ):
        """BUG-004 regression: cancel_order doesn't exist, must use cancel."""
        response = await admin_client.put(
            f"/api/admin/orders/{test_order.id}/status",
            json={"status": "cancelled"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cancelled"

    async def test_update_status_refund(
        self, admin_client: AsyncClient, test_paid_order
    ):
        """BUG-004 regression: mark_refunded doesn't exist, must use process_refund."""
        response = await admin_client.put(
            f"/api/admin/orders/{test_paid_order.id}/status",
            json={"status": "refunded"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "refunded"

    async def test_update_status_invalid_transition(
        self, admin_client: AsyncClient, test_order
    ):
        """Cannot skip statuses (e.g. pending -> shipped)."""
        response = await admin_client.put(
            f"/api/admin/orders/{test_order.id}/status",
            json={"status": "shipped"},
        )
        assert response.status_code == 400

    async def test_update_status_invalid_value(
        self, admin_client: AsyncClient, test_order
    ):
        """Invalid status string returns 400."""
        response = await admin_client.put(
            f"/api/admin/orders/{test_order.id}/status",
            json={"status": "nonexistent"},
        )
        assert response.status_code == 400

    async def test_update_status_order_not_found(
        self, admin_client: AsyncClient
    ):
        """Returns 404 for non-existent order."""
        response = await admin_client.put(
            "/api/admin/orders/99999/status",
            json={"status": "paid"},
        )
        assert response.status_code == 404


class TestShipOrder:
    """Tests for POST /api/admin/orders/{order_id}/ship"""

    async def test_ship_order_requires_admin(
        self, auth_client: AsyncClient, test_paid_order
    ):
        """Regular users cannot ship orders."""
        response = await auth_client.post(
            f"/api/admin/orders/{test_paid_order.id}/ship",
            json={"tracking_number": "TRACK123"},
        )
        assert response.status_code == 403

    async def test_ship_order_success(
        self,
        admin_client: AsyncClient,
        db_session: AsyncSession,
        test_paid_order,
    ):
        """BUG-004 regression: ship endpoint must use ship_order with order_id."""
        test_paid_order.status = OrderStatus.PROCESSING.value
        await db_session.commit()

        response = await admin_client.post(
            f"/api/admin/orders/{test_paid_order.id}/ship",
            json={"tracking_number": "TRACK-LV-12345"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "shipped"
        assert data["tracking_number"] == "TRACK-LV-12345"

    async def test_ship_order_not_found(self, admin_client: AsyncClient):
        """Returns 404 for non-existent order."""
        response = await admin_client.post(
            "/api/admin/orders/99999/ship",
            json={"tracking_number": "TRACK123"},
        )
        assert response.status_code == 404

    async def test_ship_order_invalid_status(
        self, admin_client: AsyncClient, test_order
    ):
        """Cannot ship a pending order (must be processing first)."""
        response = await admin_client.post(
            f"/api/admin/orders/{test_order.id}/ship",
            json={"tracking_number": "TRACK123"},
        )
        assert response.status_code == 400

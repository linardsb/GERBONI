"""
Tests for the AI support agent tools.

Tests each agent tool individually with proper data scoping and error handling.
Does NOT call the actual AI model — tests tool functions directly.
"""

import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from unittest.mock import MagicMock

from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.support_agent import (
    AgentDependencies,
    get_support_agent,
    run_agent_conversation,
)
from app.models import Order, OrderItem, OrderStatus, Product, TShirtVariant, User


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
async def second_user(db_session: AsyncSession):
    """Create a second test user for access control tests."""
    from app.services import AuthService

    user = User(
        email="other@example.com",
        password_hash=AuthService.get_password_hash("OtherPass123"),
        is_guest=False,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def agent_deps(test_user, db_session):
    """Create AgentDependencies for authenticated user."""
    return AgentDependencies(
        user_id=test_user.id,
        guest_email=None,
        db=db_session,
    )


@pytest.fixture
def guest_deps(db_session):
    """Create AgentDependencies for guest user."""
    return AgentDependencies(
        user_id=None,
        guest_email="guest@example.com",
        db=db_session,
    )


@pytest.fixture
def unauthenticated_deps(db_session):
    """Create AgentDependencies with no identity."""
    return AgentDependencies(
        user_id=None,
        guest_email=None,
        db=db_session,
    )


@pytest.fixture
def agent(monkeypatch):
    """Get the support agent instance with dummy API key."""
    import app.agent.support_agent as agent_module

    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-not-real")
    # Reset singleton so it re-creates with the env var set
    agent_module._support_agent = None
    a = get_support_agent()
    yield a
    # Reset singleton after test to avoid polluting other tests
    agent_module._support_agent = None


@pytest.fixture
def mock_ctx(agent_deps):
    """Create a mock RunContext with agent dependencies."""
    ctx = MagicMock()
    ctx.deps = agent_deps
    return ctx


@pytest.fixture
def mock_guest_ctx(guest_deps):
    """Create a mock RunContext with guest dependencies."""
    ctx = MagicMock()
    ctx.deps = guest_deps
    return ctx


@pytest.fixture
def mock_unauth_ctx(unauthenticated_deps):
    """Create a mock RunContext with no identity."""
    ctx = MagicMock()
    ctx.deps = unauthenticated_deps
    return ctx


# =============================================================================
# Tool Extraction Helper
# =============================================================================


def get_tool_func(agent, tool_name: str):
    """Extract a tool function from the agent by name.

    Wraps internal API access for pydantic-ai compatibility.
    v0.0.53: agent._function_tools[name].function
    v1.51.0: agent._function_toolset.tools[name].function
    """
    # v1.x: _function_toolset with .tools dict
    if hasattr(agent, "_function_toolset"):
        toolset = agent._function_toolset
        if hasattr(toolset, "tools") and tool_name in toolset.tools:
            return toolset.tools[tool_name].function
    # v0.0.53: _function_tools plain dict
    if hasattr(agent, "_function_tools"):
        tools = agent._function_tools
        if tool_name in tools:
            return tools[tool_name].function
    raise ValueError(f"Tool '{tool_name}' not found in agent")


# =============================================================================
# get_order_details Tests
# =============================================================================


class TestGetOrderDetails:
    """Tests for the get_order_details agent tool."""

    async def test_get_order_summary(self, agent, mock_ctx, test_order):
        """Should return summary format for existing order."""
        tool = get_tool_func(agent, "get_order_details")
        result = await tool(mock_ctx, test_order.id, include="summary")
        assert f"Order #{test_order.id}" in result
        assert "pending" in result.lower() or "PENDING" in result

    async def test_get_order_full_details(self, agent, mock_ctx, test_order):
        """Should return full details including items and shipping."""
        tool = get_tool_func(agent, "get_order_details")
        result = await tool(mock_ctx, test_order.id, include="full")
        assert f"Order #{test_order.id}" in result
        assert "Riga" in result  # Product city name
        assert "123 Test Street" in result  # Shipping address

    async def test_get_order_shipping_info(self, agent, mock_ctx, test_order):
        """Should return shipping-focused format."""
        tool = get_tool_func(agent, "get_order_details")
        result = await tool(mock_ctx, test_order.id, include="shipping")
        assert "Ship to" in result
        assert "Test User" in result

    async def test_order_not_found(self, agent, mock_ctx):
        """Should return helpful error for nonexistent order."""
        tool = get_tool_func(agent, "get_order_details")
        result = await tool(mock_ctx, 99999, include="full")
        assert "not found" in result.lower()

    async def test_order_access_control(
        self, agent, db_session, second_user, test_order
    ):
        """User should not see another user's orders."""
        ctx = MagicMock()
        ctx.deps = AgentDependencies(
            user_id=second_user.id,
            guest_email=None,
            db=db_session,
        )
        tool = get_tool_func(agent, "get_order_details")
        result = await tool(ctx, test_order.id, include="full")
        assert "not found" in result.lower()

    async def test_unauthenticated_access(self, agent, mock_unauth_ctx, test_order):
        """Unauthenticated users should get an error."""
        tool = get_tool_func(agent, "get_order_details")
        result = await tool(mock_unauth_ctx, test_order.id, include="full")
        assert "verify" in result.lower() or "log in" in result.lower()


# =============================================================================
# get_user_orders Tests
# =============================================================================


class TestGetUserOrders:
    """Tests for the get_user_orders agent tool."""

    async def test_list_user_orders(self, agent, mock_ctx, test_order):
        """Should list orders for authenticated user."""
        tool = get_tool_func(agent, "get_user_orders")
        result = await tool(mock_ctx)
        assert f"#{test_order.id}" in result

    async def test_no_orders(self, agent, mock_ctx):
        """Should return helpful message when user has no orders."""
        tool = get_tool_func(agent, "get_user_orders")
        result = await tool(mock_ctx)
        assert "no orders" in result.lower()

    async def test_filter_by_status(self, agent, mock_ctx, test_order):
        """Should filter orders by status."""
        tool = get_tool_func(agent, "get_user_orders")
        result = await tool(mock_ctx, status_filter="pending")
        assert f"#{test_order.id}" in result

    async def test_filter_no_match(self, agent, mock_ctx, test_order):
        """Should handle no matching status filter."""
        tool = get_tool_func(agent, "get_user_orders")
        result = await tool(mock_ctx, status_filter="shipped")
        assert "no orders" in result.lower()

    async def test_unauthenticated_access(self, agent, mock_unauth_ctx):
        """Unauthenticated users should get an error."""
        tool = get_tool_func(agent, "get_user_orders")
        result = await tool(mock_unauth_ctx)
        assert "not authenticated" in result.lower() or "log in" in result.lower()


# =============================================================================
# search_products Tests
# =============================================================================


class TestSearchProducts:
    """Tests for the search_products agent tool."""

    async def test_search_all_products(self, agent, mock_ctx, test_product):
        """Should return all active products when no filter."""
        tool = get_tool_func(agent, "search_products")
        result = await tool(mock_ctx)
        assert "Riga" in result

    async def test_search_by_city(self, agent, mock_ctx, test_product):
        """Should find products by city name."""
        tool = get_tool_func(agent, "search_products")
        result = await tool(mock_ctx, city_name="Riga")
        assert "Riga" in result

    async def test_search_by_city_no_match(self, agent, mock_ctx, test_product):
        """Should return helpful message for no matches."""
        tool = get_tool_func(agent, "search_products")
        result = await tool(mock_ctx, city_name="Nonexistent")
        assert "no products" in result.lower()

    async def test_search_by_color(self, agent, mock_ctx, test_product):
        """Should filter by color."""
        tool = get_tool_func(agent, "search_products")
        result = await tool(mock_ctx, color="Black")
        assert "Riga" in result


# =============================================================================
# get_product_details Tests
# =============================================================================


class TestGetProductDetails:
    """Tests for the get_product_details agent tool."""

    async def test_get_product_by_city(self, agent, mock_ctx, test_product):
        """Should return detailed product info."""
        tool = get_tool_func(agent, "get_product_details")
        result = await tool(mock_ctx, city_name="Riga")
        assert "Riga" in result
        assert "Colors:" in result
        assert "Sizes:" in result
        assert "Price:" in result

    async def test_product_not_found(self, agent, mock_ctx):
        """Should return helpful message for unknown city."""
        tool = get_tool_func(agent, "get_product_details")
        result = await tool(mock_ctx, city_name="Nonexistent")
        assert "no product found" in result.lower()

    async def test_check_availability(self, agent, mock_ctx, test_product):
        """Should include stock details when check_availability=True."""
        tool = get_tool_func(agent, "get_product_details")
        result = await tool(mock_ctx, city_name="Riga", check_availability=True)
        assert "in stock" in result.lower()


# =============================================================================
# request_refund Tests
# =============================================================================


class TestRequestRefund:
    """Tests for the request_refund agent tool."""

    async def test_refund_paid_order(self, agent, mock_ctx, test_paid_order):
        """Should approve refund for paid order."""
        tool = get_tool_func(agent, "request_refund")
        result = await tool(mock_ctx, test_paid_order.id, reason="Wrong size")
        assert "refund approved" in result.lower() or "✅" in result

    async def test_refund_paid_order_updates_status(self, agent, mock_ctx, test_paid_order, db_session):
        """Refund should transition order to REFUNDED via OrderService."""
        tool = get_tool_func(agent, "request_refund")
        await tool(mock_ctx, test_paid_order.id, reason="Wrong size")

        from sqlalchemy import select
        result = await db_session.execute(
            select(Order).where(Order.id == test_paid_order.id)
        )
        order = result.scalar_one()
        assert order.status == OrderStatus.REFUNDED.value

    async def test_refund_restores_stock(self, agent, mock_ctx, test_paid_order, db_session):
        """Refund should restore variant stock via OrderService."""
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models import TShirtVariant

        # Eagerly load items to avoid lazy load issues
        result = await db_session.execute(
            select(Order).options(selectinload(Order.items)).where(Order.id == test_paid_order.id)
        )
        order = result.scalar_one()
        item = order.items[0]

        variant_result = await db_session.execute(
            select(TShirtVariant).where(TShirtVariant.id == item.variant_id)
        )
        variant = variant_result.scalar_one()
        stock_before = variant.stock

        tool = get_tool_func(agent, "request_refund")
        await tool(mock_ctx, test_paid_order.id, reason="Wrong size")

        # Check stock increased
        variant_result = await db_session.execute(
            select(TShirtVariant).where(TShirtVariant.id == item.variant_id)
        )
        variant = variant_result.scalar_one()
        assert variant.stock == stock_before + item.quantity

    async def test_refund_pending_order(self, agent, mock_ctx, test_order):
        """Should reject refund for pending (unpaid) order."""
        tool = get_tool_func(agent, "request_refund")
        result = await tool(mock_ctx, test_order.id, reason="Changed mind")
        assert "cannot" in result.lower()

    async def test_refund_cancelled_order(self, agent, mock_ctx, db_session, test_paid_order):
        """Should reject refund for cancelled order."""
        # Manually set to cancelled
        test_paid_order.status = OrderStatus.CANCELLED.value
        await db_session.commit()

        tool = get_tool_func(agent, "request_refund")
        result = await tool(mock_ctx, test_paid_order.id, reason="Want money back")
        assert "cannot" in result.lower() or "not eligible" in result.lower()

    async def test_refund_processing_order(self, agent, mock_ctx, db_session, test_paid_order):
        """PROCESSING orders should be eligible for refund."""
        test_paid_order.status = OrderStatus.PROCESSING.value
        await db_session.commit()

        tool = get_tool_func(agent, "request_refund")
        result = await tool(mock_ctx, test_paid_order.id, reason="Changed mind")
        assert "refund approved" in result.lower() or "✅" in result

    async def test_refund_delivered_within_window(self, agent, mock_ctx, db_session, test_paid_order):
        """DELIVERED order within 14-day window should be refundable."""
        from datetime import datetime, timedelta

        test_paid_order.status = OrderStatus.DELIVERED.value
        test_paid_order.updated_at = datetime.utcnow() - timedelta(days=5)
        await db_session.commit()

        tool = get_tool_func(agent, "request_refund")
        result = await tool(mock_ctx, test_paid_order.id, reason="Wrong size")
        assert "refund approved" in result.lower() or "✅" in result

    async def test_refund_delivered_expired_window(self, agent, mock_ctx, db_session, test_paid_order):
        """DELIVERED order past 14-day window should be rejected."""
        from datetime import datetime, timedelta

        test_paid_order.status = OrderStatus.DELIVERED.value
        test_paid_order.updated_at = datetime.utcnow() - timedelta(days=20)
        await db_session.commit()

        tool = get_tool_func(agent, "request_refund")
        result = await tool(mock_ctx, test_paid_order.id, reason="Want refund")
        assert "expired" in result.lower()
        assert "delivery" in result.lower() or "delivered" in result.lower()

    async def test_refund_shipped_no_time_limit(self, agent, mock_ctx, db_session, test_paid_order):
        """SHIPPED order should be refundable regardless of age (delivery hasn't happened)."""
        from datetime import datetime, timedelta

        test_paid_order.status = OrderStatus.SHIPPED.value
        test_paid_order.created_at = datetime.utcnow() - timedelta(days=30)
        await db_session.commit()

        tool = get_tool_func(agent, "request_refund")
        result = await tool(mock_ctx, test_paid_order.id, reason="Changed mind")
        assert "refund approved" in result.lower() or "✅" in result

    async def test_refund_nonexistent_order(self, agent, mock_ctx):
        """Should return error for nonexistent order."""
        tool = get_tool_func(agent, "request_refund")
        result = await tool(mock_ctx, 99999, reason="Test")
        assert "not found" in result.lower()

    async def test_refund_access_control(
        self, agent, db_session, second_user, test_paid_order
    ):
        """User should not refund another user's order."""
        ctx = MagicMock()
        ctx.deps = AgentDependencies(
            user_id=second_user.id,
            guest_email=None,
            db=db_session,
        )
        tool = get_tool_func(agent, "request_refund")
        result = await tool(ctx, test_paid_order.id, reason="Fraud attempt")
        assert "not found" in result.lower()

    async def test_unauthenticated_refund(self, agent, mock_unauth_ctx, test_paid_order):
        """Unauthenticated users should not be able to refund."""
        tool = get_tool_func(agent, "request_refund")
        result = await tool(mock_unauth_ctx, test_paid_order.id, reason="Test")
        assert "not verified" in result.lower() or "identity" in result.lower()


# =============================================================================
# Agent Conversation Integration Test
# =============================================================================


class TestAgentConversation:
    """Integration test for run_agent_conversation (mocked)."""

    async def test_conversation_with_mock(self, mock_anthropic_agent, db_session, test_user):
        """Should run agent conversation with mocked AI."""
        result = await run_agent_conversation(
            message="Hello, I need help",
            user_id=test_user.id,
            guest_email=None,
            db=db_session,
        )
        assert isinstance(result, str)
        assert len(result) > 0

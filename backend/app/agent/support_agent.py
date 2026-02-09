from dataclasses import dataclass
from typing import Literal
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import Order, OrderItem, Product, TShirtVariant, User, OrderStatus
from ..services import OrderService
from ..exceptions import InvalidStateTransitionError
from ..config import get_settings

settings = get_settings()

# Lazy agent initialization
_support_agent: Agent | None = None

# Available cities for reference in tool descriptions
LATVIAN_CITIES = ["Rīga", "Daugavpils", "Jelgava", "Jēkabpils", "Jūrmala", "Liepāja", "Ogre", "Rēzekne", "Valmiera", "Ventspils"]
AVAILABLE_COLORS = ["Black", "White", "Red"]
AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"]


@dataclass
class AgentDependencies:
    user_id: int | None
    guest_email: str | None
    db: AsyncSession


class AgentResponse(BaseModel):
    message: str
    action_taken: str | None = None
    order_info: dict | None = None


def get_support_agent() -> Agent:
    """Get or create the support agent (lazy initialization)."""
    global _support_agent
    if _support_agent is None:
        _support_agent = Agent(
            "anthropic:claude-sonnet-4-20250514",
            deps_type=AgentDependencies,
            result_type=str,
            system_prompt="""You are a friendly customer support agent for GERBONI,
a Latvian t-shirt store selling city coat of arms designs.

You help customers with:
- Order status and tracking
- Product information and availability
- Refund requests
- Account questions
- Shipping information

TOOL USAGE GUIDELINES:
1. For order inquiries: Use get_order_details (combines status + shipping in one call)
2. For "show my orders" requests: Use get_user_orders first, then get_order_details if they ask about a specific one
3. For product questions: Use search_products for browsing, get_product_details for specific city info
4. For refunds: Always verify the order with get_order_details first, then use request_refund

Be helpful, concise, and friendly. If you can't help with something,
explain why and suggest alternatives. Use the available tools to look up
real information - don't make up order details or tracking numbers.

Important: Only access information for the authenticated user. Never share
information about other customers' orders.

The store sells t-shirts featuring coats of arms from 10 major Latvian cities:
Rīga, Daugavpils, Jelgava, Jēkabpils, Jūrmala, Liepāja, Ogre, Rēzekne, Valmiera, and Ventspils.

Available colors: Black, White, Red
Available sizes: XS, S, M, L, XL, XXL

SIZING GUIDE:
| Size | Chest (cm) | Length (cm) | Fit |
|------|------------|-------------|-----|
| XS   | 86         | 66          | Slim |
| S    | 91         | 69          | Standard |
| M    | 97         | 72          | Standard |
| L    | 102        | 74          | Relaxed |
| XL   | 107        | 76          | Relaxed |
| XXL  | 112        | 78          | Relaxed |

Tip: For a relaxed fit, recommend sizing up. Shirts are pre-shrunk.

SHIPPING POLICY:
- Latvia: 2-4 business days, €3.99 (free over €50)
- EU countries: 5-10 business days, €7.99 (free over €75)
- Express available at checkout for +€12 (Latvia only, 1-2 days)
- All orders ship from Rīga with tracking provided via email

RETURNS & REFUNDS:
- 14-day return window from delivery date
- Items must be unworn with original tags attached
- Refunds processed to original payment method in 5-10 business days
- Exchanges available for size/color (subject to stock)
- Free return shipping within Latvia; EU customers pay return postage

CARE INSTRUCTIONS:
- Machine wash cold (30°C max)
- Do not bleach
- Tumble dry low or hang dry recommended
- Iron on reverse side only (avoid direct heat on print)
- Do not dry clean

PAYMENT METHODS:
- Visa, Mastercard, American Express
- Apple Pay & Google Pay
- Klarna (buy now, pay later) - EU only
- All payments secured via Stripe (we never store card details)

ORDER MODIFICATIONS:
- Cancel: Possible within 1 hour of placing order (contact support immediately)
- Address change: Contact support before order shows "Shipped" status
- After shipping: Cannot modify, but can return for refund after delivery

GIFT OPTIONS:
- Gift wrapping: +€2.50 (select at checkout)
- Gift message: Free, add personalized note up to 150 characters
- Gift receipts: Available on request (hides pricing)

INTERNATIONAL SHIPPING (NON-EU):
- UK: 7-14 business days, €12.99, customs fees may apply
- USA/Canada: 10-21 business days, €19.99, import duties are buyer's responsibility
- Other countries: Email international@gerboni.lv for quote

BULK & CUSTOM ORDERS:
- 10+ items: 10% discount (auto-applied at checkout)
- 25+ items: 15% discount, contact sales@gerboni.lv
- Custom municipality designs: Minimum 50 units, 4-6 week lead time, email custom@gerboni.lv

PRODUCT QUALITY:
- Material: 100% organic cotton, 180 GSM medium weight
- Print method: Direct-to-garment (DTG), wash-resistant, eco-friendly inks
- Origin: Designed in Rīga, Latvia; ethically produced in EU

CONTACT & SUPPORT:
- Email: support@gerboni.lv (response within 24 hours)
- Live chat: Available on website 9:00-18:00 EET weekdays
- Phone: +371 2XXX XXXX (weekdays 10:00-17:00 EET)
- Response priority: Chat > Email > Phone

DAMAGED/DEFECTIVE ITEMS:
- Report within 48 hours of delivery with photos
- Full replacement or refund offered (customer's choice)
- No return shipping needed - keep or dispose of damaged item
- Wrong item sent: Free replacement shipped immediately

DISCOUNTS & PROMOTIONS:
- Newsletter signup: 10% off first order
- Seasonal sales: Follow @gerboni.lv on Instagram for announcements
- Student discount: 15% with valid student email (verify at checkout)
- No discount code stacking - only one code per order

ACCOUNT & PRIVACY:
- Password reset: Use "Forgot Password" link on login page
- Delete account: Email support@gerboni.lv with request
- Guest checkout: Always available, no account required
- Data policy: GDPR compliant, data never sold to third parties
""",
        )
        _register_tools(_support_agent)
    return _support_agent


def _register_tools(agent: Agent):
    """Register all tools with the agent."""

    @agent.tool
    async def get_order_details(
        ctx: RunContext[AgentDependencies],
        order_id: int,
        include: Literal["summary", "full", "shipping"] = "full",
    ) -> str:
        """
        Retrieve order information including status, items, and shipping details.

        This is the PRIMARY tool for any order-related inquiry. Use this instead of
        making multiple separate calls.

        Args:
            order_id: The numeric order ID (e.g., 1234). Customers often say "order 1234"
                      or "my order #1234".
            include: Level of detail to return:
                - "summary": Just status, total, and date (for quick checks)
                - "full": Status, items, shipping address, tracking (DEFAULT - use for most queries)
                - "shipping": Detailed shipping info with delivery estimates

        Returns order details if found and owned by current user, otherwise an error
        with guidance on what to do next.

        Examples of when to use:
        - "Where is my order?" → get_order_details(order_id, include="shipping")
        - "What's the status of order 1234?" → get_order_details(1234, include="summary")
        - "Show me order details" → get_order_details(order_id, include="full")
        """
        db = ctx.deps.db

        stmt = (
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.variant).selectinload(TShirtVariant.product))
            .where(Order.id == order_id)
        )

        if ctx.deps.user_id:
            stmt = stmt.where(Order.user_id == ctx.deps.user_id)
        elif ctx.deps.guest_email:
            stmt = stmt.where(Order.guest_email == ctx.deps.guest_email)
        else:
            return "Unable to verify order ownership. Please ask the customer to log in or use get_user_orders if they're authenticated."

        result = await db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            return f"Order #{order_id} not found. This could mean: (1) the order ID is incorrect, (2) the order belongs to a different account. Suggest: Ask customer to verify the order number from their confirmation email, or use get_user_orders to list their orders."

        # Summary format - minimal info
        if include == "summary":
            return f"Order #{order.id}: {order.status} | €{order.total:.2f} | Placed {order.created_at.strftime('%Y-%m-%d')}"

        # Shipping format - focus on delivery
        if include == "shipping":
            shipping_status = {
                OrderStatus.PENDING.value: "⏳ Awaiting payment",
                OrderStatus.PAID.value: "📦 Preparing for shipment (ships within 1-2 business days)",
                OrderStatus.PROCESSING.value: "🔧 Being processed",
                OrderStatus.SHIPPED.value: f"🚚 Shipped! Tracking: {order.tracking_number or 'Tracking number pending'}",
                OrderStatus.DELIVERED.value: "✅ Delivered",
                OrderStatus.CANCELLED.value: "❌ Cancelled",
                OrderStatus.REFUNDED.value: "💸 Refunded",
            }
            status_msg = shipping_status.get(order.status, order.status)

            delivery_estimate = ""
            if order.status in [OrderStatus.PAID.value, OrderStatus.PROCESSING.value, OrderStatus.SHIPPED.value]:
                if order.shipping_country and order.shipping_country.lower() in ["latvia", "lv", "latvija"]:
                    delivery_estimate = "\nEstimated delivery: 2-4 business days within Latvia"
                else:
                    delivery_estimate = "\nEstimated delivery: 5-10 business days (EU shipping)"

            return f"""Order #{order.id} Shipping Status
{status_msg}{delivery_estimate}

Ship to: {order.shipping_name}
Address: {order.shipping_address}
{order.shipping_city}, {order.shipping_postal_code}
{order.shipping_country}"""

        # Full format - complete details (default)
        items_desc = []
        for item in order.items:
            items_desc.append(
                f"  • {item.variant.product.city_name} T-Shirt ({item.variant.color}, {item.variant.size}) ×{item.quantity}"
            )

        tracking = f"\nTracking: {order.tracking_number}" if order.tracking_number else ""

        return f"""Order #{order.id}
Status: {order.status}
Total: €{order.total:.2f}
Placed: {order.created_at.strftime('%Y-%m-%d %H:%M')}

Items:
{chr(10).join(items_desc)}

Shipping to:
  {order.shipping_name}
  {order.shipping_address}
  {order.shipping_city}, {order.shipping_postal_code}
  {order.shipping_country}{tracking}"""

    @agent.tool
    async def get_user_orders(
        ctx: RunContext[AgentDependencies],
        status_filter: str | None = None,
        limit: int = 10,
    ) -> str:
        """
        List the customer's orders with optional filtering.

        Use this when:
        - Customer asks "show my orders" or "what have I ordered?"
        - Customer doesn't know their order ID and needs to find it
        - Checking if a customer has previous orders before making recommendations

        Do NOT use this for:
        - Getting details about a specific order (use get_order_details instead)
        - Checking shipping status (use get_order_details with include="shipping")

        Args:
            status_filter: Optional filter by order status. Values: "pending", "paid",
                          "processing", "shipped", "delivered", "cancelled", "refunded".
                          Leave empty to show all orders.
            limit: Maximum orders to return (1-10, default 10). Use lower values for
                   quick lookups, higher for "show all my orders".

        Returns a list of orders with ID, status, total, and date. Customer can then
        ask about a specific order using the ID shown.
        """
        db = ctx.deps.db

        stmt = (
            select(Order)
            .order_by(Order.created_at.desc())
            .limit(min(limit, 10))  # Cap at 10 for token efficiency
        )

        if ctx.deps.user_id:
            stmt = stmt.where(Order.user_id == ctx.deps.user_id)
        elif ctx.deps.guest_email:
            stmt = stmt.where(Order.guest_email == ctx.deps.guest_email)
        else:
            return "Cannot list orders: Customer is not authenticated. Ask them to log in or provide the email used for their order."

        if status_filter:
            stmt = stmt.where(Order.status == status_filter.lower())

        result = await db.execute(stmt)
        orders = result.scalars().all()

        if not orders:
            if status_filter:
                return f"No orders found with status '{status_filter}'. Try without the filter to see all orders, or verify the status value is correct."
            return "No orders found for this account. If the customer believes they have orders, verify they're logged into the correct account or using the right email for guest orders."

        order_list = []
        for order in orders:
            order_list.append(
                f"  #{order.id}: {order.status} | €{order.total:.2f} | {order.created_at.strftime('%Y-%m-%d')}"
            )

        filter_note = f" (filtered: {status_filter})" if status_filter else ""
        return f"Recent orders{filter_note}:\n{chr(10).join(order_list)}\n\nTo see details for any order, ask about that specific order number."

    @agent.tool
    async def search_products(
        ctx: RunContext[AgentDependencies],
        city_name: str | None = None,
        color: str | None = None,
    ) -> str:
        """
        Search and browse available t-shirt products.

        Use this for:
        - "What t-shirts do you have?" → search_products() with no filters
        - "Do you have Riga shirts?" → search_products(city_name="Riga")
        - "Show me black t-shirts" → search_products(color="black")
        - "Riga shirt in navy?" → search_products(city_name="Riga", color="navy")

        Do NOT use for detailed product info (use get_product_details instead).

        Args:
            city_name: Search by city name. Accepts English or Latvian spellings.
                      Examples: "Riga" or "Rīga", "Daugavpils", "Liepaja" or "Liepāja".
                      Partial matches work: "Rig" finds "Rīga".
                      Available cities: Rīga, Daugavpils, Jelgava, Jēkabpils, Jūrmala,
                      Liepāja, Ogre, Rēzekne, Valmiera, Ventspils.
            color: Filter by t-shirt color. Available: Black, White, Red.
                   Case-insensitive.

        Returns a concise list showing city name, starting price, and available colors.
        For full product details (sizes, stock, descriptions), use get_product_details.
        """
        db = ctx.deps.db

        stmt = select(Product).where(Product.is_active == True)

        if city_name:
            stmt = stmt.where(
                Product.city_name.ilike(f"%{city_name}%") |
                Product.city_name_lv.ilike(f"%{city_name}%")
            )

        result = await db.execute(stmt)
        products = result.scalars().all()

        if not products:
            city_suggestions = ", ".join(LATVIAN_CITIES[:5])
            return f"No products found matching '{city_name}'. Available cities include: {city_suggestions}. Try a different spelling or search without a city filter to see all products."

        product_list = []
        for product in products:
            variant_stmt = select(TShirtVariant).where(TShirtVariant.product_id == product.id)
            if color:
                variant_stmt = variant_stmt.where(TShirtVariant.color.ilike(f"%{color}%"))

            variant_result = await db.execute(variant_stmt)
            variants = variant_result.scalars().all()

            if color and not variants:
                continue

            min_price = min(v.price for v in variants) if variants else None
            price_str = f"from €{min_price:.2f}" if min_price else "price varies"

            colors_available = list(set(v.color for v in variants)) if variants else []
            colors_str = ", ".join(colors_available[:3]) + ("..." if len(colors_available) > 3 else "")

            product_list.append(
                f"  • {product.city_name} ({product.city_name_lv}): {price_str} | Colors: {colors_str or 'various'}"
            )

        if not product_list:
            available_colors = ", ".join(AVAILABLE_COLORS)
            return f"No products found with color '{color}'. Available colors: {available_colors}."

        return f"Available products:\n{chr(10).join(product_list)}\n\nFor sizes, stock, and coat of arms details, ask about a specific city."

    @agent.tool
    async def request_refund(
        ctx: RunContext[AgentDependencies],
        order_id: int,
        reason: str,
    ) -> str:
        """
        Submit a refund request for an order.

        IMPORTANT: Before calling this, verify the order exists using get_order_details.
        This action changes the order status and triggers a refund process.

        Eligibility requirements:
        - Order must be PAID, PROCESSING, SHIPPED, or DELIVERED status
        - For DELIVERED orders: must be within 14 days of delivery date
        - For non-DELIVERED orders: refund window has not started (always eligible)
        - Customer must own the order (authenticated or matching guest email)

        Args:
            order_id: The order number to refund. Must be a valid order ID belonging
                     to the authenticated customer.
            reason: Customer's reason for the refund. Be descriptive as this is
                   logged for quality assurance. Examples:
                   - "Wrong size ordered"
                   - "Changed mind about the design"
                   - "Product not as expected"
                   - "Received damaged item"

        Returns confirmation with refund amount and timeline if successful,
        or clear explanation of why refund cannot be processed.

        Note: Refunds are processed to the original payment method within 5-10
        business days after approval.
        """
        db = ctx.deps.db

        stmt = select(Order).where(Order.id == order_id)

        if ctx.deps.user_id:
            stmt = stmt.where(Order.user_id == ctx.deps.user_id)
        elif ctx.deps.guest_email:
            stmt = stmt.where(Order.guest_email == ctx.deps.guest_email)
        else:
            return "Cannot process refund: Customer identity not verified. Ask them to log in or provide the email used for their order."

        result = await db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            return f"Order #{order_id} not found or doesn't belong to this customer. Use get_user_orders to find the correct order ID."

        # Check 14-day return window from delivery date (business rule enforced by agent)
        # Policy: "14-day return window from delivery date"
        # For DELIVERED orders: use updated_at as proxy for delivery date
        # For non-DELIVERED orders (PAID, PROCESSING, SHIPPED): window hasn't started yet
        from datetime import datetime
        if order.status == OrderStatus.DELIVERED.value:
            delivery_date = order.updated_at.replace(tzinfo=None)
            days_since_delivery = (datetime.utcnow() - delivery_date).days
            if days_since_delivery > 14:
                return f"Refund window has expired for Order #{order_id}. Order was delivered {days_since_delivery} days ago (14-day limit from delivery). For orders outside the refund window, please direct the customer to contact support@gerboni.lv for special consideration."

        # Delegate to OrderService for transition validation and stock restoration
        try:
            await OrderService.process_refund(db, order.id, reason=reason, restore_stock=True)
            await db.commit()
        except InvalidStateTransitionError:
            return f"Cannot refund Order #{order_id}: order status '{order.status}' is not eligible for refund."

        return f"""✅ Refund approved for Order #{order_id}

Amount: €{order.total:.2f}
Reason recorded: {reason}

Timeline:
• Refund initiated: Today
• Expected completion: 5-10 business days
• Funds returned to: Original payment method

The customer will receive an email confirmation shortly."""

    # NOTE: get_shipping_info has been consolidated into get_order_details with include="shipping"
    # This reduces tool overlap and follows Anthropic's agent tool best practices

    @agent.tool
    async def get_product_details(
        ctx: RunContext[AgentDependencies],
        city_name: str,
        check_availability: bool = False,
    ) -> str:
        """
        Get comprehensive information about a specific city's t-shirt design.

        Use this when customer asks about:
        - Specific city's coat of arms or design details
        - What sizes/colors are available for a particular city
        - Stock availability before purchase
        - The history or meaning of a coat of arms

        Do NOT use for:
        - Browsing multiple products (use search_products instead)
        - Comparing prices across cities (use search_products)

        Args:
            city_name: The city name to look up. Accepts English or Latvian spellings
                      with diacritics. Examples: "Riga", "Rīga", "Daugavpils", "Liepaja".
                      Partial matching supported.
            check_availability: If True, includes detailed stock levels per variant.
                               Use when customer is asking "do you have X in size M?"
                               Default False for faster response.

        Returns full product details including description, coat of arms info,
        all available colors/sizes, price range, and stock status.
        """
        db = ctx.deps.db

        stmt = (
            select(Product)
            .options(selectinload(Product.variants))
            .where(
                Product.is_active == True,
                Product.city_name.ilike(f"%{city_name}%") |
                Product.city_name_lv.ilike(f"%{city_name}%")
            )
        )

        result = await db.execute(stmt)
        product = result.scalar_one_or_none()

        if not product:
            city_suggestions = ", ".join(LATVIAN_CITIES[:5])
            return f"No product found for city '{city_name}'. Did you mean one of these? {city_suggestions}. Use search_products() to see all available cities."

        colors = sorted(set(v.color for v in product.variants))
        sizes = ["XS", "S", "M", "L", "XL", "XXL"]  # Standard order
        available_sizes = [s for s in sizes if s in {v.size for v in product.variants}]
        prices = [v.price for v in product.variants]
        in_stock = [v for v in product.variants if v.stock > 0]

        response = f"""{product.city_name} ({product.city_name_lv}) T-Shirt

{product.description}

🎨 Colors: {', '.join(colors)}
📏 Sizes: {', '.join(available_sizes)}
💰 Price: €{min(prices):.2f}{f' - €{max(prices):.2f}' if min(prices) != max(prices) else ''}
📦 In Stock: {len(in_stock)}/{len(product.variants)} variants available

🏛️ About the Coat of Arms:
{product.description_lv or "Features traditional Latvian heraldic design representing the city's history and heritage."}"""

        if check_availability:
            stock_details = []
            for color in colors:
                color_variants = [v for v in product.variants if v.color == color and v.stock > 0]
                if color_variants:
                    sizes_in_stock = [v.size for v in color_variants]
                    stock_details.append(f"  {color}: {', '.join(sizes_in_stock)}")
            if stock_details:
                response += f"\n\n📋 Currently in stock:\n{chr(10).join(stock_details)}"
            else:
                response += "\n\n⚠️ Currently out of stock in all variants."

        return response


async def run_agent_conversation(
    message: str,
    user_id: int | None,
    guest_email: str | None,
    db: AsyncSession,
) -> str:
    """Run the support agent with a user message and return the response."""
    agent = get_support_agent()
    deps = AgentDependencies(
        user_id=user_id,
        guest_email=guest_email,
        db=db,
    )

    result = await agent.run(message, deps=deps)
    return result.output

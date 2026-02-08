import stripe
from decimal import Decimal
from ..config import get_settings
from ..models import Order, OrderItem, TShirtVariant

settings = get_settings()
stripe.api_key = settings.stripe_secret_key


class StripeService:
    @staticmethod
    async def create_checkout_session(
        order: Order,
        items: list[tuple[OrderItem, TShirtVariant]],
        success_url: str,
        cancel_url: str,
    ) -> stripe.checkout.Session:
        line_items = []
        for order_item, variant in items:
            line_items.append(
                {
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": f"{variant.product.city_name} T-Shirt",
                            "description": f"Color: {variant.color}, Size: {variant.size}",
                            "images": [
                                f"{settings.frontend_url}/coats/{variant.product.coat_of_arms_image}"
                            ],
                        },
                        "unit_amount": int(order_item.price * 100),  # Cents
                    },
                    "quantity": order_item.quantity,
                }
            )

        session_params: dict = {
            "payment_method_types": ["card"],
            "line_items": line_items,
            "mode": "payment",
            "success_url": f"{success_url}?session_id={{CHECKOUT_SESSION_ID}}",
            "cancel_url": cancel_url,
            "metadata": {"order_id": str(order.id)},
            "shipping_address_collection": {"allowed_countries": ["LV", "EE", "LT"]},
        }

        # Apply discount via Stripe coupon if order has a discount
        if order.discount_amount and order.discount_amount > 0:
            coupon = stripe.Coupon.create(
                amount_off=int(order.discount_amount * 100),
                currency="eur",
                duration="once",
                name=f"Discount: {order.discount_code or 'order'}",
            )
            session_params["discounts"] = [{"coupon": coupon.id}]

        session = stripe.checkout.Session.create(**session_params)
        return session

    @staticmethod
    async def retrieve_session(session_id: str) -> stripe.checkout.Session:
        return stripe.checkout.Session.retrieve(session_id)

    @staticmethod
    async def create_refund(
        payment_intent_id: str, amount: int | None = None
    ) -> stripe.Refund:
        if amount:
            return stripe.Refund.create(payment_intent=payment_intent_id, amount=amount)
        return stripe.Refund.create(payment_intent=payment_intent_id)

    @staticmethod
    def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
        return stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )

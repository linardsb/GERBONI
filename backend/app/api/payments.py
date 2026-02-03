import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Order, OrderItem, TShirtVariant, OrderStatus
from ..services import StripeService, OrderService
from ..config import get_settings
from .deps import get_current_user
from ..models import User
from ..middleware import limiter
from ..utils.errors import safe_error_response, ErrorCode
from ..exceptions import InvalidStateTransitionError

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


@router.post("/create-checkout")
@limiter.limit("10/minute")
async def create_checkout(
    request: Request,
    order_id: int,
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.variant).selectinload(TShirtVariant.product))
        .where(Order.id == order_id)
    )

    if user:
        stmt = stmt.where(Order.user_id == user.id)

    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if order.status != OrderStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already processed",
        )

    items = [(item, item.variant) for item in order.items]

    try:
        session = await StripeService.create_checkout_session(
            order=order,
            items=items,
            success_url=f"{settings.frontend_url}/checkout/success",
            cancel_url=f"{settings.frontend_url}/cart",
        )

        order.stripe_session_id = session.id
        await db.commit()

        return {"checkout_url": session.url}
    except Exception as e:
        raise safe_error_response(
            error=e,
            request=request,
            context={"order_id": order_id},
        )


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature")

    try:
        event = StripeService.construct_webhook_event(payload, sig_header)
    except Exception as e:
        logger.error(f"Stripe webhook signature verification failed: {e}")
        raise HTTPException(
            status_code=400,
            detail={"code": ErrorCode.STRIPE_ERROR.value, "message": "Invalid webhook signature"},
        )

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("order_id")

        if order_id:
            payment_id = session.get("payment_intent")
            try:
                await OrderService.mark_paid(db, int(order_id), payment_id or "")
                await db.commit()
            except InvalidStateTransitionError:
                # Order already processed (idempotent webhook handling)
                logger.info(f"Order {order_id} already paid, ignoring duplicate webhook")

    elif event["type"] == "checkout.session.expired":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("order_id")

        if order_id:
            try:
                # Don't restore stock for pending orders (stock not yet decremented)
                await OrderService.cancel(db, int(order_id), restore_stock=False)
                await db.commit()
            except InvalidStateTransitionError:
                # Order already processed
                logger.info(f"Order {order_id} cannot be cancelled, ignoring expired session webhook")

    return {"status": "ok"}


@router.get("/session/{session_id}")
async def get_checkout_session(session_id: str, request: Request):
    try:
        session = await StripeService.retrieve_session(session_id)
        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "order_id": session.metadata.get("order_id"),
        }
    except Exception as e:
        logger.warning(f"Session lookup failed for {session_id}: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": ErrorCode.NOT_FOUND.value, "message": "Session not found"},
        )

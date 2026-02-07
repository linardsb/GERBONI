import json
import asyncio
import logging
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..agent import run_agent_conversation
from ..services import AuthService
from ..middleware.websocket_security import (
    WebSocketRateLimiter,
    RateLimitError,
    MessageSizeError,
    AuthTimeoutError,
    sanitize_error_message,
    create_auth_timeout_task,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/chat")
async def websocket_chat(
    websocket: WebSocket,
    db: AsyncSession = Depends(get_db),
):
    await websocket.accept()

    # Initialize security controls
    rate_limiter = WebSocketRateLimiter(
        max_messages=30,
        window_seconds=60,
        max_message_size=10 * 1024,  # 10KB
        auth_timeout_seconds=30,
    )

    user_id = None
    guest_email = None
    auth_timeout_task = None

    async def handle_auth_timeout():
        """Handle authentication timeout."""
        try:
            await websocket.send_json(
                sanitize_error_message(AuthTimeoutError("Authentication required within 30 seconds"))
            )
            await websocket.close(code=4001, reason="Authentication timeout")
        except Exception:
            pass

    try:
        # Start auth timeout monitoring
        auth_timeout_task = await create_auth_timeout_task(rate_limiter, handle_auth_timeout)

        while True:
            # Check auth timeout before receiving
            if rate_limiter.is_auth_timeout_exceeded():
                raise AuthTimeoutError()

            data = await websocket.receive_text()

            # Check message size
            size_ok, size_error = rate_limiter.check_message_size(data)
            if not size_ok:
                await websocket.send_json(sanitize_error_message(MessageSizeError(size_error)))
                continue

            # Check rate limit
            rate_ok, rate_error = rate_limiter.check_rate_limit()
            if not rate_ok:
                await websocket.send_json(sanitize_error_message(RateLimitError(rate_error)))
                continue

            try:
                message_data = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "code": "INVALID_JSON",
                    "message": "Invalid message format",
                })
                continue

            # Handle authentication message
            if message_data.get("type") == "auth":
                token = message_data.get("token")
                if token:
                    payload = AuthService.decode_token(token)
                    if payload:
                        user_id = int(payload.get("sub"))
                        rate_limiter.mark_authenticated()
                        # Cancel auth timeout task
                        if auth_timeout_task:
                            auth_timeout_task.cancel()
                            auth_timeout_task = None
                        await websocket.send_json({
                            "type": "auth_success",
                            "message": "Authenticated successfully",
                        })
                    else:
                        await websocket.send_json({
                            "type": "auth_error",
                            "code": "INVALID_TOKEN",
                            "message": "Invalid token",
                        })
                continue

            # Handle guest session
            if message_data.get("type") == "guest":
                session_token = message_data.get("session_token")
                email = message_data.get("email")
                if session_token:
                    session = await AuthService.get_guest_session(db, session_token)
                    if session:
                        guest_email = session.email or email
                        rate_limiter.mark_authenticated()
                        # Cancel auth timeout task
                        if auth_timeout_task:
                            auth_timeout_task.cancel()
                            auth_timeout_task = None
                        await websocket.send_json({
                            "type": "guest_success",
                            "message": "Guest session established",
                        })
                    else:
                        await websocket.send_json({
                            "type": "guest_error",
                            "code": "INVALID_SESSION",
                            "message": "Invalid or expired session token",
                        })
                elif email:
                    guest_email = email
                    rate_limiter.mark_authenticated()
                    # Cancel auth timeout task
                    if auth_timeout_task:
                        auth_timeout_task.cancel()
                        auth_timeout_task = None
                    await websocket.send_json({
                        "type": "guest_success",
                        "message": "Guest email registered",
                    })
                continue

            # Handle chat message
            if message_data.get("type") == "message":
                user_message = message_data.get("content", "")

                if not user_message:
                    continue

                # Send typing indicator
                await websocket.send_json({
                    "type": "typing",
                    "status": True,
                })

                try:
                    # Get agent response
                    response = await run_agent_conversation(
                        message=user_message,
                        user_id=user_id,
                        guest_email=guest_email,
                        db=db,
                    )

                    # Send response
                    await websocket.send_json({
                        "type": "message",
                        "role": "assistant",
                        "content": response,
                    })

                except Exception as e:
                    logger.error(f"Agent error: {type(e).__name__}: {e}")
                    await websocket.send_json(sanitize_error_message(e))

                finally:
                    # End typing indicator
                    await websocket.send_json({
                        "type": "typing",
                        "status": False,
                    })

    except WebSocketDisconnect:
        logger.debug("WebSocket client disconnected")
    except AuthTimeoutError:
        logger.warning("WebSocket auth timeout exceeded")
    except Exception as e:
        logger.error(f"WebSocket connection error: {type(e).__name__}: {e}")
        try:
            await websocket.send_json(sanitize_error_message(e))
        except Exception:
            pass
    finally:
        # Cleanup: cancel auth timeout task if still running
        if auth_timeout_task and not auth_timeout_task.done():
            auth_timeout_task.cancel()
            try:
                await auth_timeout_task
            except asyncio.CancelledError:
                pass

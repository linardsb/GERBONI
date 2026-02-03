"""
WebSocket Security Middleware

Provides security controls for WebSocket connections:
- Rate limiting: Max messages per time window
- Message size validation: Prevents large payload attacks
- Authentication timeout: Enforces auth within time limit
- Sanitized error responses: No exception detail leakage
"""

import time
import asyncio
import logging
from dataclasses import dataclass, field
from typing import Callable, Awaitable

logger = logging.getLogger(__name__)


@dataclass
class WebSocketRateLimiter:
    """
    Per-connection rate limiter for WebSocket messages.

    Uses a sliding window algorithm to track message counts.
    """
    max_messages: int = 30  # messages per window
    window_seconds: int = 60  # window size in seconds
    max_message_size: int = 10 * 1024  # 10KB max message size
    auth_timeout_seconds: int = 30  # seconds to authenticate

    # Per-connection state
    _message_timestamps: list = field(default_factory=list)
    _connection_time: float = field(default_factory=time.time)
    _authenticated: bool = False

    def __post_init__(self):
        self._message_timestamps = []
        self._connection_time = time.time()

    def mark_authenticated(self) -> None:
        """Mark this connection as authenticated."""
        self._authenticated = True

    @property
    def is_authenticated(self) -> bool:
        """Check if connection is authenticated."""
        return self._authenticated

    def is_auth_timeout_exceeded(self) -> bool:
        """Check if auth timeout has been exceeded for unauthenticated connection."""
        if self._authenticated:
            return False
        elapsed = time.time() - self._connection_time
        return elapsed > self.auth_timeout_seconds

    def check_rate_limit(self) -> tuple[bool, str]:
        """
        Check if a message can be sent.

        Returns:
            Tuple of (allowed: bool, error_message: str)
        """
        now = time.time()
        window_start = now - self.window_seconds

        # Remove timestamps outside the window
        self._message_timestamps = [
            ts for ts in self._message_timestamps if ts > window_start
        ]

        if len(self._message_timestamps) >= self.max_messages:
            return False, f"Rate limit exceeded. Max {self.max_messages} messages per {self.window_seconds} seconds."

        self._message_timestamps.append(now)
        return True, ""

    def check_message_size(self, message: str | bytes) -> tuple[bool, str]:
        """
        Check if message size is within limits.

        Returns:
            Tuple of (allowed: bool, error_message: str)
        """
        size = len(message.encode() if isinstance(message, str) else message)
        if size > self.max_message_size:
            return False, f"Message too large. Max size is {self.max_message_size // 1024}KB."
        return True, ""


class WebSocketSecurityError(Exception):
    """Base exception for WebSocket security violations."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


class RateLimitError(WebSocketSecurityError):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__("RATE_LIMIT_EXCEEDED", message)


class MessageSizeError(WebSocketSecurityError):
    """Raised when message size exceeds limit."""

    def __init__(self, message: str = "Message too large"):
        super().__init__("MESSAGE_TOO_LARGE", message)


class AuthTimeoutError(WebSocketSecurityError):
    """Raised when authentication timeout is exceeded."""

    def __init__(self, message: str = "Authentication timeout"):
        super().__init__("AUTH_TIMEOUT", message)


def sanitize_error_message(error: Exception) -> dict:
    """
    Convert an exception to a safe, user-facing error response.

    Never exposes internal exception details to the client.
    """
    if isinstance(error, WebSocketSecurityError):
        return {
            "type": "error",
            "code": error.code,
            "message": error.message,
        }

    # Log the actual error for debugging
    logger.error(f"WebSocket error: {type(error).__name__}: {error}")

    # Return generic message for unknown errors
    return {
        "type": "error",
        "code": "INTERNAL_ERROR",
        "message": "An unexpected error occurred. Please try again.",
    }


async def create_auth_timeout_task(
    rate_limiter: WebSocketRateLimiter,
    on_timeout: Callable[[], Awaitable[None]],
) -> asyncio.Task:
    """
    Create a task that triggers callback when auth timeout is exceeded.

    Args:
        rate_limiter: The rate limiter instance to monitor
        on_timeout: Async callback to run when timeout is exceeded

    Returns:
        The created task (caller should cancel when auth succeeds)
    """
    async def timeout_monitor():
        await asyncio.sleep(rate_limiter.auth_timeout_seconds)
        if not rate_limiter.is_authenticated:
            await on_timeout()

    return asyncio.create_task(timeout_monitor())

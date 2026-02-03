"""
Performance Monitoring Middleware

Provides request timing and performance tracking:
- Adds X-Response-Time header to all responses
- Logs slow requests (>1s warning, >5s error)
- Tracks request duration for monitoring
"""

import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger(__name__)


class TimingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that tracks request processing time.

    Features:
    - Adds X-Response-Time header (in milliseconds)
    - Logs warnings for slow requests (>1 second)
    - Logs errors for very slow requests (>5 seconds)
    - Includes request path and method in log context

    Configuration (via Settings):
    - slow_request_threshold: seconds before warning (default: 1.0)
    - very_slow_request_threshold: seconds before error (default: 5.0)
    """

    def __init__(
        self,
        app,
        slow_threshold: float = 1.0,
        very_slow_threshold: float = 5.0,
    ):
        super().__init__(app)
        self.slow_threshold = slow_threshold
        self.very_slow_threshold = very_slow_threshold

    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()

        response = await call_next(request)

        # Calculate duration
        duration = time.perf_counter() - start_time
        duration_ms = duration * 1000

        # Add response time header
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

        # Log slow requests
        path = request.url.path
        method = request.method
        status_code = response.status_code

        if duration >= self.very_slow_threshold:
            logger.error(
                f"Very slow request: {method} {path} took {duration_ms:.2f}ms (status: {status_code})",
                extra={
                    "duration_ms": duration_ms,
                    "status_code": status_code,
                    "threshold": "very_slow",
                },
            )
        elif duration >= self.slow_threshold:
            logger.warning(
                f"Slow request: {method} {path} took {duration_ms:.2f}ms (status: {status_code})",
                extra={
                    "duration_ms": duration_ms,
                    "status_code": status_code,
                    "threshold": "slow",
                },
            )

        return response


def log_database_query_time(
    query_name: str,
    duration_seconds: float,
    slow_threshold: float = 0.5,
) -> None:
    """
    Utility function to log slow database queries.

    Usage:
        start = time.perf_counter()
        result = await db.execute(query)
        log_database_query_time("get_user_orders", time.perf_counter() - start)

    Args:
        query_name: Descriptive name for the query
        duration_seconds: How long the query took
        slow_threshold: Seconds before logging warning (default: 0.5)
    """
    duration_ms = duration_seconds * 1000

    if duration_seconds >= slow_threshold:
        logger.warning(
            f"Slow database query: {query_name} took {duration_ms:.2f}ms",
            extra={
                "query_name": query_name,
                "duration_ms": duration_ms,
                "type": "db_query",
            },
        )

import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from ..logging_config import set_request_context, clear_request_context


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Adds a unique request ID to each request for tracing and debugging.

    The request ID is:
    - Generated as UUID4 if not provided
    - Accepted from X-Request-ID header if provided by client/proxy
    - Stored in request.state.request_id for use in handlers
    - Returned in X-Request-ID response header
    - Propagated to all loggers via contextvars

    This enables:
    - End-to-end request tracing across services
    - Correlation of logs with specific requests
    - Debugging production issues
    - Automatic request context in all log messages
    """

    async def dispatch(self, request: Request, call_next):
        # Use existing request ID or generate new one
        request_id = request.headers.get("X-Request-ID")

        if not request_id:
            request_id = str(uuid.uuid4())

        # Store in request state for access in route handlers
        request.state.request_id = request_id

        # Extract client IP (considering proxies)
        client_ip = request.headers.get("X-Forwarded-For")
        if client_ip:
            # Take first IP if multiple (original client)
            client_ip = client_ip.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else None

        # Set request context for logging (propagates to all loggers)
        set_request_context(
            request_id=request_id,
            path=request.url.path,
            method=request.method,
            client_ip=client_ip,
        )

        try:
            # Process request
            response = await call_next(request)

            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id

            return response
        finally:
            # Clear context after request completes
            clear_request_context()

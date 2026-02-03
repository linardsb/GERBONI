import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

# Configure audit logger
logger = logging.getLogger("gerboni.audit")

# Sensitive endpoints that should always be logged
SENSITIVE_ENDPOINTS = {
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/convert-guest",
    "/api/payments/create-checkout",
    "/api/payments/webhooks/stripe",
    "/api/orders",
}

# Endpoints to exclude from logging (health checks, etc.)
EXCLUDED_ENDPOINTS = {
    "/health",
    "/",
    "/docs",
    "/redoc",
    "/openapi.json",
}


class AuditLogMiddleware(BaseHTTPMiddleware):
    """
    Logs security-relevant API requests for audit and monitoring.

    Logs include:
    - Client IP address
    - Request method and path
    - Response status code
    - Request duration
    - User agent (for sensitive endpoints)

    Sensitive endpoints (auth, payments) are always logged.
    Failed requests (4xx, 5xx) are always logged.
    """

    async def dispatch(self, request: Request, call_next):
        # Skip excluded endpoints
        if request.url.path in EXCLUDED_ENDPOINTS:
            return await call_next(request)

        start_time = time.time()

        # Get client info
        client_ip = self._get_client_ip(request)
        request_id = getattr(request.state, "request_id", "unknown")

        # Process request
        response = await call_next(request)

        duration = time.time() - start_time
        status_code = response.status_code

        # Determine if we should log this request
        should_log = (
            request.url.path in SENSITIVE_ENDPOINTS or
            status_code >= 400 or  # Log all errors
            request.method in ["POST", "PUT", "DELETE"]  # Log all mutations
        )

        if should_log:
            log_data = {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client_ip": client_ip,
                "status_code": status_code,
                "duration_ms": round(duration * 1000, 2),
            }

            # Add user agent for sensitive endpoints
            if request.url.path in SENSITIVE_ENDPOINTS:
                log_data["user_agent"] = request.headers.get("user-agent", "unknown")[:100]

            # Log level based on status code
            if status_code >= 500:
                logger.error(f"API_ERROR | {self._format_log(log_data)}")
            elif status_code >= 400:
                logger.warning(f"API_CLIENT_ERROR | {self._format_log(log_data)}")
            else:
                logger.info(f"API_REQUEST | {self._format_log(log_data)}")

        return response

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP, considering proxy headers."""
        # Check for forwarded headers (when behind proxy/load balancer)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in the chain (original client)
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Direct connection
        if request.client:
            return request.client.host

        return "unknown"

    def _format_log(self, data: dict) -> str:
        """Format log data as key=value pairs."""
        return " | ".join(f"{k}={v}" for k, v in data.items())

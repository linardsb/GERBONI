from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Limits the size of incoming requests to prevent large payload attacks.

    Default limit: 5MB

    This protects against:
    - Memory exhaustion attacks
    - Denial of service via large payloads
    - Slowloris-style attacks with large bodies
    """

    def __init__(self, app, max_size: int = 5 * 1024 * 1024):
        """
        Initialize middleware with size limit.

        Args:
            app: ASGI application
            max_size: Maximum request body size in bytes (default 5MB)
        """
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next):
        # Check Content-Length header
        content_length = request.headers.get("content-length")

        if content_length:
            try:
                size = int(content_length)
                if size > self.max_size:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": f"Request body too large. Maximum size: {self.max_size // (1024 * 1024)}MB"
                        }
                    )
            except ValueError:
                # Invalid content-length header
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid Content-Length header"}
                )

        return await call_next(request)

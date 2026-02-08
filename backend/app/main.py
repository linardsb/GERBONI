import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .config import get_settings
from .database import init_db
from .api import api_router, api_v1_router
from .error_tracker import error_tracker
from .services.cache_service import CacheService
from .middleware import (
    SecurityHeadersMiddleware,
    RequestSizeLimitMiddleware,
    AuditLogMiddleware,
    RequestIDMiddleware,
    TimingMiddleware,
    limiter,
)
from .logging_config import configure_logging

settings = get_settings()

# Configure structured logging
log_level = os.getenv("LOG_LEVEL", "INFO" if settings.debug else "WARNING")
log_format = os.getenv("LOG_FORMAT", "standard" if settings.debug else "json")
configure_logging(level=log_level, format_type=log_format)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await CacheService.init(settings.redis_url)

    # Sentry (conditional on DSN)
    if settings.sentry_dsn:
        try:
            import sentry_sdk

            sentry_sdk.init(
                dsn=settings.sentry_dsn,
                traces_sample_rate=settings.sentry_traces_sample_rate,
                environment=settings.sentry_environment,
                send_default_pii=False,
            )
            logger.info("Sentry initialized (env=%s)", settings.sentry_environment)
        except Exception as exc:
            logger.warning("Sentry init failed: %s", exc)

    yield
    # Shutdown
    await CacheService.close()


app = FastAPI(
    title=settings.app_name,
    description="Latvian City Coat of Arms T-Shirt Store",
    version="1.0.0",
    lifespan=lifespan,
    # Disable docs in production for security
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
)

# Rate limiting setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# =============================================================================
# MIDDLEWARE STACK
# Order matters: last added = first executed in request flow
# =============================================================================

# 1. Trusted Host Middleware - Prevent host header injection attacks
#    Validates the Host header against allowed hosts
allowed_hosts = ["localhost", "127.0.0.1"]
if not settings.debug:
    # Add production domains
    allowed_hosts.extend(["gerboni.lv", "*.gerboni.lv", "api.gerboni.lv"])

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=allowed_hosts,
)

# 2. Request Size Limit - Prevent large payload attacks
#    Rejects requests larger than 5MB
app.add_middleware(RequestSizeLimitMiddleware, max_size=5 * 1024 * 1024)

# 3. Security Headers - Add protective headers to all responses
#    X-Frame-Options, X-Content-Type-Options, CSP, HSTS (prod), etc.
app.add_middleware(SecurityHeadersMiddleware)

# 4. Request ID - Add unique ID to each request for tracing
#    Enables correlation of logs across services
app.add_middleware(RequestIDMiddleware)

# 5. Audit Logging - Log security-relevant requests
#    Logs auth attempts, payments, errors, and mutations
app.add_middleware(AuditLogMiddleware)

# 6. Timing Middleware - Track request performance
#    Adds X-Response-Time header, logs slow requests
slow_threshold = float(os.getenv("SLOW_REQUEST_THRESHOLD", "1.0"))
very_slow_threshold = float(os.getenv("VERY_SLOW_REQUEST_THRESHOLD", "5.0"))
app.add_middleware(
    TimingMiddleware,
    slow_threshold=slow_threshold,
    very_slow_threshold=very_slow_threshold,
)

# 7. CORS - Must be last for preflight handling to work correctly
#    Restricts which origins can access the API
cors_origins = [settings.frontend_url]
if settings.debug:
    cors_origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    # Explicit methods instead of "*" for security
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    # Explicit headers instead of "*" for security
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Guest-Session",
        "X-Request-ID",
    ],
    # Expose request ID to frontend for error reporting
    expose_headers=["X-Request-ID"],
)

# =============================================================================
# ERROR TRACKING MIDDLEWARE
# Catches unhandled exceptions and tracks them for debugging
# =============================================================================

@app.middleware("http")
async def error_tracking_middleware(request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        request_id = request.headers.get("x-request-id")
        # In-memory tracker (always, for dev)
        error_tracker.track(
            error=exc,
            request_method=request.method,
            request_path=str(request.url.path),
            request_id=request_id,
            status_code=500,
        )
        # Sentry (when configured)
        if settings.sentry_dsn:
            try:
                import sentry_sdk

                sentry_sdk.set_context("request", {
                    "request_id": request_id,
                    "method": request.method,
                    "path": str(request.url.path),
                })
                sentry_sdk.capture_exception(exc)
            except Exception:
                pass
        raise


# Include API routes
# Legacy route (backward compatible)
app.include_router(api_router, prefix=settings.api_prefix)
# Versioned route (for future API evolution)
app.include_router(api_v1_router, prefix=f"{settings.api_prefix}/v1")


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "description": "Latvian City Coat of Arms T-Shirt Store",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}

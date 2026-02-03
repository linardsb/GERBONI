"""
Error Sanitization Utilities

Provides safe error handling that:
- Never exposes internal exception details to clients
- Logs full errors with request context for debugging
- Returns consistent error response format with codes
- Maps common exceptions to user-friendly messages
"""

import logging
from enum import Enum
from typing import Any
from fastapi import HTTPException, status
from starlette.requests import Request

logger = logging.getLogger(__name__)


class ErrorCode(str, Enum):
    """Standard error codes for API responses."""
    INTERNAL_ERROR = "INTERNAL_ERROR"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    RATE_LIMITED = "RATE_LIMITED"
    PAYMENT_ERROR = "PAYMENT_ERROR"
    STRIPE_ERROR = "STRIPE_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"


# Map exception types to safe user-facing messages
EXCEPTION_MESSAGES = {
    "StripeError": (ErrorCode.STRIPE_ERROR, "Payment processing failed. Please try again."),
    "CardError": (ErrorCode.PAYMENT_ERROR, "Your card was declined. Please check your card details."),
    "InvalidRequestError": (ErrorCode.PAYMENT_ERROR, "Invalid payment request. Please try again."),
    "AuthenticationError": (ErrorCode.PAYMENT_ERROR, "Payment authentication failed."),
    "APIConnectionError": (ErrorCode.EXTERNAL_SERVICE_ERROR, "Unable to connect to payment service."),
    "RateLimitError": (ErrorCode.RATE_LIMITED, "Too many requests. Please wait before trying again."),
    "SQLAlchemyError": (ErrorCode.DATABASE_ERROR, "A database error occurred. Please try again."),
    "IntegrityError": (ErrorCode.DATABASE_ERROR, "Data conflict detected. Please refresh and try again."),
    "OperationalError": (ErrorCode.DATABASE_ERROR, "Database temporarily unavailable."),
    "TimeoutError": (ErrorCode.EXTERNAL_SERVICE_ERROR, "Request timed out. Please try again."),
    "ConnectionError": (ErrorCode.EXTERNAL_SERVICE_ERROR, "Connection failed. Please try again."),
}


def get_request_id(request: Request | None) -> str | None:
    """Extract request ID from request state if available."""
    if request and hasattr(request, "state") and hasattr(request.state, "request_id"):
        return request.state.request_id
    return None


def sanitize_exception(
    error: Exception,
    request: Request | None = None,
    context: dict[str, Any] | None = None,
) -> tuple[ErrorCode, str]:
    """
    Convert an exception to a safe error code and message.

    Args:
        error: The exception that was raised
        request: The FastAPI request object (optional, for logging)
        context: Additional context for logging (optional)

    Returns:
        Tuple of (ErrorCode, safe_message) for the response
    """
    error_type = type(error).__name__
    request_id = get_request_id(request)

    # Build log context
    log_context = {
        "error_type": error_type,
        "error_message": str(error),
        "request_id": request_id,
    }
    if context:
        log_context.update(context)
    if request:
        log_context["path"] = request.url.path
        log_context["method"] = request.method

    # Log the full error for debugging
    logger.error(
        f"Exception occurred: {error_type}",
        extra=log_context,
        exc_info=True,
    )

    # Check for known exception types
    for exc_name, (code, message) in EXCEPTION_MESSAGES.items():
        if exc_name in error_type or exc_name == error_type:
            return code, message

    # Check class hierarchy for Stripe errors
    for base_class in type(error).__mro__:
        base_name = base_class.__name__
        if base_name in EXCEPTION_MESSAGES:
            return EXCEPTION_MESSAGES[base_name]

    # Default to internal error
    return ErrorCode.INTERNAL_ERROR, "An unexpected error occurred. Please try again."


def safe_error_response(
    error: Exception,
    request: Request | None = None,
    context: dict[str, Any] | None = None,
    default_status: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
) -> HTTPException:
    """
    Create a safe HTTPException from any exception.

    Args:
        error: The exception that was raised
        request: The FastAPI request object (optional)
        context: Additional context for logging (optional)
        default_status: HTTP status code to use (default 500)

    Returns:
        HTTPException with sanitized error message
    """
    code, message = sanitize_exception(error, request, context)

    # Include request ID in response for support reference
    request_id = get_request_id(request)
    detail = {
        "code": code.value,
        "message": message,
    }
    if request_id:
        detail["request_id"] = request_id

    return HTTPException(status_code=default_status, detail=detail)


class APIError(HTTPException):
    """
    Custom API exception with error code and safe message.

    Use this for business logic errors where you want to control
    the exact message shown to users.
    """

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        request: Request | None = None,
    ):
        request_id = get_request_id(request)
        detail = {
            "code": code.value,
            "message": message,
        }
        if request_id:
            detail["request_id"] = request_id

        super().__init__(status_code=status_code, detail=detail)
        self.code = code
        self.message = message

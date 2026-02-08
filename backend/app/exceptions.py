"""Domain exceptions for business rule violations.

These exceptions are HTTP-agnostic and should be translated to HTTPException
at the route handler level using domain_to_http().
"""

from fastapi import HTTPException, status


class DomainException(Exception):
    """Base for all business rule violations."""

    def __init__(self, message: str, code: str | None = None):
        super().__init__(message)
        self.message = message
        self.code = code


class EntityNotFoundError(DomainException):
    """Cart item, order, or variant not found."""
    pass


class InsufficientStockError(DomainException):
    """Requested quantity exceeds available stock."""
    pass


class InvalidStateTransitionError(DomainException):
    """Order cannot transition to requested status."""
    pass


class EmptyCartError(DomainException):
    """Cannot checkout with empty cart."""
    pass


class AuthorizationError(DomainException):
    """User/guest identity required but not provided."""
    pass


class ValidationError(DomainException):
    """Input validation failure (e.g., invalid discount code)."""
    pass


def domain_to_http(exc: DomainException) -> HTTPException:
    """Translate domain exceptions to HTTP exceptions.

    Use at route handler boundaries:
        try:
            items = await CartService.add_item(...)
        except DomainException as e:
            raise domain_to_http(e)
    """
    if isinstance(exc, EntityNotFoundError):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=exc.message,
        )
    if isinstance(exc, AuthorizationError):
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
        )
    # InsufficientStockError, InvalidStateTransitionError, EmptyCartError
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=exc.message,
    )

"""
Structured Logging Configuration

Provides production-grade logging with:
- JSON formatting for log aggregation (ELK, CloudWatch, etc.)
- Request context injection (request_id, path, method, client_ip)
- Configurable via LOG_LEVEL and LOG_FORMAT environment variables
- Async-safe using contextvars
"""

import json
import logging
import sys
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any

# Context variables for request-scoped data
request_context: ContextVar[dict[str, Any]] = ContextVar("request_context", default={})


def set_request_context(
    request_id: str | None = None,
    path: str | None = None,
    method: str | None = None,
    client_ip: str | None = None,
    **extra: Any,
) -> None:
    """Set request context for the current async context."""
    ctx = {
        "request_id": request_id,
        "path": path,
        "method": method,
        "client_ip": client_ip,
        **extra,
    }
    # Filter out None values
    ctx = {k: v for k, v in ctx.items() if v is not None}
    request_context.set(ctx)


def clear_request_context() -> None:
    """Clear request context."""
    request_context.set({})


def get_request_context() -> dict[str, Any]:
    """Get current request context."""
    return request_context.get()


class JSONFormatter(logging.Formatter):
    """
    JSON log formatter for structured logging.

    Output format:
    {
        "timestamp": "2024-01-15T10:30:00.123456Z",
        "level": "INFO",
        "logger": "app.api.auth",
        "message": "User logged in",
        "module": "auth",
        "function": "login",
        "line": 42,
        "request_id": "abc-123",
        "path": "/api/auth/login",
        "method": "POST",
        "client_ip": "192.168.1.1",
        "exception": "..." (if present)
    }
    """

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add request context
        ctx = get_request_context()
        if ctx:
            log_data.update(ctx)

        # Add any extra fields from the log record
        if hasattr(record, "extra") and record.extra:
            log_data.update(record.extra)

        # Add extra attributes set via logger.info(..., extra={...})
        for key in ["request_id", "path", "method", "client_ip", "error_type", "error_message", "order_id"]:
            if hasattr(record, key):
                log_data[key] = getattr(record, key)

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, default=str)


class StandardFormatter(logging.Formatter):
    """
    Standard human-readable formatter with request context.

    Output format:
    2024-01-15 10:30:00 | INFO | app.api.auth | User logged in | request_id=abc-123 path=/api/auth/login
    """

    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        base = f"{timestamp} | {record.levelname:8} | {record.name} | {record.getMessage()}"

        # Add request context
        ctx = get_request_context()
        if ctx:
            context_str = " ".join(f"{k}={v}" for k, v in ctx.items())
            base = f"{base} | {context_str}"

        # Add exception if present
        if record.exc_info:
            base = f"{base}\n{self.formatException(record.exc_info)}"

        return base


def configure_logging(
    level: str = "INFO",
    format_type: str = "standard",
    handlers: list[logging.Handler] | None = None,
) -> None:
    """
    Configure application logging.

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        format_type: "json" for structured logs, "standard" for human-readable
        handlers: Optional list of handlers (defaults to stderr)
    """
    # Get root logger
    root_logger = logging.getLogger()

    # Clear existing handlers
    root_logger.handlers.clear()

    # Set level
    log_level = getattr(logging, level.upper(), logging.INFO)
    root_logger.setLevel(log_level)

    # Create formatter
    if format_type.lower() == "json":
        formatter = JSONFormatter()
    else:
        formatter = StandardFormatter()

    # Create handlers
    if handlers is None:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(formatter)
        handlers = [handler]
    else:
        for handler in handlers:
            handler.setFormatter(formatter)

    # Add handlers
    for handler in handlers:
        root_logger.addHandler(handler)

    # Quiet noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


class ContextLogger(logging.LoggerAdapter):
    """
    Logger adapter that automatically includes request context.

    Usage:
        logger = ContextLogger(logging.getLogger(__name__))
        logger.info("User logged in")  # Automatically includes request_id, path, etc.
    """

    def process(self, msg: str, kwargs: dict) -> tuple[str, dict]:
        extra = kwargs.get("extra", {})
        extra.update(get_request_context())
        kwargs["extra"] = extra
        return msg, kwargs


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance.

    In production, returns a ContextLogger that auto-includes request context.
    For simplicity, returns standard logger (context is added by JSONFormatter).
    """
    return logging.getLogger(name)

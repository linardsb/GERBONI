"""
Lightweight Error Tracking

Provides error aggregation and tracking without external dependencies:
- Aggregates errors by fingerprint (type + message pattern)
- 24-hour retention with automatic cleanup
- Summary endpoint for monitoring dashboards
- Foundation for Sentry integration later
"""

import hashlib
import logging
import threading
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class ErrorOccurrence:
    """Single occurrence of an error."""
    timestamp: datetime
    request_id: str | None
    path: str | None
    method: str | None
    client_ip: str | None
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class AggregatedError:
    """Aggregated error information."""
    fingerprint: str
    error_type: str
    message_pattern: str
    first_seen: datetime
    last_seen: datetime
    count: int
    occurrences: list[ErrorOccurrence] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "fingerprint": self.fingerprint,
            "error_type": self.error_type,
            "message_pattern": self.message_pattern,
            "first_seen": self.first_seen.isoformat(),
            "last_seen": self.last_seen.isoformat(),
            "count": self.count,
            "recent_occurrences": [
                {
                    "timestamp": occ.timestamp.isoformat(),
                    "request_id": occ.request_id,
                    "path": occ.path,
                    "method": occ.method,
                }
                for occ in self.occurrences[-5:]  # Last 5 occurrences
            ],
        }


class ErrorTracker:
    """
    Lightweight error tracking with aggregation.

    Thread-safe implementation using locks.
    Automatically cleans up entries older than retention period.

    Usage:
        tracker = ErrorTracker()

        try:
            # ... code that might fail
        except Exception as e:
            tracker.track(e, request_id="abc-123", path="/api/orders")
            raise

        # Get error summary
        summary = tracker.get_summary()
    """

    def __init__(
        self,
        retention_hours: int = 24,
        max_occurrences_per_error: int = 100,
        max_errors: int = 1000,
    ):
        self.retention_hours = retention_hours
        self.max_occurrences_per_error = max_occurrences_per_error
        self.max_errors = max_errors
        self._errors: dict[str, AggregatedError] = {}
        self._lock = threading.Lock()
        self._last_cleanup = time.time()
        self._cleanup_interval = 300  # 5 minutes

    def _generate_fingerprint(self, error: Exception) -> str:
        """Generate a stable fingerprint for an error."""
        error_type = type(error).__name__
        # Normalize message by removing numbers (IDs, timestamps, etc.)
        message = str(error)
        normalized = "".join(c if not c.isdigit() else "#" for c in message)
        # Create hash
        content = f"{error_type}:{normalized}"
        return hashlib.md5(content.encode()).hexdigest()[:12]

    def _maybe_cleanup(self) -> None:
        """Perform cleanup if enough time has passed."""
        now = time.time()
        if now - self._last_cleanup < self._cleanup_interval:
            return

        self._last_cleanup = now
        cutoff = datetime.now(timezone.utc).timestamp() - (self.retention_hours * 3600)
        cutoff_dt = datetime.fromtimestamp(cutoff, timezone.utc)

        # Remove old errors
        to_remove = []
        for fingerprint, error in self._errors.items():
            if error.last_seen < cutoff_dt:
                to_remove.append(fingerprint)

        for fingerprint in to_remove:
            del self._errors[fingerprint]

        # Trim if too many errors
        if len(self._errors) > self.max_errors:
            # Remove oldest errors
            sorted_errors = sorted(
                self._errors.items(),
                key=lambda x: x[1].last_seen,
            )
            to_remove = [fp for fp, _ in sorted_errors[: len(self._errors) - self.max_errors]]
            for fingerprint in to_remove:
                del self._errors[fingerprint]

    def track(
        self,
        error: Exception,
        request_id: str | None = None,
        path: str | None = None,
        method: str | None = None,
        client_ip: str | None = None,
        **extra: Any,
    ) -> str:
        """
        Track an error occurrence.

        Args:
            error: The exception that occurred
            request_id: Request ID for correlation
            path: Request path
            method: HTTP method
            client_ip: Client IP address
            **extra: Additional context

        Returns:
            Error fingerprint
        """
        fingerprint = self._generate_fingerprint(error)
        now = datetime.now(timezone.utc)

        occurrence = ErrorOccurrence(
            timestamp=now,
            request_id=request_id,
            path=path,
            method=method,
            client_ip=client_ip,
            extra=extra,
        )

        with self._lock:
            self._maybe_cleanup()

            if fingerprint in self._errors:
                agg = self._errors[fingerprint]
                agg.last_seen = now
                agg.count += 1
                agg.occurrences.append(occurrence)
                # Trim occurrences if too many
                if len(agg.occurrences) > self.max_occurrences_per_error:
                    agg.occurrences = agg.occurrences[-self.max_occurrences_per_error:]
            else:
                self._errors[fingerprint] = AggregatedError(
                    fingerprint=fingerprint,
                    error_type=type(error).__name__,
                    message_pattern=str(error)[:200],  # Truncate long messages
                    first_seen=now,
                    last_seen=now,
                    count=1,
                    occurrences=[occurrence],
                )

        logger.debug(f"Tracked error {fingerprint}: {type(error).__name__}")
        return fingerprint

    def get_summary(
        self,
        limit: int = 50,
        since_hours: int | None = None,
    ) -> dict[str, Any]:
        """
        Get error summary for monitoring.

        Args:
            limit: Maximum number of errors to return
            since_hours: Only include errors from last N hours

        Returns:
            Dictionary with error summary
        """
        with self._lock:
            errors = list(self._errors.values())

        # Filter by time if specified
        if since_hours:
            cutoff = datetime.now(timezone.utc).timestamp() - (since_hours * 3600)
            cutoff_dt = datetime.fromtimestamp(cutoff, timezone.utc)
            errors = [e for e in errors if e.last_seen >= cutoff_dt]

        # Sort by count (most frequent first)
        errors.sort(key=lambda x: x.count, reverse=True)
        errors = errors[:limit]

        total_count = sum(e.count for e in errors)

        return {
            "total_unique_errors": len(self._errors),
            "total_occurrences": total_count,
            "retention_hours": self.retention_hours,
            "errors": [e.to_dict() for e in errors],
        }

    def get_error(self, fingerprint: str) -> dict[str, Any] | None:
        """Get details for a specific error by fingerprint."""
        with self._lock:
            error = self._errors.get(fingerprint)
            if error:
                return error.to_dict()
        return None

    def clear(self) -> None:
        """Clear all tracked errors."""
        with self._lock:
            self._errors.clear()


# Global error tracker instance
_tracker: ErrorTracker | None = None


def get_error_tracker() -> ErrorTracker:
    """Get or create the global error tracker instance."""
    global _tracker
    if _tracker is None:
        _tracker = ErrorTracker()
    return _tracker


def track_error(
    error: Exception,
    request_id: str | None = None,
    path: str | None = None,
    method: str | None = None,
    client_ip: str | None = None,
    **extra: Any,
) -> str:
    """
    Convenience function to track an error using global tracker.

    Returns:
        Error fingerprint
    """
    tracker = get_error_tracker()
    return tracker.track(
        error=error,
        request_id=request_id,
        path=path,
        method=method,
        client_ip=client_ip,
        **extra,
    )

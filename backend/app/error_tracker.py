"""In-memory error tracking for development and debugging.

Tracks errors with fingerprinting for aggregation. In production,
this should be replaced with or supplemented by Sentry or similar.
"""

import hashlib
import logging
import traceback
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)

MAX_OCCURRENCES = 100  # Per fingerprint
MAX_FINGERPRINTS = 500  # Total unique errors tracked


@dataclass
class ErrorOccurrence:
    timestamp: datetime
    request_method: str
    request_path: str
    request_id: str | None
    status_code: int | None
    user_id: int | None
    error_type: str
    error_message: str
    traceback: str | None


@dataclass
class ErrorGroup:
    fingerprint: str
    error_type: str
    error_message: str
    first_seen: datetime
    last_seen: datetime
    count: int = 0
    occurrences: list[ErrorOccurrence] = field(default_factory=list)


class ErrorTracker:
    def __init__(self):
        self._errors: dict[str, ErrorGroup] = {}

    def track(
        self,
        error: Exception,
        request_method: str = "",
        request_path: str = "",
        request_id: str | None = None,
        status_code: int | None = None,
        user_id: int | None = None,
    ) -> str:
        """Track an error occurrence. Returns the fingerprint."""
        error_type = type(error).__name__
        error_message = str(error)
        tb = traceback.format_exception(type(error), error, error.__traceback__)
        tb_str = "".join(tb)

        # Create fingerprint from error type + message + location
        fingerprint_source = f"{error_type}:{error_message}:{request_path}"
        fingerprint = hashlib.md5(fingerprint_source.encode()).hexdigest()[:12]

        now = datetime.utcnow()
        occurrence = ErrorOccurrence(
            timestamp=now,
            request_method=request_method,
            request_path=request_path,
            request_id=request_id,
            status_code=status_code,
            user_id=user_id,
            error_type=error_type,
            error_message=error_message,
            traceback=tb_str,
        )

        if fingerprint in self._errors:
            group = self._errors[fingerprint]
            group.last_seen = now
            group.count += 1
            if len(group.occurrences) < MAX_OCCURRENCES:
                group.occurrences.append(occurrence)
        else:
            if len(self._errors) >= MAX_FINGERPRINTS:
                # Evict oldest error group
                oldest_key = min(self._errors, key=lambda k: self._errors[k].last_seen)
                del self._errors[oldest_key]

            self._errors[fingerprint] = ErrorGroup(
                fingerprint=fingerprint,
                error_type=error_type,
                error_message=error_message,
                first_seen=now,
                last_seen=now,
                count=1,
                occurrences=[occurrence],
            )

        logger.error(
            "Tracked error [%s] %s: %s (path=%s, request_id=%s)",
            fingerprint,
            error_type,
            error_message,
            request_path,
            request_id,
        )

        return fingerprint

    def get_summary(self) -> list[dict]:
        """Get aggregated error summary, sorted by most recent."""
        return [
            {
                "fingerprint": group.fingerprint,
                "error_type": group.error_type,
                "error_message": group.error_message[:200],
                "count": group.count,
                "first_seen": group.first_seen.isoformat(),
                "last_seen": group.last_seen.isoformat(),
            }
            for group in sorted(
                self._errors.values(),
                key=lambda g: g.last_seen,
                reverse=True,
            )
        ]

    def get_error(self, fingerprint: str) -> dict | None:
        """Get details for a specific error group."""
        group = self._errors.get(fingerprint)
        if not group:
            return None

        return {
            "fingerprint": group.fingerprint,
            "error_type": group.error_type,
            "error_message": group.error_message,
            "count": group.count,
            "first_seen": group.first_seen.isoformat(),
            "last_seen": group.last_seen.isoformat(),
            "occurrences": [
                {
                    "timestamp": occ.timestamp.isoformat(),
                    "request_method": occ.request_method,
                    "request_path": occ.request_path,
                    "request_id": occ.request_id,
                    "status_code": occ.status_code,
                    "user_id": occ.user_id,
                    "error_type": occ.error_type,
                    "error_message": occ.error_message,
                    "traceback": occ.traceback,
                }
                for occ in group.occurrences[-20:]  # Last 20 occurrences
            ],
        }

    def clear(self):
        """Clear all tracked errors."""
        self._errors.clear()


# Singleton instance
error_tracker = ErrorTracker()

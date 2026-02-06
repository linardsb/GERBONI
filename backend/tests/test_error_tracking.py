"""
Tests for error tracking API endpoints.
"""

import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
from datetime import datetime

from app.error_tracker import ErrorTracker, ErrorGroup, ErrorOccurrence


@pytest.fixture
def mock_error_tracker():
    """Provide a mock error tracker with sample data."""
    tracker = ErrorTracker()
    # Track a sample error
    try:
        raise ValueError("Test error message")
    except ValueError as e:
        tracker.track(
            e,
            request_method="GET",
            request_path="/api/products",
            request_id="req-123",
            status_code=500,
        )
    return tracker


class TestErrorSummary:
    """Tests for GET /api/errors/summary"""

    async def test_summary_requires_admin(self, auth_client: AsyncClient):
        """Regular users cannot access error summary."""
        response = await auth_client.get("/api/errors/summary")
        assert response.status_code == 403

    async def test_summary_unauthenticated(self, client: AsyncClient):
        """Unauthenticated users cannot access error summary."""
        response = await client.get("/api/errors/summary")
        assert response.status_code == 401

    async def test_summary_empty(self, admin_client: AsyncClient):
        """Summary returns empty list when no errors tracked."""
        with patch("app.api.errors.error_tracker") as mock:
            mock.get_summary.return_value = []
            response = await admin_client.get("/api/errors/summary")
            assert response.status_code == 200
            assert response.json() == []

    async def test_summary_with_errors(
        self, admin_client: AsyncClient, mock_error_tracker
    ):
        """Summary returns tracked errors."""
        with patch("app.api.errors.error_tracker", mock_error_tracker):
            response = await admin_client.get("/api/errors/summary")
            assert response.status_code == 200
            data = response.json()
            assert len(data) >= 1
            assert data[0]["error_type"] == "ValueError"
            assert data[0]["count"] == 1


class TestErrorDetails:
    """Tests for GET /api/errors/{fingerprint}"""

    async def test_details_requires_admin(self, auth_client: AsyncClient):
        """Regular users cannot access error details."""
        response = await auth_client.get("/api/errors/abc123")
        assert response.status_code == 403

    async def test_details_not_found(self, admin_client: AsyncClient):
        """Returns 404 for non-existent fingerprint."""
        with patch("app.api.errors.error_tracker") as mock:
            mock.get_error.return_value = None
            response = await admin_client.get("/api/errors/nonexistent")
            assert response.status_code == 404

    async def test_details_success(
        self, admin_client: AsyncClient, mock_error_tracker
    ):
        """Returns error group details."""
        summary = mock_error_tracker.get_summary()
        fingerprint = summary[0]["fingerprint"]

        with patch("app.api.errors.error_tracker", mock_error_tracker):
            response = await admin_client.get(f"/api/errors/{fingerprint}")
            assert response.status_code == 200
            data = response.json()
            assert data["fingerprint"] == fingerprint
            assert data["error_type"] == "ValueError"
            assert "occurrences" in data


class TestClearErrors:
    """Tests for DELETE /api/errors"""

    async def test_clear_requires_admin(self, auth_client: AsyncClient):
        """Regular users cannot clear errors."""
        response = await auth_client.delete("/api/errors")
        assert response.status_code == 403

    async def test_clear_success(self, admin_client: AsyncClient):
        """Admin can clear all tracked errors."""
        with patch("app.api.errors.error_tracker") as mock:
            response = await admin_client.delete("/api/errors")
            assert response.status_code == 200
            assert response.json()["status"] == "cleared"
            mock.clear.assert_called_once()

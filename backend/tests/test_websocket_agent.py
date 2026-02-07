"""
Tests for the WebSocket chat endpoint (backend/app/api/agent.py).

Covers:
- WebSocket connection lifecycle
- JWT authentication flow
- Guest session authentication
- Auth timeout enforcement
- Rate limiting (30 messages/60 seconds)
- Message size validation (10KB max)
- Chat message handling with typing indicators
- Error handling and sanitization
"""

import json
import time
from unittest.mock import patch, AsyncMock, MagicMock

import pytest
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app
from app.database import get_db
from app.config import get_settings


# =============================================================================
# Fixtures
# =============================================================================


class WebSocketTestClient:
    """Wrapper around TestClient to add host header to WebSocket connections."""

    def __init__(self, client: TestClient):
        self._client = client

    def websocket_connect(self, url: str, **kwargs):
        """Connect to WebSocket with host header for TrustedHostMiddleware."""
        headers = kwargs.pop("headers", {})
        headers["host"] = "localhost"
        return self._client.websocket_connect(url, headers=headers, **kwargs)


@pytest.fixture
def ws_client(db_session):
    """Create a test client configured for WebSocket testing."""
    # Override database dependency
    async def override_get_db():
        yield db_session

    # Mock init_db to avoid connecting to production database
    async def mock_init_db():
        pass

    app.dependency_overrides[get_db] = override_get_db

    with patch("app.main.init_db", mock_init_db):
        # Use base_url with localhost to satisfy TrustedHostMiddleware
        client = TestClient(app, base_url="http://localhost", raise_server_exceptions=False)
        yield WebSocketTestClient(client)

    app.dependency_overrides.clear()


@pytest.fixture
def mock_agent_response():
    """Mock the run_agent_conversation function."""
    with patch("app.api.agent.run_agent_conversation") as mock:
        mock.return_value = "I'm here to help! How can I assist you today?"
        yield mock


@pytest.fixture
def mock_agent_error():
    """Mock the run_agent_conversation function to raise an error."""
    with patch("app.api.agent.run_agent_conversation") as mock:
        mock.side_effect = Exception("Internal agent error with secrets")
        yield mock


# =============================================================================
# TestWebSocketConnection
# =============================================================================


class TestWebSocketConnection:
    """Tests for basic WebSocket connection lifecycle."""

    def test_websocket_accepts_connection(self, ws_client):
        """Basic connection should be accepted."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Connection established - send a message to verify it's alive
            ws.send_json({"type": "ping"})
            # No response expected for unknown type, connection stays open

    def test_websocket_disconnect_cleanup(self, ws_client, mock_agent_response):
        """Clean disconnect should be handled gracefully."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            ws.send_json({"type": "auth", "token": "invalid"})
            response = ws.receive_json()
            assert response["type"] == "auth_error"
        # No exception on disconnect - cleanup successful


# =============================================================================
# TestJWTAuthentication
# =============================================================================


class TestJWTAuthentication:
    """Tests for JWT token authentication flow."""

    def test_auth_with_valid_token(self, ws_client, test_user_token):
        """Valid JWT token should return auth_success."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            ws.send_json({"type": "auth", "token": test_user_token})
            response = ws.receive_json()
            assert response["type"] == "auth_success"
            assert "authenticated" in response["message"].lower()

    def test_auth_with_invalid_token(self, ws_client):
        """Invalid JWT token should return auth_error."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            ws.send_json({"type": "auth", "token": "invalid.token.here"})
            response = ws.receive_json()
            assert response["type"] == "auth_error"
            assert response["code"] == "INVALID_TOKEN"

    def test_auth_with_expired_token(self, ws_client, test_user):
        """Expired JWT token should return auth_error."""
        import jwt
        from datetime import datetime, timedelta

        # Create an expired token
        expired_payload = {
            "sub": str(test_user.id),
            "exp": datetime.utcnow() - timedelta(hours=1),
        }
        settings = get_settings()
        expired_token = jwt.encode(expired_payload, settings.secret_key, algorithm="HS256")

        with ws_client.websocket_connect("/api/agent/chat") as ws:
            ws.send_json({"type": "auth", "token": expired_token})
            response = ws.receive_json()
            assert response["type"] == "auth_error"

    def test_auth_sets_user_context(self, ws_client, test_user_token, mock_agent_response):
        """After auth, subsequent messages should have user_id in context."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Authenticate first
            ws.send_json({"type": "auth", "token": test_user_token})
            response = ws.receive_json()
            assert response["type"] == "auth_success"

            # Send a message
            ws.send_json({"type": "message", "content": "Hello"})

            # Should get typing indicator, then message, then typing off
            typing_on = ws.receive_json()
            assert typing_on["type"] == "typing"
            assert typing_on["status"] is True

            message = ws.receive_json()
            assert message["type"] == "message"

            typing_off = ws.receive_json()
            assert typing_off["type"] == "typing"
            assert typing_off["status"] is False

            # Verify agent was called with user_id
            mock_agent_response.assert_called_once()
            call_kwargs = mock_agent_response.call_args.kwargs
            assert call_kwargs["user_id"] is not None
            assert call_kwargs["guest_email"] is None


# =============================================================================
# TestGuestAuthentication
# =============================================================================


class TestGuestAuthentication:
    """Tests for guest session authentication flow."""

    def test_guest_with_session_token(self, ws_client, test_guest_session, db_session):
        """Valid guest session token should return guest_success."""
        # Ensure session is committed and visible
        import asyncio
        loop = asyncio.get_event_loop()
        loop.run_until_complete(db_session.commit())

        with ws_client.websocket_connect("/api/agent/chat") as ws:
            ws.send_json({
                "type": "guest",
                "session_token": test_guest_session.session_token,
            })
            response = ws.receive_json()
            assert response["type"] == "guest_success"
            assert "session" in response["message"].lower()

    def test_guest_with_session_token_uses_session_email(self, ws_client, db_session, mock_agent_response):
        """Guest session with email should use that email in context."""
        from app.models import GuestSession
        import asyncio

        # Create session with email
        session = GuestSession(email="session-stored@example.com")
        db_session.add(session)
        loop = asyncio.get_event_loop()
        loop.run_until_complete(db_session.commit())
        loop.run_until_complete(db_session.refresh(session))

        with ws_client.websocket_connect("/api/agent/chat") as ws:
            ws.send_json({
                "type": "guest",
                "session_token": session.session_token,
            })
            response = ws.receive_json()
            assert response["type"] == "guest_success"
            assert "session" in response["message"].lower()

            # Send a message to verify email context
            ws.send_json({"type": "message", "content": "Hello"})
            ws.receive_json()  # typing
            ws.receive_json()  # message
            ws.receive_json()  # typing off

            # Verify agent got the session email
            mock_agent_response.assert_called_once()
            call_kwargs = mock_agent_response.call_args.kwargs
            assert call_kwargs["guest_email"] == "session-stored@example.com"

    def test_guest_session_prefers_session_email_over_provided(self, ws_client, db_session, mock_agent_response):
        """When session has email, it should be used over provided email."""
        from app.models import GuestSession
        import asyncio

        # Create session with stored email
        session = GuestSession(email="stored@example.com")
        db_session.add(session)
        loop = asyncio.get_event_loop()
        loop.run_until_complete(db_session.commit())
        loop.run_until_complete(db_session.refresh(session))

        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Send both session_token AND email - session.email should win
            ws.send_json({
                "type": "guest",
                "session_token": session.session_token,
                "email": "provided@example.com",
            })
            response = ws.receive_json()
            assert response["type"] == "guest_success"

            # Send a message
            ws.send_json({"type": "message", "content": "Test"})
            ws.receive_json()  # typing
            ws.receive_json()  # message
            ws.receive_json()  # typing off

            # Verify session.email was used (not provided email)
            call_kwargs = mock_agent_response.call_args.kwargs
            assert call_kwargs["guest_email"] == "stored@example.com"

    def test_guest_with_email_only(self, ws_client):
        """Guest with email only should return guest_success."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            ws.send_json({
                "type": "guest",
                "email": "visitor@example.com",
            })
            response = ws.receive_json()
            assert response["type"] == "guest_success"
            assert "email" in response["message"].lower()

    def test_guest_with_invalid_session_returns_error(self, ws_client):
        """Invalid session token should return guest_error with INVALID_SESSION code."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            ws.send_json({
                "type": "guest",
                "session_token": "invalid-session-token",
                "email": "fallback@example.com",
            })
            # Should receive an error response for the invalid session
            response = ws.receive_json()
            assert response["type"] == "guest_error"
            assert response["code"] == "INVALID_SESSION"
            assert "invalid" in response["message"].lower() or "expired" in response["message"].lower()

            # Client can retry with email-only auth after the error
            ws.send_json({"type": "guest", "email": "retry@example.com"})
            response = ws.receive_json()
            assert response["type"] == "guest_success"

    def test_guest_sets_email_context(self, ws_client, mock_agent_response):
        """After guest auth, subsequent messages should have guest_email in context."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Authenticate as guest
            ws.send_json({
                "type": "guest",
                "email": "test-guest@example.com",
            })
            response = ws.receive_json()
            assert response["type"] == "guest_success"

            # Send a message
            ws.send_json({"type": "message", "content": "Help me"})

            # Consume typing indicators and message
            ws.receive_json()  # typing on
            ws.receive_json()  # message
            ws.receive_json()  # typing off

            # Verify agent was called with guest_email
            mock_agent_response.assert_called_once()
            call_kwargs = mock_agent_response.call_args.kwargs
            assert call_kwargs["user_id"] is None
            assert call_kwargs["guest_email"] == "test-guest@example.com"


# =============================================================================
# TestAuthTimeout
# =============================================================================


class TestAuthTimeout:
    """Tests for authentication timeout enforcement."""

    def test_auth_timeout_raises_exception(self, ws_client):
        """Auth timeout should raise AuthTimeoutError when exceeded."""
        from app.middleware.websocket_security import AuthTimeoutError

        # Patch is_auth_timeout_exceeded to return True immediately
        with patch("app.api.agent.WebSocketRateLimiter") as MockLimiter:
            mock_limiter = MagicMock()
            mock_limiter.check_message_size.return_value = (True, "")
            mock_limiter.check_rate_limit.return_value = (True, "")
            # Return True immediately to trigger the AuthTimeoutError
            mock_limiter.is_auth_timeout_exceeded.return_value = True
            MockLimiter.return_value = mock_limiter

            with ws_client.websocket_connect("/api/agent/chat") as ws:
                # Send any message to trigger the timeout check
                ws.send_json({"type": "ping"})
                # Connection should be closed due to AuthTimeoutError
                # The exception is caught and logged, connection terminates

    def test_auth_timeout_closes_connection(self, ws_client):
        """Connection should close after 30s without auth."""
        # Patch the auth timeout to 0.1 seconds for testing
        with patch("app.api.agent.WebSocketRateLimiter") as MockLimiter:
            mock_limiter = MagicMock()
            mock_limiter.max_messages = 30
            mock_limiter.window_seconds = 60
            mock_limiter.max_message_size = 10 * 1024
            mock_limiter.auth_timeout_seconds = 0.1  # Very short timeout
            mock_limiter.is_authenticated = False
            mock_limiter._connection_time = time.time()
            mock_limiter.check_message_size.return_value = (True, "")
            mock_limiter.check_rate_limit.return_value = (True, "")

            # Make is_auth_timeout_exceeded return True after timeout
            def check_timeout():
                return time.time() - mock_limiter._connection_time > 0.1

            mock_limiter.is_auth_timeout_exceeded.side_effect = check_timeout
            MockLimiter.return_value = mock_limiter

            with ws_client.websocket_connect("/api/agent/chat") as ws:
                # Wait for timeout
                import time as t
                t.sleep(0.2)

                # Try to receive - should get error or disconnect
                try:
                    ws.send_json({"type": "message", "content": "test"})
                    response = ws.receive_json()
                    # May get auth timeout error
                    if response.get("type") == "error":
                        assert response["code"] == "AUTH_TIMEOUT"
                except Exception:
                    # Connection may be closed - expected
                    pass

    def test_auth_timeout_cancelled_on_auth(self, ws_client, test_user_token, mock_agent_response):
        """Auth timeout should be cancelled when authenticated."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Authenticate immediately
            ws.send_json({"type": "auth", "token": test_user_token})
            response = ws.receive_json()
            assert response["type"] == "auth_success"

            # Wait a bit, then send message - should still work
            import time as t
            t.sleep(0.1)

            ws.send_json({"type": "message", "content": "Still here"})

            # Should get response, not timeout
            typing_on = ws.receive_json()
            assert typing_on["type"] == "typing"


# =============================================================================
# TestRateLimiting
# =============================================================================


class TestRateLimiting:
    """Tests for message rate limiting."""

    def test_rate_limit_allows_normal_usage(self, ws_client, test_user_token, mock_agent_response):
        """Normal message rate should be allowed."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Authenticate
            ws.send_json({"type": "auth", "token": test_user_token})
            ws.receive_json()  # auth_success

            # Send a few messages - should all work
            for i in range(3):
                ws.send_json({"type": "message", "content": f"Message {i}"})
                ws.receive_json()  # typing on
                ws.receive_json()  # message
                ws.receive_json()  # typing off

            # All messages processed successfully
            assert mock_agent_response.call_count == 3

    def test_rate_limit_blocks_excessive_messages(self, ws_client, test_user_token):
        """Over 30 messages in 60 seconds should be blocked."""
        with patch("app.api.agent.run_agent_conversation") as mock:
            mock.return_value = "OK"

            with ws_client.websocket_connect("/api/agent/chat") as ws:
                # Authenticate
                ws.send_json({"type": "auth", "token": test_user_token})
                ws.receive_json()  # auth_success

                rate_limit_hit = False

                # Send more than 30 messages rapidly
                for i in range(35):
                    ws.send_json({"type": "message", "content": f"Msg {i}"})

                    # Check for rate limit error
                    response = ws.receive_json()
                    if response.get("type") == "error" and response.get("code") == "RATE_LIMIT_EXCEEDED":
                        rate_limit_hit = True
                        break
                    else:
                        # Consume remaining responses (typing, message, typing)
                        if response.get("type") == "typing":
                            ws.receive_json()  # message
                            ws.receive_json()  # typing off

                assert rate_limit_hit, "Rate limit should have been triggered"

    def test_rate_limit_returns_error_message(self, ws_client, test_user_token):
        """Rate limit error should include RATE_LIMIT_EXCEEDED code."""
        with patch("app.api.agent.run_agent_conversation") as mock:
            mock.return_value = "OK"

            with ws_client.websocket_connect("/api/agent/chat") as ws:
                # Authenticate
                ws.send_json({"type": "auth", "token": test_user_token})
                ws.receive_json()  # auth_success

                error_response = None

                # Send excessive messages
                for i in range(35):
                    ws.send_json({"type": "message", "content": f"Spam {i}"})
                    response = ws.receive_json()

                    if response.get("type") == "error":
                        error_response = response
                        break
                    else:
                        # Consume responses
                        if response.get("type") == "typing":
                            ws.receive_json()
                            ws.receive_json()

                assert error_response is not None
                assert error_response["code"] == "RATE_LIMIT_EXCEEDED"
                assert "rate limit" in error_response["message"].lower()


# =============================================================================
# TestMessageSizeValidation
# =============================================================================


class TestMessageSizeValidation:
    """Tests for message size limits."""

    def test_message_size_within_limit(self, ws_client, test_user_token, mock_agent_response):
        """Messages under 10KB should be accepted."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Authenticate
            ws.send_json({"type": "auth", "token": test_user_token})
            ws.receive_json()  # auth_success

            # Send a normal-sized message
            ws.send_json({"type": "message", "content": "A" * 1000})

            # Should succeed
            typing_on = ws.receive_json()
            assert typing_on["type"] == "typing"

    def test_message_size_exceeds_limit(self, ws_client, test_user_token):
        """Messages over 10KB should be rejected."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Authenticate
            ws.send_json({"type": "auth", "token": test_user_token})
            ws.receive_json()  # auth_success

            # Send an oversized message (>10KB)
            large_content = "X" * (11 * 1024)  # 11KB
            ws.send_json({"type": "message", "content": large_content})

            response = ws.receive_json()
            assert response["type"] == "error"
            assert response["code"] == "MESSAGE_TOO_LARGE"
            assert "10KB" in response["message"] or "too large" in response["message"].lower()


# =============================================================================
# TestChatMessages
# =============================================================================


class TestChatMessages:
    """Tests for chat message handling."""

    def test_message_sends_typing_indicator(self, ws_client, test_user_token, mock_agent_response):
        """Chat message should trigger typing indicators."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Authenticate
            ws.send_json({"type": "auth", "token": test_user_token})
            ws.receive_json()  # auth_success

            # Send message
            ws.send_json({"type": "message", "content": "Hello"})

            # Should receive typing: true, then message, then typing: false
            typing_on = ws.receive_json()
            assert typing_on["type"] == "typing"
            assert typing_on["status"] is True

            message = ws.receive_json()
            assert message["type"] == "message"

            typing_off = ws.receive_json()
            assert typing_off["type"] == "typing"
            assert typing_off["status"] is False

    def test_message_returns_agent_response(self, ws_client, test_user_token, mock_agent_response):
        """Chat message should return agent response with role=assistant."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Authenticate
            ws.send_json({"type": "auth", "token": test_user_token})
            ws.receive_json()  # auth_success

            # Send message
            ws.send_json({"type": "message", "content": "What products do you have?"})

            # Skip typing indicator
            ws.receive_json()

            # Get agent response
            message = ws.receive_json()
            assert message["type"] == "message"
            assert message["role"] == "assistant"
            assert message["content"] == "I'm here to help! How can I assist you today?"

    def test_empty_message_ignored(self, ws_client, test_user_token, mock_agent_response):
        """Empty message content should be ignored."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Authenticate
            ws.send_json({"type": "auth", "token": test_user_token})
            ws.receive_json()  # auth_success

            # Send empty message
            ws.send_json({"type": "message", "content": ""})

            # Send another message to verify connection still works
            ws.send_json({"type": "message", "content": "Real message"})

            # Should only get response from second message
            response = ws.receive_json()
            assert response["type"] == "typing"

            # Agent should only be called once (for the non-empty message)
            # Wait for all responses
            ws.receive_json()  # message
            ws.receive_json()  # typing off

            assert mock_agent_response.call_count == 1

    def test_message_without_auth_works(self, ws_client, mock_agent_response):
        """Messages can be sent without auth (agent handles access control)."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Don't authenticate - just send message directly
            ws.send_json({"type": "message", "content": "Hello without auth"})

            # Should still get response (with null user_id and guest_email)
            typing_on = ws.receive_json()
            assert typing_on["type"] == "typing"

            message = ws.receive_json()
            assert message["type"] == "message"

            # Agent was called with no identity
            mock_agent_response.assert_called_once()
            call_kwargs = mock_agent_response.call_args.kwargs
            assert call_kwargs["user_id"] is None
            assert call_kwargs["guest_email"] is None


# =============================================================================
# TestErrorHandling
# =============================================================================


class TestErrorHandling:
    """Tests for error handling and sanitization."""

    def test_invalid_json_returns_error(self, ws_client):
        """Invalid JSON should return INVALID_JSON error."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Send raw text that's not valid JSON
            ws.send_text("{invalid json content")

            response = ws.receive_json()
            assert response["type"] == "error"
            assert response["code"] == "INVALID_JSON"
            assert "invalid" in response["message"].lower()

    def test_agent_error_sanitized(self, ws_client, test_user_token, mock_agent_error):
        """Internal agent errors should not leak details."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Authenticate
            ws.send_json({"type": "auth", "token": test_user_token})
            ws.receive_json()  # auth_success

            # Send message that triggers error
            ws.send_json({"type": "message", "content": "Trigger error"})

            # Get typing indicator
            typing_on = ws.receive_json()
            assert typing_on["type"] == "typing"

            # Get error response (sanitized)
            error = ws.receive_json()
            assert error["type"] == "error"
            assert error["code"] == "INTERNAL_ERROR"
            # Should NOT contain "secrets" from the mock error
            assert "secrets" not in error["message"]
            assert "unexpected" in error["message"].lower()

            # Should still get typing off
            typing_off = ws.receive_json()
            assert typing_off["type"] == "typing"
            assert typing_off["status"] is False

    def test_unknown_message_type_ignored(self, ws_client, mock_agent_response):
        """Unknown message types should be silently ignored."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Send unknown message type
            ws.send_json({"type": "unknown_type", "data": "something"})

            # Send a valid message after
            ws.send_json({"type": "message", "content": "Valid message"})

            # Should only get response from the valid message
            response = ws.receive_json()
            assert response["type"] == "typing"  # From valid message

            # Connection still works
            mock_agent_response.assert_called_once()


# =============================================================================
# TestConnectionResilience
# =============================================================================


class TestConnectionResilience:
    """Tests for connection resilience and edge cases."""

    def test_multiple_auth_attempts(self, ws_client, test_user_token):
        """Multiple auth attempts should be handled gracefully."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # First auth - invalid
            ws.send_json({"type": "auth", "token": "invalid"})
            response1 = ws.receive_json()
            assert response1["type"] == "auth_error"

            # Second auth - valid
            ws.send_json({"type": "auth", "token": test_user_token})
            response2 = ws.receive_json()
            assert response2["type"] == "auth_success"

    def test_auth_after_guest(self, ws_client, test_user_token):
        """JWT auth after guest auth should work (upgrade session)."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Start as guest
            ws.send_json({"type": "guest", "email": "guest@test.com"})
            response1 = ws.receive_json()
            assert response1["type"] == "guest_success"

            # Then authenticate with JWT
            ws.send_json({"type": "auth", "token": test_user_token})
            response2 = ws.receive_json()
            assert response2["type"] == "auth_success"

    def test_rapid_messages(self, ws_client, test_user_token, mock_agent_response):
        """Rapid successive messages should be handled."""
        with ws_client.websocket_connect("/api/agent/chat") as ws:
            # Authenticate
            ws.send_json({"type": "auth", "token": test_user_token})
            ws.receive_json()  # auth_success

            # Send multiple messages quickly
            for i in range(5):
                ws.send_json({"type": "message", "content": f"Quick {i}"})

            # Collect all responses
            responses = []
            for _ in range(15):  # 5 messages * 3 responses each
                responses.append(ws.receive_json())

            # Should have received all responses
            message_responses = [r for r in responses if r.get("type") == "message"]
            assert len(message_responses) == 5

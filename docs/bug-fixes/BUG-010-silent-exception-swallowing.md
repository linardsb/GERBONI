# BUG-010: Silent Exception Swallowing in Error Handlers

**Status**: Fixed
**Severity**: Medium
**Date Discovered**: 2026-02-08
**Date Fixed**: 2026-02-08
**GitHub Issue**: https://github.com/linardsb/GERBONI/issues/5

## Summary
Three locations in the backend used bare `except Exception: pass`, silently swallowing errors. This made it impossible to diagnose infrastructure failures in Sentry error forwarding, WebSocket authentication timeouts, and WebSocket error message delivery.

## Root Cause
Defensive coding taken too far. The handlers were designed to "never fail" and disrupt the main flow, but the implementation created silent black holes where legitimate infrastructure problems (broken Sentry SDK, WebSocket connection issues) were completely hidden.

### Affected Locations
1. **`backend/app/main.py`** — Sentry error forwarding in exception middleware
2. **`backend/app/api/agent.py`** — WebSocket auth timeout handler
3. **`backend/app/api/agent.py`** — WebSocket error message sender

## Symptoms
- If Sentry SDK failed to capture an exception, no diagnostic output appeared
- If a WebSocket timeout/close message failed to send, no record existed
- Infrastructure problems could persist undetected for extended periods

## Fix Applied
Replaced all three bare `except` blocks with proper logging:

1. `main.py`: `except Exception as sentry_exc: logger.warning("Failed to send exception to Sentry: %s", sentry_exc)`
2. `agent.py` (timeout): `except Exception as e: logger.debug("Error sending auth timeout message: %s", e)`
3. `agent.py` (error sender): `except Exception as send_exc: logger.debug("Failed to send error to WebSocket client: %s", send_exc)`

**Files changed:** `backend/app/main.py`, `backend/app/api/agent.py`

## Regression Test
N/A — logging behavior verified by code review. The fix ensures diagnostic output exists, not a functional behavior change.

## Prevention
- **Never use bare `except: pass` or `except Exception: pass`**
- At minimum, log the exception at DEBUG level
- Consider a Ruff linting rule (`E722` bare-except, `S110` try-except-pass) to flag these patterns
- Error handlers that "should never fail" still need observability

## Related Issues
- Affects debugging of Known Fragile Area #4 (AI Agent WebSocket)
- No direct relation to previous bugs, but establishes exception handling standard

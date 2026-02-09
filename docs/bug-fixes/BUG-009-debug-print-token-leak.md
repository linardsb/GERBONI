# BUG-009: Debug Print Leaking Password Reset Tokens

**Status**: Fixed
**Severity**: High
**Date Discovered**: 2026-02-08
**Date Fixed**: 2026-02-08
**GitHub Issue**: https://github.com/linardsb/GERBONI/issues/4

## Summary
When `DEBUG=true`, the password reset endpoint printed the full reset token to stdout using `print()`, exposing sensitive security tokens in server logs. Any process or log aggregator with access to stdout could read the token and use it to reset any user's password.

## Root Cause
A developer convenience `print()` statement was left in production code at `backend/app/api/auth.py:111`:
```python
print(f"Password reset token for {data.email}: {reset_token.token}")
```
This bypassed all log level controls since `print()` always writes to stdout regardless of logging configuration.

## Symptoms
- Password reset tokens visible in server stdout when DEBUG=true
- Tokens could be captured by log aggregation services (CloudWatch, Datadog, etc.)
- No indication in application logs that sensitive data was being leaked

## Fix Applied
- Added proper structured logging: `import logging` and `logger = logging.getLogger(__name__)`
- Replaced `print()` with `logger.debug("Password reset token created for %s", data.email)`
- Token value itself is no longer logged at any level — only the email address at DEBUG level

**File changed:** `backend/app/api/auth.py`

## Regression Test
N/A — logging behavior verified by code review. No user-facing behavior change to assert on.

## Prevention
- **Never use `print()` in backend code.** Always use `logging.getLogger(__name__)`
- **Never log token/secret values**, even at DEBUG level
- Consider adding a pre-commit hook or Ruff rule to flag `print()` calls in `app/` directory
- Code review checklist should include "no sensitive data in logs"

## Related Issues
- First information disclosure bug in the project
- Establishes logging standard for all backend modules

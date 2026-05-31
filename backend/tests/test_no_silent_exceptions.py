"""Regression test for BUG-010: no error-swallowing ``except ...: pass`` handlers.

Three handlers in the codebase previously used a bare ``except Exception: pass``,
silently hiding infrastructure failures (Sentry forwarding in ``main.py``, the
WebSocket auth-timeout sender and the WebSocket error sender in ``api/agent.py``).
Each now logs the swallowed exception.

This test guards against reintroducing a swallowing handler in the affected
modules. It parses each file's AST and flags any ``except`` block whose body is
*only* ``pass`` / ``...``, allowing the single idiomatic exception:
``except asyncio.CancelledError: pass`` used for cooperative task cancellation
cleanup.
"""

import ast
from pathlib import Path

import pytest

APP_DIR = Path(__file__).resolve().parents[1] / "app"

# Modules that previously swallowed exceptions and must stay clean.
GUARDED_FILES = [APP_DIR / "main.py", APP_DIR / "api" / "agent.py"]

# Exception types for which an empty ``pass`` body is idiomatic, not a swallow:
# awaiting a cancelled task is expected to raise CancelledError, which is ignored.
ALLOWED_BARE_PASS = {"CancelledError", "asyncio.CancelledError"}


def _exc_names(handler: ast.ExceptHandler) -> list[str]:
    """Return the caught exception type name(s) for an except handler."""
    node = handler.type
    if node is None:
        return ["<bare except>"]
    parts = node.elts if isinstance(node, ast.Tuple) else [node]
    names: list[str] = []
    for part in parts:
        if isinstance(part, ast.Attribute):
            prefix = getattr(part.value, "id", "")
            names.append(f"{prefix}.{part.attr}" if prefix else part.attr)
        elif isinstance(part, ast.Name):
            names.append(part.id)
        else:  # pragma: no cover - unusual expression
            names.append(ast.dump(part))
    return names


def _is_only_pass(body: list[ast.stmt]) -> bool:
    """True if a handler body does nothing but ``pass`` / a bare ``...``."""
    for stmt in body:
        if isinstance(stmt, ast.Pass):
            continue
        if (
            isinstance(stmt, ast.Expr)
            and isinstance(stmt.value, ast.Constant)
            and stmt.value.value is Ellipsis
        ):
            continue
        return False
    return True


def _swallowing_handlers(path: Path) -> list[tuple[str, int, list[str]]]:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    offenders: list[tuple[str, int, list[str]]] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ExceptHandler) and _is_only_pass(node.body):
            names = _exc_names(node)
            if not all(name in ALLOWED_BARE_PASS for name in names):
                offenders.append((path.name, node.lineno, names))
    return offenders


@pytest.mark.parametrize("path", GUARDED_FILES, ids=lambda p: p.name)
def test_no_error_swallowing_except_pass(path: Path):
    """BUG-010: error handlers must log, not silently swallow, exceptions."""
    assert path.exists(), f"guarded file is missing: {path}"
    offenders = _swallowing_handlers(path)
    assert not offenders, (
        "Found error-swallowing `except ...: pass` handler(s) (BUG-010 regression) "
        f"at {offenders}. Log the exception instead of swallowing it."
    )

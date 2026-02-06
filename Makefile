.PHONY: test test-backend test-frontend test-file test-lint help

# Run all tests
test: test-backend test-frontend
	@echo "\n✅ All tests passed"

# Backend tests (pytest)
test-backend:
	@echo "🔧 Running backend tests..."
	@cd backend && source venv/bin/activate && python -m pytest -v

# Frontend unit tests (vitest)
test-frontend:
	@echo "🔧 Running frontend tests..."
	@cd frontend && npm run test -- --run

# Run a specific test file
# Usage: make test-file FILE=backend/tests/test_auth.py
#        make test-file FILE=frontend/src/__tests__/components/button.test.tsx
test-file:
ifndef FILE
	$(error Usage: make test-file FILE=path/to/test_file.py)
endif
	@if echo "$(FILE)" | grep -q "^backend/"; then \
		cd backend && source venv/bin/activate && python -m pytest $(FILE:backend/%=%) -v; \
	elif echo "$(FILE)" | grep -q "^frontend/"; then \
		cd frontend && npm run test -- --run $(FILE:frontend/%=%); \
	else \
		echo "Error: FILE must start with backend/ or frontend/"; exit 1; \
	fi

# Lint frontend
test-lint:
	@echo "🔧 Running lint..."
	@cd frontend && npm run lint

# E2E tests (playwright, requires running servers)
test-e2e:
	@echo "🔧 Running E2E tests..."
	@cd frontend && npm run e2e:chromium

help:
	@echo "Available commands:"
	@echo "  make test            Run all backend + frontend tests"
	@echo "  make test-backend    Run backend tests (pytest)"
	@echo "  make test-frontend   Run frontend unit tests (vitest)"
	@echo "  make test-file FILE= Run a specific test file"
	@echo "  make test-lint       Run frontend ESLint"
	@echo "  make test-e2e        Run E2E tests (Playwright)"
	@echo ""
	@echo "Examples:"
	@echo "  make test-file FILE=backend/tests/test_auth.py"
	@echo "  make test-file FILE=frontend/src/__tests__/components/button.test.tsx"

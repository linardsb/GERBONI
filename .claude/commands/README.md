# GERBONI Slash Commands

11 commands organized into 4 workflows. Run any command with `/command-name` in Claude Code.

---

## Command Reference

### `/prime` — Load Session Context

**Solves**: Starting a new session without knowing what's going on — what branch you're on, what tasks are active, what was worked on recently.

**Usage**: `/prime` or `/prime backend` or `/prime frontend`

**What it does**: Reads CLAUDE.md, tasks/todo.md, tasks/bugs.md, runs git status/log, and produces a structured session context summary with branch state, active tasks, open bugs, architecture quick ref, and fragile area alerts.

**When to use**: First command in every session. Sets the stage for everything else.

---

### `/plan-feature` — Design Implementation Plan

**Solves**: Jumping into code without understanding what to build, which files to touch, or what might break.

**Usage**: `/plan-feature add wishlist sharing via URL`

**What it does**: Researches the codebase for related code, checks all 6 fragile areas for overlap, designs backend + frontend + testing steps, and writes a plan to `tasks/plans/<feature-name>.md`.

**When to use**: Before building anything non-trivial. The plan becomes the input for `/execute`.

---

### `/scaffold` — Generate Resource Boilerplate

**Solves**: Writing the same model/schema/service/route/test boilerplate from scratch every time you add a new resource.

**Usage**: `/scaffold coupon` or `/scaffold review backend` or `/scaffold address fullstack`

**What it does**: Generates all files for a new resource following GERBONI patterns — model, schemas (Create/Read/Update), service (static methods, flush), routes (thin handlers, commit), test skeleton, frontend page, API client types, and i18n namespace. Files contain `# TODO` markers for resource-specific logic.

**When to use**: When adding a new domain entity. Gives you the skeleton; you fill in the specifics.

---

### `/execute` — Implement from a Plan

**Solves**: Losing track of what's been done and what's left when implementing a multi-step feature.

**Usage**: `/execute tasks/plans/wishlist-sharing.md`

**What it does**: Reads a plan document, executes each step in order (backend → frontend → tests), marks steps complete as it goes, runs lint/type checks between steps, runs full test suites at the end, and updates the plan status to "Implemented".

**When to use**: After `/plan-feature` produces a plan. This is the execution engine.

---

### `/validate` — Pre-Commit Quality Gates

**Solves**: Pushing code that breaks CI — lint errors, failing tests, coverage drops, i18n drift, build failures.

**Usage**: `/validate` (quick mode) or `/validate full`

**What it does**:
- **Quick** (~30s): Lint + type check + tests for changed files only
- **Full** (~3min): All test suites + build + coverage thresholds (backend >=60%, frontend >=80%) + i18n parity check + git status review

**When to use**: Before every commit. Quick mode for iteration, full mode before pushing.

---

### `/review-code` — 14-Category Code Review

**Solves**: Missing security vulnerabilities, architecture violations, design system drift, or test gaps during development.

**Usage**: `/review-code`

**What it does**: Reviews code across 14 categories — security/auth, three-layer architecture, database patterns, type safety, order state machine, i18n, design system, accessibility, frontend patterns, testing, AI agent, API contracts, performance/caching, Docker/production. Produces a prioritized issue list (Critical/High/Medium/Low) with risk assessment.

**When to use**: After implementing changes and before committing. Catches issues that tests alone won't find.

---

### `/rca` — Root Cause Analysis for GitHub Issues

**Solves**: Fixing bugs without understanding why they happened, leading to incomplete fixes and repeat failures.

**Usage**: `/rca 42` (where 42 is the GitHub issue number)

**What it does**: Fetches the GitHub issue, traces the symptom through the three-layer architecture, searches recent commits for introduction point, checks fragile area overlap, searches past bugs for patterns, designs a fix strategy with regression test spec, and writes an RCA document to `docs/rca/issue-42.md`.

**When to use**: When a bug is reported as a GitHub issue. Produces the investigation document that `/implement-fix` consumes.

---

### `/implement-fix` — Test-First Bug Fix from RCA

**Solves**: Fixing bugs without regression tests, or implementing fixes that don't actually address the root cause.

**Usage**: `/implement-fix 42` (where 42 is the GitHub issue number)

**What it does**: Reads the RCA document, writes the regression test FIRST (verifies it fails), implements the fix from the RCA's strategy, verifies the test passes, runs full test suite, updates tasks/bugs.md, and suggests a commit message with `Fixes #42`.

**When to use**: After `/rca` produces an RCA document. Requires the RCA to exist — if missing, it tells you to run `/rca` first.

---

### `/audit-i18n` — Translation Parity Audit

**Solves**: en.json and lv.json drifting out of sync — missing keys, empty values, mismatched ICU variables.

**Usage**: `/audit-i18n`

**What it does**: Runs 5 checks — key parity between en.json/lv.json, namespace usage vs. actual `useTranslations()` calls in code, remaining hardcoded strings, empty/placeholder values, and ICU variable consistency. Reports issues with specific key names.

**When to use**: After adding new UI text, before committing frontend changes, or as a periodic health check.

---

### `/create-tool` — Create Agent Tool or Reference Doc

**Solves**: Extending the AI support agent with new capabilities, or eliminating repetitive MCP/context7 calls by creating local reference docs.

**Usage**: `/create-tool agent tool for delivery time estimates` or `/create-tool Zustand patterns cheat sheet`

**What it does**: Auto-detects the tool type from keywords, then either:
- **Type 1 (Agent Tool)**: Creates a Pydantic AI tool function in `support_agent.py` with the 7-section docstring standard, auth checks, service delegation, system prompt update, and tests
- **Type 2 (Reference Doc)**: Creates a reference guide in `reference/` under 200 lines, following the established format with GERBONI-specific examples

**When to use**: When the support agent needs a new capability, or when you're repeatedly looking up the same library/pattern info.

---

### `/scaffold` — Generate Resource Boilerplate

(See above — already documented)

---

## Workflow Chains

Commands are designed to be combined into workflows. Each chain follows a deliberate progression — context loading, planning, execution, and verification. You can skip steps when the situation is simple, but the full chain catches issues that shortcuts miss.

### Chain 1: Build a New Feature

**Purpose**: Take a feature from idea to verified implementation without missing architectural patterns, fragile areas, or test coverage.

**Scenario**: "Add wishlist sharing via URL", "Add product comparison page", "Add order status email notifications"

```
/prime                              → Load session context (branch, tasks, recent work)
/plan-feature <description>         → Research codebase, check fragile areas, write step-by-step plan
/execute tasks/plans/<name>.md      → Implement each step, mark progress, run tests between steps
/review-code                        → 14-category review catches security, architecture, i18n gaps
/validate full                      → Full test suites + build + coverage thresholds + i18n parity
```

**Why this order**: `/plan-feature` researches existing code so you don't duplicate patterns. `/execute` follows the plan systematically so nothing gets skipped. `/review-code` catches what tests can't (architecture violations, missing auth, design system drift). `/validate full` is the final gate before commit.

**Shortcut**: For small features (single file, obvious approach), skip `/plan-feature` and go straight to implementation + `/validate quick`.

---

### Chain 2: Fix a Bug from GitHub Issue

**Purpose**: Fix bugs with full root cause understanding and regression tests, so the same bug never comes back.

**Scenario**: "Users report 500 error on checkout", "Guest users can't see their orders", "Refund button does nothing"

```
/prime                              → Load context, check if this bug relates to recent changes
/rca <issue-number>                 → Fetch issue, trace through code layers, find root cause, write RCA doc
/implement-fix <issue-number>       → Write regression test FIRST (must fail), then fix, then verify test passes
/review-code                        → Verify fix doesn't introduce new issues
/validate quick                     → Quick pre-commit check
```

**Why this order**: `/rca` prevents fixing symptoms instead of causes — it traces the bug through route → service → model and checks for blast radius. `/implement-fix` enforces test-first: the regression test proves the bug exists before you fix it, and proves it's gone after. The RCA document in `docs/rca/` becomes permanent knowledge.

**Shortcut**: For obvious bugs (typo, off-by-one, missing import), skip `/rca` and fix directly with a regression test + `/validate quick`.

---

### Chain 3: Add a New Resource (CRUD Entity)

**Purpose**: Generate consistent boilerplate for a new domain entity so all files follow GERBONI patterns from the start.

**Scenario**: "Add product reviews", "Add shipping addresses", "Add gift cards"

```
/prime                              → Load context, check for similar existing resources to reference
/scaffold <resource-name>           → Generate model, schemas, service, routes, tests, frontend page, i18n
/execute                            → Fill in the TODO markers with resource-specific fields and logic
/validate full                      → Run all quality gates on the new resource
```

**Why this order**: `/scaffold` generates 7+ files that all follow GERBONI conventions (three-layer architecture, dual auth, design tokens, i18n). You fill in the resource-specific parts instead of recreating the patterns from memory. The generated tests give you a skeleton to expand.

**When to use this vs `/plan-feature`**: Use `/scaffold` when the resource is standard CRUD (model + API + page). Use `/plan-feature` when the feature has complex business logic, state machines, or cross-cutting concerns.

---

### Chain 4: Extend AI Agent Capabilities

**Purpose**: Add new tools to the Pydantic AI support agent with proper docstrings that guide tool selection, or create reference docs that eliminate repetitive lookups.

**Scenario**: "Agent should estimate delivery times", "Agent should recommend products based on purchase history", "Create a Zustand patterns reference to stop looking it up"

```
/prime backend                      → Load backend context (agent tools, services, models)
/create-tool <tool description>     → Auto-detect type, create tool with 7-section docstring or reference doc
/validate quick                     → Run agent tests (Type 1) or verify reference loads (Type 2)
```

**Why this order**: `/create-tool` reads `reference/adding_tools_guide.md` which contains the 7-section docstring standard, anti-patterns, and GERBONI conventions. For agent tools, it checks existing tools for consolidation opportunities before creating new ones. For reference docs, it follows the established format from other guides.

**Two outcomes**: Type 1 produces a Python function in `support_agent.py` with tests. Type 2 produces a markdown reference in `reference/` that replaces MCP calls.

---

### Chain 5: Pre-Commit Quality Check

**Purpose**: Catch issues before they reach CI — security holes, architecture violations, missing translations, failing tests, coverage drops.

**Scenario**: After any code changes, before running `git commit`.

```
/review-code                        → 14-category code review (security, auth, architecture, i18n, design system)
/audit-i18n                         → Check en.json/lv.json parity (only if UI text was changed)
/validate full                      → Tests + build + coverage + i18n in one pass
```

**Why all three**: `/review-code` catches things tests don't (using `get_current_user` instead of `require_auth`, missing `data-slot`, hardcoded colors). `/audit-i18n` catches translation drift that only shows up in the other locale. `/validate full` catches runtime failures (build errors, import issues, coverage regression).

**Minimum viable check**: `/validate quick` — runs lint + type check + tests for changed files only (~30 seconds). Use this during iteration. Use the full chain before pushing.

---

### Chain 6: Periodic Health Check

**Purpose**: Verify overall project health — no drift in translations, no broken tests from dependency updates, no stale tasks.

**Scenario**: Start of the week, before a release, after pulling changes from others, or when something feels off.

```
/prime                              → See branch state, active tasks, open bugs, fragile area alerts
/audit-i18n                         → Verify 857 en/lv keys still in sync, no empty values, no ICU mismatches
/validate full                      → Full suite: backend 497 tests, frontend 382 tests, build, coverage
```

**Why periodically**: Dependencies update silently (pydantic-ai API renames broke 30 tests — BUG-013). Translation files drift when PRs add keys to one language but not the other. Test fixtures can break when models change. Running the full check catches issues before they compound.

---

## Quick Reference

| Command | Input | Produces | Speed |
|---------|-------|----------|-------|
| `/prime` | scope (optional) | Session context summary | ~10s |
| `/plan-feature` | feature description | Plan in `tasks/plans/` | ~2min |
| `/scaffold` | resource name | Boilerplate files with TODOs | ~1min |
| `/execute` | path to plan | Implemented code + test results | ~5-15min |
| `/validate` | `quick` or `full` | Pass/fail report with issues | 30s-3min |
| `/review-code` | (reads changed files) | Prioritized issue list | ~2min |
| `/rca` | GitHub issue number | RCA document in `docs/rca/` | ~3min |
| `/implement-fix` | GitHub issue number | Fix + regression test + updated bugs.md | ~5-10min |
| `/audit-i18n` | (none) | i18n parity report | ~15s |
| `/create-tool` | tool description | Agent tool or reference doc | ~5min |

---

## Decision Guide: Which Command Do I Need?

| I want to... | Use |
|--------------|-----|
| Start a new coding session | `/prime` |
| Build a new feature | `/plan-feature` → `/execute` |
| Add a new database table / API resource | `/scaffold` |
| Fix a reported bug | `/rca` → `/implement-fix` |
| Check my code before committing | `/validate quick` |
| Do a thorough pre-push check | `/review-code` + `/validate full` |
| Check if translations are complete | `/audit-i18n` |
| Add a tool to the AI support agent | `/create-tool` |
| Create a reference doc to avoid repeated lookups | `/create-tool` |
| Understand what's in the backlog | `/prime` (shows tasks/todo.md) |

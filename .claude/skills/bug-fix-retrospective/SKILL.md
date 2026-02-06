---
name: bug-fix-retrospective
description: |
  Automated bug documentation and learning extraction after every bug fix.
  Use when: (1) A bug has just been fixed, (2) User says /bug-fix-retrospective,
  (3) Claude detects a bug was resolved during the session.
  Creates: structured bug report in tasks/bugs.md, GitHub Issue via gh CLI,
  regression test suggestion, Known Fragile Areas update check.
author: Claude Code
version: 1.0.0
date: 2026-02-06
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# Bug Fix Retrospective Skill

You are a bug documentation and learning system. After every bug fix, you capture the root cause, create tracking records, suggest regression tests, and evaluate whether the project's defensive documentation needs updating.

## Trigger Conditions

Activate this skill when:
1. User explicitly says `/bug-fix-retrospective`
2. A bug fix was just completed in the current session
3. A test was written to fix a failing case

## Workflow

### Step 1: Gather Context

Read the current `tasks/bugs.md` to determine the next BUG-XXX number:
```bash
# Find the highest existing BUG number
grep -oP 'BUG-\K\d+' tasks/bugs.md | sort -n | tail -1
```

Collect from the current session:
- **What broke?** (symptoms, error messages, user report)
- **Root cause** (the actual code defect)
- **Fix applied** (files changed, approach taken)
- **Component** (Backend / Frontend / Infrastructure / i18n / etc.)
- **Severity** (Critical / High / Medium / Low)

### Step 2: Create Bug Report in tasks/bugs.md

Add a new entry under "## Recently Fixed" using the enhanced template:

```markdown
### BUG-XXX: [Short Description]
**Status:** CLOSED
**Severity:** [Critical | High | Medium | Low]
**Reported:** [today's date]
**Fixed:** [today's date]
**Component:** [area]
**GitHub Issue:** [will be filled after Step 3]

**Description:**
[Clear description of what was broken]

**Root Cause:**
[Technical explanation of why it broke]

**Fix:**
[What was changed and why]

**Related Files:**
- [list of modified files]

**Regression Test:** `[test file]` → `[test name]`

**Learning Outcomes:**
- **Fragile Area?** [Yes/No — if Yes, specify which area in CLAUDE.md to update]
- **Pattern?** [Describe the bug class for future prevention]
- **Prevention Strategy:** [What would have caught this earlier?]

**Related Bugs:** [list any similar past bugs]
```

### Step 3: Create GitHub Issue

```bash
gh issue create \
  --title "BUG-XXX: [Short Description]" \
  --label "bug" \
  --label "severity:[level]" \
  --body "$(cat <<'EOF'
## Bug Report

**Component:** [area]
**Severity:** [level]
**Status:** Fixed

### Description
[description]

### Root Cause
[root cause]

### Fix
[fix description]

### Files Changed
- [file list]

### Regression Test
- [ ] `[test file]` → `[test name]`

### Learning Outcomes
- **Fragile Area:** [yes/no]
- **Pattern:** [description]
- **Prevention:** [strategy]

---
Local tracking: `tasks/bugs.md` → BUG-XXX
EOF
)"
```

Update the `tasks/bugs.md` entry with the GitHub Issue URL.

### Step 4: Write Regression Test (MANDATORY)

**A bug CANNOT be marked CLOSED without a regression test.** This is non-negotiable.

The regression test must:
1. Reproduce the exact condition that caused the bug
2. Fail on the buggy code (verify by reasoning about the old code path)
3. Pass on the fixed code
4. Be committed alongside the fix

**Step 4A: Verify the test exists**
```bash
# Check if a regression test was already written for this bug
grep -r "BUG-XXX\|bug.xxx\|bug_xxx" backend/tests/ frontend/src/__tests__/ 2>/dev/null
```

If no test exists, write one immediately:

**For backend bugs:**
```python
# File: backend/tests/test_[module].py

async def test_bug_xxx_[short_description](client, db_session, ...):
    """Regression test for BUG-XXX: [description].

    Verifies that [the specific condition] no longer causes [the bug].
    """
    # Setup: Create the conditions that triggered the bug
    ...

    # Act: Perform the action that used to fail
    response = await client.[method]("/api/...")

    # Assert: Verify correct behavior
    assert response.status_code == [expected]
    ...
```

**For frontend bugs:**
```tsx
// File: frontend/src/__tests__/[path].test.tsx

it("should [correct behavior] when [condition] (BUG-XXX)", () => {
  // Setup: Create conditions that triggered the bug
  render(<Component {...buggyProps} />)

  // Act: Perform the action that used to fail
  fireEvent.click(screen.getByRole("button"))

  // Assert: Verify correct behavior
  expect(screen.getByText("expected")).toBeInTheDocument()
})
```

**Step 4B: Run the test**
```bash
# Backend
cd backend && pytest tests/test_[module].py::test_bug_xxx -v

# Frontend
cd frontend && npm run test -- [test-file]
```

If the test does not pass, the bug is NOT fixed. Go back and fix the code.

### Step 5: Check Known Fragile Areas

Review `CLAUDE.md` "Known Fragile Areas" section. If this bug reveals a new fragile area or pattern not already documented:

1. Add a new numbered entry to the list
2. Include: what can break, why it's fragile, what to watch for

### Step 6: Evaluate Skill Potential

Ask: "Is this bug class common enough to warrant a reusable Claude Code skill?"

Criteria for creating a new skill:
- Bug pattern has occurred 2+ times (check Related Bugs)
- Fix requires specialized knowledge not obvious from code
- Prevention could be automated via a validation script

If yes, suggest creating a skill via the continuous-learning framework.

### Step 7: Create Bug Fix Documentation

Create a detailed writeup at `docs/bug-fixes/BUG-XXX-[slug].md` with:

```markdown
# BUG-XXX: [Short Description]

**Status:** CLOSED
**Severity:** [level]
**Component:** [area]
**Fixed:** [date]
**Regression Test:** `[test file]` → `[test name]`

## What Broke
[User-visible symptoms]

## Root Cause
[Technical explanation with code references]

## Fix
[What was changed and why, with file paths and line numbers]

## Prevention
[What would have caught this earlier — tests, linting rules, runbooks]

## Related
- [links to related bugs, runbooks, fragile areas]
```

Update `docs/bug-fixes/README.md` to include the new entry in the index.

## Output Format

After completing the workflow, output a summary:

```
## Bug Fix Retrospective: BUG-XXX

**Bug:** [one-line description]
**Root Cause:** [one-line]
**Severity:** [level]
**GitHub Issue:** #[number]

### Actions Taken
- [x] Bug documented in tasks/bugs.md
- [x] GitHub Issue created
- [x] Regression test written and passing: `[file]` → `[test name]`
- [x] Bug fix writeup created: `docs/bug-fixes/BUG-XXX-[slug].md`
- [x/n/a] Known Fragile Areas updated

### Prevention
[One sentence on what would prevent this class of bug in the future]
```

# Project Global Rules Guide

> How to write and maintain CLAUDE.md for the GERBONI project. Load this guide when creating or updating project-level rules, adding new Known Fragile Areas, or restructuring project instructions.

## Overall Pattern

```
CLAUDE.md (root, <150 lines)         ← Loaded EVERY session — universally applicable only
├── .claude/skills/*/SKILL.md        ← On-demand per task type (backend, frontend, bug-fix)
├── .claude/rules/*.md               ← Auto-loaded, can be path-scoped via frontmatter
├── tasks/CLAUDE.md                  ← Sprint status — read when checking project state
├── reference/*.md                   ← On-demand guides for specific task types
└── CLAUDE.local.md                  ← Personal overrides (gitignored)
```

Root CLAUDE.md is the highest-leverage config point — every token compounds downstream. Keep it short, specific, and pruned. Domain knowledge lives in skills/rules loaded on demand.

## Step 1: Decide Where a Rule Belongs

| Rule applies to... | Location | Loaded |
|---------------------|----------|--------|
| Every session, every task | `CLAUDE.md` (root) | Always |
| Only backend code changes | `.claude/skills/gerboni-backend/SKILL.md` | On demand |
| Only frontend code changes | `.claude/skills/gerboni-frontend-design/SKILL.md` | On demand |
| Only bug fix workflow | `.claude/skills/bug-fix-retrospective/SKILL.md` | On demand |
| Specific file paths only | `.claude/rules/{topic}.md` with `paths:` frontmatter | Auto |
| Just you, not team | `CLAUDE.local.md` or `~/.claude/CLAUDE.md` | Always (user) |
| Occasional reference | `reference/{task_type}_guide.md` | Never (manual) |

**Litmus test:** If removing a line from root CLAUDE.md would NOT cause mistakes in >50% of sessions, move it elsewhere.

## Step 2: Write Rules That Actually Work

```markdown
# BAD — vague, unactionable
- Format code properly
- Write good tests

# GOOD — specific, actionable
- Use `require_auth()` from `deps.py` for endpoints needing user identity
- Services use `flush()` not `commit()` — API layer calls `await db.commit()`
```

```markdown
# BAD — pure negative constraint
- Never use datetime.utcnow()

# GOOD — constraint + alternative
- Use `datetime.now(timezone.utc)` instead of `datetime.utcnow()` (deprecated in 3.12)
```

```markdown
# BAD — stale data that rots
- 358 test cases across 21 test files

# GOOD — stable reference
- Run `pytest --cov=app -v` for full backend suite with coverage
```

**Rules for rules:**
- One instruction per bullet, command in backticks
- Use **MUST** / **IMPORTANT** for critical rules only (overuse dilutes impact)
- Reference files as `path/file.ext` — never copy code snippets (they go stale)
- Never include info Claude can discover from code (API routes, env vars, schema)

## Step 3: Follow the Root CLAUDE.md Structure

```markdown
# CLAUDE.md

## Project Overview          ← 1-2 sentences. What is this project?
## Development Skills        ← Which SKILL.md to read before which changes
## Development Commands      ← Docker, backend, frontend commands (can't be guessed)
## Architecture              ← ONLY non-obvious patterns (dual auth, flush/commit)
## Testing                   ← Commands + key fixtures. No hardcoded counts.
## Key File Locations        ← Table of non-discoverable paths only
## Known Fragile Areas       ← Hard-won knowledge. Numbered, defensive patterns.
## Post-Fix Verification     ← Bug fix workflow steps
```

**Target:** <150 lines. Current: ~130 lines after 2026-02-09 revision.

## Step 4: Maintain Known Fragile Areas

This is the highest-value section. Update it when:
- A bug fix reveals a new fragile pattern → add numbered entry
- An existing area gets better coverage → update description
- A fragile area is resolved (refactored away) → remove it

Each entry format:
```markdown
N. **Short Name** — What breaks, why it's fragile, and the defensive pattern to follow.
```

## Step 5: Validate After Changes

```bash
# Line count (target: <150)
wc -l CLAUDE.md

# Check all referenced files exist
grep -oE '`[^`]*\.(py|ts|tsx|md|json|css)`' CLAUDE.md | tr -d '`' | sort -u | \
  while read f; do [ ! -e "$f" ] && echo "STALE: $f"; done

# Verify skills are referenced correctly
ls .claude/skills/*/SKILL.md
```

**Maintenance cadence:**
- After any bug fix: check Known Fragile Areas
- After Claude correction: add lesson if universally applicable
- Monthly: for each line, ask "Would removing this cause mistakes?" — if no, cut it
- Watch for signals: Claude ignoring rules (file too long) or asking answered questions (phrasing ambiguous)

## Quick Checklist

- [ ] Rule belongs in root CLAUDE.md (applies to >50% of sessions)
- [ ] Rule is specific and actionable (not vague advice)
- [ ] Constraints include alternatives (not just "don't do X")
- [ ] Critical rules use MUST/IMPORTANT emphasis sparingly
- [ ] No hardcoded counts or frequently-changing data
- [ ] No content duplicated from skill files
- [ ] No discoverable info (API routes, env vars, schema, file contents)
- [ ] No code snippets (use file references instead)
- [ ] Root file is under 150 lines
- [ ] All file references point to existing paths
- [ ] Known Fragile Areas updated if needed
- [ ] Changes committed to git

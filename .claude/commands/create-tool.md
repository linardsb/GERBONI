---
description: Create a new tool (backend agent tool or Claude Code reference tool)
argument-hint: <tool-description>
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(pytest:*), Bash(ruff:*), Bash(wc:*)
---

## Context (INPUT)

You are creating a new tool to extend GERBONI's AI capabilities.

Tool description: `$ARGUMENTS`

Read the comprehensive guide first — it contains templates, conventions, and examples:

- `reference/adding_tools_guide.md` — tool types, docstring standards, checklists
- `CLAUDE.md` — architecture rules and known fragile areas

## Process (PROCESS)

### Step 1: Determine Tool Type

Parse `$ARGUMENTS` against the decision matrix from the guide:

| Signal | Type |
|--------|------|
| "agent", "customer", "support", "chat", "bot" | **Type 1**: Backend Agent Tool |
| "reference", "cheat sheet", "pattern", "guide", library name | **Type 2**: Claude Code Reference Tool |
| Ambiguous | Ask user: "Backend agent tool or Claude Code reference doc?" |

### Step 2A: Backend Agent Tool (if Type 1)

1. Read `backend/app/agent/support_agent.py` for existing tool patterns
2. Check existing tools for consolidation — can an existing tool be extended with a parameter?
3. Determine: tool name, parameters, which service to delegate to
4. Write the function inside `_register_tools()` with all 7 docstring sections:
   - One-line summary
   - "Use this when" (3-5 bullets with example phrases)
   - "Do NOT use this for" (with redirects to correct tool)
   - Args (with WHY guidance for each parameter)
   - Returns (format and error behavior)
   - Performance (query count, token estimate)
   - Examples (realistic customer phrases mapped to calls)
5. Add auth check pattern: `user_id` -> `guest_email` -> error string
6. For mutations: delegate to service layer + `await db.commit()`
7. Update the system prompt `TOOL USAGE GUIDELINES` section
8. Write test in `tests/test_websocket_agent.py` using `agent._function_tools["name"]`
9. Run: `cd backend && pytest tests/test_websocket_agent.py -v`

### Step 2B: Claude Code Reference Tool (if Type 2)

1. Read existing reference guides for format: `reference/backend_architecture_guide.md`
2. Research the topic — read relevant codebase files, identify patterns to document
3. Write the reference at `reference/<descriptive-name>.md` following the template:
   - One-line purpose after heading
   - GERBONI-specific code examples (real paths, real models)
   - Under 200 lines
   - Quick Checklist at end
4. Verify: load via `@reference/<name>.md` and confirm it answers target questions
5. Check if it should be added to CLAUDE.md Key File Locations table

### Step 3: Validate

- **Type 1**: Run `cd backend && pytest tests/test_websocket_agent.py -v` — all tests pass
- **Type 2**: Verify file exists, is under 200 lines, and follows the reference template

## Output Format (OUTPUT)

### For Type 1 (Backend Agent Tool)

```
## Tool Created: <tool_name>

**File modified**: backend/app/agent/support_agent.py
**Tool function**: <tool_name>(ctx, <params>)
**Docstring sections**: 7/7
**Auth check**: Yes
**Service delegation**: <service_class>.<method>
**System prompt updated**: Yes — added guideline #<N>

### Test Results
<pytest output summary>

### When the agent will use this tool
- <customer phrase> -> <tool_name>(params)
- <customer phrase> -> <tool_name>(params)
```

### For Type 2 (Claude Code Reference Tool)

```
## Reference Created: <name>

**File created**: reference/<name>.md
**Lines**: <count>/200 max
**Replaces**: <what MCP calls or grep sessions this eliminates>

### What it covers
- <topic 1>
- <topic 2>

### Usage
Load with: @reference/<name>.md
```

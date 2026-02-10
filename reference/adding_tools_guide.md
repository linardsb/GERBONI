# Adding Tools Guide

Use when creating new tools to extend GERBONI's AI capabilities — either backend agent tools (Python functions for `support_agent.py`) or Claude Code reference tools (local docs in `reference/` that replace repetitive MCP calls).

## Tool Type Decision

Parse the request and route to the correct type:

| Signal in description | Tool Type |
|----------------------|-----------|
| "agent", "customer", "support", "chat", "bot" | **Type 1**: Backend Agent Tool |
| "reference", "cheat sheet", "pattern", "guide", library name | **Type 2**: Claude Code Reference Tool |
| Ambiguous (e.g., "product recommendations") | Ask: "Agent tool (support bot can do X) or reference doc (document X patterns)?" |

---

## Type 1: Backend Agent Tools

New Python functions registered on the Pydantic AI agent in `backend/app/agent/support_agent.py`.

### Why Agent Tool Docstrings Are Different

Standard docstrings document **what code does** for human developers. Agent tool docstrings guide **when to use the tool and how** for LLM reasoning. The agent reads every tool's docstring before deciding which one to call — your docstring is the sales pitch.

**Five principles:**

1. **Guide Tool Selection** — Agent must choose this tool over 4+ alternatives based on docstring alone
2. **Prevent Token Waste** — Steer toward efficient parameter choices (concise over detailed)
3. **Enable Composition** — Show how tool fits into multi-step workflows (e.g., "verify with X first, then call this")
4. **Set Expectations** — Explain performance characteristics, query counts, and return format
5. **Provide Examples** — Concrete usage with realistic GERBONI data (Latvian cities, not "foo"/"bar")

### The 7-Section Docstring Standard

Every agent tool MUST include all 7 sections:

```python
@agent.tool
async def tool_name(
    ctx: RunContext[AgentDependencies],
    param: str,
    optional_param: bool = False,
) -> str:
    """
    SECTION 1 — One-line summary of what this tool does.

    SECTION 2 — Use this when:
    - Customer asks "exact phrase they'd say" -> tool_name(param="value")
    - Customer wants to <goal> -> tool_name(param="value")
    - You need to <internal reason>

    SECTION 3 — Do NOT use this for:
    - <thing that sounds similar> (use other_tool instead)
    - <common confusion> (use other_tool instead)

    SECTION 4 — Args:
        param: What this is AND why you'd choose different values.
              Examples: "Riga", "Rīga", "Daugavpils".
              Accepts English or Latvian spellings. Partial matches work.
        optional_param: When True, includes <extra data>.
                       Use when customer asks "do you have X in size M?"
                       Default False for faster response.
        include: Control output detail level and token usage.
              - "summary": Status + total only (~50 tokens, quick checks)
              - "full": All details (~200 tokens, DEFAULT for most queries)
              - "detailed": Full with history (~500+ tokens, use sparingly)

    SECTION 5 — Returns:
    <format description>. If not found, returns error string with
    guidance on what to try next (e.g., "Use get_user_orders to find the correct ID.").

    SECTION 6 — Performance:
    - Summary format: ~50 tokens, 1 DB query
    - Full format: ~200 tokens, 1 DB query with joins
    - Detailed format: ~500+ tokens, 2 DB queries
    - Execution: <50ms typical

    SECTION 7 — Examples:
        # Quick status check
        tool_name(param="Riga", optional_param=False)

        # Customer asks "do you have Daugavpils in size M?"
        tool_name(param="Daugavpils", optional_param=True)

        # Browsing with minimal info
        tool_name(param="Liepaja", include="summary")
    """
```

### Standard vs Agent-Optimized Docstring

Standard (for humans — insufficient for agents):

```python
async def get_product_details(ctx, city_name: str, check_availability: bool = False) -> str:
    """Get product details by city name."""
```

Agent-optimized (from `support_agent.py:496-524`):

```python
async def get_product_details(ctx, city_name: str, check_availability: bool = False) -> str:
    """
    Get comprehensive information about a specific city's t-shirt design.

    Use this when customer asks about:
    - Specific city's coat of arms or design details
    - What sizes/colors are available for a particular city
    - Stock availability before purchase

    Do NOT use for:
    - Browsing multiple products (use search_products instead)
    - Comparing prices across cities (use search_products)

    Args:
        city_name: The city name to look up. Accepts English or Latvian spellings
                  with diacritics. Examples: "Riga", "Rīga", "Daugavpils".
                  Partial matching supported.
        check_availability: If True, includes detailed stock levels per variant.
                           Use when customer asks "do you have X in size M?"
                           Default False for faster response.

    Returns full product details including description, coat of arms info,
    all available colors/sizes, price range, and stock status.
    """
```

The difference: the agent-optimized version tells the LLM *when* to pick this tool, *when not to*, and *why* to choose each parameter value — not just what the parameters are.

### GERBONI Agent Tool Conventions

Every agent tool in `support_agent.py` MUST follow these rules:

1. **First param**: `ctx: RunContext[AgentDependencies]` — provides `user_id`, `guest_email`, `db`
2. **Return type**: Always `str` — the agent communicates via text
3. **Auth check pattern** (copy from existing tools):
   ```python
   if ctx.deps.user_id:
       stmt = stmt.where(Order.user_id == ctx.deps.user_id)
   elif ctx.deps.guest_email:
       stmt = stmt.where(Order.guest_email == ctx.deps.guest_email)
   else:
       return "Unable to verify identity. Ask the customer to log in."
   ```
4. **Delegate to service layer** for mutations — never modify models directly (BUG-005)
5. **`db.commit()` after mutations** — agent tools ARE the boundary (unlike API routes, there's no route handler above)
6. **Cap result lists** — use `.limit(10)` or slice to keep token costs low
7. **Error returns** — return helpful strings with next-step guidance, never raise exceptions

### Tool Consolidation Principle

Before creating a new tool, check if an existing tool can be extended with a parameter. The `get_order_details` tool handles status, items, AND shipping via its `include` parameter — eliminating a separate `get_shipping_info` tool. Fewer tools with clear parameters > many overlapping tools.

### Common Anti-Patterns

**1. Vague affirmative guidance:**

```python
# BAD — too generic, agent doesn't know when to pick this over search_products
"""Use this when you need product information."""

# GOOD — specific triggers the agent can match against
"""Use this when customer asks about:
- Specific city's coat of arms or design details
- What sizes/colors are available for a particular city
- Stock availability before purchase"""
```

**2. Missing negative guidance:**

```python
# BAD — no "Do NOT use" section. Agent calls this for browsing too.
"""Get product details for a city."""

# GOOD — redirects agent to the correct tool
"""Do NOT use for:
- Browsing multiple products (use search_products instead)
- Comparing prices across cities (use search_products)"""
```

**3. Toy examples:**

```python
# BAD — unrealistic, doesn't help agent understand real usage
"""Examples: tool("test"), tool("foo", detailed=True)"""

# GOOD — realistic GERBONI data the agent will actually encounter
"""Examples:
    # Customer asks about Riga shirts
    get_product_details(city_name="Rīga", check_availability=False)
    # Customer wants to know if Daugavpils is in stock in size M
    get_product_details(city_name="Daugavpils", check_availability=True)"""
```

**4. No performance info:**

```python
# BAD — agent has no idea about token cost
"""Returns: String with product details."""

# GOOD — agent can optimize for efficiency
"""Performance:
    - Default: ~200 tokens, 1 DB query with selectinload
    - With check_availability: ~350 tokens, 1 DB query
    - Always prefer default unless customer specifically asks about stock"""
```

### Think Like an Agent: Writing Checklist

When writing a tool docstring, ask yourself these 6 questions:

1. **Tool Selection**: "Given 5 tools, how will the agent know THIS is the right one?" → Write specific "Use this when" scenarios
2. **Parameter Choices**: "How will the agent know which `include` value to use?" → Explain token costs and use cases per option
3. **Error Prevention**: "What mistakes will the agent make without guidance?" → Add "Do NOT use" with redirects
4. **Token Efficiency**: "How can I help the agent minimize response size?" → Document token costs, recommend defaults
5. **Composition**: "How does this fit into multi-step workflows?" → Show sequences: "verify with X first, then call this"
6. **Edge Cases**: "What happens with empty results or invalid IDs?" → Document error returns with next-step guidance

### Worked Example: `estimate_delivery_time`

```python
@agent.tool
async def estimate_delivery_time(
    ctx: RunContext[AgentDependencies],
    order_id: int | None = None,
    destination_country: str | None = None,
) -> str:
    """
    Estimate delivery time for an order or hypothetical shipment.

    Use this when:
    - Customer asks "when will my order arrive?" -> estimate_delivery_time(order_id=1234)
    - Customer asks "how long does shipping to Germany take?" -> estimate_delivery_time(destination_country="Germany")
    - Customer comparing shipping options before purchase

    Do NOT use this for:
    - Checking current shipping STATUS of an existing order (use get_order_details with include="shipping")
    - Tracking number lookups (use get_order_details with include="shipping")

    Args:
        order_id: If provided, estimates delivery for this specific order based on its
                 current status and shipping address. The order must belong to the
                 authenticated customer.
        destination_country: If provided without order_id, gives general shipping estimates.
                           Examples: "Latvia", "Germany", "United Kingdom".
                           Use this for pre-purchase inquiries.

    Returns estimated delivery window in business days with any relevant caveats
    (customs, holidays, etc). For existing orders, includes status-aware estimates.

    Performance:
    - General estimate (no order_id): 0 DB queries, ~30 tokens response
    - Order-specific: 1 DB query, ~50 tokens response
    - Execution: <20ms general, <50ms order-specific

    Examples:
        # "When will my order arrive?"
        estimate_delivery_time(order_id=1234)
        # "How long does shipping to Germany take?"
        estimate_delivery_time(destination_country="Germany")
        # "What's shipping like to Latvia?"
        estimate_delivery_time(destination_country="Latvia")
    """
    # General estimate (no order needed)
    if not order_id and destination_country:
        country = destination_country.lower()
        if country in ["latvia", "lv", "latvija"]:
            return "Shipping to Latvia: 2-4 business days. Express available for 1-2 days (+EUR12)."
        elif country in ["uk", "united kingdom", "great britain"]:
            return "Shipping to UK: 7-14 business days. Customs fees may apply."
        else:
            return f"Shipping to {destination_country}: 5-10 business days (EU), 10-21 days (non-EU)."

    # Order-specific estimate
    if not order_id:
        return "Please provide an order ID or destination country for delivery estimates."

    db = ctx.deps.db
    stmt = select(Order).where(Order.id == order_id)
    if ctx.deps.user_id:
        stmt = stmt.where(Order.user_id == ctx.deps.user_id)
    elif ctx.deps.guest_email:
        stmt = stmt.where(Order.guest_email == ctx.deps.guest_email)
    else:
        return "Cannot look up order: customer not authenticated."

    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        return f"Order #{order_id} not found. Use get_user_orders to find the correct ID."

    # Status-aware estimate
    estimates = {
        "paid": "1-2 days to ship, then 2-4 days delivery (Latvia) or 5-10 days (EU)",
        "processing": "Shipping soon. 2-4 days delivery (Latvia) or 5-10 days (EU)",
        "shipped": "In transit. 1-3 days remaining (Latvia) or 3-7 days (EU)",
        "delivered": "Already delivered!",
    }
    return f"Order #{order_id} ({order.status}): {estimates.get(order.status, 'Contact support for details.')}"
```

### Adding a New Agent Tool — Checklist

- [ ] Function defined with `@agent.tool` decorator inside `_register_tools()`
- [ ] All 7 docstring sections present (summary, use-when, do-not-use, args, returns, performance, examples)
- [ ] Auth check: `user_id` -> `guest_email` -> error string
- [ ] Mutations delegate to service layer, followed by `await db.commit()`
- [ ] Read-only queries use `selectinload()` for relationships
- [ ] Result lists capped (`.limit(10)` or similar) for token efficiency
- [ ] System prompt `TOOL USAGE GUIDELINES` section updated with when to use the new tool
- [ ] Test added in `tests/test_websocket_agent.py` (access via `agent._function_tools["name"]`)

---

## Type 2: Claude Code Reference Tools

Local markdown documents in `reference/` that Claude Code reads on demand, replacing repetitive MCP calls (context7 lookups, codebase grep sessions, user clarification questions).

### Three Subtypes

| Subtype | Replaces | Example |
|---------|----------|---------|
| **Library Cheat Sheet** | Repeated context7 calls for same API | `stripe_patterns.md` |
| **Project Pattern** | Repeated grep for same auth/error/state pattern | `error_handling_patterns.md` |
| **Decision Tree** | Same "X or Y?" clarification questions | `state_management_decisions.md` |

### When to Create Each

- **Library Cheat Sheet**: You've called context7 3+ times for the same library's API. Capture the answers locally.
- **Project Pattern**: You've grepped the same pattern across sessions (e.g., "how does auth work", "where are domain exceptions"). Write it down once.
- **Decision Tree**: The same architectural question keeps coming up (e.g., "server component or client component?", "Zustand store or local state?"). Document the decision criteria.

### Reference Document Template

Follow the established pattern from `backend_architecture_guide.md`:

```markdown
# <Topic> Reference

Use when <one-line purpose>.

## <Core concept>

<Explanation with code example>

```code
// GERBONI-specific example, not generic
```

## <Next concept>

...

## Quick Checklist

- [ ] <Verification item>
- [ ] <Verification item>
```

### Rules for Reference Documents

1. **One-line purpose** as the first line after the heading
2. **Under 200 lines** — if longer, split into two documents
3. **Code examples are GERBONI-specific** — use real file paths, real model names, real patterns from this codebase
4. **Quick Checklist at the end** — actionable verification items
5. **No enforcement rules** — those belong in `.claude/skills/`. References are informational only.

### Skill vs Reference Decision

| If the content... | Put it in... |
|-------------------|-------------|
| Contains MUST/MUST NOT rules | `.claude/skills/<name>/SKILL.md` |
| Describes how-to, API reference, patterns | `reference/<name>.md` |
| Needs automatic enforcement | Skill (loaded by CLAUDE.md instruction) |
| Loaded on-demand when relevant | Reference (loaded via `@reference/` or command) |

### Creating a Reference Tool — Checklist

- [ ] File placed in `reference/<descriptive-name>.md`
- [ ] One-line purpose statement after heading
- [ ] Under 200 lines
- [ ] All code examples use GERBONI-specific paths, models, patterns
- [ ] Quick Checklist at the end
- [ ] Optionally add to CLAUDE.md Key File Locations table

---

## Testing Your Tool

### Type 1: Backend Agent Tool

Test via `_function_tools` dict in `tests/test_websocket_agent.py`:

```python
class TestEstimateDeliveryTime:
    @pytest.mark.asyncio
    async def test_general_estimate_latvia(self):
        agent = get_support_agent()
        tool_fn = agent._function_tools["estimate_delivery_time"].function

        # Create mock context
        mock_ctx = MockRunContext(deps=AgentDependencies(
            user_id=None, guest_email=None, db=mock_db
        ))
        result = await tool_fn(mock_ctx, destination_country="Latvia")
        assert "2-4 business days" in result

    @pytest.mark.asyncio
    async def test_order_estimate_requires_auth(self):
        agent = get_support_agent()
        tool_fn = agent._function_tools["estimate_delivery_time"].function
        mock_ctx = MockRunContext(deps=AgentDependencies(
            user_id=None, guest_email=None, db=mock_db
        ))
        result = await tool_fn(mock_ctx, order_id=1)
        assert "not authenticated" in result
```

Run: `cd backend && pytest tests/test_websocket_agent.py -v -k "delivery"`

### Type 2: Claude Code Reference Tool

Manual verification:
1. Confirm file exists at `reference/<name>.md`
2. Load it in a session via `@reference/<name>.md`
3. Ask the question it's designed to answer — confirm it provides a complete answer without MCP calls

### Validate Your Docstring (Both Types)

After writing, ask these 3 questions:

1. **Can the agent select the right tool?** — Given 5 tool options and a customer message, does the docstring make it obvious this is (or isn't) the right choice?
2. **Can the agent use parameters efficiently?** — Will it choose `"summary"` over `"detailed"` when appropriate? Does it know when to include optional params?
3. **Does the agent avoid mistakes?** — After reading "Do NOT use", will it redirect to the correct tool? Will it compose tools properly in multi-step workflows?

If the agent consistently makes mistakes, **the docstring needs improvement, not the agent.**

---

## Quick Checklist

- [ ] Tool type identified (Type 1: agent tool or Type 2: reference doc)
- [ ] Checked existing tools for consolidation opportunity (don't duplicate)
- [ ] Appropriate template followed (7-section docstring or reference format)
- [ ] GERBONI conventions applied (auth pattern, service delegation, design tokens)
- [ ] Tests written (Type 1) or manual verification done (Type 2)
- [ ] System prompt updated (Type 1 only) or CLAUDE.md updated (Type 2, optional)

---

**Key Insight:** Even small refinements to tool docstrings can yield dramatic improvements in agent performance. The docstring is the CONTRACT between deterministic tools and non-deterministic agents. Clear contracts produce better tool selection, fewer wasted calls, and more reliable multi-step workflows.

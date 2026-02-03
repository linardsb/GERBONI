# GERBONI PRD

## Executive Summary

**GERBONI** is a niche e-commerce platform selling premium t-shirts featuring the heraldic coats of arms (*ģerboņi*) of Latvia's major cities. The platform differentiates itself through **AI-powered customer support** that handles order inquiries, refunds, and product discovery via natural conversation.

The product addresses a gap in Latvian cultural merchandise—no dedicated online store exists for municipal heraldic apparel. By combining cultural pride with modern e-commerce patterns and conversational AI, GERBONI creates a memorable shopping experience for tourists, expatriates, and local enthusiasts.

**Key Metrics [Illustrative]:**
- **Target launch catalog**: 10 cities × 6 colors × 6 sizes = **360 SKUs**
- **Projected average order value**: €35-45
- **AI agent cost per conversation**: ~€0.003

---

## Mission

Enable customers to discover and purchase authentic Latvian cultural apparel through an intuitive e-commerce experience backed by intelligent, always-available customer support.

**Strategic Alignment:**
- Promote Latvian heritage and municipal identity
- Demonstrate AI agent integration as a competitive advantage in niche retail
- Establish a scalable template for regional merchandise expansion

---

## Target Users

### Primary: Latvian Diaspora
- **Profile**: Latvians living abroad (estimated 370,000+ globally)
- **Motivation**: Cultural connection, gifts for family, nostalgic purchases
- **Behavior**: Higher average order value, international shipping requirements

### Secondary: Tourists & Visitors
- **Profile**: Visitors to Latvia seeking authentic souvenirs
- **Motivation**: Unique, locally-designed merchandise
- **Behavior**: Guest checkout preferred, single-purchase pattern

### Tertiary: Local Residents
- **Profile**: Latvians with strong city/regional pride
- **Motivation**: Local identity, sports events, community representation
- **Behavior**: Repeat customers, multi-city collections

---

## Minimum Viable Product (MVP) Scope

### Included

| Feature | Description |
|---------|-------------|
| **Product Catalog** | 10 major Latvian cities with coat of arms designs |
| **T-Shirt Variants** | 6 colors (Black, White, Navy, Gray, Red, Green) × 6 sizes (XS–XXL) |
| **Shopping Cart** | Persistent cart with session support |
| **Checkout** | Guest checkout + optional account creation |
| **Payment Processing** | Stripe integration (EU card support) |
| **Order Management** | Status tracking, order history |
| **AI Support Agent** | Conversational support via WebSocket chat |
| **Refund Processing** | 14-day automated refund window |

### Excluded from MVP

- **Custom print positioning** — Fixed front-center placement only
- **Non-t-shirt products** — No hoodies, mugs, or accessories
- **Multi-language UI** — English-only interface (agent understands Latvian city names)
- **Mobile native apps** — Web-responsive only
- **Wholesale/B2B ordering** — Consumer direct only
- **Loyalty program** — No points or rewards system

---

## Core Patterns

### 1. Guest-First Commerce
Users can complete purchases **without account creation**. Account conversion is offered post-purchase, preserving order history. This reduces cart abandonment for one-time buyers while enabling repeat customer engagement.

### 2. Conversational Support
The AI agent serves as the **primary support channel**, handling ~80% of common inquiries [Illustrative] without human escalation:
- Order status and tracking
- Refund requests within policy
- Product discovery and recommendations
- Stock availability checks

### 3. Cultural Authenticity
All coat of arms designs are sourced from **Wikimedia Commons** (public domain/CC licensed), ensuring historical accuracy. Product descriptions include heraldic context and city history.

### 4. Token-Efficient AI Design
Agent tools follow **response format patterns** (summary/full/detailed modes) to minimize LLM token consumption while maintaining helpful responses. Tools are consolidated to reduce decision overhead.

### 5. EU-Compliant Operations
- **Stripe** handles PCI compliance and SCA requirements
- GDPR-ready data model with guest session expiration
- 14-day refund window aligned with EU consumer rights

---

## Agent Tools

The AI support agent operates with **5 consolidated tools** following Anthropic's best practices for agent design:

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| **get_order_details** | Unified order status, items, and shipping info | `include`: summary / full / shipping |
| **get_user_orders** | List customer's order history | `status_filter`, `limit` (max 10) |
| **search_products** | Browse catalog by city or color | `city_name`, `color` |
| **get_product_details** | Deep-dive on specific city design | `city_name`, `check_availability` |
| **request_refund** | Process refund within 14-day window | `order_id`, `reason` |

**Design Principles Applied:**
- **Tool consolidation** — Merged order status + shipping into single tool
- **Response format control** — Parameters control verbosity for token efficiency
- **Actionable errors** — All failures return specific remediation guidance
- **Explicit docstrings** — Comprehensive "when to use / when not to use" documentation
- **High-signal context** — Emoji status indicators and structured formatting

---

## Technical Architecture

```
┌────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 15)                    │
│   Product Catalog │ Cart │ Checkout │ Chat Widget (WS)     │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                        │
│   REST API ←→ PostgreSQL    │    Pydantic AI Agent ←→ LLM  │
└────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         PostgreSQL        Stripe        Claude API
         (SQLAlchemy)    (Payments)     (Anthropic)
```

**Key Dependencies:**
- **Backend**: FastAPI, Pydantic AI, SQLAlchemy, Stripe SDK
- **Frontend**: Next.js 15, React 19, Tailwind CSS v4
- **AI**: Anthropic Claude Sonnet (claude-sonnet-4)

---

## Success Criteria

| Metric | Target [Illustrative] |
|--------|----------------------|
| Agent resolution rate | ≥75% without escalation |
| Checkout completion | ≥65% of cart initiations |
| Page load time | <2s (LCP) |
| AI response latency | <3s average |
| Refund automation | 100% within policy window |

---

*Document Version: 1.0*
*Last Updated: 2026-02-01*

# Future Development Research

This document captures technical research and analysis for potential GERBONI platform enhancements. Each section evaluates a technology or feature against the current implementation to guide prioritization decisions.

---

## RAG (Retrieval Augmented Generation) Analysis

**Evaluation Date:** February 2026
**Status:** Not recommended for MVP/Growth phase
**Revisit When:** Content library exceeds 50+ documents or multi-language expansion

### Overview

RAG enables AI agents to retrieve relevant information from large document collections before generating responses. This analysis evaluates whether RAG would improve GERBONI's customer support agent.

### Current Agent Capabilities

The existing support agent handles enquiries through **database tools**:

| Query Type | Current Method | Coverage |
|------------|----------------|----------|
| Order status/tracking | `get_order_details` | Complete |
| Product search | `search_products` | Complete |
| Stock availability | `get_product_details` | Complete |
| Refund processing | `request_refund` | Complete |
| Order history | `get_user_orders` | Complete |

**Static information** is embedded in the system prompt:
- 10 Latvian cities (Rīga, Daugavpils, Jelgava, etc.)
- 6 colors, 6 sizes
- Basic shipping estimates

### RAG Potential Use Cases

| Content Type | RAG Value | Complexity | Alternative Approach |
|--------------|-----------|------------|---------------------|
| Sizing guide (measurements, fit) | Medium | Low | System prompt (~200 tokens) |
| Care instructions | Low | Low | Product description field |
| Returns/shipping policy | Medium | Low | FAQ tool or system prompt |
| Coat of arms history per city | **High** | Medium | Enrich `description_lv` field |
| Latvian culture context | Medium | Medium | Blog content (if added) |
| Payment/checkout help | Low | Low | Stripe handles directly |

### Cost-Benefit Analysis

**Implementation Costs:**

| Component | Monthly Cost | Setup Effort |
|-----------|--------------|--------------|
| Vector database (Pinecone/Qdrant) | $20-50 | 4-8 hours |
| Embedding API (OpenAI/Voyage) | $5-15 | 2-4 hours |
| Document chunking pipeline | $0 | 8-16 hours |
| Retrieval tuning & testing | $0 | 8-16 hours |
| **Total** | **$25-65/month** | **22-44 hours** |

**Performance Impact:**
- Additional latency: 200-500ms per query (embedding + vector search)
- Token overhead: ~500-1500 tokens for retrieved context

**Benefits for GERBONI's Scale:**
- Minimal - 80%+ of queries are database lookups (orders, products)
- Small catalog (360 SKUs) fits entirely in context
- Static content (policies, sizing) fits in system prompt

### Recommendation: Alternative Approaches First

Before implementing RAG, exhaust these simpler solutions:

#### 1. Enhanced System Prompt (Immediate, Zero Cost)

Add structured information directly to the agent's system prompt:

```python
system_prompt = """...existing prompt...

SIZING GUIDE:
| Size | Chest (cm) | Length (cm) | Fit |
|------|------------|-------------|-----|
| XS   | 86         | 66          | Slim |
| S    | 91         | 69          | Standard |
| M    | 97         | 72          | Standard |
| L    | 102        | 74          | Relaxed |
| XL   | 107        | 76          | Relaxed |
| XXL  | 112        | 78          | Relaxed |

SHIPPING POLICY:
- Latvia: 2-4 business days, €3.99 (free over €50)
- EU countries: 5-10 business days, €7.99 (free over €75)
- Express available at checkout for +€12

RETURNS & REFUNDS:
- 14-day return window from delivery
- Items must be unworn with original tags
- Refunds processed within 5-10 business days
- Exchanges available for size/color (subject to stock)

CARE INSTRUCTIONS:
- Machine wash cold (30°C max)
- Do not bleach
- Tumble dry low or hang dry
- Iron on reverse side only
"""
```

**Estimated token cost:** ~300 tokens added to system prompt
**Annual cost impact:** ~€15-30 (negligible)

#### 2. Simple FAQ Tool (Low Effort)

Add a lightweight tool for structured FAQ lookups:

```python
@agent.tool
async def get_faq(
    ctx: RunContext[AgentDependencies],
    topic: Literal["sizing", "shipping", "returns", "care", "payment", "custom"]
) -> str:
    """
    Look up frequently asked questions by topic.

    Use for policy questions, sizing help, or general inquiries
    not related to specific orders or products.

    Topics: sizing, shipping, returns, care, payment, custom
    """
    faqs = {
        "sizing": """GERBONI T-Shirt Sizing Guide:
XS: Chest 86cm, Length 66cm (slim fit)
S: Chest 91cm, Length 69cm
M: Chest 97cm, Length 72cm
L: Chest 102cm, Length 74cm
XL: Chest 107cm, Length 76cm
XXL: Chest 112cm, Length 78cm

Tip: For a relaxed fit, size up. Our shirts are pre-shrunk.""",

        "shipping": """Shipping Information:
Latvia: 2-4 business days, €3.99 (free over €50)
EU: 5-10 business days, €7.99 (free over €75)
Express: +€12, 1-2 business days (Latvia only)

All orders ship from Rīga. Tracking provided via email.""",

        "returns": """Returns & Refunds:
- 14-day return window from delivery date
- Items must be unworn with original tags attached
- Refunds to original payment method in 5-10 business days
- Free return shipping within Latvia
- EU returns: customer pays return postage

To start a return, use 'I want a refund' and provide your order number.""",

        "care": """T-Shirt Care Instructions:
- Machine wash cold (30°C maximum)
- Do not bleach
- Tumble dry low or hang dry recommended
- Iron on reverse side only (avoid direct heat on print)
- Do not dry clean

Following these instructions preserves the coat of arms print quality.""",

        "payment": """Payment Methods:
- Credit/Debit cards (Visa, Mastercard, Amex)
- Apple Pay & Google Pay
- Klarna (buy now, pay later) - EU only

All payments processed securely via Stripe.
We do not store card details.""",

        "custom": """Custom Orders:
Currently we offer standard designs only.
Custom municipality requests (outside the 10 cities) may be
considered for bulk orders (50+ units).

Contact: custom@gerboni.lv"""
    }
    return faqs.get(topic, "Topic not found. Available: sizing, shipping, returns, care, payment, custom")
```

**Implementation time:** 1-2 hours
**Maintenance:** Update FAQ dict as policies change

#### 3. Enriched Product Descriptions (Database)

Add coat of arms history to the `description` field in Products table:

```sql
UPDATE products SET description =
'The Rīga coat of arms dates to 1225, featuring the city gates with
crossed keys of Saint Peter and a lion''s head. The keys symbolize
the city''s role as a trading hub, while the gates represent protection
and civic authority. This design has remained largely unchanged for
800 years, making it one of Europe''s oldest continuous city emblems.'
WHERE city_name = 'Rīga';
```

The existing `get_product_details` tool already returns this content.

### When to Implement RAG

Revisit RAG implementation when any of these triggers occur:

| Trigger | Rationale |
|---------|-----------|
| Blog/content marketing launches | 50+ articles require retrieval |
| Multi-language expansion (LV/EN/RU) | Content volume triples |
| Customer service knowledge base | Past ticket patterns inform responses |
| Product catalog exceeds 100 products | Database queries may need augmentation |
| Partnership with tourism boards | External content integration |

### RAG Implementation Roadmap (If Needed Later)

**Phase 1: pgvector (Lowest friction)**
- Use PostgreSQL's pgvector extension (already on Neon/Supabase)
- Embed documents using OpenAI's `text-embedding-3-small`
- Simple similarity search via SQL
- Cost: ~$5/month additional

**Phase 2: Dedicated Vector DB (Scale)**
- Migrate to Pinecone or Qdrant if >10,000 documents
- Implement hybrid search (keyword + semantic)
- Add metadata filtering by content type

**Phase 3: Advanced Retrieval**
- Re-ranking with cross-encoder models
- Query expansion for Latvian language support
- Agentic RAG with multi-step retrieval

---

## Appendix: Technology Options

### Vector Databases Comparison

| Provider | Free Tier | Paid Starting | Best For |
|----------|-----------|---------------|----------|
| pgvector (Neon/Supabase) | Included | $0 | Small-medium, SQL familiarity |
| Pinecone | 100K vectors | $25/month | Production scale, managed |
| Qdrant | Self-host free | $25/month cloud | Open source, filtering |
| Weaviate | Self-host free | $25/month cloud | Multi-modal |

### Embedding Models

| Model | Cost per 1M tokens | Dimensions | Quality |
|-------|-------------------|------------|---------|
| OpenAI text-embedding-3-small | $0.02 | 1536 | Good |
| OpenAI text-embedding-3-large | $0.13 | 3072 | Better |
| Voyage AI voyage-3 | $0.06 | 1024 | Best for retrieval |
| Cohere embed-v3 | $0.10 | 1024 | Multi-language |

---

*Last updated: February 2026*

# GERBONI Production Cost Analysis

## Overview

This document analyzes the **production infrastructure costs** for the GERBONI e-commerce platform, focusing on the AI customer support agent and FastAPI backend. All figures are **[Illustrative]** based on current 2025-2026 pricing and projected usage patterns.

---

## Current Stack Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| **AI Agent** | Pydantic AI + Claude Sonnet 4 | Customer support automation |
| **Backend** | FastAPI (Python) | REST API, WebSocket chat |
| **Database** | PostgreSQL | Orders, products, users |
| **Cache/Queue** | Redis | Sessions, async tasks |
| **Frontend** | Next.js | E-commerce storefront |

---

## 1. AI Agent Costs (Claude API)

### Current Model: Claude Sonnet 4

Based on line 41 of `backend/app/agent/support_agent.py`, the agent uses `anthropic:claude-sonnet-4-20250514`.

**Anthropic API Pricing (2025-2026):**

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude Sonnet 4 | $3.00 | $15.00 |
| Claude Haiku 3.5 | $0.80 | $4.00 |
| Claude Opus 4.5 | $5.00 | $25.00 |

### Estimated Token Usage per Conversation

Based on the GERBONI agent's system prompt (~500 tokens) and tool definitions (~2,000 tokens):

| Scenario | Input Tokens | Output Tokens | Cost/Conversation |
|----------|-------------|---------------|-------------------|
| Simple query (order status) | ~3,500 | ~300 | $0.015 [Illustrative] |
| Medium query (product search + details) | ~5,000 | ~600 | $0.024 [Illustrative] |
| Complex query (refund with verification) | ~7,000 | ~800 | $0.033 [Illustrative] |
| Multi-turn conversation (3 exchanges) | ~12,000 | ~1,500 | $0.059 [Illustrative] |

### Monthly Cost Projections

| Monthly Conversations | Avg Cost/Conv | Monthly AI Cost |
|----------------------|---------------|-----------------|
| 500 [Illustrative] | $0.025 | **$12.50** [Illustrative] |
| 2,000 [Illustrative] | $0.025 | **$50.00** [Illustrative] |
| 10,000 [Illustrative] | $0.025 | **$250.00** [Illustrative] |
| 50,000 [Illustrative] | $0.025 | **$1,250.00** [Illustrative] |

### Cost Optimization Strategies

1. **Prompt Caching** (0.1× read cost): Cache the system prompt and tool definitions
   - Savings: ~60% on input tokens for repeat conversations
   - Implementation: Enable `cache_control` on system prompt

2. **Batch API** (50% discount): For non-real-time analytics/reporting
   - Use case: Daily order summaries, refund processing reports

3. **Model Downgrade for Simple Queries**: Route simple FAQ to Haiku 3.5
   - Haiku cost: $0.80/$4.00 vs Sonnet $3.00/$15.00
   - Savings: ~70% on simple queries

4. **Response Format Control**: Already implemented via `include` parameter
   - `"summary"` mode reduces output tokens by ~50%

**Recommended Configuration:**

| Query Type | Model | Estimated Savings |
|------------|-------|-------------------|
| FAQ / Simple status | Claude Haiku 3.5 | 70% [Illustrative] |
| Product search | Claude Sonnet 4 | Baseline |
| Refunds / Complex | Claude Sonnet 4 | Baseline |
| With prompt caching | All models | +40% additional [Illustrative] |

---

## 2. Backend Hosting Options

### Option A: AWS Lambda (Serverless) — **Recommended for Low-Medium Traffic**

| Component | Monthly Cost |
|-----------|-------------|
| Lambda invocations (100K requests) | $0.20 [Illustrative] |
| Lambda compute (512MB, 500ms avg) | $4.17 [Illustrative] |
| API Gateway | $3.50 [Illustrative] |
| Data transfer (10GB) | $0.90 [Illustrative] |
| **Total** | **$8.77/month** [Illustrative] |

**Pros:** Scale to zero, pay-per-use, no server maintenance
**Cons:** Cold starts (1-3s), WebSocket complexity, 15-min max execution

### Option B: Railway — **Recommended for Simplicity**

| Plan | Monthly Cost | Includes |
|------|-------------|----------|
| Hobby | $5.00 | + usage |
| Pro | $20.00 | + usage |
| Compute (1 vCPU, 1GB) | ~$30.00 [Illustrative] | 24/7 uptime |

**Total estimated: $35-50/month** [Illustrative]

**Pros:** Simple deployment, managed PostgreSQL add-on, WebSocket support
**Cons:** Higher cost at scale, less control

### Option C: AWS EC2 (Reserved) — **Recommended for Predictable Traffic**

| Instance | Monthly Cost (1-yr reserved) |
|----------|------------------------------|
| t4g.micro (2 vCPU, 1GB) | $4.38 [Illustrative] |
| t4g.small (2 vCPU, 2GB) | $8.76 [Illustrative] |
| t4g.medium (2 vCPU, 4GB) | $17.52 [Illustrative] |

**Pros:** Predictable cost, full control, Graviton3 efficiency
**Cons:** Requires DevOps, no auto-scaling without additional setup

### Option D: Render — **Balanced Option**

| Service | Monthly Cost |
|---------|-------------|
| Web Service (Starter) | $7.00 |
| Web Service (Standard) | $25.00 |
| Background Worker | $7.00 |

**Total estimated: $14-39/month** [Illustrative]

**Pros:** Managed SSL, auto-deploy from Git, WebSocket support
**Cons:** Less flexibility than AWS

---

## 3. Database Hosting Options

### Option A: Neon (Serverless) — **Recommended for Variable Workloads**

| Plan | Monthly Cost | Storage | Compute Hours |
|------|-------------|---------|---------------|
| Free | $0 | 0.5 GB | 191.9 hrs |
| Launch | $19 | 10 GB | 300 hrs |
| Scale | $69 | 50 GB | 750 hrs |

**Key Feature:** Scale-to-zero reduces costs during low-traffic periods
**Best for:** Variable traffic, development, cost-conscious startups

### Option B: Supabase — **Recommended for Full-Stack Features**

| Plan | Monthly Cost | Storage | Includes |
|------|-------------|---------|----------|
| Free | $0 | 500 MB | Auth, Realtime, Storage |
| Pro | $25 | 8 GB | + $10 compute credit |
| Team | $599 | Custom | Priority support |

**Key Feature:** Built-in auth, realtime subscriptions, storage
**Best for:** Rapid development, if you need auth/realtime

### Option C: AWS RDS (PostgreSQL)

| Instance | Monthly Cost |
|----------|-------------|
| db.t4g.micro | $12.41 [Illustrative] |
| db.t4g.small | $24.82 [Illustrative] |
| db.t4g.medium | $49.64 [Illustrative] |

**+ Storage:** $0.115/GB-month
**+ Backup:** $0.095/GB-month

**Best for:** Production workloads with AWS infrastructure

---

## 4. Redis/Cache Hosting

### Option A: Upstash (Serverless) — **Recommended**

| Usage | Monthly Cost |
|-------|-------------|
| Free tier | $0 (500K commands) |
| 1M requests + 1GB storage | $2.25 [Illustrative] |
| 10M requests + 1GB storage | $20.25 [Illustrative] |

**Key Feature:** Pay-per-request, scale-to-zero, REST API
**Best for:** Serverless architectures, variable workloads

### Option B: Redis Cloud

| Plan | Monthly Cost |
|------|-------------|
| Free | $0 (30MB) |
| Fixed 1GB | $22 [Illustrative] |
| Fixed 5GB | $88 [Illustrative] |

**Best for:** High-throughput, predictable workloads

---

## 5. Frontend Hosting (Next.js)

### Vercel — **Recommended**

| Plan | Monthly Cost | Bandwidth |
|------|-------------|-----------|
| Hobby | $0 | 100 GB |
| Pro | $20 | 1 TB |
| Enterprise | Custom | Unlimited |

**Pros:** Native Next.js support, edge functions, preview deployments
**Best for:** Next.js applications (optimal integration)

### Alternatives

| Platform | Monthly Cost |
|----------|-------------|
| Netlify Pro | $19 |
| AWS Amplify | ~$5-15 [Illustrative] |
| Cloudflare Pages | $0-20 |

---

## 6. Total Cost Scenarios

### Scenario A: MVP / Low Traffic (500 conversations/month)

| Component | Provider | Monthly Cost |
|-----------|----------|-------------|
| AI Agent (Claude Sonnet 4) | Anthropic | $12.50 [Illustrative] |
| Backend | AWS Lambda | $8.77 [Illustrative] |
| Database | Neon Free | $0 |
| Redis | Upstash Free | $0 |
| Frontend | Vercel Hobby | $0 |
| Domain/SSL | Cloudflare | $0 |
| **Total** | | **$21.27/month** [Illustrative] |

### Scenario B: Growth Stage (2,000 conversations/month)

| Component | Provider | Monthly Cost |
|-----------|----------|-------------|
| AI Agent (Claude Sonnet 4) | Anthropic | $50.00 [Illustrative] |
| Backend | Railway Pro | $35.00 [Illustrative] |
| Database | Neon Launch | $19.00 |
| Redis | Upstash | $5.00 [Illustrative] |
| Frontend | Vercel Pro | $20.00 |
| Monitoring | Sentry Free | $0 |
| **Total** | | **$129.00/month** [Illustrative] |

### Scenario C: Scale (10,000 conversations/month)

| Component | Provider | Monthly Cost |
|-----------|----------|-------------|
| AI Agent (Sonnet + Haiku mix) | Anthropic | $175.00 [Illustrative] |
| Backend | AWS EC2 t4g.medium | $17.52 [Illustrative] |
| Database | Neon Scale | $69.00 |
| Redis | Upstash | $25.00 [Illustrative] |
| Frontend | Vercel Pro | $20.00 |
| Monitoring | Datadog | $15.00 [Illustrative] |
| Load Balancer | AWS ALB | $16.20 [Illustrative] |
| **Total** | | **$337.72/month** [Illustrative] |

### Scenario D: High Volume (50,000 conversations/month)

| Component | Provider | Monthly Cost |
|-----------|----------|-------------|
| AI Agent (optimized routing) | Anthropic | $625.00 [Illustrative] |
| Backend | AWS EC2 (2x t4g.medium) | $35.04 [Illustrative] |
| Database | AWS RDS db.t4g.medium | $60.00 [Illustrative] |
| Redis | Redis Cloud 5GB | $88.00 [Illustrative] |
| Frontend | Vercel Enterprise | $150.00 [Illustrative] |
| Monitoring | Datadog Pro | $50.00 [Illustrative] |
| CDN | CloudFront | $25.00 [Illustrative] |
| **Total** | | **$1,033.04/month** [Illustrative] |

---

## 7. Recommendations

### Immediate (MVP Launch)

| Component | Recommendation | Rationale |
|-----------|---------------|-----------|
| **AI Agent** | Claude Sonnet 4 | Balanced quality/cost |
| **Backend** | Railway Hobby → Pro | Fastest deployment, managed infra |
| **Database** | Neon Launch ($19) | Scale-to-zero, serverless |
| **Redis** | Upstash Free | Pay-per-use, sufficient for MVP |
| **Frontend** | Vercel Pro | Native Next.js optimization |

**Estimated MVP Cost: $75-130/month** [Illustrative]

### Growth Optimizations

1. **Implement Prompt Caching** — 40% AI cost reduction
2. **Route Simple Queries to Haiku** — Additional 30% reduction
3. **Migrate to AWS** when traffic stabilizes for cost predictability
4. **Reserved Instances** — 30-40% discount on EC2/RDS

### Cost Monitoring

- Set Anthropic API usage alerts at 50%, 80%, 100% of budget
- Use Neon's usage dashboard for compute hour tracking
- Implement request logging to identify optimization opportunities

---

## 8. Summary

| Traffic Level | Monthly Cost Range | Primary Cost Driver |
|--------------|--------------------|--------------------|
| MVP (500 conv) | $21-50 [Illustrative] | AI API |
| Growth (2K conv) | $100-150 [Illustrative] | AI API + Hosting |
| Scale (10K conv) | $300-400 [Illustrative] | AI API |
| High (50K conv) | $900-1,200 [Illustrative] | AI API + Infrastructure |

**Key Insight:** AI API costs dominate at scale. Optimizing Claude usage through prompt caching, model routing, and response format controls provides the highest ROI.

---

**Sources:**
- [Anthropic API Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Neon Pricing](https://neon.tech/pricing)
- [Supabase Pricing](https://supabase.com/pricing)
- [Upstash Pricing](https://upstash.com/pricing/redis)
- [Railway Pricing](https://railway.app/pricing)
- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [Vercel Pricing](https://vercel.com/pricing)

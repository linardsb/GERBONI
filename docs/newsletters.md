# Newsletter System

The newsletter system allows admins to create and send email campaigns to subscribers directly from the GERBONI admin panel.

## Overview

| Component | Detail |
|-----------|--------|
| Email provider | [Resend](https://resend.com) |
| Content format | Plain text (HTML-escaped on render) |
| Email template | Hardcoded branded HTML in `CampaignService._build_email_html()` |
| Subscribers | Collected via popup, footer, or checkout — stored in `newsletter_subscriptions` |
| Admin UI | `/en/admin/newsletters` |

## How It Works

### 1. Create a Campaign

From the admin panel, click **+ Create Campaign** and fill in:

| Field | Required | Description |
|-------|----------|-------------|
| Title | Yes | Internal name (not shown to subscribers) |
| Subject | Yes | Email subject line |
| Intro Text | Yes | Plain text body content (max unlimited, no HTML/Markdown) |
| Featured Products | No | Select products to include as image cards in the email |

The campaign is saved as a **draft** and can be edited or deleted.

### 2. Send the Campaign

Click the send icon on a draft campaign. The system will:

1. Query all active subscribers from `newsletter_subscriptions`
2. Build an HTML email with:
   - **Header**: GERBONI branding (cyan `#0891b2` background)
   - **Body**: Your plain text (HTML-escaped for security)
   - **Product cards**: If featured products selected — image, city name, "View Product" link
   - **Footer**: Unsubscribe link, copyright
3. Send individually to each subscriber via Resend API
4. Track results: `sent_count`, `failed_count`
5. Mark campaign as `sent` (all succeeded) or `partial` (some failed)

### 3. Campaign Lifecycle

```
draft → sending → sent
                → partial (some sends failed)
```

- Only **draft** campaigns can be edited, sent, or deleted
- Sent campaigns are read-only records
- Send rate limit: **5 sends per minute** (to prevent accidental mass sends)

## API Endpoints

All endpoints require admin authentication (`Authorization: Bearer <token>`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/newsletters` | List all campaigns |
| `POST` | `/api/admin/newsletters` | Create draft campaign |
| `GET` | `/api/admin/newsletters/{id}` | Get campaign details |
| `PUT` | `/api/admin/newsletters/{id}` | Update draft campaign |
| `DELETE` | `/api/admin/newsletters/{id}` | Delete draft campaign |
| `POST` | `/api/admin/newsletters/{id}/send` | Send to all subscribers |

### Create/Update Request Body

```json
{
  "title": "February Sale",
  "subject": "New arrivals from GERBONI!",
  "intro_text": "Check out our latest t-shirts featuring Latvian city coats of arms.",
  "featured_product_ids": [1, 3, 5]
}
```

### Response

```json
{
  "id": 1,
  "title": "February Sale",
  "subject": "New arrivals from GERBONI!",
  "intro_text": "Check out our latest...",
  "featured_product_ids": [1, 3, 5],
  "status": "draft",
  "recipient_count": 0,
  "sent_count": 0,
  "failed_count": 0,
  "created_by": 1,
  "created_at": "2026-02-10T12:00:00Z",
  "sent_at": null
}
```

## Subscriber Management

Subscribers are stored in the `newsletter_subscriptions` table:

| Field | Type | Description |
|-------|------|-------------|
| `email` | string (unique) | Subscriber email |
| `is_active` | boolean | Only active subscribers receive campaigns |
| `subscribed_at` | datetime | When they signed up |
| `unsubscribed_at` | datetime | When they unsubscribed (if applicable) |
| `source` | string | Where they signed up: `"popup"`, `"footer"`, `"checkout"` |

Public subscription endpoint: `POST /api/newsletter/subscribe`

## Email Template

The email HTML is generated in `backend/app/services/campaign_service.py` → `_build_email_html()`. The template is **hardcoded** with inline CSS for maximum email client compatibility.

```
+----------------------------------+
|  GERBONI  (cyan header)          |
+----------------------------------+
|                                  |
|  Your plain text content here    |
|                                  |
|  +--------+  +--------+         |
|  | Product |  | Product |  ...  |  (if featured products selected)
|  | Image   |  | Image   |       |
|  | Name    |  | Name    |       |
|  | View -> |  | View -> |       |
|  +--------+  +--------+         |
|                                  |
+----------------------------------+
|  GERBONI footer                  |
|  Unsubscribe link                |
+----------------------------------+
```

## Configuration

Required environment variables in `backend/.env`:

```bash
RESEND_API_KEY=re_...          # Resend API key
FROM_EMAIL=noreply@gerboni.lv  # Sender address (must be verified in Resend)
FRONTEND_URL=https://gerboni.lv # Used for product links and unsubscribe URL
```

If `RESEND_API_KEY` is not set, sends will silently fail with a warning log.

## Current Limitations

| Limitation | Description |
|------------|-------------|
| Plain text only | No rich text, HTML, or Markdown in campaign body |
| No custom templates | Email layout is hardcoded in Python |
| No scheduling | Campaigns send immediately — no future date scheduling |
| No segmentation | Sends to all active subscribers — no audience targeting |
| No A/B testing | Single variant per campaign |
| No analytics | No open/click tracking |
| No preview | No email preview before sending |
| Sequential sending | Emails sent one-by-one (fine for small lists, won't scale to 10k+) |

## Key Files

| File | Purpose |
|------|---------|
| `backend/app/models/campaign.py` | Campaign model and status enum |
| `backend/app/models/newsletter.py` | Subscriber model |
| `backend/app/schemas/campaign.py` | Pydantic schemas (Create/Update/Read) |
| `backend/app/services/campaign_service.py` | Business logic, email building, sending |
| `backend/app/api/admin/newsletters.py` | Admin API routes |
| `frontend/src/app/[locale]/admin/newsletters/page.tsx` | Admin UI |

## Future Improvements

If the newsletter system needs to grow beyond basic campaigns:

1. **Rich text editor** — Add TipTap or React-Quill to the admin form for formatted HTML content
2. **Email templates** — Store reusable templates in the database, let admins pick per campaign
3. **Preview** — Render and display the email before sending
4. **Scheduling** — Add a `scheduled_at` field and background job to send at a future time
5. **Batch sending** — Use Resend's batch API or a task queue (Celery/ARQ) for large lists
6. **Analytics** — Track opens and clicks via Resend webhooks
7. **External platform** — For advanced needs (segmentation, automations, A/B testing), integrate with Mailchimp, ConvertKit, or use Resend's dashboard directly

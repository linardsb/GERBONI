# GERBONI - Latvian City Coat of Arms T-Shirt Store

An e-commerce platform selling t-shirts featuring coats of arms (ģerboņi) of major Latvian cities, with an AI-powered customer support agent.

## Features

### Shopping Experience
- **Product Catalog**: 10 Latvian cities × 6 colors × 6 sizes = 360 SKUs
- **Guest Checkout**: Complete purchases without creating an account
- **Wishlist**: Save products for later (registered users)
- **Reviews & Ratings**: Customer product reviews with star ratings
- **Product Recommendations**: AI-powered "You might also like" suggestions
- **Recently Viewed**: Track browsing history for easy navigation

### AI Support
- **24/7 Chat Support**: Powered by Claude Sonnet 4 via Pydantic AI
- **Order Assistance**: Check order status, request refunds
- **Product Discovery**: Natural language product search
- **WebSocket Integration**: Real-time chat interface

### Payments & Orders
- **Stripe Checkout**: Secure payment processing
- **Order Tracking**: Status updates from pending to delivered
- **Baltic Shipping**: Latvia, Estonia, Lithuania support

### Admin Panel
- **Dashboard**: Sales analytics and order metrics
- **Order Management**: View, update status, process refunds
- **Product Management**: Edit inventory and pricing
- **User Management**: View and manage customer accounts

## Tech Stack

### Backend
- **FastAPI** - Python 3.11+ async web framework
- **SQLAlchemy 2.0** - Async ORM with PostgreSQL
- **Pydantic AI** - AI agent framework with Claude
- **Stripe SDK** - Payment processing
- **Alembic** - Database migrations

### Frontend
- **Next.js 16** - React 19 framework with App Router
- **Tailwind CSS 4** - Utility-first CSS with OKLch colors
- **Zustand** - Lightweight state management
- **CVA** - Class Variance Authority for component variants
- **Radix UI** - Accessible component primitives

### Infrastructure
- **PostgreSQL 16** - Primary database
- **Docker Compose** - Local development orchestration
- **Kubernetes** - Production deployment configs

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Stripe account (test mode works)
- Anthropic API key

### Setup

1. Clone and enter the project:
```bash
git clone https://github.com/linardsb/GERBONI.git
cd GERBONI
```

2. Create environment files:
```bash
cp backend/.env.example backend/.env
```

3. Add your API keys to `backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://gerboni:gerboni@localhost:5432/gerboni
SECRET_KEY=your-secret-key-here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
```

4. Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

5. Start services:
```bash
docker compose up -d
```

6. Seed the database:
```bash
docker compose --profile seed up seed
```

7. Open [http://localhost:3000](http://localhost:3000)

## Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### API Documentation
Interactive docs available at [http://localhost:8000/docs](http://localhost:8000/docs)

## API Endpoints

### Products
- `GET /api/products` - List products with filtering
- `GET /api/products/{id}` - Product details
- `GET /api/products/{id}/variants` - Available variants
- `GET /api/products/{id}/reviews` - Product reviews

### Cart
- `GET /api/cart` - Get cart contents
- `POST /api/cart` - Add item
- `PUT /api/cart/{id}` - Update quantity
- `DELETE /api/cart/{id}` - Remove item

### Orders
- `GET /api/orders` - List user orders
- `GET /api/orders/{id}` - Order details
- `POST /api/orders` - Create from cart

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT token
- `POST /api/auth/guest-session` - Anonymous session
- `POST /api/auth/convert-guest` - Convert to registered
- `POST /api/auth/forgot-password` - Password reset email
- `POST /api/auth/reset-password` - Set new password

### Payments
- `POST /api/payments/create-checkout` - Stripe session
- `POST /api/payments/webhooks/stripe` - Webhook handler

### Other
- `WS /api/agent/chat` - AI support chat
- `GET /api/wishlist` - User wishlist
- `GET /api/recommendations/{id}` - Product recommendations
- `POST /api/newsletter/subscribe` - Email signup

## Project Structure

```
GERBONI/
├── backend/
│   ├── app/
│   │   ├── api/           # Route handlers
│   │   │   ├── admin/     # Admin endpoints
│   │   │   └── *.py       # Public endpoints
│   │   ├── agent/         # Pydantic AI support agent
│   │   ├── middleware/    # Security, rate limiting, logging
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response
│   │   ├── services/      # Business logic layer
│   │   └── utils/         # Error handling utilities
│   ├── alembic/           # Database migrations
│   └── tests/             # Pytest test suite
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/
│   │   │   ├── elements/      # Primitives (Button, Input)
│   │   │   ├── components/    # Features (Header, ProductCard)
│   │   │   ├── compositions/  # Complex (CheckoutForm)
│   │   │   └── admin/         # Admin panel components
│   │   └── lib/           # API client, store, utils
│   ├── public/coats/      # City coat of arms SVGs
│   └── docs/              # Design system documentation
├── k8s/                   # Kubernetes manifests
├── docs/                  # Project documentation
└── docker-compose.yml
```

## Cities Featured

| City | Latvian | Description |
|------|---------|-------------|
| Riga | Rīga | Hanseatic towers, crossed keys, lion guardian |
| Daugavpils | Daugavpils | Golden griffin, Daugava fortress heritage |
| Jelgava | Jelgava | Moose head, Courland duchy symbol |
| Jekabpils | Jēkabpils | Leaping stag, forest traditions |
| Jurmala | Jūrmala | Mermaid, Baltic Sea resort identity |
| Liepaja | Liepāja | Lion, naval port strength |
| Ogre | Ogre | Oak tree, natural heritage |
| Rezekne | Rēzekne | Griffin, Latgale cultural heart |
| Valmiera | Valmiera | Wolf head, Gauja valley guardian |
| Ventspils | Ventspils | Blue bull, free port prosperity |

## Authentication

The platform supports dual authentication:

- **JWT Tokens**: For registered users via `Authorization: Bearer <token>`
- **Guest Sessions**: For anonymous checkout via `X-Guest-Session: <token>`

Both methods work for cart, orders, and AI chat functionality.

## License

MIT

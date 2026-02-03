# GERBONI - Latvian City Coat of Arms T-Shirt Store

An e-commerce store selling personalized t-shirts featuring coats of arms (ģerboņi) of major Latvian cities, with an AI-powered customer support agent.

## Features

- **Product Catalog**: 10 Latvian state cities with unique coat of arms designs
- **T-Shirt Customization**: Multiple colors (Black, White, Navy, Gray, Red, Green) and sizes (XS-XXL)
- **Guest Checkout**: Shop without creating an account
- **AI Customer Support**: 24/7 chat support powered by Claude for orders, refunds, and questions
- **Stripe Payments**: Secure payment processing with EU support

## Tech Stack

### Backend
- FastAPI (Python 3.11+)
- Pydantic AI with Anthropic Claude
- PostgreSQL with SQLAlchemy
- Stripe payment integration

### Frontend
- Next.js 15 with React 19
- Tailwind CSS v4
- WebSocket-based chat interface
- Zustand for state management

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Stripe account (for payments)
- Anthropic API key (for AI agent)

### Setup

1. Clone the repository:
```bash
cd GERBONI
```

2. Create environment file:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

3. Add your API keys to the `.env` files:
- `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
- `ANTHROPIC_API_KEY` from [Anthropic Console](https://console.anthropic.com/)

4. Start the services:
```bash
docker compose up -d
```

5. Seed the database with products:
```bash
docker compose --profile seed up seed
```

6. Open [http://localhost:3000](http://localhost:3000)

## Development

### Backend Only
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Only
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/{id}` - Get product details
- `GET /api/products/{id}/variants` - Get color/size variants

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart` - Add item
- `PUT /api/cart/{id}` - Update quantity
- `DELETE /api/cart/{id}` - Remove item

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/{id}` - Get order details
- `POST /api/orders` - Create order

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/guest-session` - Create guest session

### AI Agent
- `WS /api/agent/chat` - WebSocket for chat

## Project Structure

```
GERBONI/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── agent/        # Pydantic AI agent
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── main.py       # FastAPI app
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # React components
│   │   └── lib/          # API client, store
│   ├── public/coats/     # Coat of arms SVGs
│   └── Dockerfile
└── docker-compose.yml
```

## Cities Featured

| City | Latvian Name | Symbol |
|------|--------------|--------|
| Riga | Rīga | Towers, keys, lion |
| Daugavpils | Daugavpils | Griffin |
| Jelgava | Jelgava | Moose head |
| Jekabpils | Jēkabpils | Stag |
| Jurmala | Jūrmala | Mermaid |
| Liepaja | Liepāja | Lion |
| Ogre | Ogre | Oak tree |
| Rezekne | Rēzekne | Griffin |
| Valmiera | Valmiera | Wolf head |
| Ventspils | Ventspils | Bull |

## License

MIT

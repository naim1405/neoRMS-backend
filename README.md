# neoRMS Backend Service

## Purpose

This service provides the core backend API for restaurant operations in neoRMS. It manages authentication, users, restaurant data, menu products, inventory, orders, tables, coupons, payments, reviews, and analytics.

## Responsibilities

- Expose REST APIs under `/api/*` for core domain modules.
- Handle authentication and role-based access flows.
- Persist and query operational data in PostgreSQL via Prisma.
- Publish real-time updates over Socket.IO for waiter/chef/customer channels.
- Integrate with external AI endpoints for sentiment, recommendations, and order import.
- Integrate with SSLCommerz for payment flows.

## Tech Stack

- Node.js + TypeScript
- Express 5
- Prisma ORM (`@prisma/client`) with PostgreSQL
- Socket.IO
- Zod (request validation)
- JWT + Passport (including Google OAuth)
- Docker + Docker Compose

## Project Structure

```text
src/
	app.ts                 # Express app, middleware, CORS, session, passport
	index.ts               # HTTP server + Socket.IO bootstrap
	config/                # Environment/config mapping
	middlewares/           # Auth, tenant, validation, upload middleware
	modules/               # Feature modules (auth, order, payment, etc.)
	routes/                # API route aggregation mounted at /api
	sockets/               # waiter/chef/customer namespaces and emit helpers
	utils/                 # Prisma client, error handling, common utilities
prisma/
	schema.prisma          # PostgreSQL schema
	migrations/            # Prisma migrations
	seed.js                # Seed script
compose.dev.yaml         # Dev compose (API + Postgres, bind mount)
compose.yaml             # Production-style local compose
Dockerfile               # Production image build
Dockerfile.dev           # Development image
```

## Setup / Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the repository root.

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Apply migrations:

```bash
npx prisma migrate dev
```

5. (Optional) Seed local data:

```bash
npm run db:seed
```

## Configuration

Create `.env` with the following variables:

### Core

- `PORT` (example: `5000`)
- `NODE_ENV` (example: `development`)
- `APP_SECRET` (session secret)

### Database

- `DATABASE_URL` (required by Prisma, PostgreSQL connection string)
- `DB_URI` (read by service config; keep aligned with `DATABASE_URL` if used)

### JWT

- `JWT_ACCESS_TOKEN_SECRET`
- `JWT_ACCESS_TOKEN_EXPIRATION`
- `JWT_REFRESH_TOKEN_SECRET`
- `JWT_REFRESH_TOKEN_EXPIRATION`

### Google OAuth

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`

### AI Service Integration

- `AI_SERVICE_URL`

### SSLCommerz Payment Integration

- `SSL_STORE_ID`
- `SSL_STORE_PASSWORD`
- `SSL_IS_LIVE`
- `SSL_SUCCESS_URL`
- `SSL_FAIL_URL`
- `SSL_CANCEL_URL`
- `SSL_IPN_URL`

## Running the Service

### Local (without Docker)

Run in development mode:

```bash
npm run dev
```

Build and run production mode:

```bash
npm run build
npm run start
```

Health check:

- `GET /health`

## API / Interfaces

### REST API Base

- Base path: `/api`

### Main Route Groups

- `/api/auth`
- `/api/user`
- `/api/restaurant`
- `/api/menuProduct`
- `/api/inventory`
- `/api/order`
- `/api/table`
- `/api/coupon`
- `/api/payment`
- `/api/review`
- `/api/analytics`

### Realtime (Socket.IO)

- Waiter namespace
- Chef namespace
- Customer namespace

The service emits room-scoped events for order/operational updates through these namespaces.

## Database

- Primary database: PostgreSQL
- ORM: Prisma
- Prisma schema: `prisma/schema.prisma`
- Migration directory: `prisma/migrations/`

Useful commands:

```bash
npx prisma migrate dev
npx prisma migrate deploy
npm run prisma:generate
npm run db:seed
```

## Docker / Containerization

### Development stack (hot reload)

```bash
docker compose -f compose.dev.yaml up --build
```

- API exposed on `http://localhost:5000`
- Postgres runs in a sibling container

Stop:

```bash
docker compose -f compose.dev.yaml down
```

### Production-style local stack

```bash
docker compose up --build
```

Stop:

```bash
docker compose down
```

## Related Services

This backend interacts with:

- **Frontend clients** (web apps) over HTTP and Socket.IO.
- **AI service** via `AI_SERVICE_URL` (`/sentiment`, `/analyze-review`, `/recommend`, `/orders/import`).
- **SSLCommerz gateway** for payment processing callbacks and status flow.

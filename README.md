# neo-RMS backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

This project was created using `bun init` in bun v1.2.20. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Docker

### Development (hot reload)

```bash
docker compose -f compose.dev.yaml up --build
```

- API runs on `http://localhost:5000`
- Source is bind-mounted, so code changes auto-reload via `npm run dev`

Stop development stack:

```bash
docker compose -f compose.dev.yaml down
```

### Production-style local run

```bash
docker compose up --build
```

Stop production-style stack:

```bash
docker compose down
```

### Notes

- Do not run both stacks at once (same ports).
- To reset database data, use `down -v` on the stack you are using.

## Seed Data (Mock Data for Testing)

Run database seed:

```bash
npm run db:seed
```

This inserts relational mock data for all tables/models in `prisma/schema.prisma`.

### Test Login Accounts

All local-auth accounts use the same password: `Pass@123`

- Owner: `owner@neorms.dev`
- Manager: `manager@neorms.dev`
- Chef: `chef@neorms.dev`
- Waiter: `waiter@neorms.dev`
- Customer 1: `customer1@neorms.dev`
- Customer 2: `customer2@neorms.dev` (authProvider: `google`)
- Customer 3: `customer3@neorms.dev`

### Key Seeded IDs

- Tenant ID: `33333333-3333-3333-3333-333333333331`
- Restaurant ID: `44444444-4444-4444-4444-444444444441`

### Coupon Codes

- `WELCOME10` (percentage coupon)
- `FLAT50` (amount coupon)

### Included Data Scope

- Users, owner/customer/manager/chef/waiter profiles
- Tenant and restaurant
- Inventory ingredients and restaurant inventory
- Menu products, product ingredients, variants, addons
- Tables and reservations
- Orders, order items, order item addons
- Coupons and coupon usages
- Payments
- Reviews

### Re-seeding Behavior

The seed script clears existing data and then recreates a consistent dataset in a safe relation order.

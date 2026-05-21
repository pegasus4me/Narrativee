# Narrativee

Newsletter content repurposing platform — turn your newsletter into social media posts.

## Architecture

Turborepo monorepo:

| App | Stack | Port |
|-----|-------|------|
| `apps/backend` | Express.js, Drizzle ORM, PostgreSQL | 3002 |
| `apps/web` | Next.js 15, Tailwind CSS | 3000 |

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** 9
- **PostgreSQL** 15+

## Quick Start

```bash
# Install dependencies
pnpm install

# Configure backend
cp apps/backend/.env.example apps/backend/.env
# Fill in required values (DATABASE_URL, BETTER_AUTH_SECRET, etc.)

# Push DB schema
cd apps/backend && npx drizzle-kit push && cd ../..

# Run in development
pnpm dev
```

The backend runs on `http://localhost:3002` and the frontend on `http://localhost:3000`.

## Environment Variables

See [`apps/backend/.env.example`](apps/backend/.env.example) for all required and optional variables.

Key secrets to configure:
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Session signing key
- `ENCRYPTION_KEY` — 32-byte hex key for OAuth token encryption
- `STRIPE_SECRET_KEY` — Stripe API key (use `sk_test_` for dev)
- `GROK_API_KEY` — xAI/Grok for LLM features

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm check-types` | TypeScript type checking |

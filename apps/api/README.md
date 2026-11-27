# @anan/api

NestJS modular-monolith API for ANAN.

## Local development

1. Copy `.env.example` to `.env` and adjust values for your local services.
2. From the repository root run `pnpm install`.
3. Generate the Prisma client with `pnpm --filter @anan/api prisma:generate`.
4. Start the API with `pnpm dev:api`.

The initial health endpoint is `GET /api/v1/health`.

## Architecture

- `modules/health`: service liveness endpoint.
- `modules/customers`, `modules/sellers`, `modules/catalog`: domain boundaries for upcoming features.
- `prisma/schema.prisma`: initial identity, seller, category and product data model.

All prices are represented in integer Bangladeshi paisa (`BigInt`), never floating-point currency. Product and seller approval states are explicit. Authentication, authorization, database migrations and business endpoints are intentionally not exposed until their security and transaction rules are implemented.

Never commit real `.env` files, credentials, customer data or production secrets.
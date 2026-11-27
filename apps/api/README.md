# ANAN API

NestJS modular-monolith API. Local development requires Node.js 22+, pnpm 10+, and Docker Compose.

## Start PostgreSQL

From the repository root:

```powershell
docker compose up -d postgres
docker compose ps
```

The local-only database is available at `localhost:5432`. Its credentials are for development only and must never be reused in production.

## Configure and run the API

```powershell
Copy-Item apps/api/.env.example apps/api/.env
pnpm install
pnpm --filter @anan/api prisma:generate
pnpm dev:api
```

API liveness: `GET http://localhost:4000/api/v1/health`

Database readiness: `GET http://localhost:4000/api/v1/health/ready`

## Public catalog

- `GET /api/v1/catalog/categories` — active categories with counts of approved products from approved sellers.
- `GET /api/v1/catalog/products` — paginated approved products.
- `GET /api/v1/catalog/products/:slug` — approved product detail.
- `GET /api/v1/catalog/stores/:storeSlug` — approved seller storefront and its approved products.
- Optional product query parameters: `search`, `category` (category slug), `page`, and `limit` (1–48).
- Search matches English and Bangla product names and descriptions.
- Monetary values are returned as paisa strings to preserve BigInt precision.

Only products with `APPROVED` status from `APPROVED` sellers and active categories are public.

## Seed the category directory

```powershell
pnpm --filter @anan/api prisma:seed
```

The seed is safe to run repeatedly; it upserts the six ANAN launch categories without creating sellers or fake products.

## Prisma migrations

After changing `prisma/schema.prisma`, create a local development migration with:

```powershell
pnpm --filter @anan/api exec prisma migrate dev --name describe_change
```

Review generated SQL before committing migrations. Never commit local database contents or real environment secrets.

## Full-stack Docker development

From the repository root, run `docker compose up --build -d`. Compose waits for PostgreSQL, applies the Prisma schema to the disposable local database, seeds the six categories, and starts the API. The API is available at http://localhost:4000.

This automated `prisma db push` is strictly for local development. Use reviewed Prisma migrations in staging and production.

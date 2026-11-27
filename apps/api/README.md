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

## Customer authentication

The first customer-authentication increment provides:

- `POST /api/v1/auth/register` — create a customer account with a display name, email or phone, and password.
- `POST /api/v1/auth/login` — sign in with email or phone and password.
- `POST /api/v1/auth/refresh` — rotate the refresh session and issue a new short-lived access token.
- `POST /api/v1/auth/logout` — revoke the refresh session.
- `GET /api/v1/auth/me` — return the authenticated customer's profile (Bearer access token required).

Passwords are hashed with bcrypt. Refresh tokens are random opaque values; only their SHA-256 hashes are stored in PostgreSQL. The raw refresh token is issued in an HttpOnly, SameSite=Lax cookie scoped to `/api/v1/auth`. Access tokens are short-lived JWTs. Refresh rotation revokes the previous token atomically.

The API only allows customer-role accounts through the customer login flow. Seller and staff authentication must use separate role-aware flows when those portals are built.

### Local environment

Set `JWT_ACCESS_SECRET` to a random value of at least 32 characters in `apps/api/.env`. A development-only fallback is provided for local Compose. Production startup requires an explicit secret. Configure `JWT_ACCESS_TTL` and `AUTH_REFRESH_TTL_DAYS` as needed.

The web app uses `NEXT_PUBLIC_ANAN_API_URL` for browser requests. For local development this should be `http://localhost:4000/api/v1`. Browser requests include credentials so the refresh cookie can be set and rotated.

Email/mobile OTP verification, password reset, MFA, login throttling, and account recovery are not included in this increment and must be completed before public launch.

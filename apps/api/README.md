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

Readiness returns HTTP 503 when PostgreSQL cannot be reached. The liveness endpoint intentionally remains independent of database availability.

## Prisma

After changing `prisma/schema.prisma`, create a local development migration with:

```powershell
pnpm --filter @anan/api exec prisma migrate dev --name describe_change
```

Review generated SQL before committing migrations. Never commit local database contents or real environment secrets.

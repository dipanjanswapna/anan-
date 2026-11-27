# ANAN full-stack local environment

This Docker Compose stack is for local development only. It starts PostgreSQL, the NestJS API, and the Next.js storefront. It is not a production deployment configuration.

## Requirements

- Docker Desktop with Docker Compose v2
- At least 4 GB RAM available to Docker Desktop

## Start all services

From the repository root:

```powershell
docker compose up --build -d
docker compose ps
docker compose logs -f api
```

The API container waits for PostgreSQL, applies the current Prisma schema with `prisma db push`, seeds the six ANAN launch categories, and starts NestJS in watch mode.

## Local URLs

- Storefront: http://localhost:3000
- Product catalog: http://localhost:3000/products
- API liveness: http://localhost:4000/api/v1/health
- API database readiness: http://localhost:4000/api/v1/health/ready
- PostgreSQL: localhost:5432

The web container reaches the API over the internal Compose network at `http://api:4000/api/v1`.

## Useful commands

```powershell
# View status and health
docker compose ps

# Follow application logs
docker compose logs -f api web

# Stop containers; preserve the database volume
docker compose down

# Rebuild after dependency or Dockerfile changes
docker compose up --build -d

# Remove containers AND the local database volume (destructive)
docker compose down -v
```

## Database safety

The Compose database credentials are fixed development-only values. Never reuse them outside a disposable local environment. Do not expose PostgreSQL publicly in production. The API startup uses `prisma db push` only to make the local environment convenient; production database changes must use reviewed, committed Prisma migrations and a controlled deployment step.

The named `anan_postgres_data` volume survives `docker compose down`. Use `docker compose down -v` only when you intentionally want to erase all local database data.

## Troubleshooting

- If port 3000, 4000, or 5432 is already occupied, stop the conflicting process or change the host-side port mapping in `docker-compose.yml`.
- If the API is unhealthy, inspect `docker compose logs api postgres`.
- If Prisma reports a schema/client mismatch after changing the schema, rebuild with `docker compose up --build -d`.

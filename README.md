# ANAN

Mobile-first multi-vendor e-commerce platform for Bangladesh.

## Development principles
- Mobile-first responsive UX
- TypeScript across frontend and backend
- Secure defaults; never commit secrets
- Automated tests and CI checks
- Incremental feature delivery

## Planned workspace
- `apps/web` — Next.js storefront
- `apps/api` — NestJS API
- `packages/shared` — shared contracts
- `infra` — infrastructure as code
- `docs` — architecture and runbooks

## Run the complete local stack with Docker

With Docker Desktop running, start PostgreSQL, the API, and the storefront together:

```powershell
docker compose up --build -d
docker compose ps
```

Open the storefront at http://localhost:3000 and the API health endpoint at http://localhost:4000/api/v1/health/ready.

See [the Docker development guide](docs/development/docker-compose.md) for logs, troubleshooting, database persistence, and reset commands. This Compose stack is for local development only; production deployment requires separate secrets, reviewed migrations, managed database/networking, and production images.

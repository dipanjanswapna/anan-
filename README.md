# ANAN

Mobile-first multi-vendor e-commerce platform for Bangladesh.

## Development principles
- Mobile-first responsive UX
- TypeScript across frontend and backend
- Secure defaults; never commit production secrets
- Automated tests and CI checks
- Incremental feature delivery

## Planned workspace
- `apps/web` — Next.js storefront
- `apps/api` — NestJS API
- `packages/shared` — shared contracts
- `infra` — infrastructure as code
- `docs` — architecture and runbooks

## Seller application workflow

Customers can visit http://localhost:3000/sell to submit a seller application. The Next.js route proxies the request to `POST /api/v1/seller-applications`; NestJS validates the contact and business fields and stores a pending application in PostgreSQL. Duplicate email addresses or phone numbers are rejected. Applications do not create login accounts, grant seller access, or approve a store.

## Customer OTP foundation

The `/login` page and `POST /api/v1/auth/otp/request` and `POST /api/v1/auth/otp/verify` endpoints provide phone challenge verification. Codes are HMAC-hashed in PostgreSQL, expire after five minutes, allow at most five attempts, and are limited to three requests per 15 minutes with a 60-second resend wait. Configure an SMS adapter using `OTP_DELIVERY_URL` and `OTP_DELIVERY_TOKEN` before sending real codes. Set a unique `OTP_HASH_SECRET` of at least 32 characters in every environment. The Docker Compose value is a disposable local-development example only.

OTP verification does not yet create an account, authenticate a session, or issue a token. Do not describe a verified phone as a signed-in customer. Production requires provider-specific SMS integration, IP/device abuse controls, monitoring, and reviewed database migrations.

## Run the complete local stack with Docker

With Docker Desktop running, start PostgreSQL, the API, and the storefront together:

```powershell
docker compose up --build -d
docker compose ps
```

Open the storefront at http://localhost:3000 and the API health endpoint at http://localhost:4000/api/v1/health/ready.

See [the Docker development guide](docs/development/docker-compose.md) for logs, troubleshooting, database persistence, and reset commands. This Compose stack is for local development only; production deployment requires separate secrets, reviewed migrations, managed database/networking, and production images.

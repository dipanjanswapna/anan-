# ANAN Architecture Overview

## Initial workspace

- `apps/web`: Next.js App Router customer storefront (seller/admin portals can be separate apps when justified).
- `apps/api`: NestJS modular monolith API to keep initial operations simple while preserving domain boundaries.
- `packages/*`: shared contracts and UI only when genuine reuse exists.
- `infra`: Terraform and deployment configuration, introduced alongside infrastructure work.

## Initial platform choices

- PostgreSQL is the source of truth for transactional data.
- Prisma is the planned database access layer.
- S3 + CloudFront for media; SQS for asynchronous jobs when those features are implemented.
- Redis is optional and must be justified by measured caching/queue needs.
- AWS ECS Fargate is the target production compute platform; local development must work without AWS.

## Engineering rules

- Mobile-first responsive layouts and accessible interactions.
- Validate and authorize every API boundary; enforce ownership at the server.
- Money uses integer minor units or precise decimal types, never floating point.
- Order, stock, payment, commission and payout mutations must be transactional and idempotent where applicable.
- Secrets live in environment/secret managers, never in Git.
- Every feature includes tests, migration review, observability and rollback considerations.
- No production credentials or real customer data in development.

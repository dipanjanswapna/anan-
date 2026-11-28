# ANAN — Canonical Project Specification

> Read this with `feature_status.md`, `known_issues.md`, and `agents.md` before every coding session. These repository files are the handoff memory and source of truth; never infer missing decisions.

## Product
ANAN is a Bangladesh-focused, mobile-first, bilingual (Bangla/English) multi-vendor marketplace. BDT is the initial currency. Customers buy from multiple sellers in one checkout; sellers apply for approval and manage products/orders; Admin controls trust, moderation, disputes and operations.

## Confirmed product decisions
- Bangladesh market; all 64 districts are intended delivery coverage, with seller serviceability/Admin controls.
- Seller application is open, but Admin approval is mandatory before selling. Application does not create an approved seller account.
- Seller verification is intended to include phone OTP, email and NID; manual NID review initially. Do not claim NID collection is implemented.
- Customer checkout requires an account; no guest checkout in current plan.
- COD is the implemented first payment path. bKash, Nagad and SSLCommerz are planned, not integrated.
- Parent order + seller-specific child orders; seller acceptance deadline 24 hours; expiry/cancellation and Admin alert foundations exist.
- Seller-managed fulfilment and multiple courier integrations are goals. Current tracking is seller/admin-entered; no live carrier webhook is verified.
- Return workflow exists at request/seller review/Admin review levels. Refund records are manual/external payout evidence only; platform does not transfer money.
- Seller earnings should be withdrawable only after Delivered + return window ended + Admin approval. Automated payouts are not implemented.
- Product publishing requires Admin approval; public catalog must expose only approved products and approved media.
- Commission-only seller revenue model; no subscription. Seller-specific commission and delivery fee rules are planned.
- Coupons by Admin/Seller planned. Loyalty points: configurable per ৳100, expire after 24 months.
- Seller-defined return policy within Admin boundaries; customer/seller first dispute resolution, Admin intervention.
- Social Studio: one image OR one video per post (no carousel); Creator Storefront and Performance Highlights; organic only; no paid sponsored placement, DMs or live commerce in current scope; public discussion only. 18+ requires real age assurance, not a checkbox. Moderation, reporting and escalation are prerequisites.
- Admin/Staff password + authenticator 2FA is a target, not yet implemented. Customer security includes OTP, session/device management and suspicious-login alerts as goals.
- Legal docs (Terms, Privacy, Return/Refund, Seller Agreement, Cookie Policy), versioned acceptance, privacy export/deletion and marketing opt-out are planned.
- Support target SLA: Normal 24h, Medium 12h, High 4h, Urgent 1h; not a staffed guarantee.
- Launch path: private test → beta → public, with QA, recovery, rollback and Admin sign-off.

## Verified technology baseline
- pnpm 10 monorepo; Node.js >=22, pnpm >=10.
- Web: Next.js 15 App Router, React 19, TypeScript, Tailwind.
- API: NestJS 10, TypeScript, class-validator/class-transformer, Joi config validation.
- PostgreSQL 16 + Prisma 6.
- Docker Compose for local PostgreSQL/API/Web.
- S3 presigned product-image upload foundation; CloudFront recommended for production.
- GitHub Actions validates Prisma, generates client, builds API, typechecks/builds Web, validates Compose and builds dev image.
- AWS ECS Fargate, RDS PostgreSQL, S3 + CloudFront, SQS and Terraform are target architecture only; no production deployment is verified.
- Redis only when justified by measured need; BI warehouse should be separate from transactional PostgreSQL.

## Current repository map
```text
apps/web/                 Next.js storefront + seller/Admin route areas
apps/api/                 NestJS modular monolith
  prisma/                 schema, migrations, seed
  src/database/           Prisma module/service
  src/modules/            auth, catalog, customers, health, sellers
packages/                 reserved for genuinely shared contracts/UI
docs/                     architecture, feature and runbook docs
.github/workflows/        CI
Dockerfile.dev
docker-compose.yml
pnpm-workspace.yaml
project_spec.md
feature_status.md
known_issues.md
agents.md
```

The current `sellers` API module contains several distinct areas (seller applications/orders, Admin reviews/notifications/orders/returns, product images). This is a known mixed boundary. Split incrementally; do not perform a risky big-bang refactor.

## Target feature boundaries
Identity & Access; Customer Profile; Catalog; Seller Onboarding; Seller Store & Products; Product Media; Cart & Wishlist; Checkout & Orders; Inventory; Payments; Shipping; Returns & Disputes; Finance & Payouts; Promotions; Admin Operations; Social Studio; Notifications; Analytics; Platform/Infrastructure.

Target logical layout (adopt incrementally):
```text
apps/api/src/
  platform/                  # config, DB, logging, security primitives
  modules/<feature>/
    api/                      # controllers, DTOs
    application/              # use cases/orchestration/ports
    domain/                   # rules, value objects, state transitions
    infrastructure/           # Prisma repos, provider adapters, queues
    tests/
apps/web/src/
  app/                        # thin Next route/page composition
  features/<feature>/
    components/ api/ hooks/ schemas/ types/ tests/
  shared/                     # genuine shared design/API primitives
packages/contracts/           # shared contracts only when genuinely needed
infra/                        # Terraform/deployment definitions
docs/architecture/adr/
```

## Non-negotiable invariants
1. PostgreSQL is transactional source of truth.
2. Validate external input; authenticate/authorize every protected operation; enforce ownership server-side.
3. Public catalog exposes only approved/active products and approved media.
4. Money is integer paisa/BigInt or approved precise decimal, never floating point.
5. Stock/order/payment/commission/payout transitions need transactions, concurrency strategy and idempotency.
6. Never trust client-provided price, stock, role, seller identity, refund or payment status.
7. Payment success requires verified provider callback/reconciliation, never browser redirect alone.
8. Persist only hashes of bearer session tokens; never expose raw session tokens to browser JS.
9. Never commit credentials, secrets, identity documents or production/customer data.
10. Prisma migrations are append-only and reviewed; never edit an applied migration.
11. External providers live behind replaceable feature-owned adapters.
12. Multi-replica workers require distributed queue/lease/lock semantics; an in-process mutex is not distributed.
13. Production needs observability, backup/restore and rollback planning.

## Definition of done
Track implementation, tests, CI, migration, provider setup, deployment, security review and UAT separately. Compilation is not feature completion. Before launch, run unit/integration/E2E, security, performance, accessibility, browser compatibility, backup/restore, rollback and smoke checks.

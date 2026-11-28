# ANAN — AI Agent Project Context: Feature Status

> Canonical ledger: [`/feature_status.md`](../../feature_status.md). Risk register: [`/known_issues.md`](../../known_issues.md). Rules: [`/agents.md`](../../agents.md).
> This file is the short orientation entry point for AI sessions and links out to the canonical documents. Update both this file and the canonical ledger in the same PR.

## Read order for a new session

1. `/agents.md` — ownership, isolation and PR rules.
2. `/project_spec.md` — product decisions and invariants.
3. `/feature_status.md` — what exists, what is partial, what is planned.
4. `/known_issues.md` — open risks with severity.
5. The feature's own source, API contract, Prisma model and docs under `/docs`.

## Current snapshot

| Area | State | Evidence |
|---|---|---|
| Storefront UI foundation | Implemented (unverified visually) | Shared header/footer, design tokens, catalogue filters, category/deals/stores/help routes, product gallery |
| Seller product workflow | Implemented (not deployed, not integration-tested) | `docs/sellers/seller-product-management.md`, `SellerProductsService`, `/seller/products` routes |
| Admin product review | Implemented (not integration-tested) | `AdminProductsService`, `/admin/products`, audit log entries |
| Product images | Merged foundation; hardening incomplete | P1 risk: no decode/re-encode, malware scan, EXIF strip, CloudFront |
| Checkout / COD orders | Partial | Parent/child orders, idempotency, stock deduction |
| Online payments | Planned | COD only |
| Finance / payouts | Planned | Manual refund evidence only |
| Social Studio | Planned, safety prerequisites absent | Not implemented |
| Production deployment | Not verified | No ECS/RDS/CloudFront environment recorded |

## What this session changed

- Frontend: full UI/UX pass over the storefront (see `docs/web/ui-ux-foundation.md`).
- Feature: seller product create/edit/submit/archive lifecycle + Admin approval (see `docs/sellers/seller-product-management.md`).
- API: catalogue sorting/price/stock/sale filters and `/catalog/stores`.
- Schema: append-only migration `20261128090000_seller_product_lifecycle` (`Product.reviewNotes`, `Product.reviewedAt`) — **not applied**.
- Docs: this file, the canonical ledger, `known_issues.md`, and the two feature docs above.

## Handoff

See [`handoff.md`](./handoff.md) for commands run, results, pending work and the recommended next task.

## Premium storefront pass

- Homepage hero carousel, premium cards, quick view, rebuilt product detail, sign up/admin login, cart, checkout, account, orders and wishlist are implemented.
- Verified in a real browser against local PostgreSQL: signup, cart math, COD order, wishlist, filters, seller sign-in/list, admin sign-in and product approval; 60 viewport checks showed no horizontal overflow.
- Blocking: no baseline migration, so fresh `migrate deploy` fails; seller product create/edit and automated tests remain unverified.


## Current main correction — 2026-11-28

The historical snapshot above is stale. Current main includes merged PR #29 Social Studio and PR #34 S3 SigV4 correction. Social Studio is implemented but not production-ready: quarantine uploads have no malware scan/sanitization/promotion pipeline, 18+ remains disabled, and moderation operations still need appeals/evidence/escalation/staffing.

The P0 database blocker remains: first migration `20261128000000_customer_orders` references foundational `User`, `SellerProfile`, and `Product` tables without creating them; no earlier baseline is present. Follow `docs/database/migration-baseline-remediation.md`. Do not assume clean-database migration works or modify shared DB migration state without backup and schema comparison.

PR #34 merged as `6aad3fb40eeb89270c494ccd4b5d593e3df99bca`; latest-head CI run `46154036981` passed build/schema/Compose checks, not live S3 or migration replay.

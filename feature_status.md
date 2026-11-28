# ANAN — Feature Status Ledger

> “Merged” means code exists on main; it does not mean production deployment, provider setup, migration execution or UAT is complete. Update this file in every feature PR.

## Snapshot
- Repository: `dipanjanswapna/anan-`; branch: `main`.
- Main HEAD at snapshot: `718b85f` (docs: feature-isolated architecture and AI session handoff).
- Session branch: `freebuff/6e0fc06bc657aeff874420c7`; delivery branch `feature/premium-storefront-ui`. Premium storefront, auth, cart/checkout, account and staff sign-in work is committed there and **unmerged/undeployed**.
- Stack: pnpm 10 (no lockfile committed yet), Next.js 15/React 19, NestJS 10, PostgreSQL 16, Prisma 6, Docker Compose.
- Latest evidence: PostgreSQL 19 (portable build), API and Web running locally; `prisma generate`, API `tsc --noEmit`, Web `tsc --noEmit`, `nest build` and `next build` passed. Real browser walkthrough of signup → OTP → cart → checkout → order, seller sign-in, admin sign-in and product approval, plus a 60-combination viewport audit (320–1920px) with no horizontal overflow.

## Status vocabulary
- **Implemented/merged**: code on main.
- **Partial**: foundation or subset only.
- **Planned**: product decision exists, code not verified.
- **Blocked**: named dependency prevents safe progress.
- **Not verified**: no evidence from a real environment/test.

## Feature matrix

| Feature | Status | Implemented | Remaining / caveat |
|---|---|---|---|
| Workspace / CI | Partial | pnpm monorepo, Next/Nest apps, Compose, GitHub Actions | No lockfile; CI installs with `--no-frozen-lockfile`; no broad test suite. |
| Storefront UI foundation | Implemented / visually verified | Shared header + footer, hero carousel (autoplay, swipe, arrows, dots, pause, reduced motion), real-data category art cards, product rails, quick view, premium product cards, catalogue filters (sort, price, stock, sale, category), pagination, category/deals/store/help pages, branded 404/error | Copy is English-first with Bangla product fields only; no full accessibility audit or formal screenshot baseline. |
| Storefront / catalog | Partial → improved | Live product cards with approved images, search, filters, sorting, pagination, storefront pages | Hreflang/localised routes still absent; no saved-search or recommendation logic. |
| Customer OTP / sessions | Partial | OTP challenges, hashed challenge/session tokens, HttpOnly cookie | Real SMS provider, abuse controls, device/session UI and 2FA remain. |
| Profile / address book | Foundation | Profile and address CRUD, ownership/default handling | Bangladesh address master data and E2E remain. |
| Seller application | Foundation | Application UI/API, duplicate checks, pending state | NID/KYC evidence, seller agreement and verification remain. |
| Admin seller review | Partial | Admin/Staff review, permission check, audit, approval profile | Secure Admin bootstrap, 2FA and permission management UI remain. |
| **Seller product management** | Implemented / not integration-tested | List with status counts and search, create draft, edit, submit, archive/restore, ownership checks, price/compare-at validation, stable slug generation, `/seller/products` UI with live summary and lifecycle panel, image manager linked from each product | Migration unapplied; no integration/E2E tests; live edits bypass re-review; no bulk actions, variants or soft-delete. |
| **Admin product review** | Implemented / not integration-tested | `GET /admin/products`, `PATCH /admin/products/:id/review`, `PRODUCT_REVIEW` permission, audit log, rejection notes surfaced to seller, `/admin/products` console | Requires a Staff `PRODUCT_REVIEW` grant; approval does not require an approved image. |
| Cart / wishlist | Foundation | Persistent records, approved-product checks, stock checks | Cart does not reserve stock; checkout revalidates. |
| COD checkout / orders | Partial | Parent/child orders, snapshots, idempotency, transactional stock deduction | Online payments, full tax/invoice, comprehensive tests remain. |
| Cancellation / audit | Partial | Customer cancellation, stock restore, OrderEvent | Wider policy matrix and tests remain. |
| Seller order management | Partial | Seller dashboard, accept/reject, 24h deadline | Shipment updates exist in API; seller UI for courier entry is still thin. |
| Automatic expiry | Partial | Polling worker, transaction recheck, stock restore, Admin alert | Process-local worker; distributed lease/queue needed for multiple replicas. |
| Shipping / tracking | Partial | Shipment data, seller-entered events, customer tracking, Admin monitoring | No live carrier API/webhook or carrier-verified status. |
| Customer returns | Partial | Delivered-order return request, default 7-day window | Photo evidence, reverse pickup and tests remain. |
| Seller return review | Partial | Seller approve/reject and notes | Reverse logistics and stock disposition remain. |
| Admin return/dispute | Partial | Admin review states, audit, manual refund reference/method/amount | No payment transfer/provider refund or finance ledger. |
| Admin notifications/orders | Partial | In-app notification inbox; read-only order monitoring | Email/SMS/push and mutating Admin order controls absent. |
| Product media | Partial | S3 presigned upload, metadata/size HEAD check, seller UI, Admin moderation, approved images in catalogue/SEO, public gallery with thumbnails | Requires AWS config, CORS and CloudFront; no decode/re-encode, malware scan, EXIF strip, quota, orphan cleanup or sort/primary controls. |
| Technical SEO | Partial | Metadata, robots, sitemap, OG image, llms.txt, Product JSON-LD, canonical + breadcrumb JSON-LD | Replace assumed domain; correct hreflang after localised routes; deploy validation remains. |
| Online payments | Planned | COD only | bKash, Nagad, SSLCommerz, signed webhooks, reconciliation and automated refunds absent. |
| Inventory / warehouses | Partial foundation | Stock-on-hand and transactional mutations | Stock ledger, reservation, multiple warehouses/bins/transfers absent. |
| Finance / commissions / payouts | Planned | Manual refund recording only | Commission ledger, seller balance and payout lifecycle absent. |
| Coupons / loyalty | Planned | Product decisions only | Coupon engine and points ledger absent. |
| Social Studio / Creator | Planned | Product decisions recorded | Feature, age assurance, moderation and safety systems not implemented. |
| Legal / privacy / consent | Planned | Help centre states current behaviour only; no versioned acceptance flow | Legal documents, consent, export/deletion remain. |
| Analytics / BI | Planned | No production pipeline verified | Privacy-aware events and separate warehouse remain. |
| AWS production | Planned / not deployed | Target architecture documented | ECS/RDS/S3/CloudFront/SQS/Terraform, secrets, monitoring, backup/DR not deployed/verified. |
| QA / release readiness | Partial | Build/typecheck/schema/Compose/image CI; local typecheck and build evidence for this session | Unit/integration/E2E, security, load, accessibility, restore and UAT gates remain. |

## Web routes (current inventory)

- Public: `/`, `/products`, `/products/[slug]`, `/categories`, `/categories/[slug]`, `/deals`, `/stores`, `/stores/[storeSlug]`, `/help`, `/sell`.
- Customer: `/login`, `/signup`, `/account`, `/cart`, `/wishlist`, `/checkout`, `/orders`, `/orders/[id]`.
- Seller: `/seller/login`, `/seller/dashboard`, `/seller/products`, `/seller/products/new`, `/seller/products/[productId]`, `/seller/products/[productId]/images`.
- Admin: `/admin` (operations index), `/admin/login`, `/admin/seller-applications`, `/admin/products`, `/admin/product-images`, `/admin/orders`, `/admin/returns`, `/admin/notifications`.
- System: `/not-found`, route `error.tsx`, `robots.txt`, `sitemap.xml`, `opengraph-image`.
- API proxies live under `apps/web/src/app/api`; raw session tokens remain server-side in the HttpOnly cookie.

## API module inventory

- `auth`: OTP challenge/verify, session read/revoke.
- `catalog`: categories, product list/detail, storefront, store directory; list filters `search`, `category`, `sort`, `minPrice`, `maxPrice`, `inStock`, `onSale`.
- `customers`: profile, addresses, cart, wishlist, checkout, orders, returns/tracking.
- `health`: liveness/readiness.
- `sellers`: seller applications/orders, Admin review/notifications/orders/returns, product media, **seller products** (list/create/read/update/submit/archive/restore) and **Admin product review**. This module remains a documented mixed boundary.

## Database

- Latest migration name: `20261128120000_admin_login`.
- `20261128090000_seller_product_lifecycle` adds `Product.reviewNotes` and `Product.reviewedAt`.
- `20261128120000_admin_login` adds `ADMIN_LOGIN` to `OtpPurpose` (append-only enum value) so ADMIN/STAFF can sign in with the existing OTP flow.
- **P0 for fresh environments:** the repository's migration chain has no initial-schema migration — `prisma migrate deploy` on an empty database fails at `20261128000000_customer_orders` (`relation "User" does not exist`). The current schema was therefore validated locally with `prisma db push` plus `migrate resolve`; a reviewed baseline migration is required before any fresh deployment.
- Both migrations were applied to the local verification database; no shared/staging/production environment has run them.

## Recommended next sequence
1. Apply and verify the new migration on disposable PostgreSQL, then test seller product lifecycle, ownership isolation, Admin review and public visibility end to end.
2. Commit a lockfile and switch CI to `--frozen-lockfile`; add integration tests for money, ownership and lifecycle transitions.
3. Review the new storefront visually on the preview environment; run an accessibility pass on catalogue filters, gallery and seller forms.
4. Product media hardening: private S3 + CloudFront OAC, credential-provider/ECS role, decode/re-encode + malware scan, quotas, orphan cleanup, sort/primary controls.
5. Add payment domain and one sandbox provider with signed webhook + idempotent reconciliation.
6. Add inventory ledger/reservations and finance/commission ledger before payouts.
7. Integrate courier adapters and signed webhooks.
8. Complete Admin bootstrap, 2FA, RBAC management and security audit.
9. Build Social Studio only with age assurance and trust/safety operations.

## Update protocol
Every feature PR must update this ledger, `known_issues.md`, and relevant `docs/`. Record PR, commit, CI evidence, migrations and external setup separately. Never mark production-ready from CI or a local build alone.

## Session update — premium storefront & responsive pass

- Homepage hero carousel (autoplay, swipe, keyboard, pause, reduced motion), real-count category cards, product rails, promo and buyer-guide sections; empty catalogue state instead of fake data.
- Premium product card with wishlist, quick view and add-to-cart plus a shared cart-update event; rebuilt product detail with gallery/lightbox, purchase actions, sticky mobile bar and honest reviews empty state.
- Sign up (`/signup`), admin sign-in (`/admin/login`, `ADMIN_LOGIN` OTP) and `/admin` operations index.
- Rebuilt cart, three-step COD checkout with idempotency and address creation, account dashboard, orders list, wishlist, order confirmation banner.
- Seller sign-in now normalises local mobile numbers to E.164 (fixes silent “no code sent” for `017…` input).
- Verified: signup → cart → checkout → order, wishlist round trip, catalogue filters/sort, seller sign-in and product list, admin sign-in and approval, 60 viewport checks across public and authenticated pages (320–1920px) with no horizontal overflow.
- Not verified: seller product create/edit/image upload, order cancellation/returns, accessibility audit, automated tests. Fresh-environment migrations remain blocked (see P0 in `known_issues.md`).

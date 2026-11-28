# ANAN — Feature Status Ledger

> “Merged” means code exists on main; it does not mean production deployment, provider setup, migration execution or UAT is complete. Update this file in every feature PR.

## Snapshot
- Repository: `dipanjanswapna/anan-`; branch: `main`.
- Main HEAD at snapshot: `718b85f0d03d6c67e80d66d56f7305ff41e64359`.
- Latest feature: PR #27 Product Image Upload & Moderation, merged as `7f27c5d60aabcab442e8262858a1a1f618fbba7a`.
- PR #27 CI run `46133765708`, job `140944437785`: completed successfully (Prisma validation/generation, API build, Web typecheck/build, Compose validation and dev image build).
- Stack: pnpm, Next.js 15/React 19, NestJS 10, PostgreSQL 16, Prisma 6, Docker Compose.

## Status vocabulary
- **Implemented/merged**: code on main.
- **Partial**: foundation or subset only.
- **Planned**: product decision exists, code not verified.
- **Blocked**: named dependency prevents safe progress.
- **Not verified**: no evidence from a real environment/test.

## Feature matrix

| Feature | Status | Implemented | Remaining / caveat |
|---|---|---|---|
| Workspace / CI | Partial | pnpm monorepo, Next/Nest apps, Compose, GitHub Actions | No broad test suite; CI installs with `--no-frozen-lockfile`. |
| Storefront / catalog | Partial | Responsive home, catalog, search/filter/pagination, product details, stores | Full bilingual content/routes, accessibility and broad E2E remain. |
| Customer OTP / sessions | Partial | OTP challenges, hashed challenge/session tokens, HttpOnly cookie | Real SMS provider, abuse controls, device/session UI and 2FA remain. |
| Profile / address book | Foundation | Profile and address CRUD, ownership/default handling | Bangladesh address master data and E2E remain. |
| Seller application | Foundation | Application UI/API, duplicate checks, pending state | NID/KYC evidence, seller agreement and verification remain. |
| Admin seller review | Partial | Admin/Staff review, permission check, audit, approval profile | Secure Admin bootstrap, 2FA and permission management UI remain. |
| Cart / wishlist | Foundation | Persistent records, approved-product checks, stock checks | Cart does not reserve stock; checkout revalidates. |
| COD checkout / orders | Partial | Parent/child orders, snapshots, idempotency, transactional stock deduction | Online payments, full tax/invoice, comprehensive tests remain. |
| Cancellation / audit | Partial | Customer cancellation, stock restore, OrderEvent | Wider policy matrix and tests remain. |
| Seller order management | Partial | Seller dashboard, accept/reject, 24h deadline | Seller product CRUD and full fulfilment remain. |
| Automatic expiry | Partial | Polling worker, transaction recheck, stock restore, Admin alert | Process-local worker; distributed lease/queue needed for multiple replicas. |
| Shipping / tracking | Partial | Shipment data, seller-entered events, customer tracking, Admin monitoring | No live carrier API/webhook or carrier-verified status. |
| Customer returns | Partial | Delivered-order return request, default 7-day window | Photo evidence, reverse pickup and tests remain. |
| Seller return review | Partial | Seller approve/reject and notes | Reverse logistics and stock disposition remain. |
| Admin return/dispute | Partial | Admin review states, audit, manual refund reference/method/amount | No payment transfer/provider refund or finance ledger. |
| Admin notifications/orders | Partial | In-app notification inbox; read-only order monitoring | Email/SMS/push and mutating Admin order controls absent. |
| Product media | Partial | PR #27: S3 presigned upload, metadata/size HEAD check, seller UI, Admin moderation, approved images in catalog/SEO | Requires AWS config, CORS, CloudFront and migration deployment; image decoding/scanning/EXIF/quota/cleanup/gallery controls absent. |
| Technical SEO | Partial | Metadata, robots, sitemap, OG image, llms.txt, Product JSON-LD | Replace assumed domain; correct hreflang after localized routes; deploy validation remains. |
| Online payments | Planned | COD only | bKash, Nagad, SSLCommerz, signed webhooks, reconciliation and automated refunds absent. |
| Inventory / warehouses | Partial foundation | Stock-on-hand and transactional mutations | Stock ledger, reservation, multiple warehouses/bins/transfers absent. |
| Finance / commissions / payouts | Planned | Manual refund recording only | Commission ledger, seller balance and payout lifecycle absent. |
| Coupons / loyalty | Planned | Product decisions only | Coupon engine and points ledger absent. |
| Social Studio / Creator | Partial (PR in progress) | Creator profile, creator storefront, single IMAGE/VIDEO draft, submit-for-review flow, Admin moderation API/UI, public feed with PUBLISHED-only visibility | External HTTPS media URL only; no upload/scanning, age assurance, reporting/blocking, comments/likes, escalation or analytics. Not merged/deployed. |
| Legal / privacy / consent | Planned | No complete versioned acceptance flow verified | Legal documents, consent, export/deletion remain. |
| Analytics / BI | Planned | No production pipeline verified | Privacy-aware events and separate warehouse remain. |
| AWS production | Planned / not deployed | Target architecture documented | ECS/RDS/S3/CloudFront/SQS/Terraform, secrets, monitoring, backup/DR not deployed/verified. |
| QA / release readiness | Partial | Build/typecheck/schema/Compose/image CI | Unit/integration/E2E, security, load, accessibility, restore and UAT gates remain. |

## Web routes (current high-level inventory)
- Public: `/`, `/products`, `/products/[slug]`, `/stores/[storeSlug]`, `/sell`, `/social`, `/social/creators/[handle]`.
- Customer: `/login`, `/account`, `/cart`, `/wishlist`, `/checkout`, `/orders`, `/orders/[id]`.
- Seller: `/seller/login`, `/seller/dashboard`, `/seller/products/[productId]/images`.
- Admin: `/admin/seller-applications`, `/admin/orders`, `/admin/notifications`, `/admin/returns`, `/admin/product-images`, `/admin/social`.
- API proxies are under `apps/web/src/app/api`; keep raw session tokens server-side.

## API module inventory
- `auth`: OTP/session.
- `catalog`: public catalog.
- `customers`: profile, addresses, cart, wishlist, checkout, orders, returns/tracking.
- `health`: liveness/readiness.
- `sellers`: currently contains seller applications/orders, Admin review/notifications/orders/returns and product media. This mixed boundary is documented technical debt.
- `social-studio`: creator profile, single-media posts and moderation (new isolated module).

## Recommended next sequence
1. Product media hardening: private S3 + CloudFront OAC, credential-provider strategy/ECS role, image decode/re-encode + malware scan, quotas, orphan cleanup, migration runbook.
2. Improve CI and add unit/integration/E2E tests before expanding critical flows.
3. Build seller product list/create/edit and connect image manager.
4. Add payment domain and one sandbox provider with signed webhook + idempotent reconciliation.
5. Add inventory ledger/reservations and finance/commission ledger before payouts.
6. Integrate courier adapters and signed webhooks.
7. Complete Admin bootstrap, 2FA, RBAC management and security audit.
8. Build Social Studio only with age assurance and trust/safety operations.

## Update protocol
Every feature PR must update this ledger, `known_issues.md`, and relevant `docs/`. Record PR, commit, CI evidence, migrations and external setup separately. Never mark production-ready from CI alone.


## Active parallel development
- Social Studio branch: `feat/social-studio-creator-foundation` (PR pending). Initial Creator Foundation includes profile/storefront, single-media drafts, moderation submission/review and public feed. See `docs/social-studio.md`.


### Social Studio Trust & Safety update (branch in progress)
- Added report reason/status enums, `SocialPostReport` and `CreatorBlock` models plus migration `20261128113000_social_trust_safety`.
- Added authenticated post reporting, creator block/unblock, feed exclusion for blocked creators, Admin report queue and transactional report disposition/audit.
- Added public feed Report control, creator storefront Block control and Admin Report Review UI.
- Still not merged or deployed; CI, migration execution, integration tests and browser verification pending. Controlled media pipeline, age assurance, appeals, evidence retention and operational escalation remain.


### Social Studio controlled upload increment (PR #29 branch)
- Added direct-to-S3 presigned PUT flow scoped to the authenticated Creator Profile; generated keys live under `social/quarantine/<creator-profile-id>/`.
- Creator UI supports one JPEG/PNG/WebP image (10 MiB max) or MP4/WebM video (100 MiB max), followed by signed S3 HEAD verification before a DRAFT post is created.
- Legacy arbitrary external HTTPS media URL draft creation is disabled. Admin post approval remains required before feed/storefront publication.
- No schema migration added in this increment. CI run 46140234885 succeeded; follow-up block-state CI run 46144057851 is running. Not merged, deployed, or storage-configured.
- Malware scanning, media decoding/re-encoding, EXIF removal, codec/duration inspection, video transcoding, content classification, private-origin delivery, orphan cleanup and quotas remain outstanding.


### Social Studio creator block UX follow-up
- Added authenticated persisted block-status lookup; Creator Storefront Block/Unblock state now rehydrates after refresh.
- Fixed PATCH unblock routing and ensured signed-in viewers cannot open a creator storefront they have blocked.
- No migration required; uses the existing CreatorBlock relation. PR #29 remains open pending fresh CI and review.


## Social Studio — handoff snapshot (2026-11-28, PR #29; NOT merged)
- Active branch: `feat/social-studio-creator-foundation`.
- Latest observed feature HEAD: `c7ecca82b542cd9752db67190dcb5f1faa13e457`.
- PR: https://github.com/dipanjanswapna/anan-/pull/29
- PR base snapshot observed: `718b85f0d03d6c67e80d66d56f7305ff41e64359`; PR was reported one commit behind and `mergeable=false`. Re-check both SHAs before any work/merge.
- Scope now implemented on the feature branch: creator profile/storefront; one IMAGE or VIDEO per post; controlled S3 presigned upload into creator-scoped quarantine; submit/review flow; Admin/Staff report and comment moderation; post reporting; creator block/unblock and blocked-creators page; follow/unfollow, like/unlike, comments (pending review), save/unsave; in-app notifications; public and following feeds with cursor pagination; authenticated action rate limits; creator summary analytics.
- Safety guard: Admin cannot publish a post while its media URL remains under `social/quarantine/`. This intentionally fails closed; no media scanning/promotion pipeline exists yet.
- Rate limits (authenticated user, fixed-minute DB buckets): follow 20/min, like 60/min, comment 8/min, report 5/min. No IP/device/anonymous edge throttling.
- Analytics: followers, 30-day new followers, content status counts, 30-day likes/approved comments, latest 10 posts' like/comment totals. Reach/impressions are NOT implemented.
- Data migrations on branch include Social Studio foundation, trust/safety, engagement and rate-limit additions. Inspect exact migration directory and schema before adding any further migration; do not assume any have been deployed.
- Validation: an earlier foundation CI run succeeded (run 46144307456) but predates latest engagement/feed/rate-limit/analytics changes. No latest-head CI success is verified. No DB migration execution, browser/E2E, production storage config or deployment is verified.
- Read `docs/social-studio.md` for API routes, behavior, storage settings and remaining limitations.
- Next tasks, in order: (1) synchronize with latest main safely and re-check migration ordering/baseline; (2) add automated unit/integration tests and get latest-head CI green; (3) implement private quarantine + scanner/sanitizer + image re-encode/EXIF stripping + video codec/duration validation/transcoding + approved-object promotion; (4) add view/impression event model and privacy-aware analytics; (5) add appeals/evidence/escalation/retention and operational moderation workflow.
- Do not merge until PR is current with main, migration chain is reviewed, latest CI is green, security review passes and mergeability is confirmed. Never describe Social Studio as production-ready.

# ANAN — AI Coding Agent Rules & Session Handoff

> Mandatory for every AI coding session. Read this file, then `project_spec.md`, `feature_status.md`, and `known_issues.md`. The repository state and these files are authoritative, not chat-history assumptions.

## 1. Session-start protocol
1. Read all four root context files in this order: agents → project spec → feature status → known issues.
2. Inspect current GitHub `main` HEAD and open PRs. Never assume an old branch/SHA is current.
3. Inspect the target feature's actual source, route, DTO/API contract, Prisma model/migrations, tests and docs.
4. Declare feature owner, owned paths, shared dependencies, schema impact, acceptance criteria and out-of-scope work before coding.
5. If a request conflicts with a recorded decision, stop and document the conflict; do not silently invent a new product rule.
6. Do not start from memory alone; revalidate the code.

## 2. Architecture: modular monolith, feature-first boundaries
Keep the operational simplicity of one NestJS API and one Next.js app, but isolate business features behind explicit contracts. Avoid premature microservices and avoid large-scale directory moves without tests.

### Target API feature shape
```text
apps/api/src/modules/<feature>/
  api/                 # Nest controllers, request/response DTOs
  application/         # use cases, orchestration, ports
  domain/              # business rules, state transitions, value objects
  infrastructure/     # Prisma repositories, provider adapters, queues
  tests/
  <feature>.module.ts
  index.ts              # deliberate public exports only
```
For small existing modules, keep current Nest structure until incremental extraction is justified. These are logical boundaries, not a demand for empty folders.

### Target Web feature shape
```text
apps/web/src/
  app/                  # thin route/page composition
  features/<feature>/
    components/
    hooks/
    api/
    schemas/
    types/
    tests/
  shared/               # genuinely shared design/API primitives
```
App Router pages should become thin: params, metadata, auth boundary and composition. Do not bulk-move existing routes without route-level regression tests.

### Logical ownership map (current physical paths may overlap)
| Domain | Logical owner | Existing hotspots |
|---|---|---|
| Identity/session | identity | `apps/api/src/modules/auth`; login and account/seller proxies |
| Catalog | catalog | `apps/api/src/modules/catalog`; products/stores pages |
| Customer profile | customer-profile | `apps/api/src/modules/customers/customers.*`; account |
| Cart/wishlist | cart | `customer-commerce.*`; cart/wishlist pages |
| Checkout/orders | checkout + orders | `customer-commerce.*`; seller order services; order pages |
| Seller onboarding | seller-onboarding | `seller-applications.*`; Admin seller review |
| Seller operations | seller-operations | `seller-orders.*`; seller dashboard |
| Product media | product-media | `product-images.*`; seller media and Admin moderation |
| Returns/disputes | returns | customer/seller/Admin return controllers and pages |
| Shipping | shipping | shipment/tracking logic and order tracking UI |
| Admin operations | admin-operations | Admin notifications/orders/returns/review |
| Health/platform | platform-health | health module, app bootstrap/config |
| SEO | seo | robots, sitemap, metadata, OG image |

## 3. Isolation rules — mandatory
- One agent owns one feature boundary and its tests/docs. No opportunistic unrelated refactor.
- Do not edit another active agent's owned files without coordination and explicit handoff.
- Shared hot spots requiring coordination: `apps/api/prisma/schema.prisma`, `apps/api/src/app.module.ts`, `apps/api/src/modules/sellers/sellers.module.ts`, `apps/api/src/modules/customers/customers.module.ts`, `apps/web/src/app/layout.tsx`, root package/workspace files and CI workflow.
- If a shared file must change, list it in the plan and PR; keep diff minimal.
- A feature must not import another feature's private service/repository/entity. Use exported application contract, port or documented event.
- No circular feature dependencies. Move only genuinely generic primitives to platform/shared, with tests and explicit ownership.
- Do not create a dumping-ground `common` folder.
- Web UI must call typed API boundaries; it must not access Prisma/Nest internals.
- Enforce customer/seller ownership and Admin permission in backend services, not only in UI.
- Cross-feature workflows (checkout→inventory, order→shipping, return→finance) must be explicit orchestration, not casual cross-table writes.

## 4. Database/migration rules
- Prisma schema is shared and high-conflict; coordinate all edits.
- One feature PR adds the smallest schema change and one new timestamped migration.
- Migrations are append-only. Never edit an applied migration.
- Never use `prisma db push` in production. Use reviewed `prisma migrate deploy` in a controlled release job.
- Consider indexes, constraints, lock duration and rollback.
- Money is integer paisa/BigInt or approved precise decimal; serialize BigInt safely.
- Stock/order/payment/return/payout transitions require transaction boundaries, concurrency strategy and idempotency.
- Use expand → backfill → switch → contract for destructive schema changes.
- A designated integration owner sequences concurrent migrations.

## 5. API/security rules
- Validate every external input; use explicit DTOs and safe errors.
- Protected mutations require authentication, role/permission checks and resource ownership checks.
- Never trust client amount, price, stock, sellerId, role, refund result or payment status.
- Preserve API version prefix `/api/v1`; document contract changes and update consumers together.
- Paginate lists with bounded limits.
- Verify external webhook signatures, replay protection and idempotency.
- Never expose raw bearer session tokens to browser JS; retain HttpOnly cookie + server proxy pattern.
- Never log secrets, OTP values, session tokens, payment credentials or private identity data.

## 6. UI rules
- Mobile-first, responsive and accessible keyboard/focus behavior.
- Provide loading, empty, error and success states; do not claim success before API confirmation.
- Maintain ANAN purple brand direction and Bangla/English readiness.
- Validate external URLs and render user content safely.

## 7. Git / PR workflow
1. Start from latest `origin/main`; never commit directly to main.
2. Branch names: `feat/<domain>-<capability>`, `fix/<domain>-<issue>`, `docs/<topic>`.
3. One coherent feature/fix per PR.
4. Update from main before final checks when shared files changed.
5. Report actual commands and results. Never claim tests ran if only code was inspected.
6. Do not merge pending/failing CI or a stale/unmergeable PR.
7. Before merge, verify PR open + mergeable + exact head SHA; use expected-head guard.
8. Verify merge commit and new main SHA after merge.
9. Never force-push over another agent's branch or discard its work.

## 8. PR checklist
- [ ] Scope, owner, acceptance criteria and owned paths stated.
- [ ] No unrelated refactor or unannounced shared-file edits.
- [ ] Input validation, auth, permission and ownership checks.
- [ ] Tests for success, failure, unauthorized access and concurrency/idempotency where relevant.
- [ ] Migration reviewed; no historical migration edited.
- [ ] UI loading/error/empty/mobile/accessibility states.
- [ ] Feature documentation updated.
- [ ] `feature_status.md` updated honestly.
- [ ] `known_issues.md` updated for new/resolved risks.
- [ ] CI passed; merge SHA verified if merged.

## 9. End-of-session handoff
Update root context files whenever understanding/status changes. Handoff must include:
- current main SHA, branch and PR;
- exact files/modules changed;
- completed work and evidence (commands, CI run/job, PR/commit);
- pending tasks and blockers;
- migrations/config/provider steps not performed;
- known risks and one best next task.

Never say “done” if code is drafted only, CI is pending, migration is unapplied or external services are unconfigured.

## 10. Agent task template
```text
Feature owner:
Goal / acceptance criteria:
Owned paths:
Shared files requiring coordination:
API contract:
Database / migration:
Dependencies:
Tests to add/run:
Out of scope:
Known risks:
Handoff / status updates:
```

## 11. Safe parallelism
Good: one agent builds an isolated Social Studio UI; another researches/designs a payment adapter without editing shared Prisma schema; another performs accessibility fixes in a separately assigned route set; another builds seller product-list UI.
Unsafe: two agents editing schema/migrations simultaneously; multiple agents editing sellers.module.ts/app.module.ts; one changing API response while another independently changes its consumer; multiple agents editing customer-commerce service concurrently.


## Active feature handoff — Social Studio (2026-11-28)
- Owner: Social Studio feature agent only. Branch: `feat/social-studio-creator-foundation`. PR #29: https://github.com/dipanjanswapna/anan-/pull/29. Latest observed HEAD: `c7ecca82b542cd9752db67190dcb5f1faa13e457`. PR was open, one commit behind main and `mergeable=false`; re-fetch live PR and main before proceeding.
- Primary owned paths: `apps/api/src/modules/social-studio/**`, Social Studio web routes/components/proxies under `apps/web/src/app/social/**` and `apps/web/src/app/api/social/**`, relevant Admin Social UI/API proxy, Social Studio Prisma models/migrations, `docs/social-studio.md`, and Social Studio sections in the root status/risk docs.
- Shared hot spots: `apps/api/prisma/schema.prisma`, `apps/api/src/app.module.ts`, `apps/web/src/app/layout.tsx`, CI and shared auth/session helpers. Coordinate before changing; never overwrite concurrent changes or migrations.
- Current branch includes creator profile/storefront; single IMAGE/VIDEO post; S3 presigned quarantine upload; moderation submission/review; post reports; creator block/unblock; follow/like/comments/save; notifications; cursor-paginated public/following feeds; per-user DB rate limits; initial creator analytics. Exact API contracts and limitations are in `docs/social-studio.md`.
- Publication safety: quarantine URLs are explicitly rejected by Admin approval. Do not bypass this guard to make posts appear. Implement scanning/sanitization and controlled promotion before publication.
- Product constraints remain: no carousel, paid sponsored placement, DMs or live commerce; no 18+ until genuine age assurance. Organic single-media posts only.
- Validation truth: run 46144307456 passed for an earlier foundation commit, not latest HEAD. Latest-head CI, migration deployment, automated tests, browser/E2E, production S3/CloudFront and deployment are NOT verified.
- Next best task: synchronize PR branch with current main using a safe merge/rebase after inspecting all changed paths and migrations; then add automated Social Studio API tests and get fresh CI green. Do not merge while stale/unmergeable or CI unverified.

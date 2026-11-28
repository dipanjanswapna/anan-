# ANAN — Known Issues, Risks & Launch Blockers

> Evidence-based risk register. Keep issues open until a fix is merged and verified. “Not verified” is not proof of failure; it means evidence is missing.

## Severity
- **P0 Critical:** data loss, unauthorized access, financial/security incident, launch-stopping outage.
- **P1 High:** production launch blocker or major workflow risk.
- **P2 Medium:** important quality, operations or maintainability gap.
- **P3 Low:** cleanup/non-blocking improvement.

## Open risks

### P0 — Migration baseline requires CI replay and existing-database cutover
- **Area:** Database / release.
- **Evidence:** The first historical migration, `20261128000000_customer_orders`, creates order tables but references `User`, `SellerProfile` and `Product`; those base tables were missing from migration history. A baseline migration has now been added at `20261127000000_baseline`, reconstructed from the Prisma schema immediately before the first orders migration (commit `d3ec652c138c332ba7065f394ce0d7a49169fd9c`).
- **Impact:** Fresh database creation should now be possible only if the baseline accurately matches that historical schema and every subsequent migration replays successfully. Existing databases already containing the baseline objects must not execute its SQL.
- **Action:** CI now provisions disposable PostgreSQL 16 and runs the complete `prisma migrate deploy` chain. For each existing database with the baseline objects already present but no baseline migration record, take a verified backup and follow `docs/database/migration-baseline-cutover.md` to mark the baseline as applied (never execute the baseline SQL against populated tables). Confirm schema parity before any release.
- **State:** Fix proposed in PR; do not remove the P0 launch block until fresh-database migration CI passes and the existing-database cutover is reviewed.

### P1 — No verified production deployment or recovery exercise
- **Area:** AWS / operations.
- **Evidence:** Repository contains local Compose and target AWS architecture; no deployed ECS/RDS/CloudFront environment or backup-restore/DR exercise is recorded.
- **Impact:** Do not call ANAN production-launched or claim 99.99% availability.
- **Action:** Terraform, network/security groups, ECS, RDS, secrets, monitoring/alarms, backups, restore and DR; controlled migration job.
- **State:** Open; production not verified.

### P1 — Online payment integration absent
- **Area:** Payments / finance.
- **Evidence:** COD path exists; bKash/Nagad/SSLCommerz integration, signed webhooks, reconciliation and provider refunds are not verified.
- **Impact:** No verified online collection or automated refund.
- **Action:** Payment intent + provider adapter, sandbox integration, signature verification, replay protection, idempotent webhook inbox, ledger and reconciliation.
- **State:** Open; planned.

### P1 — Admin bootstrap and strong authentication incomplete
- **Area:** Identity / Admin.
- **Evidence:** `ADMIN_LOGIN` OTP sign-in and `/admin/login` now exist and were verified end to end, but secure provisioning, a second factor, recovery, and a permission-management UI are still absent. OTP remains the only admin factor.
- **Impact:** Privileged account lifecycle is not production-ready; a compromised SIM is sufficient to sign in.
- **Action:** Break-glass bootstrap, MFA, recovery, session/device revocation, permission-management UI and audit review screens.
- **State:** Open; sign-in path partially closed this session.

### P1 — Product media needs AWS configuration and safe image processing
- **Area:** Product media.
- **Evidence:** PR #27 verifies S3 object metadata and size, but does not decode pixels, enforce dimensions, strip EXIF, scan malware or re-encode. Bucket/CORS/CloudFront are not deployed/verified.
- **Impact:** Metadata checks alone do not establish file safety; uploads require storage setup.
- **Action:** Prefer AWS SDK credential provider chain/ECS task role over long-lived static keys; private S3 + CloudFront OAC; isolated decode/re-encode and malware scan; dimension checks, quota/rate limit, orphan cleanup; exact-origin CORS; test against sandbox S3.
- **State:** Open; feature merged, hardening incomplete.

### P1 — Order expiry worker uses process-local coordination
- **Area:** Orders / background jobs.
- **Evidence:** Polling worker and in-process overlap guard; guard is not shared between API replicas.
- **Impact:** Multiple replicas can process the same overdue workload concurrently.
- **Action:** SQS/EventBridge + idempotent consumer, or single dedicated worker with database lease/lock, monitoring and concurrency tests.
- **State:** Open; single-process foundation only.

### P1 — Courier tracking is seller/admin-entered
- **Area:** Shipping.
- **Evidence:** No live carrier adapter or verified carrier webhook.
- **Impact:** Tracking and delivery status are not independently carrier-verified.
- **Action:** Provider adapters, signed webhook validation, replay protection, event dedupe, retry/DLQ and reconciliation.
- **State:** Open; partial.

### P1 — Return/refund records do not move money
- **Area:** Returns / finance.
- **Evidence:** Admin can record an external/manual refund method, amount and reference. No provider refund or full finance ledger is verified.
- **Impact:** Do not imply the platform transferred funds or reconciled payment.
- **Action:** Explicit UI wording; finance ledger, provider adapters, reconciliation and evidence.
- **State:** Open; partial.

### P1 — Migration discipline needs production workflow
- **Area:** Database / CI.
- **Evidence:** The CI workflow is being updated to replay the migration chain against disposable PostgreSQL 16. Local Compose still uses `prisma db push` for developer convenience; production migration execution is not recorded.
- **Impact:** Migration order/drift/rollback problems may be discovered late if CI replay is bypassed or production uses schema push.
- **Action:** Require the fresh-database migration CI check; production uses reviewed `prisma migrate deploy` as a one-shot release job, never `db push`.
- **State:** CI enforcement proposed in PR; production workflow remains open.

### P2 — CI dependency install is not frozen
- **Area:** Reproducibility.
- **Evidence:** `.github/workflows/ci.yml` uses `pnpm install --no-frozen-lockfile`.
- **Impact:** CI does not strictly enforce committed dependency resolution.
- **Action:** Maintain lockfile and switch to `pnpm install --frozen-lockfile`.
- **State:** Open.

### P2 — Critical-flow test coverage not demonstrated
- **Area:** QA.
- **Evidence:** Current CI validates Prisma, builds API, typechecks/builds Web, validates Compose and builds dev image. Broad unit/integration/E2E/security/performance/accessibility suites are not demonstrated.
- **Impact:** Transaction, authorization, expiry, return, refund and concurrency regressions may pass build-only CI.
- **Action:** Disposable PostgreSQL integration tests; customer/seller/Admin E2E; auth matrix; race/idempotency tests; security, load and accessibility scans.
- **State:** Open.

### P2 — API modules have mixed feature ownership
- **Area:** Architecture / AI parallelism.
- **Evidence:** `apps/api/src/modules/sellers` contains seller onboarding/orders, Admin review/notifications/orders/returns and product images; `customers` contains several commerce workflows.
- **Impact:** Agents collide on shared services, module registration and Prisma schema.
- **Action:** Apply ownership rules in `agents.md`; extract bounded modules incrementally with contract/regression tests. Avoid big-bang refactor.
- **State:** Open; mitigation documented.

### P2 — Seller product lifecycle lacks integration tests and environment verification
- **Area:** Seller products / QA.
- **Evidence:** Seller product list/create/edit/submit/archive/restore and Admin `POST`-review endpoints were added with ownership and validation rules, but no PostgreSQL was available in the authoring environment. The append-only migration was not applied, and no integration or E2E test exercises the flow.
- **Impact:** A defect in a lifecycle transition, permission check or migration could reach production unnoticed. Compilation is not flow verification.
- **Action:** Apply the migration to disposable PostgreSQL; test seller ownership isolation, price/compare-at validation, submit-without-image rejection, Admin permission failure, approve/reject audit rows, and public catalogue visibility after approval.
- **State:** Open; feature merged, verification pending.

### P2 — Live product edits bypass re-review
- **Area:** Catalogue integrity.
- **Evidence:** Editing an `APPROVED` product keeps it live; only the Admin product-review step gates first publication.
- **Impact:** A seller can change price, copy or stock on a public listing without a fresh review, and a previously reviewed description can become misleading.
- **Action:** Decide the policy: either return approved products to `PENDING_APPROVAL` on copy/media changes, or add a moderation flag and periodic re-review. Document the chosen rule in the seller product doc.
- **State:** Open; deliberate trade-off, needs product sign-off.

### P3 — Product gallery is read-only
- **Area:** Catalog / media.
- **Evidence:** Public product pages now render every approved image in an accessible gallery with thumbnails. Sellers cannot yet reorder images, choose a primary image, or delete an image, and Admin cannot change the primary selection.
- **Impact:** Display order is fixed by upload order; a rejected or poor first image can only be fixed by approval of a new one.
- **Action:** Add seller sort/primary controls with server-side ownership checks and an Admin override.
- **State:** Partially resolved; gallery shipped, controls open.

### P2 — SEO domain and localization require correction
- **Area:** SEO.
- **Evidence:** Metadata fallback and llms.txt assume `https://anan.com`; domain ownership is unconfirmed. en-BD/bn-BD alternates point to root while localized route structure is not established.
- **Action:** Set verified owned domain and implement localized URLs before distinct hreflang; validate sitemap/robots/JSON-LD on deployment.
- **State:** Open.

### P2 — Social Studio safety prerequisites absent
- **Area:** Social Studio.
- **Evidence:** Product decisions exist, but full product and safety systems are not implemented.
- **Impact:** UGC without age assurance, moderation, abuse reporting, escalation and operational response is unsafe to launch.
- **Action:** Make safety, age assurance, reporting, blocking/muting, evidence retention and escalation release prerequisites.
- **State:** Open; planned.

### P3 — Project status can drift across AI sessions
- **Area:** Governance.
- **Evidence:** Implementation history outgrew a single canonical handoff.
- **Action:** Update root context files and feature docs in each relevant PR, with evidence and next steps.
- **State:** Mitigation added in this PR.

## Not verified / do not claim
- Seller product create/edit/submit, Admin product approval and the new catalogue filters have not been exercised against a real API or PostgreSQL.
- Migration `20261128090000_seller_product_lifecycle` has not been applied to any environment.
- The new storefront routes and seller/admin screens have not been reviewed in a browser, at multiple viewports, or with assistive technology.
- Production AWS credentials, bucket, CloudFront distribution, SMS provider or courier credentials are configured.
- Production database migrations have been applied.
- Real payment collection or automated refunds work.
- Backup restore, DR, 99.99% availability, load testing or formal security audit passed.
- Local Windows/Docker runtime works; this documentation task uses GitHub repository/CI evidence only.

## Resolution policy
Retain a short resolved entry with issue, former severity, PR/commit, tests/CI evidence and remaining operational action. Do not erase history without evidence.

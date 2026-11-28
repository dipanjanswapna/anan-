# ANAN — Known Issues, Risks & Launch Blockers

> Evidence-based risk register. Keep issues open until a fix is merged and verified. “Not verified” is not proof of failure; it means evidence is missing.

## Severity
- **P0 Critical:** data loss, unauthorized access, financial/security incident, launch-stopping outage.
- **P1 High:** production launch blocker or major workflow risk.
- **P2 Medium:** important quality, operations or maintainability gap.
- **P3 Low:** cleanup/non-blocking improvement.

## Open risks

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
- **Evidence:** Protected Admin/Staff endpoints and permission checks exist; secure provisioning, password + authenticator 2FA, recovery and permission-management UI are not verified complete.
- **Impact:** Privileged account lifecycle is not production-ready.
- **Action:** Break-glass bootstrap, MFA, recovery, session/device revocation and audit controls.
- **State:** Open.

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
- **Evidence:** Compose runs `prisma db push`; CI validates schema/generates client but does not apply migration chain to disposable PostgreSQL. Production migration execution is not recorded.
- **Impact:** Migration order/drift/rollback problems may be discovered late.
- **Action:** Run migrations in CI against ephemeral PostgreSQL; production uses reviewed `prisma migrate deploy` as a one-shot release job, never `db push`.
- **State:** Open.

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

### P2 — Seller product CRUD/list workflow incomplete
- **Area:** Seller products.
- **Evidence:** Product media route is addressed by known product ID; complete seller product list/create/edit lifecycle is not verified.
- **Impact:** Media feature is not discoverable through a full seller product workflow.
- **Action:** Seller product list/create/edit and link media management from product detail.
- **State:** Open.

### P2 — Product gallery controls incomplete
- **Area:** Catalog / media.
- **Evidence:** Public detail uses first approved image; ordering/primary controls and gallery are not complete.
- **Action:** Gallery, sort/primary controls and server-side authorization.
- **State:** Open.

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
- Production AWS credentials, bucket, CloudFront distribution, SMS provider or courier credentials are configured.
- Production database migrations have been applied.
- Real payment collection or automated refunds work.
- Backup restore, DR, 99.99% availability, load testing or formal security audit passed.
- Local Windows/Docker runtime works; this documentation task uses GitHub repository/CI evidence only.

## Resolution policy
Retain a short resolved entry with issue, former severity, PR/commit, tests/CI evidence and remaining operational action. Do not erase history without evidence.


### P2 — Social Studio trust, safety and media pipeline incomplete
- **Area:** Social Studio / user-generated content.
- **Evidence:** Initial Creator Foundation is under development on `feat/social-studio-creator-foundation`; media is accepted as an HTTPS URL and post approval is a basic Admin review workflow.
- **Impact:** This is not launch-ready UGC infrastructure. External media is not uploaded to controlled storage, decoded/re-encoded, malware scanned or checked for ownership/codec/duration. Age assurance, reporting, blocking/muting, appeals, evidence retention, escalation and staffed response are absent.
- **Action:** Keep 18+ content disabled until genuine age assurance exists. Add controlled media upload/processing, user reporting and block/mute controls, moderation policy tooling, audit/evidence retention, escalation/SLA and operational staffing before public launch.
- **State:** Open; initial foundation in progress, not merged or deployed.


### P2 — Social Studio trust and media controls remain incomplete
- **Area:** Social Studio / user-generated content.
- **Evidence:** The active Social Studio feature branch now includes post reporting, creator block/unblock, feed filtering for blocked creators, and Admin report disposition with audit. It still accepts externally hosted HTTPS media URLs.
- **Impact:** Report/block primitives do not constitute a full Trust & Safety operation; harmful media may evade detection and blocked creators can still be opened directly by URL.
- **Action:** Add controlled upload and media processing/scanning, age assurance before any 18+ features, creator profile block-aware handling, appeals, evidence retention, abuse controls, escalation and staffed response. Add DB integration/E2E tests and verify migration deployment.
- **State:** Partial implementation on PR #29 branch; not merged/deployed; CI pending.


### P2 — Social Studio media upload is only a first storage gate
- **Area:** Social Studio / user-generated content.
- **Evidence:** PR #29 branch now supports authenticated presigned S3 uploads and signed HEAD checks for JPEG/PNG/WebP images (10 MiB) and MP4/WebM videos (100 MiB). External URL draft creation is disabled.
- **Impact:** MIME/size/HEAD verification does not detect malware, spoofed media, unsafe visual/audio content or malicious payloads. No decoding/re-encoding, EXIF removal, codec/duration inspection, transcoding, quarantine-to-approved promotion, private delivery guarantee, quotas or orphan cleanup exists. If the configured bucket/CDN exposes the quarantine prefix, an uploaded object may be directly reachable even while its post is not published in ANAN feeds.
- **Action:** Configure a private quarantine origin, implement malware/content scanning and media normalization, enforce video duration/codec, promote only approved assets to a separately controlled delivery origin, add quotas/rate limits/orphan cleanup, then complete security and integration testing.
- **State:** Partial implementation on PR #29 branch; not merged/deployed; CI run 46140234885 pending at documentation update.

# Prisma migration baseline remediation runbook

**Status: investigation / design only. No migration has been changed or applied by this runbook.**

## Why this is a release blocker

The current migration directory begins with `20261128000000_customer_orders`. That SQL creates `Order`, `SellerOrder` and `OrderItem`, then adds foreign keys to `User`, `SellerProfile` and `Product`. The first migration does not create those referenced tables. The checked-in history has no earlier foundational baseline migration.

A successful `prisma validate` or `prisma generate` checks the schema/client, not whether the SQL history can build an empty database. Do not infer migration readiness from build CI.

## Non-negotiable safety rules

- Never run `prisma migrate reset`, `db push`, `migrate resolve`, or `migrate deploy` against production/shared/staging data as an experiment.
- Never mark a migration applied merely to make deployment green.
- Never rewrite/delete migration files that may already be recorded in a shared database until every environment's `_prisma_migrations` history and schema have been inventoried.
- Take and verify a restorable backup before any adoption operation.
- Use disposable PostgreSQL databases for all destructive tests. Confirm the target database name/host before every command.
- Keep credentials out of logs, PRs and committed files.

## Required investigation before authoring SQL

1. Inventory all environments (local, preview, staging, production) and determine whether any migration was applied. Capture the migration names/checksums/status from `_prisma_migrations` and a schema-only dump; do not expose customer rows.
2. Locate the exact historical Prisma schema that existed immediately before `20261128000000_customer_orders` was authored. Use Git history and PR diffs, not today's complete schema as a proxy.
3. List every table, enum, index, unique constraint and foreign key that the first and subsequent migrations expect to pre-exist. Review all migration SQL in chronological order.
4. Agree on a migration strategy based on evidence:
   - If no shared environment has applied the current history, a coordinated history correction may be possible, but it still needs a migration plan and independent review.
   - If any environment has applied migrations, preserve that environment's recorded history. Build an additive compatibility strategy; do not replace the migration chain or alter applied checksums.
5. Have a second engineer review the proposed baseline SQL against the historical schema and the first existing migration before it is committed.

## Test gates (must all pass before merge)

### A. Empty database replay

- Start a brand-new disposable PostgreSQL instance/database with the same major version as the deployment target.
- Set `DATABASE_URL` only in the test process/environment to that disposable database.
- Run `pnpm --filter @anan/api exec prisma migrate deploy`.
- Require exit code 0 and verify `prisma migrate status` reports no pending migrations.
- Compare the resulting schema to the current Prisma datamodel using Prisma's schema diff tooling. Investigate every difference; do not automatically accept destructive diffs.
- Run Prisma Client generation, API tests and seed only if the seed is explicitly designed to be repeatable.

### B. Existing-database adoption rehearsal

- Restore a verified backup into an isolated disposable database.
- Capture `_prisma_migrations` rows and a schema-only dump before changes.
- Compare actual tables, columns, types, defaults, indexes, constraints and migration checksums against the intended state.
- Rehearse the proposed adoption procedure on the restored copy only. Any `prisma migrate resolve --applied` command must be justified migration-by-migration by proven schema equivalence and reviewed evidence.
- Verify application reads/writes, critical order flows and rollback/recovery procedures on the copy.
- Production adoption requires a separately approved maintenance window and a fresh verified backup.

### C. CI gate

Add a dedicated CI job using a disposable PostgreSQL service. It must run the actual migration chain with `prisma migrate deploy`; schema validation/client generation alone are insufficient. Keep the migration smoke test isolated from build-only jobs and fail the PR if replay fails.

## Required evidence in the eventual PR

- Historical schema source commit and migration inventory.
- Exact SQL diff and reviewer sign-off.
- Empty-database replay logs and final migration status.
- Existing-database rehearsal report (schema-only; no customer data).
- CI run URL and PostgreSQL version.
- Explicit statement of which real environments have or have not had migrations applied.

## Current safe conclusion

The first migration references foundational tables that are not created by that migration, and no earlier baseline is present in the checked-in directory. A fresh-database `migrate deploy` must be treated as blocked until the above replay test proves otherwise. No live database has been modified as part of this audit.

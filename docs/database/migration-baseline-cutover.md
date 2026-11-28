# Prisma baseline migration and existing database cutover

## What the baseline represents

`20261127000000_baseline` creates the tables, enums, indexes and foreign keys that existed immediately before `20261128000000_customer_orders`. It is based on the historical Prisma schema at commit `d3ec652c138c332ba7065f394ce0d7a49169fd9c`.

The baseline is deliberately the first migration. Fresh databases must run it normally, followed by every later migration.

## Fresh database

For a genuinely empty PostgreSQL database, do not run `db push` and do not mark the baseline as applied. Run:

```bash
pnpm --filter @anan/api exec prisma migrate deploy
```

CI runs this command against a disposable PostgreSQL 16 instance. The database must be empty and the migration chain must complete without manual intervention.

## Existing database that already has the baseline schema

**Never execute the baseline SQL against a database that already contains its tables or enum types.** First:

1. Take a database backup and verify that it can be restored.
2. Confirm that the baseline objects exist and match the historical pre-orders schema.
3. Confirm the database's `_prisma_migrations` history and determine which later migrations have already been applied.
4. If this database is already using the later migration chain and only the baseline record is missing, mark only the baseline as applied:

```bash
pnpm --filter @anan/api exec prisma migrate resolve --applied 20261127000000_baseline
pnpm --filter @anan/api exec prisma migrate status
pnpm --filter @anan/api exec prisma migrate deploy
```

Use the production `DATABASE_URL` only in a secured release environment; never put credentials in shell history, logs, tickets or chat.

## Database created using `prisma db push` with no migration history

Do not blindly run the commands above. A database pushed from the current (latest) Prisma schema may already contain tables and columns created by later migrations too. Marking only the baseline as applied would cause subsequent migrations to try to create objects that already exist.

For this case, stop and perform a schema-and-data inventory against the exact target database. Prepare a reviewed adoption plan that accounts for every migration already represented in the database, then test the plan on a restored copy before touching the target. Do not use `migrate resolve` for all migrations as a shortcut without proving schema parity.

## Release rules

- Production schema changes use a reviewed one-shot `prisma migrate deploy` release job.
- Never use `prisma db push` in staging or production.
- Never run the baseline SQL manually on a populated database.
- A green build is not evidence that a production database has been safely adopted.
- Keep a verified backup and a tested restore path before any cutover.

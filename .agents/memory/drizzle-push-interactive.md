---
name: drizzle-kit push interactive prompt
description: How to add a new table when db:push blocks on a TTY rename prompt
---

# drizzle-kit push rename prompt cannot be answered via piped stdin

When adding a NEW table, `npm run db:push` (drizzle-kit push) may show an interactive
"Is X created or renamed from another table?" select prompt. In this environment that
raw-TTY prompt does **not** accept piped input (`printf '\n' | ...` is ignored), even
with `--force`.

**Why:** drizzle-kit's rename detection prompt reads from a raw TTY, not normal stdin,
so non-interactive automation hangs/loops on it.

**How to apply:** Create the table (and any unique indexes) directly with
`psql "$DATABASE_URL" -c "CREATE TABLE IF NOT EXISTS ..."` matching the Drizzle column
types, then keep the table definition in `shared/schema.ts` so the ORM and types stay
in sync. Verify with `psql "$DATABASE_URL" -c "\d <table>"`.

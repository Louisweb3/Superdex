---
name: Supabase database connection
description: How this app connects to Supabase Postgres and the gotchas around connection strings and TLS.
---

# Supabase connection

The app connects to Supabase via the standard `pg` driver (`drizzle-orm/node-postgres`).
`server/connection.ts` parses `SUPABASE_DATABASE_URL` (falls back to `DATABASE_URL`)
into DISCRETE pg Pool fields rather than passing the URI string. `server/db.ts` and
`drizzle.config.ts` both consume that helper.

**Why discrete fields, not the URI string:** Supabase-generated passwords often contain
`# % ? &` which break URI/percent-decode parsers (libpq and pg-connection-string both
fail). Passing user/password/host/port/database directly to pg sidesteps all encoding.
The parser also unwraps a password left inside `[...]` (a half-replaced `[YOUR-PASSWORD]`
placeholder) and trims whitespace — a very common paste mistake.

**TLS constraint (do not "fix" naively):** the Supabase pooler presents a cert signed by
Supabase's own CA, not in Node's default trust store. `rejectUnauthorized: true` fails with
`SELF_SIGNED_CERT_IN_CHAIN`. So we use `ssl: { rejectUnauthorized: false }` (traffic is still
encrypted). For full verification, set `DATABASE_SSL_CA` to Supabase's CA PEM — the helper
then switches to verified TLS.

**How to apply:** any new DB connection path must go through `getPoolConfig()` /
`getEncodedConnectionUrl()`, never `new Pool({ connectionString })` directly, or it will
break on special-char passwords and the TLS chain.

**Migration note:** data was moved with `pg_dump --no-owner --no-acl --clean --if-exists`
then `psql -f`. Schema uses varchar UUID/text primary keys (no sequences/serials), so there
is no sequence resync step after a dump/restore.

---
name: Supabase migration approach
description: How to extract production DB data (via executeSql) and restore to Supabase (via Node pg) for SuperSwap
---

## Rule
Production DB → Supabase migration uses two steps:
1. **Extract**: `executeSql({environment:"production"})` with `json_agg(t)` batching (2000 rows/batch); parse output by stripping outer CSV `"` wrapper and replacing `""` with `"`.
2. **Restore**: Node.js script using `pg` Pool with `parseConnectionUrl` regex (literal password, no URL-decoding) from `server/connection.ts`.

**Why:** `psql` fails because the Supabase password contains special chars that break URL parsing. The Node pg driver with discrete fields bypasses all percent-encoding issues. `new URL().password` also fails (it URL-decodes; password must be literal).

## How to apply
- Run restore script from project root (needs node_modules/pg accessible)
- Use `ssl: { rejectUnauthorized: false }` — Supabase pooler uses self-signed CA chain
- `SUPABASE_DATABASE_URL` is a global Replit secret; applies to both dev and prod deployments automatically once set

import { Pool } from "pg";
import { parseConnectionUrl } from "../server/connection";

async function run() {
  const raw = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!raw) throw new Error("No DB URL");
  const c = parseConnectionUrl(raw);
  const pool = new Pool({ user: c.user, password: c.password, host: c.host, port: c.port, database: c.database, ssl: { rejectUnauthorized: false } });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS popular_tokens (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      symbol VARCHAR(16) NOT NULL,
      name VARCHAR(64) NOT NULL,
      address VARCHAR(42) NOT NULL,
      decimals INTEGER NOT NULL DEFAULT 18,
      icon_url TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("popular_tokens table ready");
  await pool.end();
}

run().catch((e) => { console.error(e.message); process.exit(1); });

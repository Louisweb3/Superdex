import type { PoolConfig } from "pg";

export interface ParsedConnection {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
  /** Raw query string without the leading '?', or '' if none. */
  params: string;
}

/**
 * Parses a PostgreSQL connection URI into discrete fields.
 *
 * Design notes:
 *  - The password is treated as a LITERAL (no percent-decoding). Supabase and
 *    other providers frequently generate passwords containing characters like
 *    # % ? & that break naive URI parsing; passing discrete fields to pg avoids
 *    all percent-encoding pitfalls at runtime.
 *  - A password accidentally left wrapped in the `[...]` placeholder brackets
 *    (from a partially-replaced "[YOUR-PASSWORD]") is unwrapped.
 *  - Surrounding whitespace on the password is trimmed.
 *  - Bracketed IPv6 hosts (e.g. `[::1]`) are supported.
 */
export function parseConnectionUrl(raw: string): ParsedConnection {
  const trimmed = raw.trim();
  const match = trimmed.match(
    /^postgres(?:ql)?:\/\/([^:@]+):(.*)@(\[[^\]]+\]|[^:@/]+):(\d+)\/([^?]+)(?:\?(.*))?$/,
  );
  if (!match) {
    throw new Error(
      "Invalid PostgreSQL connection string. Expected format: postgresql://user:password@host:port/database",
    );
  }

  let password = match[2].trim();
  if (password.startsWith("[") && password.endsWith("]")) {
    password = password.slice(1, -1);
  }

  return {
    user: match[1],
    password,
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
    params: match[6] || "",
  };
}

function resolveRawUrl(): string {
  const raw = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "No database connection string found. Set SUPABASE_DATABASE_URL (or DATABASE_URL).",
    );
  }
  return raw;
}

/**
 * Builds the SSL config for the pg Pool.
 *
 * Supabase's connection pooler presents a certificate signed by Supabase's own
 * CA, which is not in Node's default trust store — full verification fails with
 * SELF_SIGNED_CERT_IN_CHAIN. Traffic is always encrypted in transit; only chain
 * verification is relaxed. To enable full verification, provide Supabase's CA
 * certificate (PEM contents) via the DATABASE_SSL_CA env var.
 */
function buildSslConfig(): PoolConfig["ssl"] {
  if (process.env.DATABASE_SSL_CA) {
    return { ca: process.env.DATABASE_SSL_CA, rejectUnauthorized: true };
  }
  return { rejectUnauthorized: false };
}

/** Builds a pg Pool config from SUPABASE_DATABASE_URL (falling back to DATABASE_URL). */
export function getPoolConfig(): PoolConfig {
  const c = parseConnectionUrl(resolveRawUrl());
  return {
    user: c.user,
    password: c.password,
    host: c.host,
    port: c.port,
    database: c.database,
    ssl: buildSslConfig(),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  };
}

/** Builds a properly percent-encoded connection URL (used by drizzle-kit). */
export function getEncodedConnectionUrl(): string {
  const c = parseConnectionUrl(resolveRawUrl());
  const user = encodeURIComponent(c.user);
  const password = encodeURIComponent(c.password);
  const base = `postgresql://${user}:${password}@${c.host}:${c.port}/${c.database}`;

  const params = new URLSearchParams(c.params);
  if (!params.has("sslmode")) {
    params.set("sslmode", "require");
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

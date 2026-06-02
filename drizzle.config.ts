import { defineConfig } from "drizzle-kit";
import { getEncodedConnectionUrl } from "./server/connection";

if (!process.env.SUPABASE_DATABASE_URL && !process.env.DATABASE_URL) {
  throw new Error(
    "SUPABASE_DATABASE_URL (or DATABASE_URL) must be set, ensure the database is provisioned",
  );
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getEncodedConnectionUrl(),
  },
});

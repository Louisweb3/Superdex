import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import { getPoolConfig } from "./connection";

const pool = new Pool(getPoolConfig());
export const db = drizzle(pool, { schema });

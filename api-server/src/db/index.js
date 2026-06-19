import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "./schema.js";

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Render-hosted Postgres requires SSL; local/dev connections typically don't.
const needsSSL = connectionString.includes("render.com") || process.env.PGSSLMODE === "require";

export const pool = new Pool({
  connectionString,
  ssl: needsSSL ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });

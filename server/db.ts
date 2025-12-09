import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL must be set. Configure your Supabase database connection.",
  );
}

export const pool = new Pool({ 
  connectionString: databaseUrl,
  max: 1,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

export const db = drizzle(pool, { schema });

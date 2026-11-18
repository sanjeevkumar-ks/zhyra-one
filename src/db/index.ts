import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

/**
 * Resolves the PostgreSQL connection string across standard variable names,
 * including Supabase & Vercel Postgres integration conventions.
 */
export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.SUPABASE_DB_URL
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDrizzleDb?: NodePgDatabase;
};

/**
 * Lazily initializes and returns the connection pool.
 * Does not execute at build/import time.
 */
export function getPool(): Pool {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL (or POSTGRES_URL) is required to connect to the database. " +
      "If you are using Supabase, please ensure the Supabase PostgreSQL connection URI is configured in your Vercel project settings."
    );
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    throw new Error(
      "Invalid database URL: An HTTP/HTTPS endpoint was provided (e.g. Supabase API URL). " +
      "Drizzle ORM requires a PostgreSQL connection string (e.g. postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres or pooler port 6543)."
    );
  }

  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1");
    const poolConfig: PoolConfig = {
      connectionString: url,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: process.env.NODE_ENV === "production" ? 10 : 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
    globalForDb.__arenaNextJsPostgresqlPool = new Pool(poolConfig);
  }

  return globalForDb.__arenaNextJsPostgresqlPool;
}

/**
 * Lazily initializes and returns the Drizzle database instance.
 */
export function getDb(): NodePgDatabase {
  if (!globalForDb.__arenaNextJsDrizzleDb) {
    const poolInstance = getPool();
    globalForDb.__arenaNextJsDrizzleDb = drizzle(poolInstance);
  }
  return globalForDb.__arenaNextJsDrizzleDb;
}

/**
 * Transparent proxy for backwards compatibility:
 * Code using `import { db } from "@/db"` continues to work without
 * triggering top-level initialization at Next.js build time.
 */
export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_target, prop, receiver) {
    const targetDb = getDb();
    const value = Reflect.get(targetDb, prop, receiver);
    return typeof value === "function" ? value.bind(targetDb) : value;
  },
});

/**
 * Transparent proxy for connection pool backwards compatibility.
 */
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const targetPool = getPool();
    const value = Reflect.get(targetPool, prop, receiver);
    return typeof value === "function" ? value.bind(targetPool) : value;
  },
});

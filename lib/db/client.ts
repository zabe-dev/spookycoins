import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const globalForDb = globalThis as unknown as {
  spookycoinsSql?: ReturnType<typeof postgres>;
};

export const sql =
  globalForDb.spookycoinsSql ??
  postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.spookycoinsSql = sql;

export const db = drizzle(sql, { schema });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

let pool: Pool | undefined;
let database: ReturnType<typeof drizzle> | undefined;

export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  if (!database) database = drizzle(pool);
  return database;
}

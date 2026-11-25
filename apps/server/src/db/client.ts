import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
// Construct explicitly when a persistence module is wired; importing does not connect.
export function createDatabase(connectionString: string) {
  const pool = new Pool({ connectionString });
  return { db: drizzle(pool), close: () => pool.end() };
}

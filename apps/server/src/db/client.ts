import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

export type CueliaDatabase = ReturnType<typeof drizzle<typeof schema>>;

// Construct explicitly when a persistence module is wired; importing does not connect.
export function createDatabase(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 10_000,
  });

  pool.on('error', (error) => {
    console.error('Unexpected idle PostgreSQL client error:', error);
  });

  return {
    db: drizzle(pool, { schema }),
    checkReady: async () => {
      await pool.query('SELECT 1');
    },
    close: () => pool.end(),
  };
}

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

// We use the WebSocket driver (not neon-http) so we have real Postgres
// transactions for atomic flows like register-tenant (registry row + tax row).
export const createDb = (databaseUrl: string) => {
  const pool = new Pool({ connectionString: databaseUrl });
  return drizzle(pool, { schema });
};

export type Db = ReturnType<typeof createDb>;

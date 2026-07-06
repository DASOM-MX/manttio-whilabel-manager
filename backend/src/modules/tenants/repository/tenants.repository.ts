import { desc, eq } from 'drizzle-orm';
import type { Db } from '../../database/client';
import { tenantRegistry } from '../models/tenants.model';
import type { NewTenant, TenantRow } from '../types/tenants.types';

export const listTenants = async (db: Db) => {
  return db.select().from(tenantRegistry).orderBy(desc(tenantRegistry.createdAt));
};

export const findTenantByEnvId = async (db: Db, envId: string) => {
  const rows = await db
    .select()
    .from(tenantRegistry)
    .where(eq(tenantRegistry.envId, envId))
    .limit(1);
  return rows[0] ?? null;
};

export const insertTenant = async (db: Db, input: NewTenant): Promise<TenantRow> => {
  const [row] = await db.insert(tenantRegistry).values(input).returning();
  if (!row) throw new Error('insertTenant returned no row');
  return row;
};

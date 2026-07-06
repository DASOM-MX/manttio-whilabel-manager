import { desc, eq } from 'drizzle-orm';
import type { Db } from '../../database/client';
import { tenantRegistry } from '../models/tenants.model';
import type { NewTenant, TenantRow } from '../types/tenants.types';

// List rows carry the joined billing_reference (via the barrel's taxInfo relation)
// so the tenants screen gets tax data in one query.
export const listTenants = async (db: Db) => {
  return db.query.tenantRegistry.findMany({
    with: { taxInfo: true },
    orderBy: desc(tenantRegistry.createdAt),
  });
};

// Reminder-sweep helper: only `monthly` tenants are ever auto-issued.
export const listTenantsByPlan = async (db: Db, plan: TenantRow['plan']) => {
  return db.select().from(tenantRegistry).where(eq(tenantRegistry.plan, plan));
};

export const findTenantByEnvId = async (db: Db, envId: string) => {
  const rows = await db
    .select()
    .from(tenantRegistry)
    .where(eq(tenantRegistry.envId, envId))
    .limit(1);
  return rows[0] ?? null;
};

// Mirror write: registry.plan follows the tenant's single active contract
// (contracts service is the only caller — the contract wins on disagreement).
export const updateTenantPlan = async (db: Db, envId: string, plan: TenantRow['plan']) => {
  await db
    .update(tenantRegistry)
    .set({ plan, updatedAt: new Date() })
    .where(eq(tenantRegistry.envId, envId));
};

export const insertTenant = async (db: Db, input: NewTenant): Promise<TenantRow> => {
  const [row] = await db.insert(tenantRegistry).values(input).returning();
  if (!row) throw new Error('insertTenant returned no row');
  return row;
};

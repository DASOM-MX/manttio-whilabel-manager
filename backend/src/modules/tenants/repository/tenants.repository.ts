import { desc, eq } from 'drizzle-orm';
import type { Db } from '../../database/client';
import { billingReference } from '../../billing/models/billing-reference.model';
import type { NewBillingReference } from '../../billing/types/billing.types';
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

// Detail/PATCH responses carry the joined tax info like the list does.
export const findTenantWithTaxInfo = async (db: Db, envId: string) => {
  const row = await db.query.tenantRegistry.findFirst({
    with: { taxInfo: true },
    where: eq(tenantRegistry.envId, envId),
  });
  return row ?? null;
};

// Registry fields only — status (KV-owned) and plan (contract-mirror) have
// their own single-writer paths and are not accepted here.
export const updateTenantRegistry = async (
  db: Db,
  envId: string,
  fields: Partial<
    Pick<
      TenantRow,
      | 'publicName'
      | 'apiBaseUrl'
      | 'billingEmail'
      | 'paymentType'
      | 'billingAnchor'
      | 'billingNotes'
      | 'modules'
      | 'timezone'
    >
  >,
) => {
  const [row] = await db
    .update(tenantRegistry)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(tenantRegistry.envId, envId))
    .returning();
  return row ?? null;
};

export const stampLastPushAt = async (db: Db, envId: string, at: Date) => {
  await db
    .update(tenantRegistry)
    .set({ lastPushAt: at, updatedAt: at })
    .where(eq(tenantRegistry.envId, envId));
};

// Mirror write: registry.plan follows the tenant's single active contract
// (contracts service is the only caller — the contract wins on disagreement).
export const updateTenantPlan = async (db: Db, envId: string, plan: TenantRow['plan']) => {
  await db
    .update(tenantRegistry)
    .set({ plan, updatedAt: new Date() })
    .where(eq(tenantRegistry.envId, envId));
};

// Mirror write: registry.status follows KV (tenant-status.service is the only
// caller — KV is the source of truth and wins on disagreement).
export const updateTenantStatusMirror = async (
  db: Db,
  envId: string,
  status: TenantRow['status'],
) => {
  await db
    .update(tenantRegistry)
    .set({ status, updatedAt: new Date() })
    .where(eq(tenantRegistry.envId, envId));
};

export const insertTenant = async (db: Db, input: NewTenant): Promise<TenantRow> => {
  const [row] = await db.insert(tenantRegistry).values(input).returning();
  if (!row) throw new Error('insertTenant returned no row');
  return row;
};

// Registration with the optional tax block is atomic — the reason this Worker
// uses the WebSocket driver (real transactions), per CLAUDE.md. Sibling pattern:
// the transaction lives inside one repository function with inline tx queries
// (`Db` and the tx handle aren't the same type, so tx never crosses functions).
// The billing_reference insert is plain (a brand-new tenant can't have a row).
export const insertTenantWithTaxInfo = async (
  db: Db,
  tenant: NewTenant,
  taxInfo: Omit<NewBillingReference, 'envId'> | null,
): Promise<TenantRow> => {
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(tenantRegistry).values(tenant).returning();
    if (!row) throw new Error('insertTenantWithTaxInfo returned no row');
    if (taxInfo) {
      await tx.insert(billingReference).values({ ...taxInfo, envId: row.envId });
    }
    return row;
  });
};

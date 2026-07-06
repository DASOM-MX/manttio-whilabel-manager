import { and, desc, eq, inArray, isNull, lt, lte, ne, or } from 'drizzle-orm';
import type { Db } from '../../database/client';
import { billingReference } from '../models/billing-reference.model';
import { billingRecords } from '../models/billing-records.model';
import type {
  BillingRecordRow,
  BillingReferenceRow,
  NewBillingRecord,
  NewBillingReference,
} from '../types/billing.types';

export const upsertBillingReference = async (
  db: Db,
  input: NewBillingReference,
): Promise<BillingReferenceRow> => {
  const [row] = await db
    .insert(billingReference)
    .values(input)
    .onConflictDoUpdate({
      target: billingReference.envId,
      set: { ...input, updatedAt: new Date() },
    })
    .returning();
  if (!row) throw new Error('upsertBillingReference returned no row');
  return row;
};

export const listBillingRecordsByEnvId = async (db: Db, envId: string) => {
  return db
    .select()
    .from(billingRecords)
    .where(eq(billingRecords.envId, envId))
    .orderBy(desc(billingRecords.issuedAt));
};

export const insertBillingRecord = async (
  db: Db,
  input: NewBillingRecord,
): Promise<BillingRecordRow> => {
  const [row] = await db.insert(billingRecords).values(input).returning();
  if (!row) throw new Error('insertBillingRecord returned no row');
  return row;
};

// Cycle-idempotency probe for the sweep's auto-issue step: a monthly cycle is
// identified by its due date (dueDateFor is the only due-date math, so a manual
// record registered mid-cycle carries the same due date and also counts).
export const hasBillingRecordWithDueDate = async (
  db: Db,
  envId: string,
  dueDate: string,
): Promise<boolean> => {
  const rows = await db
    .select({ id: billingRecords.id })
    .from(billingRecords)
    .where(and(eq(billingRecords.envId, envId), eq(billingRecords.dueDate, dueDate)))
    .limit(1);
  return rows.length > 0;
};

// Sweep step 2: pending records past their due date become overdue.
export const flipOverdueRecords = async (db: Db, today: string): Promise<number> => {
  const rows = await db
    .update(billingRecords)
    .set({ status: 'overdue' })
    .where(and(eq(billingRecords.status, 'pending'), lt(billingRecords.dueDate, today)))
    .returning({ id: billingRecords.id });
  return rows.length;
};

// Sweep step 3 candidates: unpaid records either due soon or already overdue,
// skipping rows reminded within the last 24h. Carries the tenant row so the
// service can group one email per tenant.
export const listRemindableRecords = async (
  db: Db,
  dueSoonCutoff: string,
  remindedBefore: Date,
) => {
  return db.query.billingRecords.findMany({
    with: { tenant: true },
    where: and(
      ne(billingRecords.status, 'paid'),
      or(lte(billingRecords.dueDate, dueSoonCutoff), eq(billingRecords.status, 'overdue')),
      or(
        isNull(billingRecords.lastRemindedAt),
        lt(billingRecords.lastRemindedAt, remindedBefore),
      ),
    ),
    orderBy: billingRecords.dueDate,
  });
};

export const findBillingRecordWithTenant = async (db: Db, id: string) => {
  const row = await db.query.billingRecords.findFirst({
    with: { tenant: true },
    where: eq(billingRecords.id, id),
  });
  return row ?? null;
};

export const stampLastRemindedAt = async (db: Db, ids: string[], at: Date) => {
  if (ids.length === 0) return;
  await db
    .update(billingRecords)
    .set({ lastRemindedAt: at })
    .where(inArray(billingRecords.id, ids));
};

import { desc, eq } from 'drizzle-orm';
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

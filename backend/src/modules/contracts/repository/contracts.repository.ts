import { desc, eq } from 'drizzle-orm';
import type { Db } from '../../database/client';
import { contracts } from '../models/contracts.model';
import type { ContractRow, NewContract } from '../types/contracts.types';

export const listContractsByEnvId = async (db: Db, envId: string) => {
  return db
    .select()
    .from(contracts)
    .where(eq(contracts.envId, envId))
    .orderBy(desc(contracts.createdAt));
};

export const findContractById = async (db: Db, id: string) => {
  const rows = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return rows[0] ?? null;
};

export const insertContract = async (db: Db, input: NewContract): Promise<ContractRow> => {
  const [row] = await db.insert(contracts).values(input).returning();
  if (!row) throw new Error('insertContract returned no row');
  return row;
};

export const updateContract = async (
  db: Db,
  id: string,
  fields: Partial<Pick<ContractRow, 'status' | 'signedAt' | 'documentUrl' | 'notes'>>,
) => {
  const [row] = await db
    .update(contracts)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(contracts.id, id))
    .returning();
  return row ?? null;
};

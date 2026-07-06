import { and, eq, isNull } from 'drizzle-orm';
import type { Db } from '../../database/client';
import { admins } from '../models/admins.model';
import type { AdminRow, NewAdmin } from '../types/admins.types';

const activeFilter = isNull(admins.deletedAt);

export const findAdminByEmail = async (db: Db, email: string) => {
  const rows = await db
    .select()
    .from(admins)
    .where(and(eq(admins.email, email), activeFilter))
    .limit(1);
  return rows[0] ?? null;
};

export const insertAdmin = async (db: Db, input: NewAdmin): Promise<AdminRow> => {
  const [row] = await db.insert(admins).values(input).returning();
  if (!row) throw new Error('insertAdmin returned no row');
  return row;
};

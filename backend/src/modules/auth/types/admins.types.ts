import type { admins } from '../models/admins.model';

export type AdminRow = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

import type { contracts } from '../models/contracts.model';

export type ContractRow = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;

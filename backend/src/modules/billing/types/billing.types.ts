import type { billingReference } from '../models/billing-reference.model';
import type { billingRecords } from '../models/billing-records.model';

export type BillingReferenceRow = typeof billingReference.$inferSelect;
export type NewBillingReference = typeof billingReference.$inferInsert;

export type BillingRecordRow = typeof billingRecords.$inferSelect;
export type NewBillingRecord = typeof billingRecords.$inferInsert;

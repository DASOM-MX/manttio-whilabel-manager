// Schema barrel. Drizzle Kit (drizzle.config.ts) and the DB client both read the schema
// from this single entry point.
//
// Tables live in each module's `models/*.model.ts`. All cross-module `relations()` are
// defined HERE (not in the model files) so the models stay acyclic — sibling convention.
import { relations } from 'drizzle-orm';
import { tenantRegistry } from '../tenants/models/tenants.model';
import { billingReference } from '../billing/models/billing-reference.model';
import { billingRecords } from '../billing/models/billing-records.model';

export { tenantRegistry } from '../tenants/models/tenants.model';
export { admins } from '../auth/models/admins.model';
export { billingReference } from '../billing/models/billing-reference.model';
export { billingRecords } from '../billing/models/billing-records.model';

export const tenantRegistryRelations = relations(tenantRegistry, ({ one, many }) => ({
  taxInfo: one(billingReference),
  billingRecords: many(billingRecords),
}));

export const billingReferenceRelations = relations(billingReference, ({ one }) => ({
  tenant: one(tenantRegistry, {
    fields: [billingReference.envId],
    references: [tenantRegistry.envId],
  }),
}));

export const billingRecordsRelations = relations(billingRecords, ({ one }) => ({
  tenant: one(tenantRegistry, {
    fields: [billingRecords.envId],
    references: [tenantRegistry.envId],
  }),
}));

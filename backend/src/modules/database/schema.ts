// Schema barrel. Drizzle Kit (drizzle.config.ts) and the DB client both read the schema
// from this single entry point.
//
// Tables live in each module's `models/*.model.ts`. All cross-module `relations()` are
// defined HERE (not in the model files) so the models stay acyclic — sibling convention.
// (First relations arrive with billing_reference / billing_records / contracts.)

export { tenantRegistry } from '../tenants/models/tenants.model';

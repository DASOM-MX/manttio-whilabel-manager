import type { tenantRegistry } from '../models/tenants.model';

export type TenantRow = typeof tenantRegistry.$inferSelect;
export type NewTenant = typeof tenantRegistry.$inferInsert;

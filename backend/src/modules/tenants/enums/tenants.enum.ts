// `provisioning` exists only backend-side: a freshly registered tenant that has not
// been switched live yet. The frontend status switch only ever sets active/suspended.
export const TENANT_STATUSES = ['active', 'suspended', 'provisioning'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

// Per-tenant feature flags pushed to the instance (settled 2026-07-05):
// `scheduling` covers calendar + contracts; equipment rides core clients.
export const MODULE_KEYS = ['billing', 'wms', 'crm', 'cms', 'scheduling'] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];
export type ModuleFlags = Record<ModuleKey, boolean>;

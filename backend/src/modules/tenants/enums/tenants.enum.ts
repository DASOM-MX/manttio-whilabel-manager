// `provisioning` exists only backend-side: a freshly registered tenant that has not
// been switched live yet. The frontend status switch only ever sets active/suspended.
export const TENANT_STATUSES = ['active', 'suspended', 'provisioning'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

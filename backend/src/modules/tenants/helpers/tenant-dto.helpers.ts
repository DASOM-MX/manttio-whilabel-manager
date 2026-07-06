import type { TenantRow } from '../types/tenants.types';

// Serializes a registry row into the frontend's `Tenant` shape
// (`frontend/src/app/core/models/tenant.ts`) — snake_case with a nested billing block.
export const toTenantDto = (row: TenantRow) => ({
  env_id: row.envId,
  slug: row.slug,
  public_name: row.publicName,
  api_base_url: row.apiBaseUrl,
  status: row.status,
  neon_project_ref: row.neonProjectRef,
  last_push_at: row.lastPushAt?.toISOString() ?? null,
  billing: {
    plan: row.plan,
    billing_email: row.billingEmail,
    payment_type: row.paymentType,
    notes: row.billingNotes ?? '',
  },
  // Joined from billing_reference once the billing phase lands.
  tax_info: null,
});

export type TenantDto = ReturnType<typeof toTenantDto>;

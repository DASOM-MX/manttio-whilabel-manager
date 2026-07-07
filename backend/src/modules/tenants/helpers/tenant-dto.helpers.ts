import type { BillingReferenceRow } from '../../billing/types/billing.types';
import { toTaxInfoDto } from '../../billing/helpers/billing-dto.helpers';
import type { TenantRow } from '../types/tenants.types';

// Serializes a registry row into the frontend's `Tenant` shape
// (`frontend/src/app/core/models/tenant.ts`) — snake_case with a nested billing block.
export const toTenantDto = (row: TenantRow & { taxInfo?: BillingReferenceRow | null }) => ({
  env_id: row.envId,
  slug: row.slug,
  public_name: row.publicName,
  api_base_url: row.apiBaseUrl,
  status: row.status,
  neon_project_ref: row.neonProjectRef,
  // Not in the frontend model yet — additive, ready for the config-push UI.
  modules: row.modules,
  timezone: row.timezone,
  last_push_at: row.lastPushAt?.toISOString() ?? null,
  billing: {
    plan: row.plan,
    billing_email: row.billingEmail,
    payment_type: row.paymentType,
    notes: row.billingNotes ?? '',
  },
  // Null until the tenant hands over their fiscal data (billing_reference row).
  tax_info: row.taxInfo ? toTaxInfoDto(row.taxInfo) : null,
});

export type TenantDto = ReturnType<typeof toTenantDto>;

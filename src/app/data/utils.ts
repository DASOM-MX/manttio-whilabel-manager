import { TenantStatus } from '../core/models/tenant';

/** Map a tenant status to the PrimeNG tag severity used across the app. */
export function statusSeverity(status: TenantStatus): 'success' | 'danger' {
  return status === 'active' ? 'success' : 'danger';
}

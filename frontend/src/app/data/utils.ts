import { BillingRecordStatus } from '../core/models/billing-record';
import { TenantStatus } from '../core/models/tenant';

/** Map a tenant status to the PrimeNG tag severity used across the app. */
export function statusSeverity(status: TenantStatus): 'success' | 'danger' {
  return status === 'active' ? 'success' : 'danger';
}

/** Map a billing record status to the PrimeNG tag severity used across the app. */
export function billingRecordStatusSeverity(
  status: BillingRecordStatus,
): 'success' | 'warn' | 'danger' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warn';
    case 'overdue':
      return 'danger';
  }
}

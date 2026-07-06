import { PaymentType } from './tenant';

export type BillingRecordStatus = 'paid' | 'pending' | 'overdue';

export const BILLING_RECORD_STATUS_LABELS: Record<BillingRecordStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue',
};

export const BILLING_RECORD_STATUS_OPTIONS = Object.entries(BILLING_RECORD_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as BillingRecordStatus, label }),
);

/** A single payment/charge tracked against a tenant — admin-side reference only. */
export interface BillingRecord {
  id: string;
  /** Tenant the record belongs to. */
  env_id: string;
  concept: string;
  amount: number;
  currency: 'MXN';
  payment_type: PaymentType;
  status: BillingRecordStatus;
  issued_at: string;
  /**
   * Payment deadline (`YYYY-MM-DD`) — always derived server-side from the tenant's
   * plan (monthly → next billing-anchor day; full → issued + 30 days), never entered.
   */
  due_date: string;
  paid_at: string | null;
  /** CFDI folio fiscal (UUID) once invoiced, if any. */
  cfdi_folio: string | null;
}

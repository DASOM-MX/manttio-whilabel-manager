// Mirrors the frontend's `core/models/tenant.ts` enums — keep the two in sync.
// (BillingRecordStatus / RegimenFiscal / UsoCfdi land with the billing phase.)

export const PLANS = ['full', 'monthly'] as const;
export type Plan = (typeof PLANS)[number];

export const PAYMENT_TYPES = ['bank_transfer', 'stripe', 'cash', 'bank_check'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

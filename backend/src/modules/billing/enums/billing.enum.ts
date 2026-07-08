// Mirrors the frontend's `core/models/tenant.ts` + `billing-record.ts` enums — keep in sync.

export const PLANS = ['full', 'monthly'] as const;
export type Plan = (typeof PLANS)[number];

export const PAYMENT_TYPES = ['bank_transfer', 'stripe', 'cash', 'bank_check'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const BILLING_RECORD_STATUSES = ['paid', 'pending', 'overdue'] as const;
export type BillingRecordStatus = (typeof BILLING_RECORD_STATUSES)[number];

/** SAT régimen fiscal codes we invoice against (extend as tenants need more). */
export const REGIMENES_FISCALES = ['601', '612', '626'] as const;
export type RegimenFiscal = (typeof REGIMENES_FISCALES)[number];

/** CFDI 4.0 uso codes we track (extend as tenants need more). */
export const USOS_CFDI = ['G01', 'G03', 'S01'] as const;
export type UsoCfdi = (typeof USOS_CFDI)[number];

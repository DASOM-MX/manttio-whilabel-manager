export type TenantStatus = 'active' | 'suspended';

export enum PaymentType {
  BankTransfer = 'bank_transfer',
  Stripe = 'stripe',
  Cash = 'cash',
  BankCheck = 'bank_check',
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  [PaymentType.BankTransfer]: 'Bank transfer',
  [PaymentType.Stripe]: 'Stripe',
  [PaymentType.Cash]: 'Cash',
  [PaymentType.BankCheck]: 'Bank check',
};

export const PAYMENT_TYPE_OPTIONS = Object.entries(PAYMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as PaymentType, label }),
);

/** The only two plans sold: Full (one-time, 5-year support) and Monthly. */
export enum Plan {
  Full = 'full',
  Monthly = 'monthly',
}

export const PLAN_LABELS: Record<Plan, string> = {
  [Plan.Full]: 'Full — 5-year support',
  [Plan.Monthly]: 'Monthly',
};

export const PLAN_OPTIONS = Object.entries(PLAN_LABELS).map(([value, label]) => ({
  value: value as Plan,
  label,
}));

export interface PlanPricing {
  price: number;
  currency: 'MXN';
  recurrence: 'one_time' | 'monthly';
}

/** Fixed price list — pricing is derived from the plan, never stored per tenant. */
export const PLAN_PRICING: Record<Plan, PlanPricing> = {
  [Plan.Full]: { price: 25_000, currency: 'MXN', recurrence: 'one_time' },
  [Plan.Monthly]: { price: 375, currency: 'MXN', recurrence: 'monthly' },
};

/** Admin-side billing tracking fields (reference only — no payment processing here). */
export interface TenantBilling {
  plan: Plan;
  billing_email: string;
  payment_type: PaymentType;
  notes: string;
}

/** A whitelabel instance as tracked in the manager backend registry. */
export interface Tenant {
  env_id: string;
  /** URL-friendly unique handle; detail routes address tenants by slug. */
  slug: string;
  public_name: string;
  api_base_url: string;
  status: TenantStatus;
  neon_project_ref: string;
  last_push_at: string | null;
  billing: TenantBilling;
}

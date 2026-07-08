import type { Plan } from '../enums/billing.enum';

export interface PlanPricing {
  price: number;
  currency: 'MXN';
  recurrence: 'one_time' | 'monthly';
}

// Mirror of the frontend's PLAN_PRICING (`core/models/tenant.ts`) — pricing is
// derived from the plan, never stored per tenant. Keep the two in sync.
export const PLAN_PRICING: Record<Plan, PlanPricing> = {
  full: { price: 25_000, currency: 'MXN', recurrence: 'one_time' },
  monthly: { price: 375, currency: 'MXN', recurrence: 'monthly' },
};

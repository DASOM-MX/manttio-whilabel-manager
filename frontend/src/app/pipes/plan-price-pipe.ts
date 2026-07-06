import { Pipe, PipeTransform } from '@angular/core';

import { Plan, PLAN_PRICING } from '../core/models/tenant';

/** `tenant.billing.plan | planPrice` → compact price tag: "$25k" (Full, one-time) or "$375/m" (Monthly). */
@Pipe({ name: 'planPrice' })
export class PlanPricePipe implements PipeTransform {
  transform(plan: Plan): string {
    const { price, recurrence } = PLAN_PRICING[plan];
    const compact = price >= 1000 ? `$${price / 1000}k` : `$${price}`;
    return recurrence === 'monthly' ? `${compact}/m` : compact;
  }
}

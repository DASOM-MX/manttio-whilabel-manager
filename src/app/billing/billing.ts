import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { select } from '@ngxs/store';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import {
  PAYMENT_TYPE_LABELS,
  PaymentType,
  Plan,
  PLAN_LABELS,
  PLAN_PRICING,
} from '../core/models/tenant';
import { statusSeverity } from '../data/utils';
import { TenantsState } from '../state/tenants/tenants.state';
import { RegisterBillingDrawer } from './components/register-billing-drawer/register-billing-drawer';

@Component({
  selector: 'app-billing',
  imports: [RouterLink, TableModule, TagModule, RegisterBillingDrawer],
  templateUrl: './billing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Billing {
  protected readonly tenants = select(TenantsState.tenants);
  protected readonly statusSeverity = statusSeverity;

  protected paymentTypeLabel(type: PaymentType): string {
    return PAYMENT_TYPE_LABELS[type];
  }

  protected planLabel(plan: Plan): string {
    return PLAN_LABELS[plan];
  }

  /** Compact price tag: "$25k" (Full, one-time) or "$375/m" (Monthly). */
  protected planPrice(plan: Plan): string {
    const { price, recurrence } = PLAN_PRICING[plan];
    const compact = price >= 1000 ? `$${price / 1000}k` : `$${price}`;
    return recurrence === 'monthly' ? `${compact}/m` : compact;
  }
}

import { Pipe, PipeTransform } from '@angular/core';

import { Plan, PLAN_LABELS } from '../core/models/tenant';

/** `tenant.billing.plan | planLabel` → display label. */
@Pipe({ name: 'planLabel' })
export class PlanLabelPipe implements PipeTransform {
  transform(plan: Plan): string {
    return PLAN_LABELS[plan];
  }
}

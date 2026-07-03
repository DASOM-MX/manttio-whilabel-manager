import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { select } from '@ngxs/store';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { PaymentTypeLabelPipe } from '../pipes/payment-type-label-pipe';
import { PlanLabelPipe } from '../pipes/plan-label-pipe';
import { PlanPricePipe } from '../pipes/plan-price-pipe';
import { StatusSeverityPipe } from '../pipes/status-severity-pipe';
import { TenantsState } from '../state/tenants/tenants.state';
import { RegisterBillingDrawer } from './components/register-billing-drawer/register-billing-drawer';

@Component({
  selector: 'app-billing',
  imports: [
    RouterLink,
    TableModule,
    TagModule,
    RegisterBillingDrawer,
    PaymentTypeLabelPipe,
    PlanLabelPipe,
    PlanPricePipe,
    StatusSeverityPipe,
  ],
  templateUrl: './billing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Billing {
  protected readonly tenants = select(TenantsState.tenants);
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { select, Store } from '@ngxs/store';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';

import {
  PAYMENT_TYPE_OPTIONS,
  PaymentType,
  Plan,
  PLAN_OPTIONS,
  PLAN_PRICING,
} from '../../../core/models/tenant';
import { UpdateTenantBilling } from '../../../state/tenants/tenants.actions';
import { TenantsState } from '../../../state/tenants/tenants.state';

@Component({
  selector: 'app-register-billing-drawer',
  imports: [ReactiveFormsModule, DrawerModule, SelectModule],
  templateUrl: './register-billing-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterBillingDrawer {
  private readonly store = inject(Store);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly visible = signal(false);
  protected readonly tenants = select(TenantsState.tenants);
  protected readonly planOptions = PLAN_OPTIONS;
  protected readonly paymentTypeOptions = PAYMENT_TYPE_OPTIONS;

  protected readonly form = this.fb.group({
    env_id: ['', Validators.required],
    plan: [Plan.Monthly, Validators.required],
    billing_email: ['', [Validators.required, Validators.email]],
    payment_type: [PaymentType.BankTransfer, Validators.required],
    notes: [''],
  });

  private readonly selectedPlan = toSignal(this.form.controls.plan.valueChanges, {
    initialValue: this.form.controls.plan.value,
  });
  protected readonly selectedPlanPricing = computed(() => PLAN_PRICING[this.selectedPlan()]);

  open(): void {
    this.form.reset();
    this.visible.set(true);
  }

  protected submit(): void {
    const { env_id, ...billing } = this.form.getRawValue();
    this.store.dispatch(new UpdateTenantBilling(env_id, billing));
    this.visible.set(false);
  }
}

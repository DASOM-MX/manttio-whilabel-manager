import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { select, Store } from '@ngxs/store';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import {
  PAYMENT_TYPE_OPTIONS,
  PaymentType,
  Plan,
  PLAN_OPTIONS,
  PLAN_PRICING,
} from '../../core/models/tenant';
import { statusSeverity } from '../../data/utils';
import { SetTenantStatus, UpdateTenantBilling } from '../../state/tenants/tenants.actions';
import { TenantsState } from '../../state/tenants/tenants.state';

interface InstanceClient {
  name: string;
  email: string;
  created_at: string;
}

@Component({
  selector: 'app-tenant-detail',
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    SelectModule,
    TableModule,
    TabsModule,
    TagModule,
    ToggleSwitchModule,
  ],
  templateUrl: './tenant-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantDetail {
  readonly slug = input.required<string>();

  private readonly store = inject(Store);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly tenants = select(TenantsState.tenants);

  protected readonly tenant = computed(
    () => this.tenants().find((t) => t.slug === this.slug()) ?? null,
  );
  protected readonly statusSeverity = statusSeverity;

  /** Start / stop switch — drives the manager-backend KV status write. */
  protected readonly statusControl = new FormControl(false, { nonNullable: true });

  protected readonly paymentTypeOptions = PAYMENT_TYPE_OPTIONS;
  protected readonly planOptions = PLAN_OPTIONS;

  protected readonly billingForm = this.fb.group({
    plan: [Plan.Monthly, Validators.required],
    billing_email: ['', [Validators.required, Validators.email]],
    payment_type: [PaymentType.BankTransfer, Validators.required],
    notes: [''],
  });

  private readonly selectedPlan = toSignal(this.billingForm.controls.plan.valueChanges, {
    initialValue: this.billingForm.controls.plan.value,
  });
  protected readonly selectedPlanPricing = computed(() => PLAN_PRICING[this.selectedPlan()]);

  // Placeholder until the manager backend proxies per-instance client lists.
  protected readonly clients: InstanceClient[] = [
    { name: 'Laura Jimenez', email: 'laura@example.com', created_at: '2026-03-14T10:20:00Z' },
    { name: 'Marco Ruiz', email: 'marco@example.com', created_at: '2026-04-02T16:45:00Z' },
    { name: 'Dana Whitfield', email: 'dana@example.com', created_at: '2026-05-21T08:05:00Z' },
  ];

  private lastEnvId: string | null = null;

  constructor() {
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((active) => {
      const tenant = this.tenant();
      if (!tenant) return;
      this.store.dispatch(new SetTenantStatus(tenant.env_id, active ? 'active' : 'suspended'));
    });

    effect(() => {
      const tenant = this.tenant();
      if (!tenant) return;
      this.statusControl.setValue(tenant.status === 'active', { emitEvent: false });
      // Only reseed the billing form when the tenant itself changes, so a
      // status flip doesn't clobber unsaved billing edits.
      if (tenant.env_id !== this.lastEnvId) {
        this.lastEnvId = tenant.env_id;
        this.billingForm.reset(tenant.billing);
      }
    });
  }

  protected saveBilling(): void {
    const tenant = this.tenant();
    if (!tenant) return;
    this.store.dispatch(new UpdateTenantBilling(tenant.env_id, this.billingForm.getRawValue()));
    this.billingForm.markAsPristine();
  }
}

import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { select, Store } from '@ngxs/store';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { BillingStatusSeverityPipe } from '../../pipes/billing-status-severity-pipe';
import { RegisterBillingRecordDrawer } from '../components/register-billing-record-drawer/register-billing-record-drawer';
import { PaymentTypeLabelPipe } from '../../pipes/payment-type-label-pipe';
import { RegimenFiscalLabelPipe } from '../../pipes/regimen-fiscal-label-pipe';
import { StatusSeverityPipe } from '../../pipes/status-severity-pipe';
import { UsoCfdiLabelPipe } from '../../pipes/uso-cfdi-label-pipe';
import { SetTenantStatus } from '../../state/tenants/tenants.actions';
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
    TableModule,
    TabsModule,
    TagModule,
    ToggleSwitchModule,
    RegisterBillingRecordDrawer,
    BillingStatusSeverityPipe,
    PaymentTypeLabelPipe,
    RegimenFiscalLabelPipe,
    StatusSeverityPipe,
    UsoCfdiLabelPipe,
  ],
  templateUrl: './tenant-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantDetail {
  readonly slug = input.required<string>();

  private readonly store = inject(Store);
  private readonly tenants = select(TenantsState.tenants);
  private readonly allBillingRecords = select(TenantsState.billingRecords);

  protected readonly tenant = computed(
    () => this.tenants().find((t) => t.slug === this.slug()) ?? null,
  );
  protected readonly billingRecords = computed(() => {
    const tenant = this.tenant();
    if (!tenant) return [];
    return this.allBillingRecords()
      .filter((record) => record.env_id === tenant.env_id)
      .sort((a, b) => b.issued_at.localeCompare(a.issued_at));
  });

  /** Start / stop switch — drives the manager-backend KV status write. */
  protected readonly statusControl = new FormControl(false, { nonNullable: true });

  // Placeholder until the manager backend proxies per-instance client lists.
  protected readonly clients: InstanceClient[] = [
    { name: 'Laura Jimenez', email: 'laura@example.com', created_at: '2026-03-14T10:20:00Z' },
    { name: 'Marco Ruiz', email: 'marco@example.com', created_at: '2026-04-02T16:45:00Z' },
    { name: 'Dana Whitfield', email: 'dana@example.com', created_at: '2026-05-21T08:05:00Z' },
  ];

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
    });
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { DrawerModule } from 'primeng/drawer';

import { PaymentType, Plan, Tenant } from '../../../core/models/tenant';
import { RegisterTenant } from '../../../state/tenants/tenants.actions';

@Component({
  selector: 'app-register-tenant-drawer',
  imports: [ReactiveFormsModule, DrawerModule],
  templateUrl: './register-tenant-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterTenantDrawer {
  private readonly store = inject(Store);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly visible = signal(false);

  protected readonly form = this.fb.group({
    public_name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    api_base_url: ['', Validators.required],
    neon_project_ref: ['', Validators.required],
  });

  open(): void {
    this.form.reset();
    this.visible.set(true);
  }

  protected submit(): void {
    const { public_name, slug, api_base_url, neon_project_ref } = this.form.getRawValue();
    const tenant: Tenant = {
      env_id: crypto.randomUUID(),
      slug,
      public_name,
      api_base_url,
      status: 'active',
      neon_project_ref,
      last_push_at: null,
      // Billing reference starts on defaults; register it from /billing.
      billing: {
        plan: Plan.Monthly,
        billing_email: '',
        payment_type: PaymentType.BankTransfer,
        notes: '',
      },
      // Fiscal data is collected from the tenant later.
      tax_info: null,
    };
    this.store.dispatch(new RegisterTenant(tenant));
    this.visible.set(false);
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Store } from '@ngxs/store';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';

import {
  BILLING_RECORD_STATUS_OPTIONS,
  BillingRecord,
} from '../../../core/models/billing-record';
import { PAYMENT_TYPE_OPTIONS, PaymentType } from '../../../core/models/tenant';
import { RegisterBillingRecord } from '../../../state/tenants/tenants.actions';

@Component({
  selector: 'app-register-billing-record-drawer',
  imports: [ReactiveFormsModule, DrawerModule, SelectModule],
  templateUrl: './register-billing-record-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterBillingRecordDrawer {
  private readonly store = inject(Store);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly visible = signal(false);
  protected readonly paymentTypeOptions = PAYMENT_TYPE_OPTIONS;
  protected readonly statusOptions = BILLING_RECORD_STATUS_OPTIONS;

  /** Tenant the new record is attached to — set by open(). */
  private envId: string | null = null;

  protected readonly form = this.fb.group({
    concept: ['', Validators.required],
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    payment_type: [PaymentType.BankTransfer, Validators.required],
    status: ['pending' as BillingRecord['status'], Validators.required],
    cfdi_folio: [''],
  });

  open(envId: string): void {
    this.envId = envId;
    this.form.reset();
    this.visible.set(true);
  }

  protected submit(): void {
    if (!this.envId) return;
    const { concept, amount, payment_type, status, cfdi_folio } = this.form.getRawValue();
    const now = new Date().toISOString();
    const record: BillingRecord = {
      id: crypto.randomUUID(),
      env_id: this.envId,
      concept,
      amount: amount ?? 0,
      currency: 'MXN',
      payment_type,
      status,
      issued_at: now,
      // Local placeholder — the manager backend derives the real due date from the
      // tenant's plan once this dispatch hits POST /api/tenants/:envId/billing-records.
      due_date: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      paid_at: status === 'paid' ? now : null,
      cfdi_folio: cfdi_folio.trim() || null,
    };
    this.store.dispatch(new RegisterBillingRecord(record));
    this.visible.set(false);
  }
}

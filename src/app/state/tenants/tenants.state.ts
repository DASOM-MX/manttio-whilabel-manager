import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';

import { BillingRecord } from '../../core/models/billing-record';
import {
  PaymentType,
  Plan,
  RegimenFiscal,
  Tenant,
  UsoCfdi,
} from '../../core/models/tenant';
import {
  RegisterBillingRecord,
  RegisterTenant,
  SelectTenant,
  SetTenantStatus,
  UpdateTenantBilling,
} from './tenants.actions';

export interface TenantsStateModel {
  tenants: Tenant[];
  selectedEnvId: string | null;
  billingRecords: BillingRecord[];
}

// Mock registry until the manager backend endpoints exist.
const MOCK_TENANTS: Tenant[] = [
  {
    env_id: '3f2c8a1e-9d4b-4e7a-b6c3-1a5d8e2f7c90',
    slug: 'acme',
    public_name: 'Acme Property Group',
    api_base_url: 'https://api.acme.manttio.app',
    status: 'active',
    neon_project_ref: 'proj-acme-8f3k2',
    last_push_at: '2026-06-28T14:32:00Z',
    billing: {
      plan: Plan.Full,
      billing_email: 'billing@acmeproperties.com',
      payment_type: PaymentType.Stripe,
      notes: 'Paid in full 2026-01-10; support runs through 2031-01.',
    },
    tax_info: {
      rfc: 'APG090512QX3',
      razon_social: 'Acme Property Group S.A. de C.V.',
      regimen_fiscal: RegimenFiscal.PersonasMorales,
      uso_cfdi: UsoCfdi.GastosGenerales,
      postal_code: '64000',
    },
  },
  {
    env_id: '7b9e4d2a-1c6f-4a83-9e5d-4f8b2c7a1d36',
    slug: 'northwind',
    public_name: 'Northwind Realty',
    api_base_url: 'https://api.northwind.manttio.app',
    status: 'active',
    neon_project_ref: 'proj-northwind-2c9d1',
    last_push_at: '2026-06-30T09:15:00Z',
    billing: {
      plan: Plan.Monthly,
      billing_email: 'accounts@northwindrealty.com',
      payment_type: PaymentType.BankTransfer,
      notes: '',
    },
    tax_info: {
      rfc: 'NORE1203148A7',
      razon_social: 'Northwind Realty S. de R.L. de C.V.',
      regimen_fiscal: RegimenFiscal.PersonasMorales,
      uso_cfdi: UsoCfdi.GastosGenerales,
      postal_code: '44100',
    },
  },
  {
    env_id: 'c4a1f7d9-8e2b-4c5f-a7d1-9b3e6c8f2a54',
    slug: 'globex',
    public_name: 'Globex Estates',
    api_base_url: 'https://api.globex.manttio.app',
    status: 'suspended',
    neon_project_ref: 'proj-globex-5t7m4',
    last_push_at: '2026-05-12T18:03:00Z',
    billing: {
      plan: Plan.Monthly,
      billing_email: 'finance@globexestates.com',
      payment_type: PaymentType.BankCheck,
      notes: 'Suspended for non-payment 2026-06-01.',
    },
    tax_info: null,
  },
];

// Mock payment history until the manager backend exposes billing records.
const MOCK_BILLING_RECORDS: BillingRecord[] = [
  {
    id: 'br-0001',
    env_id: '3f2c8a1e-9d4b-4e7a-b6c3-1a5d8e2f7c90',
    concept: 'Full plan — one-time payment',
    amount: 25_000,
    currency: 'MXN',
    payment_type: PaymentType.Stripe,
    status: 'paid',
    issued_at: '2026-01-10T09:00:00Z',
    paid_at: '2026-01-10T09:24:00Z',
    cfdi_folio: 'a81d2f4c-6b3e-4d9a-8c1f-2e7b5a9d3c60',
  },
  {
    id: 'br-0002',
    env_id: '7b9e4d2a-1c6f-4a83-9e5d-4f8b2c7a1d36',
    concept: 'Monthly subscription — May 2026',
    amount: 375,
    currency: 'MXN',
    payment_type: PaymentType.BankTransfer,
    status: 'paid',
    issued_at: '2026-05-01T08:00:00Z',
    paid_at: '2026-05-03T13:41:00Z',
    cfdi_folio: 'f3c9b7a1-2d5e-4f8b-9a6c-7e1d4b8f2a35',
  },
  {
    id: 'br-0003',
    env_id: '7b9e4d2a-1c6f-4a83-9e5d-4f8b2c7a1d36',
    concept: 'Monthly subscription — June 2026',
    amount: 375,
    currency: 'MXN',
    payment_type: PaymentType.BankTransfer,
    status: 'paid',
    issued_at: '2026-06-01T08:00:00Z',
    paid_at: '2026-06-02T10:12:00Z',
    cfdi_folio: '9d4e2c7b-5a1f-4b8d-8e3a-6c9f1b7d4e28',
  },
  {
    id: 'br-0004',
    env_id: '7b9e4d2a-1c6f-4a83-9e5d-4f8b2c7a1d36',
    concept: 'Monthly subscription — July 2026',
    amount: 375,
    currency: 'MXN',
    payment_type: PaymentType.BankTransfer,
    status: 'pending',
    issued_at: '2026-07-01T08:00:00Z',
    paid_at: null,
    cfdi_folio: null,
  },
  {
    id: 'br-0005',
    env_id: 'c4a1f7d9-8e2b-4c5f-a7d1-9b3e6c8f2a54',
    concept: 'Monthly subscription — April 2026',
    amount: 375,
    currency: 'MXN',
    payment_type: PaymentType.BankCheck,
    status: 'paid',
    issued_at: '2026-04-01T08:00:00Z',
    paid_at: '2026-04-15T16:30:00Z',
    cfdi_folio: '4b7a1e9d-3c8f-4a2b-b5e6-1d9c7f3a8b52',
  },
  {
    id: 'br-0006',
    env_id: 'c4a1f7d9-8e2b-4c5f-a7d1-9b3e6c8f2a54',
    concept: 'Monthly subscription — May 2026',
    amount: 375,
    currency: 'MXN',
    payment_type: PaymentType.BankCheck,
    status: 'overdue',
    issued_at: '2026-05-01T08:00:00Z',
    paid_at: null,
    cfdi_folio: null,
  },
];

@State<TenantsStateModel>({
  name: 'tenants',
  defaults: {
    tenants: MOCK_TENANTS,
    selectedEnvId: null,
    billingRecords: MOCK_BILLING_RECORDS,
  },
})
@Injectable()
export class TenantsState {
  @Selector()
  static tenants(state: TenantsStateModel): Tenant[] {
    return state.tenants;
  }

  @Selector()
  static selectedEnvId(state: TenantsStateModel): string | null {
    return state.selectedEnvId;
  }

  @Selector()
  static billingRecords(state: TenantsStateModel): BillingRecord[] {
    return state.billingRecords;
  }

  @Selector()
  static selectedTenant(state: TenantsStateModel): Tenant | null {
    return state.tenants.find((t) => t.env_id === state.selectedEnvId) ?? null;
  }

  @Selector()
  static stats(state: TenantsStateModel) {
    const active = state.tenants.filter((t) => t.status === 'active').length;
    const lastPush = state.tenants
      .map((t) => t.last_push_at)
      .filter((d): d is string => d !== null)
      .sort()
      .at(-1);
    return {
      total: state.tenants.length,
      active,
      suspended: state.tenants.length - active,
      lastPush: lastPush ?? null,
    };
  }

  @Action(RegisterTenant)
  registerTenant(ctx: StateContext<TenantsStateModel>, { tenant }: RegisterTenant) {
    // TODO: provision via the manager backend and append on success.
    ctx.patchState({ tenants: [...ctx.getState().tenants, tenant] });
  }

  @Action(SelectTenant)
  selectTenant(ctx: StateContext<TenantsStateModel>, { envId }: SelectTenant) {
    ctx.patchState({ selectedEnvId: envId });
  }

  @Action(SetTenantStatus)
  setTenantStatus(ctx: StateContext<TenantsStateModel>, { envId, status }: SetTenantStatus) {
    // TODO: call the manager backend (KV.put) and update on success.
    ctx.patchState({
      tenants: ctx
        .getState()
        .tenants.map((t) => (t.env_id === envId ? { ...t, status } : t)),
    });
  }

  @Action(RegisterBillingRecord)
  registerBillingRecord(ctx: StateContext<TenantsStateModel>, { record }: RegisterBillingRecord) {
    // TODO: persist via the manager backend and append on success.
    ctx.patchState({ billingRecords: [...ctx.getState().billingRecords, record] });
  }

  @Action(UpdateTenantBilling)
  updateTenantBilling(ctx: StateContext<TenantsStateModel>, { envId, billing }: UpdateTenantBilling) {
    // TODO: persist via the manager backend.
    ctx.patchState({
      tenants: ctx
        .getState()
        .tenants.map((t) => (t.env_id === envId ? { ...t, billing } : t)),
    });
  }
}

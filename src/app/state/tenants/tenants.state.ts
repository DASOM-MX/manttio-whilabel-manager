import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';

import { PaymentType, Plan, Tenant } from '../../core/models/tenant';
import {
  RegisterTenant,
  SelectTenant,
  SetTenantStatus,
  UpdateTenantBilling,
} from './tenants.actions';

export interface TenantsStateModel {
  tenants: Tenant[];
  selectedEnvId: string | null;
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
  },
];

@State<TenantsStateModel>({
  name: 'tenants',
  defaults: {
    tenants: MOCK_TENANTS,
    selectedEnvId: null,
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

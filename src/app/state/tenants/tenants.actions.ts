import { Tenant, TenantBilling, TenantStatus } from '../../core/models/tenant';

export class RegisterTenant {
  static readonly type = '[Tenants] Register Tenant';
  constructor(readonly tenant: Tenant) {}
}

export class SelectTenant {
  static readonly type = '[Tenants] Select Tenant';
  constructor(readonly envId: string | null) {}
}

/** Start / stop a tenant — will become a manager-backend KV.put on the edge. */
export class SetTenantStatus {
  static readonly type = '[Tenants] Set Tenant Status';
  constructor(
    readonly envId: string,
    readonly status: TenantStatus,
  ) {}
}

export class UpdateTenantBilling {
  static readonly type = '[Tenants] Update Tenant Billing';
  constructor(
    readonly envId: string,
    readonly billing: TenantBilling,
  ) {}
}

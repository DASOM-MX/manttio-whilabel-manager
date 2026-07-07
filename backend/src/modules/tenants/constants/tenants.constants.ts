import type { ModuleFlags } from '../enums/tenants.enum';

// New tenants start with the full product; the superadmin flips flags off per
// plan/contract from the manager UI.
export const DEFAULT_MODULES: ModuleFlags = {
  billing: true,
  wms: true,
  crm: true,
  cms: true,
  scheduling: true,
};

// Tenant-wide default/fallback timezone (visit times, tenant-wide views);
// instance-side `customers.timezone` stays the per-customer override.
export const DEFAULT_TIMEZONE = 'America/Monterrey';

// The config-push contract this manager defines and the whitelabeled fork must
// implement: POST {api_base_url}/internal/config with the shared token.
export const CONFIG_PUSH_PATH = '/internal/config';

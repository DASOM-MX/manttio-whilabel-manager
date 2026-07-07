import type { Env } from '../../../env';
import type { Db } from '../../database/client';
import { sendToInstance } from '../../instances/services/instance-client.service';
import { CONFIG_PUSH_PATH } from '../constants/tenants.constants';
import { findTenantByEnvId, stampLastPushAt } from '../repository/tenants.repository';

// Config push (settled 2026-07-05): operational config ONLY — module flags +
// tenant timezone. Brand is a separate instance-side row (seed/override push is
// a later follow-up once the whitelabeled fork's brand module exists); CMS
// content NEVER travels through the manager. The body never includes
// neon_project_ref, billing_reference data, or anything KV-owned.

export type PushTenantConfigResult =
  | { ok: true; pushedAt: Date }
  | {
      ok: false;
      error: 'tenant_not_found' | 'push_failed';
      reason?: 'http_error' | 'network_error' | 'timeout';
      status?: number | null;
    };

export const pushTenantConfig = async (
  db: Db,
  env: Env,
  envId: string,
): Promise<PushTenantConfigResult> => {
  const tenant = await findTenantByEnvId(db, envId);
  if (!tenant) return { ok: false, error: 'tenant_not_found' };

  const result = await sendToInstance(env, {
    apiBaseUrl: tenant.apiBaseUrl,
    path: CONFIG_PUSH_PATH,
    method: 'POST',
    body: {
      env_id: tenant.envId,
      slug: tenant.slug,
      modules: tenant.modules,
      timezone: tenant.timezone,
    },
  });
  if (!result.ok) {
    return { ok: false, error: 'push_failed', reason: result.reason, status: result.status };
  }

  const pushedAt = new Date();
  await stampLastPushAt(db, envId, pushedAt);
  return { ok: true, pushedAt };
};

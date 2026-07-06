import type { Env } from '../../../env';
import type { Db } from '../../database/client';
import { findTenantByEnvId, updateTenantStatusMirror } from '../repository/tenants.repository';
import type { TenantStatus } from '../enums/tenants.enum';

// Single-writer rule (architecture.md): this service is the ONLY code allowed
// to touch TENANT_STATUS. Write order is load-bearing:
//   1. KV.put — the source of truth (instances read this; ~60s edge propagation).
//   2. Registry mirror — UI convenience. If it fails, the request still
//      succeeds with a `mirror_stale` warning: KV already won, a later write
//      can re-sync. A KV failure, by contrast, fails the whole request.

const kvKeyFor = (envId: string) => `tenant:${envId}`;

export type UpdateTenantStatusResult =
  | { ok: true; status: TenantStatus; mirrorStale: boolean }
  | { ok: false; error: 'tenant_not_found' };

export const updateTenantStatus = async (
  db: Db,
  env: Env,
  envId: string,
  status: TenantStatus,
): Promise<UpdateTenantStatusResult> => {
  const tenant = await findTenantByEnvId(db, envId);
  if (!tenant) return { ok: false, error: 'tenant_not_found' };

  await env.TENANT_STATUS.put(kvKeyFor(envId), JSON.stringify({ status }));

  let mirrorStale = false;
  try {
    await updateTenantStatusMirror(db, envId, status);
  } catch (err) {
    console.error('tenant status mirror update failed', err);
    mirrorStale = true;
  }

  return { ok: true, status, mirrorStale };
};

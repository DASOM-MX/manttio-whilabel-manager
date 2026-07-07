import type { Env } from '../../../env';
import type { InstanceRequest, InstanceResult } from '../types/instances.types';

export type { InstanceRequest, InstanceResult };

// Generic token-auth HTTP client to whitelabeled instances. This is the ONLY
// code allowed to read SHARED_INSTANCE_TOKEN (CLAUDE.md invariant) — the token
// is never logged, never in a response body, never in an error message. Domain
// shaping (what to push) stays in the domain modules; this is transport only.

const INSTANCE_TIMEOUT_MS = 10_000;

export const sendToInstance = async (
  env: Env,
  req: InstanceRequest,
): Promise<InstanceResult> => {
  let res: Response;
  try {
    res = await fetch(new URL(req.path, req.apiBaseUrl), {
      method: req.method,
      headers: {
        authorization: `Bearer ${env.SHARED_INSTANCE_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(INSTANCE_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
    return { ok: false, status: null, reason: timedOut ? 'timeout' : 'network_error' };
  }

  if (!res.ok) return { ok: false, status: res.status, reason: 'http_error' };
  return { ok: true, status: res.status };
};

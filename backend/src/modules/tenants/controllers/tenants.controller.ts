import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppBindings } from '../../../env';
import { createDb } from '../../database/client';
import { toTenantDto } from '../helpers/tenant-dto.helpers';
import { listTenants } from '../repository/tenants.repository';
import { sendSetupEmail } from '../services/setup-email.service';
import { pushTenantConfig } from '../services/tenant-push.service';
import { updateTenantStatus } from '../services/tenant-status.service';
import { updateTenant } from '../services/tenants.service';
import { updateTenantSchema, updateTenantStatusSchema } from '../validators/tenants.validator';

export const tenants = new Hono<AppBindings>();

const uuidSchema = z.string().uuid();

tenants.get('/', async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const rows = await listTenants(db);
  return c.json({ tenants: rows.map(toTenantDto) });
});

tenants.patch('/:envId', zValidator('json', updateTenantSchema), async (c) => {
  const envId = c.req.param('envId');
  if (!uuidSchema.safeParse(envId).success) {
    return c.json({ error: 'invalid_env_id' }, 400);
  }

  const db = createDb(c.env.DATABASE_URL);
  const row = await updateTenant(db, envId, c.req.valid('json'));
  if (!row) return c.json({ error: 'tenant_not_found' }, 404);
  return c.json({ tenant: toTenantDto(row) });
});

tenants.post('/:envId/push', async (c) => {
  const envId = c.req.param('envId');
  if (!uuidSchema.safeParse(envId).success) {
    return c.json({ error: 'invalid_env_id' }, 400);
  }

  const db = createDb(c.env.DATABASE_URL);
  const result = await pushTenantConfig(db, c.env, envId);
  if (!result.ok) {
    if (result.error === 'tenant_not_found') return c.json({ error: result.error }, 404);
    // Instance-side failure class only — no bodies, no token material.
    return c.json({ error: result.error, reason: result.reason, status: result.status }, 502);
  }
  return c.json({ pushed: true, pushed_at: result.pushedAt.toISOString() });
});

tenants.put('/:envId/status', zValidator('json', updateTenantStatusSchema), async (c) => {
  const envId = c.req.param('envId');
  if (!uuidSchema.safeParse(envId).success) {
    return c.json({ error: 'invalid_env_id' }, 400);
  }

  const db = createDb(c.env.DATABASE_URL);
  const result = await updateTenantStatus(db, c.env, envId, c.req.valid('json').status);
  if (!result.ok) return c.json({ error: result.error }, 404);
  return c.json({
    status: result.status,
    ...(result.mirrorStale ? { warning: 'mirror_stale' } : {}),
  });
});

tenants.post('/:envId/setup-email', async (c) => {
  const envId = c.req.param('envId');
  if (!uuidSchema.safeParse(envId).success) {
    return c.json({ error: 'invalid_env_id' }, 400);
  }

  const db = createDb(c.env.DATABASE_URL);
  const result = await sendSetupEmail(db, c.env, envId);
  if (!result.ok) {
    const status = result.error === 'tenant_not_found' ? 404 : 502;
    return c.json({ error: result.error }, status);
  }
  return c.json({ sent: true, recipient: result.recipient });
});

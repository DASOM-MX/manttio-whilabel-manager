import { Hono } from 'hono';
import { z } from 'zod';
import type { AppBindings } from '../../../env';
import { createDb } from '../../database/client';
import { toTenantDto } from '../helpers/tenant-dto.helpers';
import { listTenants } from '../repository/tenants.repository';
import { sendSetupEmail } from '../services/setup-email.service';

export const tenants = new Hono<AppBindings>();

const uuidSchema = z.string().uuid();

tenants.get('/', async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const rows = await listTenants(db);
  return c.json({ tenants: rows.map(toTenantDto) });
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

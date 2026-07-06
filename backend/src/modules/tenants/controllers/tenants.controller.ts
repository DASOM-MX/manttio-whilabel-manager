import { Hono } from 'hono';
import type { AppBindings } from '../../../env';
import { createDb } from '../../database/client';
import { toTenantDto } from '../helpers/tenant-dto.helpers';
import { listTenants } from '../repository/tenants.repository';

export const tenants = new Hono<AppBindings>();

tenants.get('/', async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const rows = await listTenants(db);
  return c.json({ tenants: rows.map(toTenantDto) });
});

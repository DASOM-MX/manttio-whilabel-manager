import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppBindings } from '../../../env';
import { createDb } from '../../database/client';
import { toBillingRecordDto, toTaxInfoDto } from '../helpers/billing-dto.helpers';
import { listBillingRecordsByEnvId } from '../repository/billing.repository';
import { registerBillingRecord, saveTaxInfo } from '../services/billing.service';
import { createBillingRecordSchema, taxInfoSchema } from '../validators/billing.validator';
import { findTenantByEnvId } from '../../tenants/repository/tenants.repository';

// Mounted at /api/tenants alongside the tenants router — this module owns the
// billing sub-resources of a tenant (tax-info + billing-records).
export const billing = new Hono<AppBindings>();

const uuidSchema = z.string().uuid();

const validEnvId = (raw: string) => (uuidSchema.safeParse(raw).success ? raw : null);

billing.put('/:envId/tax-info', zValidator('json', taxInfoSchema), async (c) => {
  const envId = validEnvId(c.req.param('envId'));
  if (!envId) return c.json({ error: 'invalid_env_id' }, 400);

  const db = createDb(c.env.DATABASE_URL);
  const row = await saveTaxInfo(db, envId, c.req.valid('json'));
  if (!row) return c.json({ error: 'tenant_not_found' }, 404);
  return c.json({ tax_info: toTaxInfoDto(row) });
});

billing.get('/:envId/billing-records', async (c) => {
  const envId = validEnvId(c.req.param('envId'));
  if (!envId) return c.json({ error: 'invalid_env_id' }, 400);

  const db = createDb(c.env.DATABASE_URL);
  if (!(await findTenantByEnvId(db, envId))) {
    return c.json({ error: 'tenant_not_found' }, 404);
  }
  const rows = await listBillingRecordsByEnvId(db, envId);
  return c.json({ billing_records: rows.map(toBillingRecordDto) });
});

billing.post(
  '/:envId/billing-records',
  zValidator('json', createBillingRecordSchema),
  async (c) => {
    const envId = validEnvId(c.req.param('envId'));
    if (!envId) return c.json({ error: 'invalid_env_id' }, 400);

    const db = createDb(c.env.DATABASE_URL);
    const row = await registerBillingRecord(db, envId, c.req.valid('json'));
    if (!row) return c.json({ error: 'tenant_not_found' }, 404);
    return c.json({ billing_record: toBillingRecordDto(row) }, 201);
  },
);

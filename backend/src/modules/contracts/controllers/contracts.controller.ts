import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppBindings } from '../../../env';
import { createDb } from '../../database/client';
import { findTenantByEnvId } from '../../tenants/repository/tenants.repository';
import { toContractDto } from '../helpers/contract-dto.helpers';
import { listContractsByEnvId } from '../repository/contracts.repository';
import { applyContractUpdate, createContract } from '../services/contracts.service';
import { createContractSchema, updateContractSchema } from '../validators/contracts.validator';

// Mounted at /api — owns both the per-tenant collection (/tenants/:envId/contracts)
// and the single-resource lifecycle route (/contracts/:id).
export const contracts = new Hono<AppBindings>();

const uuidSchema = z.string().uuid();

const validUuid = (raw: string) => (uuidSchema.safeParse(raw).success ? raw : null);

contracts.get('/tenants/:envId/contracts', async (c) => {
  const envId = validUuid(c.req.param('envId'));
  if (!envId) return c.json({ error: 'invalid_env_id' }, 400);

  const db = createDb(c.env.DATABASE_URL);
  if (!(await findTenantByEnvId(db, envId))) {
    return c.json({ error: 'tenant_not_found' }, 404);
  }
  const rows = await listContractsByEnvId(db, envId);
  return c.json({ contracts: rows.map(toContractDto) });
});

contracts.post(
  '/tenants/:envId/contracts',
  zValidator('json', createContractSchema),
  async (c) => {
    const envId = validUuid(c.req.param('envId'));
    if (!envId) return c.json({ error: 'invalid_env_id' }, 400);

    const db = createDb(c.env.DATABASE_URL);
    const row = await createContract(db, envId, c.req.valid('json'));
    if (!row) return c.json({ error: 'tenant_not_found' }, 404);
    return c.json({ contract: toContractDto(row) }, 201);
  },
);

contracts.patch('/contracts/:id', zValidator('json', updateContractSchema), async (c) => {
  const id = validUuid(c.req.param('id'));
  if (!id) return c.json({ error: 'invalid_contract_id' }, 400);

  const db = createDb(c.env.DATABASE_URL);
  const result = await applyContractUpdate(db, id, c.req.valid('json'));
  if (!result.ok) {
    const status = result.error === 'contract_not_found' ? 404 : 409;
    return c.json({ error: result.error }, status);
  }
  return c.json({
    contract: toContractDto(result.contract),
    ...(result.mirrorStale ? { warning: 'mirror_stale' } : {}),
  });
});

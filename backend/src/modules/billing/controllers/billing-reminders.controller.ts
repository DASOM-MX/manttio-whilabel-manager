import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppBindings } from '../../../env';
import { createDb } from '../../database/client';
import { remindBillingRecord } from '../services/billing-reminder.service';

// Mounted at /api — billing-records actions live under /api/billing-records/:id,
// not under the tenant collection, so this is a separate router from `billing`.
export const billingReminders = new Hono<AppBindings>();

const uuidSchema = z.string().uuid();

// ?force=true bypasses the 24h last_reminded_at guard (explicit override only).
const remindQuerySchema = z.object({ force: z.enum(['true', 'false']).optional() });

billingReminders.post(
  '/billing-records/:id/remind',
  zValidator('query', remindQuerySchema),
  async (c) => {
    const id = c.req.param('id');
    if (!uuidSchema.safeParse(id).success) {
      return c.json({ error: 'invalid_record_id' }, 400);
    }

    const db = createDb(c.env.DATABASE_URL);
    const force = c.req.valid('query').force === 'true';
    const result = await remindBillingRecord(db, c.env, id, force);
    if (!result.ok) {
      const status =
        result.error === 'record_not_found' ? 404 : result.error === 'send_failed' ? 502 : 409;
      return c.json({ error: result.error }, status);
    }
    return c.json({ sent: true, recipient: result.recipient });
  },
);

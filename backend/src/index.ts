import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppBindings, Env } from './env';
import { auth } from './modules/auth/controllers/auth.controller';
import { jwtMiddleware } from './modules/auth/middleware/jwt.middleware';
import { billing } from './modules/billing/controllers/billing.controller';
import { billingReminders } from './modules/billing/controllers/billing-reminders.controller';
import { runBillingReminderSweep } from './modules/billing/services/billing-reminder.service';
import { contracts } from './modules/contracts/controllers/contracts.controller';
import { expireLapsedContracts } from './modules/contracts/services/contracts.service';
import { createDb } from './modules/database/client';
import { tenants } from './modules/tenants/controllers/tenants.controller';

const app = new Hono<AppBindings>();

app.use('*', logger());
app.use('/api/*', cors({ origin: ['http://localhost:4299'] }));

app.get('/health', (c) => c.json({ ok: true, service: 'manttio-manager-backend' }));

// Public /api/auth first, then JWT gates everything else under /api/*
// (registration order keeps login public; the middleware also skips /api/auth
// itself for defense in depth).
app.route('/api/auth', auth);
app.use('/api/*', jwtMiddleware);

app.route('/api/tenants', tenants);
// Billing owns the tax-info + billing-records sub-resources of a tenant.
app.route('/api/tenants', billing);
// Manual reminder re-send lives at /api/billing-records/:id/remind.
app.route('/api', billingReminders);
// Contracts own /api/tenants/:envId/contracts + /api/contracts/:id (lifecycle).
app.route('/api', contracts);

app.onError((err, c) => {
  if (err instanceof SyntaxError || /JSON/i.test(err.message)) {
    return c.json({ error: 'invalid_json' }, 400);
  }
  console.error(err);
  return c.json({ error: 'internal_error', message: err.message }, 500);
});

app.notFound((c) => c.json({ error: 'not_found' }, 404));

// Daily sweep (wrangler.toml [triggers], 15:00 UTC = 09:00 América/Monterrey):
// expire lapsed contracts, then auto-issue monthly records, flip overdue, and
// send grouped reminders. Locally: `wrangler dev --test-scheduled` +
// `curl "http://localhost:8787/__scheduled?cron=0+15+*+*+*"`.
const scheduled: ExportedHandlerScheduledHandler<Env> = (_event, env, ctx) => {
  ctx.waitUntil(
    (async () => {
      const db = createDb(env.DATABASE_URL);
      const expiredContracts = await expireLapsedContracts(db);
      const sweep = await runBillingReminderSweep(db, env);
      console.log(
        `[cron] contracts expired: ${expiredContracts} · records auto-issued: ${sweep.autoIssued} · ` +
          `flipped overdue: ${sweep.flippedOverdue} · tenants reminded: ${sweep.remindedTenants} · ` +
          `reminder failures: ${sweep.failedTenants}`,
      );
    })(),
  );
};

export default {
  fetch: app.fetch,
  scheduled,
} satisfies ExportedHandler<Env>;

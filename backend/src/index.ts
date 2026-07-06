import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppBindings } from './env';
import { tenants } from './modules/tenants/controllers/tenants.controller';

const app = new Hono<AppBindings>();

app.use('*', logger());
app.use('/api/*', cors({ origin: ['http://localhost:4299'] }));

app.get('/health', (c) => c.json({ ok: true, service: 'manttio-manager-backend' }));

// JWT middleware lands in the auth phase and will gate everything under /api/*
// except /api/auth (see architecture.md build order).
app.route('/api/tenants', tenants);

app.onError((err, c) => {
  if (err instanceof SyntaxError || /JSON/i.test(err.message)) {
    return c.json({ error: 'invalid_json' }, 400);
  }
  console.error(err);
  return c.json({ error: 'internal_error', message: err.message }, 500);
});

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default app;

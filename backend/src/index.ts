import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  // TENANT_STATUS: KVNamespace; // `tenant:{envId}` -> { status } — wire in wrangler.toml
  // SHARED_INSTANCE_TOKEN: string; // instance-push auth — `wrangler secret put`
}

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors({ origin: ['http://localhost:4299'] }));

app.get('/health', (c) => c.json({ ok: true, service: 'manttio-manager-backend' }));

// Mock registry until the DB is wired — mirrors the frontend's TenantsState mocks
// so swapping the frontend from local mocks to this endpoint is a no-op visually.
const MOCK_TENANTS = [
  {
    env_id: '3f2c8a1e-9d4b-4e7a-b6c3-1a5d8e2f7c90',
    slug: 'acme',
    public_name: 'Acme Property Group',
    api_base_url: 'https://api.acme.manttio.app',
    status: 'active',
    neon_project_ref: 'proj-acme-8f3k2',
    last_push_at: '2026-06-28T14:32:00Z',
  },
  {
    env_id: '7b9e4d2a-1c6f-4a83-9e5d-4f8b2c7a1d36',
    slug: 'northwind',
    public_name: 'Northwind Realty',
    api_base_url: 'https://api.northwind.manttio.app',
    status: 'active',
    neon_project_ref: 'proj-northwind-2c9d1',
    last_push_at: '2026-06-30T09:15:00Z',
  },
  {
    env_id: 'c4a1f7d9-8e2b-4c5f-a7d1-9b3e6c8f2a54',
    slug: 'globex',
    public_name: 'Globex Estates',
    api_base_url: 'https://api.globex.manttio.app',
    status: 'suspended',
    neon_project_ref: 'proj-globex-5t7m4',
    last_push_at: '2026-05-12T18:03:00Z',
  },
];

app.get('/api/tenants', (c) => c.json({ tenants: MOCK_TENANTS }));

// TODO (see manttio-manager-backend-plan.md):
// - internal superadmin auth on /api/*
// - tenant_registry + billing_reference stores (registry CRUD, billing CRUD)
// - PUT /api/tenants/:envId/status -> KV.put on TENANT_STATUS (registry mirrors it)
// - POST /api/tenants/:envId/push -> instance config push with SHARED_INSTANCE_TOKEN

export default app;

# Manttio Manager Backend — control-plane BFF rules

## Role
The only holder of the **shared instance token**. Owns the tenant registry + billing reference, pushes config to whitelabeled instances, and writes tenant status to Cloudflare KV. The manager frontend calls this API and nothing else; instances are never reachable from the browser. Full plan: `manttio-manager-backend-plan.md` · architecture sketch (modules, schema, routes, build order): `architecture.md`.

## Stack
- **Hono 4** on **Cloudflare Workers** (`wrangler dev` / `wrangler deploy`), TypeScript strict, ESM.
- Validation with **zod** via `@hono/zod-validator` on every write endpoint.
- **pnpm** (not npm) — matches the sibling `manttio-whitelabeled/backend`.
- DB layer when it lands: **Drizzle + Neon serverless**, same as the sibling backend.
- Outbound email via **Resend** (fetch wrapper, no SDK): billing-due reminders (daily cron
  sweep + manual re-send) and instance setup-info emails, sent to `tenant_registry.billing_email`
  only — never to end customers, never containing tokens or `neon_project_ref`.
- **Contracts** are 1:N per tenant (`contracts` table): lifecycle `draft → active →
  expired | terminated`, renewals are new rows, at most one `active` per tenant (partial
  unique index). `tenant_registry.plan` mirrors the active contract; the contract wins.
- Billing record `due_date` is **always server-derived from the tenant's plan**
  (`billing/utils/billing-cycle.ts`: monthly → next `billing_anchor` day; full → issued + 30
  days) — never accepted from a client. Pricing comes from `billing/constants/plans.ts`,
  never stored per tenant.

## Invariants
- `SHARED_INSTANCE_TOKEN` lives only in Worker secrets (`wrangler secret put`) — never in code, git, or responses. Daily rotation with a dual-valid overlap window.
- **KV is the status source of truth** (`tenant:{envId}` → `{ status }`); the registry `status` column is a UI mirror. If they disagree, KV wins.
- `billing_reference` data is admin-side only — never sent to a tenant DB, never exposed to a client.
- CORS allows the manager frontend origin only (dev: `http://localhost:4299`).

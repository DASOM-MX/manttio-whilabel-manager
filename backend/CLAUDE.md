# Manttio Manager Backend — control-plane BFF rules

## Role
The only holder of the **shared instance token**. Owns the tenant registry + billing reference, pushes config to whitelabeled instances, and writes tenant status to Cloudflare KV. The manager frontend calls this API and nothing else; instances are never reachable from the browser. Full plan: `manttio-manager-backend-plan.md` · architecture sketch (modules, schema, routes, build order): `architecture.md`.

## Project state (as of 2026-07-06)
- **Cloudflare Workers** (Wrangler v4) running **Hono 4** in TypeScript. Entry: `src/index.ts`, deployed as `manttio-manager-backend`. `compatibility_flags = ["nodejs_compat"]` for `bcryptjs`.
- **Postgres** on **Neon** via `@neondatabase/serverless`'s **WebSocket driver** (not neon-http) — real transactions for atomic flows like register-tenant. The manager has its **own** Neon project — never a tenant DB, never the sibling `manttio-whitelabeled` DB.
- **Drizzle ORM** for the schema (`src/modules/database/schema.ts` barrel + per-module `models/*.model.ts`) and queries (`src/modules/<domain>/repository/*`). Migrations in `drizzle/migrations/` via `drizzle-kit`. Live DB is current through migration `0004` (tenant `modules` + `timezone`).
- **Auth** via JWT (HS256) using `jose`. Payload is `{ sub: adminId }` only — all superadmins are equal, no role tiers (add one only if a read-only operator ever exists). TTL: `7d` dev, `1d` prod (fail-closed on unknown env).
- **pnpm** (not npm) — matches the sibling backend.
- Build order lives in `architecture.md`; **all 7 phases done** (1 DB foundations, 2 auth, 3 billing, 4 contracts, 5 email + cron, 6 KV status control, 7 config push — the draft-vs-live blocker was settled 2026-07-05, see `manttio-manager-backend-plan.md` §5). Not yet built: tenant registration endpoint (`POST /api/tenants`), brand seed/override push (needs the whitelabeled fork's brand module first).
- The Worker exports `{ fetch, scheduled }` — the `scheduled` handler (cron `0 15 * * *` = 09:00 América/Monterrey) expires lapsed contracts then runs the billing reminder sweep. Test locally with `wrangler dev --test-scheduled` + `curl "http://localhost:8787/__scheduled?cron=0+15+*+*+*"`.
- Conventions are inherited from the sibling `manttio-whitelabeled/backend` (see its `CLAUDE.md`) so both Workers feel like the same codebase; deviations are listed at the end of `architecture.md`.

## Module layout (NestJS-like, module-first)
`src/` holds only `env.ts` (bindings + `AuthUser`), `index.ts` (composition root), and `modules/`. **All logic for a domain lives under its own module.** No top-level `routes/`, `db/`, `lib/`, `middleware/`, or `validators/`.

- **Domain modules:** `auth/`, `tenants/`, `billing/`, `contracts/`. `billing/` owns the tax-info + billing-records sub-resources of a tenant (router mounted at `/api/tenants` alongside the tenants router); `contracts/` owns `/api/tenants/:envId/contracts` + `/api/contracts/:id` (mounted at `/api`).
- **Cross-cutting modules (not junk drawers; must be generic/reusable):** `database/` (Drizzle client + schema barrel + `db-errors`), `email/` (generic Resend transport — fetch wrapper, no SDK), and `instances/` (token-auth HTTP client to whitelabeled instances — the ONLY reader of `SHARED_INSTANCE_TOKEN`). Domain composition that *uses* a cross-cutting module stays in the domain module (push shaping in `tenants/tenant-push.service.ts`, reminder email content in `billing/`, setup email content in `tenants/`).
- **Per-module folders (create only what a module needs):** `controllers/` (thin Hono router: validate → service → respond) · `services/` (business logic) · `repository/` (every Drizzle query/mutation) · `models/` (Drizzle tables) · `validators/` (zod schemas + their `z.infer` input types) · `enums/` (literal unions + value arrays) · `constants/` (fixed values, never markup) · `types/` (DB row aliases etc.) · `templates/` (static markup, never inline in a renderer; named `<name>.template.ts` — the sibling's `.html.ts` breaks under wrangler v4, which treats `.html`-suffixed import specifiers as text modules) · `helpers/` (renderers/formatters, e.g. `tenant-dto.helpers.ts`) · `utils/` (small pure helpers, e.g. due-date math) · `middleware/` (**`auth/` only**).
- **Schema barrel:** each `models/*.model.ts` defines only its tables (acyclic FK imports); **all `relations()` live in `modules/database/schema.ts`**. `drizzle.config.ts` and `database/client.ts` read the barrel.

## Routing structure
- All routes mounted off `src/index.ts`. Order matters: `logger()` → `cors()` (manager frontend origin only, dev: `http://localhost:4299`) → public `/api/auth` → `jwtMiddleware` on `/api/*` → protected routers. `/health` is public.
- One controller per resource under `src/modules/<domain>/controllers/`. **Controllers stay thin** — validate → call service/repository → respond. Full route table: `architecture.md`.
- Routers are `Hono<AppBindings>` (see `src/env.ts`) so `c.env` / `c.get('user')` are typed.
- **Error response shape:** `{ error: 'snake_case_code', message? }`. Status reflects the class (`400` validation, `401` auth, `404` missing, `409` conflict, `500` unexpected).

## Auth
- JWT middleware: `src/modules/auth/middleware/jwt.middleware.ts`. Reads `Authorization: Bearer`, verifies with `jose.jwtVerify`, asserts `sub` is a string, stores `{ id }` on `c.set('user', ...)`. Any failure → `401 unauthorized`. It skips `/api/auth` (also public by registration order — defense in depth).
- Login + signing live in `src/modules/auth/services/`: `auth.service.ts` (`login()` → token | null), `jwt.service.ts` (`signAuthToken`, TTL via `expiresInForEnv`, fail-closed), `password.service.ts` (bcrypt).
- **The backend is the sole authority on token validity.** Never trust client-supplied identity — read it from `c.get('user')`.
- Registration is closed: bootstrap via `pnpm seed:admin <email> [name]` (password from `SEEDED_ADMIN_PASSWORD` in `.dev.vars`).

## Database
- **Use the WebSocket driver** (`Pool` → `drizzle/neon-serverless`). Do not switch to neon-http.
- Tables so far: `tenant_registry` (identity/push columns incl. `modules` jsonb feature flags + IANA `timezone`, plus the `TenantBilling` block: `plan`, `billing_email`, `payment_type`, `billing_anchor`, `billing_notes`; CHECK constraints on status/plan/payment_type), `admins` (soft delete, partial unique email index on active rows), `billing_reference` (1:1 tax/legal data, nullable "handed over later"), `billing_records` (payment history; `due_date` server-derived), `contracts` (1:N; partial unique index = one `active` per tenant; `ends_at` derived). Pull types via `$inferSelect` / `$inferInsert` aliased in each module's `types/`.
- **Repository pattern:** controllers/services never call `db.select(...)` directly outside a repository. Repository functions take a `Db` (from `modules/database/client.ts`) plus typed args.
- **Soft deletes** via `deleted_at` (`isNull` in every list filter) — `admins` today; hard deletes are reserved for fixture cleanup.
- **Postgres error mapping:** use `isForeignKeyViolation` / `isUniqueViolation` from `database/db-errors.ts` on inserts/updates, never catch `Error` blindly.
- **Migrations:** `pnpm db:generate` (after a schema change) → review the SQL under `drizzle/migrations/` → `pnpm db:migrate` (or `db:push` for dev iteration). `db:studio` opens Drizzle Studio.

## Validation
- All request bodies/query params go through `@hono/zod-validator` (`zValidator('json' | 'query', schema)`) — never read `await c.req.json()` directly.
- Schemas live in `src/modules/<domain>/validators/` with their inferred input types exported alongside.
- Validate `:id`-style path params with `z.string().uuid()` inside the handler when the format matters.

## Domain rules (manager-specific)
- Billing record `due_date` is **always server-derived from the tenant's plan** (`billing/utils/billing-cycle.ts`: monthly → next `billing_anchor` day; full → issued + 30 days) — never accepted from a client. Pricing comes from `billing/constants/plans.ts` (mirror of the frontend's `PLAN_PRICING`), never stored per tenant.
- **Contracts** are 1:N per tenant (`contracts` table): lifecycle `draft → active → expired | terminated`, renewals are new rows, at most one `active` per tenant (partial unique index). `tenant_registry.plan` mirrors the active contract; the contract wins.
- Outbound email via **Resend** (fetch wrapper, no SDK): billing-due reminders (daily cron sweep + manual re-send `POST /api/billing-records/:id/remind`, `?force=true` bypasses the 24h guard) and instance setup-info emails (`POST /api/tenants/:envId/setup-email`), sent to `tenant_registry.billing_email` only — never to end customers, never containing tokens or `neon_project_ref`.
- **Reminder sweep** (`billing/services/billing-reminder.service.ts`): (1) auto-issue the current monthly cycle's record if missing — idempotent, a cycle is keyed by its due date, `full` tenants and tenants whose `billing_anchor` is still in the future are skipped; (2) flip `pending` past `due_date` → `overdue`; (3) remind unpaid records due within 3 days or overdue, skipping rows reminded in the last 24h — one grouped email per tenant. A failed send is logged and NOT stamped with `last_reminded_at`, so the next sweep retries it.
- **Config push** (settled 2026-07-05): `POST /api/tenants/:envId/push` sends operational config ONLY — `{ env_id, slug, modules, timezone }` — as `POST {api_base_url}/internal/config` with the shared token (this repo defines the contract; the whitelabeled fork implements the receiver). Brand is a separate instance-side row (seed/override push is a follow-up once that module exists); **CMS content never travels through the manager**. Success stamps `last_push_at`; instance failures surface as 502 `push_failed` with a reason class only (`http_error` / `network_error` / `timeout`) — never response bodies.
- `PATCH /api/tenants/:envId` edits registry fields only: `status` is KV-owned (`PUT /:envId/status`), `plan` mirrors the active contract, and slug/env_id/`neon_project_ref` are fixed at provisioning.
- Enums mirror the frontend's `core/models/tenant.ts` (`Plan`, `PaymentType` in `billing/enums/billing.enum.ts`) — keep the two in sync. `TenantStatus` adds a backend-only `provisioning` state.

## Invariants
- `SHARED_INSTANCE_TOKEN` lives only in Worker secrets (`wrangler secret put`) — never in code, git, logs, or responses; read exclusively inside `instances/instance-client.service.ts`. Daily rotation with a dual-valid overlap window (instances accept current + next; this Worker sends the newest).
- **KV is the status source of truth** (`tenant:{envId}` → `{ status }`); the registry `status` column is a UI mirror. If they disagree, KV wins. Single-writer rule: only `tenants/services/tenant-status.service.ts` may touch `TENANT_STATUS` — KV.put first (a KV failure fails the request), mirror second (a mirror failure returns success + `warning: 'mirror_stale'`). The status switch only sets active/suspended; `provisioning` can't be re-entered from the API.
- `billing_reference` data is admin-side only — never sent to a tenant DB, never exposed to any client but the manager frontend.
- CORS allows the manager frontend origin only (dev: `http://localhost:4299`).

## Configuration + secrets
- `wrangler.toml` declares **vars** (non-secret: `ENVIRONMENT`, `RESEND_FROM`, `BRAND_NAME`, `BRAND_SITE_URL`, `BRAND_LOGO_URL`, `BRAND_PAYMENT_INSTRUCTIONS`), the `[triggers]` cron, and the `TENANT_STATUS` KV binding (real namespace id; local dev simulates KV regardless). Secrets are set via `wrangler secret put <NAME>`: `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `SHARED_INSTANCE_TOKEN`.
- `.dev.vars` (gitignored) provides the same secrets locally for `wrangler dev`, `drizzle-kit`, and the seed scripts — copy `.dev.vars.example`. Restart `wrangler dev` after creating it; it doesn't pick up a brand-new file.

## Scripts
- `pnpm dev` — `wrangler dev` (local Worker on `http://localhost:8787`, reads `.dev.vars`).
- `pnpm deploy` — `wrangler deploy`.
- `pnpm typecheck` — `tsc --noEmit`.
- `pnpm db:generate` / `db:migrate` / `db:push` / `db:studio` — Drizzle Kit.
- `pnpm seed:admin <email> [name]` — bootstrap superadmin. Run once per fresh DB.
- `pnpm seed:tenants` — dev fixtures: the three tenants the frontend mocks use.
- Tests (when they land): Vitest + `@cloudflare/vitest-pool-workers` against live Neon with fixture email/slug patterns, same caveats as the sibling.

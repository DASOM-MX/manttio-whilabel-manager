# Manttio Manager Backend — architecture sketch

The "how" for `manttio-manager-backend-plan.md` (the "what"). Conventions are inherited from
the sibling `manttio-whitelabeled/backend` (see its `CLAUDE.md`) so both Workers feel like the
same codebase; deviations are called out at the end.

## System position

```
manager frontend (:4299)
        │  JWT (superadmin)
        ▼
manager backend (:8787, this Worker)
        │                         │
        │ shared token (push)     │ KV.put tenant:{envId} → { status }
        ▼                         ▼
whitelabeled instances       Cloudflare KV (TENANT_STATUS)
```

- The frontend only ever talks to this Worker. Instances are never reachable from the browser.
- **KV is the status source of truth**; `tenant_registry.status` is a UI mirror. KV wins.

## Stack

- **Hono 4** on **Cloudflare Workers** (Wrangler v4), TypeScript strict, ESM, `nodejs_compat`
  (for `bcryptjs`, matching the sibling).
- **Drizzle ORM** + **Neon Postgres** via the **WebSocket driver** (`Pool` →
  `drizzle/neon-serverless`) — same driver as the sibling; registry + billing writes stay
  transactional (e.g. register-tenant = registry row + tax row atomically).
- **jose** JWT (HS256), **bcryptjs** for password hashing.
- **zod** via `@hono/zod-validator` on every request body/query.
- **Resend** for outbound email (fetch-based wrapper, no SDK — sibling pattern), plus a
  **Cron Trigger** (`[triggers] crons` in `wrangler.toml` → `scheduled` handler) for the
  daily billing-reminder sweep.
- Bindings: `TENANT_STATUS` (KV namespace). Secrets: `DATABASE_URL`, `JWT_SECRET`,
  `RESEND_API_KEY`, `SHARED_INSTANCE_TOKEN` (+ `SHARED_INSTANCE_TOKEN_NEXT` during rotation
  overlap). Vars: `RESEND_FROM`, `BRAND_*` (manttio brand strings for email chrome).

## Module layout (module-first, NestJS-like — sibling convention)

`src/` holds only `env.ts` (bindings + `AuthUser`), `index.ts` (composition root), and
`modules/`. No top-level `routes/`, `db/`, `lib/`, `middleware/`.

```
src/
  env.ts                  # Env bindings + AppBindings + AuthUser ({ id })
  index.ts                # logger + cors → public /api/auth → jwt middleware → protected routers
  modules/
    auth/                 # superadmin auth (this repo's only "users" domain)
      controllers/auth.controller.ts     # POST /api/auth/login
      middleware/jwt.middleware.ts       # Bearer → jose.jwtVerify → c.set('user')
      models/admins.model.ts             # admins table (all superadmins; no roles tier yet)
      repository/admins.repository.ts
      services/auth.service.ts           # login() → token | null
      services/jwt.service.ts            # signAuthToken, TTL 7d dev / 1d prod (fail-closed)
      services/password.service.ts       # bcrypt
      validators/auth.validator.ts
    tenants/              # tenant_registry + status + config push (domain composition)
      controllers/tenants.controller.ts
      models/tenants.model.ts            # tenant_registry
      repository/tenants.repository.ts
      services/tenants.service.ts        # register/update, orchestration
      services/tenant-status.service.ts  # KV.put + registry mirror update (single writer)
      services/tenant-push.service.ts    # fan-out via instances/ client  [blocked: draft-vs-live]
      services/setup-email.service.ts    # instance setup info email (composes email/ transport)
      templates/setup-email.html.ts      # markup only — never inline in a renderer
      helpers/setup-email.helpers.ts     # fills the template from a registry row
      enums/tenants.enum.ts              # TenantStatus: active | suspended | provisioning
      validators/tenants.validator.ts
      types/tenants.types.ts
    billing/              # billing_reference (tax/legal) + billing_records — ADMIN-SIDE ONLY
      controllers/billing.controller.ts
      models/billing-reference.model.ts
      models/billing-records.model.ts
      repository/billing.repository.ts
      services/billing.service.ts
      services/billing-reminder.service.ts  # due-soon/overdue reminder emails (cron + manual)
      templates/billing-reminder.html.ts
      helpers/billing-email.helpers.ts      # amounts/dates formatted es-MX for the template
      constants/plans.ts                 # PLAN_PRICING mirror (full $25,000 one-time / monthly $375)
      utils/billing-cycle.ts             # dueDateFor(plan, issuedAt, anchor) — the ONLY due-date math
      enums/billing.enum.ts              # Plan, BillingRecordStatus, PaymentType, RegimenFiscal, UsoCfdi
      validators/billing.validator.ts
    contracts/            # service contracts signed with the client (tenant) — 1:N
      controllers/contracts.controller.ts
      models/contracts.model.ts
      repository/contracts.repository.ts
      services/contracts.service.ts      # create (derives ends_at), status transitions
      utils/contract-lifecycle.ts        # isActive/isExpired predicates + allowed transitions
      enums/contracts.enum.ts            # ContractStatus: draft | active | expired | terminated
      validators/contracts.validator.ts
    database/             # cross-cutting: Drizzle client + schema barrel + db-errors
      client.ts
      schema.ts                          # barrel + ALL relations() (acyclic model imports)
      db-errors.ts                       # isForeignKeyViolation / isUniqueViolation
    email/                # cross-cutting: generic Resend transport (ported from the sibling)
      services/email.service.ts          # sendEmail() — fetch-based, provider-swappable
      types/email.types.ts
    instances/            # cross-cutting: generic token-auth HTTP client to whitelabeled instances
      services/instance-client.service.ts  # fetch wrapper: base_url + shared token header,
                                           # timeout, typed result — the ONLY reader of
                                           # SHARED_INSTANCE_TOKEN
      types/instances.types.ts
```

Split rule (sibling pattern): `instances/` and `email/` are generic transports; domain
composition stays in the domain module — push shaping in `tenants/tenant-push.service.ts`,
setup-email content in `tenants/setup-email.service.ts`, reminder content in
`billing/billing-reminder.service.ts`.

## Data model (Drizzle, per-module `models/*.model.ts`, relations in the barrel)

**`tenant_registry`** — mirrors the frontend `Tenant` model:

| column | type | notes |
|---|---|---|
| env_id | uuid pk | assigned at by-hand provisioning |
| slug | text unique | e.g. `acme` |
| public_name | text | |
| api_base_url | text | push target |
| neon_project_ref | text | that tenant's DB project |
| status | text | **mirror of KV** — UI convenience only |
| plan | text | `full` / `monthly` — **drives due-date derivation + pricing** (frontend `TenantBilling.plan`; price is never stored per tenant) |
| billing_email | text | recipient for billing reminders + setup emails |
| payment_type | text | default method: bank_transfer / stripe / cash / bank_check |
| billing_anchor | date | first invoice date; monthly cycles bill on this day of the month |
| billing_notes | text null | |
| last_push_at | timestamptz null | stamped by push service |
| created_at / updated_at | timestamptz | |

The `plan…billing_notes` block is the frontend's `TenantBilling` — it lives on the registry
row (always present from registration) while `billing_reference` below stays the nullable
"tax data handed over later" 1:1 row.

**`billing_reference`** — one row per tenant; union of the plan's fields and the frontend's
`TenantTaxInfo` (rfc = tax_id, postal_code = tax_zip, razon_social = legal_name):

| column | type | notes |
|---|---|---|
| env_id | uuid pk, fk → tenant_registry | 1:1 |
| business_name | text | trade name |
| razon_social | text | legal name (CFDI) |
| legal_owner | text null | |
| rfc | text | tax id |
| regimen_fiscal | text | SAT code: 601 / 612 / 626 |
| uso_cfdi | text | G01 / G03 / S01 |
| tax_zip | text | CP fiscal |
| owner_phone | text null | |
| notes | text null | |

(Reminder/setup emails go to `tenant_registry.billing_email`, not this table — tax data can
arrive late, but every tenant has a billing contact from day one.)

**`billing_records`** — mirrors the frontend `BillingRecord`:

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| env_id | uuid fk → tenant_registry | |
| concept | text | |
| amount | numeric(12,2) | |
| currency | text | `MXN` only for now |
| payment_type | text | bank_transfer / card / cash |
| status | text | paid / pending / overdue |
| issued_at | timestamptz | |
| due_date | date | **server-derived from the tenant's plan at creation — never client-supplied** (see below) |
| paid_at | timestamptz null | set when status → paid |
| cfdi_folio | text null | |
| last_reminded_at | timestamptz null | stamped by the reminder sweep — dedup guard |
| created_at | timestamptz | |

### Due-date derivation (plan-driven)

Single source: `billing/utils/billing-cycle.ts` (`dueDateFor(plan, issuedAt, billingAnchor)`)
plus `billing/constants/plans.ts` (mirror of the frontend's `PLAN_PRICING`: full = $25,000
one-time, monthly = $375/mo, MXN). Rules — the sibling's `report-lifecycle.ts` pattern: no
service or controller computes dates inline.

- **`monthly`** → the next occurrence of `billing_anchor`'s day-of-month strictly after
  `issued_at` (anchor days 29–31 clamp to the last day of shorter months).
- **`full`** → `issued_at` + 30 days (a `NET_30_DAYS` constant — the one-time invoice's
  payment window).

`POST /billing-records` therefore takes **no `due_date` field** — the zod validator rejects
it, the service derives it. The frontend drawer stays exactly as built (concept, amount,
payment type, status, folio). Auto-issued monthly records (below) also take their `amount`
from `plans.ts`; manually registered records keep a free-form amount for adjustments/extras.

**`contracts`** — one client (tenant) → many contracts (original sale, renewals, addenda):

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| env_id | uuid fk → tenant_registry | the client the contract is signed with |
| plan | text | plan sold under this contract |
| status | text | draft / active / expired / terminated |
| signed_at | date null | null while draft |
| starts_at | date | |
| ends_at | date null | **derived on create**: full → starts_at + 5 years (`SUPPORT_YEARS` const, the plan's support window); monthly → null (open-ended until terminated) |
| document_url | text null | link to the signed doc (external storage — no R2 in this Worker) |
| notes | text null | |
| created_at / updated_at | timestamptz | |

Lifecycle in `contracts/utils/contract-lifecycle.ts` (sibling `report-lifecycle` pattern):
`draft → active → expired | terminated`, no resurrection — a renewal is a **new row**, which
is what makes the 1:N useful. Like KV-vs-registry, `tenant_registry.plan` becomes a mirror of
the tenant's single **active** contract once contracts land; if they disagree, the contract
wins. (Enforce one active contract per tenant with a partial unique index on
`(env_id) WHERE status = 'active'`.)

**`admins`** — email unique, password_hash, name, created_at, deleted_at (soft delete,
sibling convention). Bootstrap via a `seed:admin` script like the sibling's.

> Guardrail (from the plan): `billing_reference` + `billing_records` are admin-side only —
> never sent to a tenant DB, never exposed to any client but the manager frontend.

## Routes

Mounted in `src/index.ts`: `logger()` + `cors()` (manager frontend origin only) → public
`/api/auth` → JWT middleware on `/api/*` (rest) → protected routers. Error shape:
`{ error: 'snake_case_code', message? }` — same contract the manager frontend's error helper
will read.

| method + path | handler chain | notes |
|---|---|---|
| POST `/api/auth/login` | validate → auth.service | public; returns `{ token }` |
| GET `/api/tenants` | repo list | registry + joined tax info (drives the list screen) |
| POST `/api/tenants` | validate → tenants.service | **register tenant** (provisioning step); optional tax block in one tx |
| GET `/api/tenants/:envId` | repo find | 404 `tenant_not_found` |
| PATCH `/api/tenants/:envId` | validate → service | registry fields only, not status |
| PUT `/api/tenants/:envId/status` | validate → tenant-status.service | **KV.put first**, then mirror; ~60s propagation |
| POST `/api/tenants/:envId/push` | tenant-push.service | ⛔ blocked on draft-vs-live decision |
| PUT `/api/tenants/:envId/tax-info` | validate → billing.service | upsert billing_reference |
| GET `/api/tenants/:envId/billing-records` | repo list | newest-first |
| POST `/api/tenants/:envId/billing-records` | validate → billing.service | drawer's Register action |
| POST `/api/tenants/:envId/setup-email` | setup-email.service | send instance setup info to `billing_email` |
| POST `/api/billing-records/:id/remind` | billing-reminder.service | manual re-send of one reminder |
| GET `/api/tenants/:envId/contracts` | repo list | newest-first |
| POST `/api/tenants/:envId/contracts` | validate → contracts.service | derives `ends_at` from plan |
| PATCH `/api/contracts/:id` | validate → contracts.service | lifecycle transitions + doc/notes; 409 `invalid_transition` |
| GET `/health` | inline | public, no auth |

All superadmins are equal — no role tiers, so no `requireRole` guard yet (the JWT middleware
alone gates everything under `/api/*` except `/api/auth`). Add roles only if a read-only
operator ever exists.

## Status flow (single-writer rule)

`tenant-status.service.ts` is the only code allowed to touch `TENANT_STATUS`:

1. `KV.put('tenant:{envId}', JSON.stringify({ status }))` — source of truth.
2. Update `tenant_registry.status` mirror in the same request.
3. If step 2 fails, the response still reports success with a `mirror_stale` warning — KV
   already won; a later read can re-sync.

Emergency hard-stop (route removal at the instance) stays a runbook action, not an endpoint.

## Email flows (outbound only, Resend)

Both flows compose the generic `email/` transport; recipient is always
`tenant_registry.billing_email` (tenant owners — never end customers).

**1. Billing reminders** — `billing/billing-reminder.service.ts`
- **Scheduled sweep:** `wrangler.toml` `[triggers] crons = ["0 15 * * *"]` (09:00
  México/Monterrey) → the Worker's `scheduled` handler → `runBillingReminderSweep(env)`:
  1. **Auto-issue (monthly tenants only):** if the current cycle (from `billing_anchor`) has
     no record yet, insert one — `pending`, amount from `plans.ts`, `due_date` from
     `billing-cycle.ts`. Idempotent per cycle, so "next billing date" reminders never depend
     on someone remembering to register the month's record. `full`-plan tenants are one-time
     and never auto-issued.
  2. **Overdue flip:** records past `due_date` still `pending` → `overdue`.
  3. **Remind:** records where `status != 'paid'` and (`due_date` within the next 3 days
     **or** `status = 'overdue'`), skipping rows reminded in the last 24h
     (`last_reminded_at` guard). One email per tenant per sweep (records grouped), then
     stamp `last_reminded_at`.
- **Manual re-send:** `POST /api/billing-records/:id/remind` for the "remind now" button in
  the tenant Billing tab; same guard, explicit override flag allowed.
- Template: concept, amount (es-MX currency), due date, CFDI folio if present, payment
  instructions from `BRAND_*` vars.

**2. Instance setup info** — `tenants/setup-email.service.ts`
- `POST /api/tenants/:envId/setup-email`, triggered by the superadmin after registering a
  tenant (button on the tenant detail Registry card).
- Contents: public name, slug, instance URL (`api_base_url`-derived app URL), current status,
  onboarding steps. **Never** includes `neon_project_ref`, tokens, or anything from
  `billing_reference` beyond the greeting name.
- Stamps nothing critical — safe to re-send anytime.

The `scheduled` handler lives in `src/index.ts` next to the fetch handler:
`export default { fetch: app.fetch, scheduled }`. Besides the reminder sweep it also flips
`active` contracts whose `ends_at` has passed to `expired` (contracts module owns that query;
the handler just calls both services).

## Shared-token handling

- Read exclusively inside `instances/instance-client.service.ts`; never logged, never in a
  response body, never in an error message.
- Daily rotation with dual-valid overlap: instances accept `SHARED_INSTANCE_TOKEN` and
  `SHARED_INSTANCE_TOKEN_NEXT` during the window; this Worker sends the newest one. Rotation
  is operational (`wrangler secret put`), not an endpoint.

## Build order (maps to the plan's checklist)

1. **DB foundations** — Drizzle + Neon wiring, `tenant_registry` schema + migration, swap the
   mock `GET /api/tenants` to the repository. Frontend keeps working unchanged.
2. **Auth** — `admins` table, login, JWT middleware on `/api/*`, seed script. Frontend gets a
   login screen + interceptor after this lands.
3. **Billing** — `billing_reference` + `billing_records` CRUD (the tenant detail Billing tab
   and tax card go live against real data).
4. **Contracts** — `contracts` table + CRUD + lifecycle util (tenant detail grows a
   Contracts card once the endpoints exist).
5. **Email** — port the `email/` transport from the sibling, setup-email endpoint, reminder
   sweep + cron trigger (incl. contract-expiry flip) + manual re-send.
6. **Status control** — KV binding + `PUT /status` + mirror.
7. **Config push** — last; blocked on the draft-vs-live decision in the whitelabeled plan.

## Deviations from the sibling backend

- **No** `storage/`, `upload/`, `pdf/` modules — this Worker has no files or documents. Don't
  port them speculatively. (`email/` IS ported — billing reminders + setup emails.)
- **Cron Trigger** for the reminder sweep — the sibling is fetch-only.
- **New** cross-cutting module `instances/` (token-auth HTTP client) — the sibling has no
  outbound-to-other-services concern.
- KV binding (`TENANT_STATUS`) — the sibling has none.
- Single implicit role (superadmin) instead of `admin | technician`.
- Tests (when they land): same Vitest + `@cloudflare/vitest-pool-workers` pattern, fixture
  rows keyed by a `test+` slug/email pattern, live-Neon caveats apply.

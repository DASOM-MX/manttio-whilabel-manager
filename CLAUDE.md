# Manttio Whitelabel Manager — monorepo

Internal superadmin tooling for operating the whitelabel fleet.

- **`frontend/`** — Angular 21 manager UI (rules in `frontend/CLAUDE.md`). Dev server: `npx ng serve --port 4299` from `frontend/` — keep it running.
- **`backend/`** — control-plane BFF on Cloudflare Workers (Hono); the only holder of the shared token; owns the tenant registry / billing reference and writes tenant status to KV (rules in `backend/CLAUDE.md`, plan in `backend/manttio-manager-backend-plan.md`). Dev: `pnpm dev` from `backend/` (wrangler, port 8787).

System map: manager frontend → manager backend → whitelabeled instances (token-auth push) · Cloudflare KV (status writes). The frontend never talks to instances and never holds the shared token.

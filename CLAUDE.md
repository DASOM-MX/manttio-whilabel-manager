# Manttio Whitelabel Manager — web-app rules

## Project state (as of 2026-07-01)
- **Angular 21** standalone-components app, zoneless change detection, esbuild via `@angular/build`, SSR enabled (`@angular/ssr`, `RenderMode.Server` catch-all).
- Internal superadmin UI for operating the whitelabel fleet. Talks only to the **manager backend**; never to instances directly, never holds the shared token. See `manttio-manager-frontend-plan.md`.
- **State:** NGXS 21 — `App` (dark mode), `Session` (current internal user + role), `Tenants` (registry, selected tenant, status/billing actions). Tenant/session data is mocked until the manager backend endpoints exist.
- **Screens:** Dashboard (fleet stats), Tenants (registry list + detail with Details / Clients / Billing tabs; the Details tab owns the start/stop state switch and shows the tenant's tax information below Registry; the Billing tab lists the tenant's billing records — no editable form), Users (superadmin only, via `superadminGuard`), Billing (fleet-wide billing reference), Blacklist. Tenant detail routes address tenants by **slug**; `env_id` is a GUID and stays internal (dispatched in actions, shown read-only).
- **Billing domain:** only two plans exist — **Full** ($25,000 MXN one-time, 5-year support) and **Monthly** ($375 MXN/month). Pricing is derived from the plan via `PLAN_PRICING` in `core/models/tenant.ts`, never stored or edited per tenant. `Plan` and `PaymentType` (`bank_transfer` | `stripe` | `cash` | `bank_check`) are string enums with `*_LABELS` records for display and `*_OPTIONS` arrays for selects. Payment history is `BillingRecord` (`core/models/billing-record.ts`, status `paid` | `pending` | `overdue`), kept in `TenantsState.billingRecords` and filtered by `env_id` per tenant. Mexican fiscal data is `TenantTaxInfo` (nullable `tax_info` on `Tenant`) with `RegimenFiscal` / `UsoCfdi` SAT-code enums.
- **Theming:** PrimeNG **Aura preset** with the manager palette (`src/app/theme/manttio-preset.ts`); per-component overrides in `src/theme/*.scss`; dark mode is real (Tailwind + PrimeNG) via `<html>.app-dark`.
- **Feature folders:** `src/app/{dashboard,tenants,users,billing,blacklist}/` hold pages + per-feature components. Layout (shell/sidebar/topbar) lives in `src/app/layout/`; nav config in `src/app/core/nav/nav-items.ts` (role-aware); models in `src/app/core/models/`.

## Styling
- Use **Tailwind CSS 3.4 only**. Do not upgrade or downgrade. If a new utility/class is needed, add it to `tailwind.config.js` (extend `theme`) rather than using arbitrary values inline.
- Prefer `size-*` over paired `w-*`/`h-*` when width and height are equal (e.g. `w-4 h-4` → `size-4`).
- **Never** use inline `style="..."` attributes (or `[style]` / `[ngStyle]`) in Angular templates. All styling goes through Tailwind classes or component-scoped styles.
- The palette is defined in `tailwind.config.js` in **HSL**: `primary`, `surface` (blue-gray neutrals; 900 is the dark sidebar tone), `success`, `warning`, `danger`, `info` — full 50–950 scales with `DEFAULT`s. Do not introduce new ad-hoc color values; extend the config instead. Keep `src/app/theme/manttio-preset.ts` in sync when the palette changes.
- Font is **Lexend** (loaded in `index.html`, wired as `font-sans`).
- **Reuse global classes from `styles.scss`** before re-styling locally: `.field-input` (form controls), `.field-label`, `.field-group`, `.btn-primary` / `-secondary` / `-neutral` / `-danger`, `.card`, `.card-section`. They already carry dark variants and disabled/focus states; re-implementing them in templates almost always misses one of those.
- `.field-input` is **fixed at 56px** (`h-14`) so every form control snaps to the same baseline. Textareas opt out via `!h-auto`. If a new control needs a non-standard height, add an `!h-*` override in its component theme sheet rather than introducing a parallel class.

## Angular
- Always use the **`inject()`** function for dependency injection — never constructor-parameter injection. Declare each dependency as a class field: `private http = inject(HttpClient);`.
- Prefer **Reactive Forms** (`FormBuilder` / `NonNullableFormBuilder` + `FormGroup` + `formControlName`, or a lone `FormControl`) over template-driven `[(ngModel)]`.
- Use the **new built-in control flow syntax** in templates: `@if`, `@else if`, `@else`, `@for (item of items; track item.id) { }`, `@switch / @case / @default`. Do not use `*ngIf`, `*ngFor`, `*ngSwitch`, or `<ng-template>`-based fallbacks (PrimeNG's named content templates like `<ng-template #body>` are the component API and are fine). Don't import `CommonModule` when standalone pipes (`DatePipe`, `CurrencyPipe`, …) suffice.
- Prefer **signals (`signal`, `computed`)** over plain class properties for any reactive component state. For NGXS state, use the top-level **`select(...)`** function imported from `@ngxs/store` (e.g. `tenants = select(TenantsState.tenants);`) — never `this.store.selectSignal(...)`. Still `inject(Store)` for `store.dispatch(...)`. Templates call signals as functions (`{{ total() }}`) — do not wrap with `async`. Plain non-reactive constants (option lists, fixed enums) can stay as regular fields.
- Inside NGXS `@Action` handlers, write the body as an **RxJS pipeline** and return the observable — do **not** mark the handler `async` and `await` Promises. Wrap Promise-returning dependencies at the boundary with `from(...)` and compose with `switchMap` / `concatMap` / `tap` / `catchError` / `finalize`. Sequence actions with `switchMap`, not `await firstValueFrom(this.store.dispatch(...))`. Use `finalize` (not `try/finally`) for cleanup and `catchError` (not `try/catch`) for per-item failure handling.
- Route params bind to signal inputs via `withComponentInputBinding()` (already provided) — `readonly envId = input.required<string>();`.

## PrimeNG
- PrimeNG **21** in styled mode with the Aura preset customized to the manager palette (`primary` = primary scale, `surface` = surface scale). The preset lives in `src/app/theme/manttio-preset.ts`; if the palette tweaks in `tailwind.config.js`, keep the preset in sync so Tailwind utilities and PrimeNG component chrome stay visually consistent.
- `theme.options.cssLayer` puts Aura's CSS into a named `primeng` layer ordered between `tailwind-base` and `tailwind-utilities`, so **per-component override sheets in `src/theme/*.scss` win** by spec without `!important`. When restyling a PrimeNG component, add its sheet there and `@import` it in `src/theme/_index.scss` — don't sprinkle overrides in component styles or templates.
- Reach for PrimeNG's own components for overlays/feedback before hand-rolling: **`<p-dialog>`** for modals, **`<p-confirmDialog>`** + `ConfirmationService` for confirmations, **`<p-popover>`** for popover menus, **`<p-toast>`** + `MessageService` for notifications. Never `Swal` or `alert()`.
- For `<p-popover>` / `<p-dialog>` content, **use `appendTo="body"`** when the trigger is inside a small layout context — that frees the overlay from any ancestor that grows an `overflow:hidden` or `transform` later.
- Components without an override sheet fall back to Aura's chrome via the cssLayer config; if one looks off, add a `src/theme/<component>.scss` rather than working around it inline.
- **Dialog extraction:** (1) trivial yes/no confirm with no form → `ConfirmationService.confirm({...})` against a global `<p-confirmdialog />`; (2) presentational shell (renders content, forwards events, parent owns the dispatch) → standalone component with `visible = model(false)` + `output()` events; (3) dialog that owns selection/form state + NGXS dispatch + toasts → self-contained component under `<feature>/components/<thing>-dialog/` (or `shared/components/` when reused globally) with an imperative `open(target?)` API and internal `dialogOpen = signal(false)`; the parent holds it via `viewChild` and calls `this.dlg()?.open(row)`. Don't bake business-logic dispatch into the presentational shape.

## Dark mode
- `<html>.app-dark` is the **single source of truth** — Tailwind (`darkMode: ['class', '.app-dark']`) and PrimeNG (`darkModeSelector: '.app-dark'`) both read from it. Don't introduce a parallel toggle.
- State lives at `AppState.darkMode`. Toggle with `store.dispatch(new SetDarkMode(...))`, read with `select(AppState.darkMode)`. The `App` root component mirrors it onto `<html>` via an `effect()`. (Persistence via `@ngxs/storage-plugin` is TODO — needs an SSR-safe storage engine.)
- Global classes already handle dark mode (`.field-input`, `.btn-*`, `.card`, `.card-section`, body bg + text). When a **template hardcodes a raw color**, pair the light token with its dark variant inline. Standard pairings:

  | Light | Dark |
  |---|---|
  | `bg-surface-50` (page bg) | `dark:bg-surface-950` |
  | `bg-white` (cards/panels) | `dark:bg-surface-900` |
  | `bg-primary-50` / `bg-success-50` / `bg-danger-50` / `bg-info-50` (soft accent panels) | `dark:bg-primary-950` / `dark:bg-success-950` / `dark:bg-danger-950` / `dark:bg-info-950` |
  | `text-surface-950` (titles) | `dark:text-surface-50` |
  | `text-surface-900` | `dark:text-surface-100` |
  | `text-surface-800` | `dark:text-surface-200` |
  | `text-surface-700` / `-600` / `-500` (muted) | `dark:text-surface-300` / `-300` / `-400` |
  | `text-primary-600` (accent links/labels) | `dark:text-primary-300` |
  | `border-surface-200` / `-300` | `dark:border-surface-700` / `-600` |

- Leave **status pills / `<p-tag>`** unchanged in dark mode — they are intentionally vibrant in both modes.
- The sidebar is always dark (`bg-surface-900`) and needs no `dark:` pairs.

## Forms + interactive state
- Bind **`[disabled]="form.invalid"`** on submit buttons so the `.btn-*` `disabled:opacity-50 disabled:cursor-not-allowed` styling actually fires.
- Default form controls to **`Validators.required`** unless the field is explicitly optional. An empty form should disable submit out of the box.
- Wrap hover/active state changes with the **`enabled:` modifier** (e.g. `enabled:hover:bg-primary-700`) on any `.btn-*` variant so a disabled button doesn't flash a darker tint on hover. The `.btn-*` global classes already do this — match the pattern when adding new buttons.

## Animations
- Use **anime.js** for animations only (install when first needed). Do not use it as a general utility library.
- Do not animate via CSS keyframes, Angular animations, or other libraries unless explicitly requested.

## Shared helpers (`src/app/data/utils.ts`)
Reuse these instead of re-implementing locally. When you add a new general-purpose helper that doesn't belong in a feature folder, put it here and add a one-line entry below.

- **`statusSeverity(status: TenantStatus): 'success' | 'danger'`** — map a tenant status to the PrimeNG tag severity used across the app.
- **`billingRecordStatusSeverity(status: BillingRecordStatus): 'success' | 'warn' | 'danger'`** — map a billing record status to its PrimeNG tag severity.

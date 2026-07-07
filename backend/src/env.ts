export type Environment = 'production' | 'dev';

export type Env = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  RESEND_API_KEY: string;

  ENVIRONMENT: Environment;
  RESEND_FROM: string;
  // Manttio brand strings for email chrome (manager emails are always
  // manttio-branded — tenant branding never leaks into billing mail).
  BRAND_NAME: string;
  BRAND_SITE_URL: string;
  BRAND_LOGO_URL: string;
  // Free-text payment instructions block appended to billing reminders.
  BRAND_PAYMENT_INSTRUCTIONS: string;

  // Tenant status source of truth (`tenant:{envId}` → { status }); written
  // ONLY by tenants/services/tenant-status.service.ts. Registry mirrors it.
  TENANT_STATUS: KVNamespace;

  // Wired in later phases (see architecture.md build order):
  // SHARED_INSTANCE_TOKEN: string;         // phase 7 — config push
};

// All superadmins are equal — no role tiers (add one only if a read-only operator ever exists).
export type AuthUser = {
  id: string;
};

export type Variables = {
  user: AuthUser;
};

export type AppBindings = {
  Bindings: Env;
  Variables: Variables;
};

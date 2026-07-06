export type Environment = 'production' | 'dev';

export type Env = {
  DATABASE_URL: string;
  JWT_SECRET: string;

  ENVIRONMENT: Environment;

  // Wired in later phases (see architecture.md build order):
  // RESEND_API_KEY: string;                // phase 5 — email
  // RESEND_FROM: string;
  // TENANT_STATUS: KVNamespace;            // phase 6 — status control
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

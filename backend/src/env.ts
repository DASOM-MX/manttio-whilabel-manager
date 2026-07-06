export type Environment = 'production' | 'dev';

export type Env = {
  DATABASE_URL: string;

  ENVIRONMENT: Environment;

  // Wired in later phases (see architecture.md build order):
  // JWT_SECRET: string;                    // phase 2 — auth
  // RESEND_API_KEY: string;                // phase 5 — email
  // RESEND_FROM: string;
  // TENANT_STATUS: KVNamespace;            // phase 6 — status control
  // SHARED_INSTANCE_TOKEN: string;         // phase 7 — config push
};

export type AppBindings = {
  Bindings: Env;
};

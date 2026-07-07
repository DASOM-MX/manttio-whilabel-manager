// Public types for the generic instance client (instance-client.service.ts).

export type InstanceRequest = {
  apiBaseUrl: string;
  path: string;
  method: 'POST' | 'PUT';
  body: unknown;
};

// Failures carry the HTTP status (null when the request never completed) but
// never response bodies — an instance error must not leak into manager logs
// or responses beyond its class.
export type InstanceResult =
  | { ok: true; status: number }
  | { ok: false; status: number | null; reason: 'http_error' | 'network_error' | 'timeout' };

import { z } from 'zod';
import { PAYMENT_TYPES, PLANS } from '../../billing/enums/billing.enum';
import { taxInfoSchema } from '../../billing/validators/billing.validator';

// The status switch only ever sets active/suspended — `provisioning` is the
// backend-only birth state and can't be re-entered from the API.
export const updateTenantStatusSchema = z
  .object({
    status: z.enum(['active', 'suspended']),
  })
  .strict();

export type UpdateTenantStatusInput = z.infer<typeof updateTenantStatusSchema>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

// Rejects made-up zone names without maintaining an IANA list ourselves.
const ianaTimezone = z.string().refine(
  (tz) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  { message: 'expected an IANA timezone' },
);

const moduleFlagsSchema = z
  .object({
    billing: z.boolean(),
    wms: z.boolean(),
    crm: z.boolean(),
    cms: z.boolean(),
    scheduling: z.boolean(),
  })
  .strict();

// Registry fields only (`.strict()` enforces the route-table rule): status is
// KV-owned (PUT /:envId/status), plan mirrors the active contract, and
// slug/env_id/neon_project_ref are fixed at provisioning.
export const updateTenantSchema = z
  .object({
    public_name: z.string().min(1).optional(),
    api_base_url: z.string().url().optional(),
    billing_email: z.string().email().optional(),
    payment_type: z.enum(PAYMENT_TYPES).optional(),
    billing_anchor: isoDate.optional(),
    billing_notes: z.string().nullish(),
    modules: moduleFlagsSchema.optional(),
    timezone: ianaTimezone.optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'empty update' });

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

// Registration (provisioning step). Identity fields are required — the billing
// block, modules, timezone, and the tax block are optional (drawer registers
// with defaults; fiscal data is usually handed over later). Status is never
// accepted: tenants are born `provisioning` and go live via PUT /:envId/status.
export const registerTenantSchema = z
  .object({
    // Provisioning can supply the env_id explicitly; otherwise the DB generates it.
    env_id: z.string().uuid().optional(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected kebab-case slug'),
    public_name: z.string().trim().min(1),
    api_base_url: z.string().url(),
    neon_project_ref: z.string().trim().min(1),
    billing: z
      .object({
        plan: z.enum(PLANS).optional(),
        // Empty is allowed at registration — the owner's email often arrives later.
        billing_email: z.string().email().or(z.literal('')).optional(),
        payment_type: z.enum(PAYMENT_TYPES).optional(),
        billing_anchor: isoDate.optional(),
        notes: z.string().nullish(),
      })
      .strict()
      .optional(),
    modules: moduleFlagsSchema.optional(),
    timezone: ianaTimezone.optional(),
    tax_info: taxInfoSchema.nullish(),
  })
  .strict();

export type RegisterTenantInput = z.infer<typeof registerTenantSchema>;

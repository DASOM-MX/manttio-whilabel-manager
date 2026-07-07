import { z } from 'zod';

// The status switch only ever sets active/suspended — `provisioning` is the
// backend-only birth state and can't be re-entered from the API.
export const updateTenantStatusSchema = z
  .object({
    status: z.enum(['active', 'suspended']),
  })
  .strict();

export type UpdateTenantStatusInput = z.infer<typeof updateTenantStatusSchema>;

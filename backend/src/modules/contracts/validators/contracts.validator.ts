import { z } from 'zod';
import { PLANS } from '../../billing/enums/billing.enum';
import { CONTRACT_STATUSES } from '../enums/contracts.enum';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

// Contracts are always created as drafts; ends_at is derived from the plan
// (contract-lifecycle.ts) and signed_at is stamped on activation — .strict()
// rejects both if a client tries to supply them.
export const createContractSchema = z
  .object({
    plan: z.enum(PLANS),
    starts_at: isoDate,
    document_url: z.string().url().nullish(),
    notes: z.string().nullish(),
  })
  .strict();

export type CreateContractInput = z.infer<typeof createContractSchema>;

// Lifecycle transition and/or metadata touch-up. signed_at is only honored when
// activating (draft → active); otherwise the service ignores it.
export const updateContractSchema = z
  .object({
    status: z.enum(CONTRACT_STATUSES).optional(),
    signed_at: isoDate.optional(),
    document_url: z.string().url().nullish(),
    notes: z.string().nullish(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'empty update' });

export type UpdateContractInput = z.infer<typeof updateContractSchema>;

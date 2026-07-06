import { z } from 'zod';
import { BILLING_RECORD_STATUSES, PAYMENT_TYPES, REGIMENES_FISCALES, USOS_CFDI } from '../enums/billing.enum';

// API field names are snake_case — same contract as the frontend models.

export const taxInfoSchema = z.object({
  business_name: z.string().trim().min(1),
  razon_social: z.string().trim().min(1),
  legal_owner: z.string().trim().min(1).nullish(),
  rfc: z.string().trim().min(12).max(13),
  regimen_fiscal: z.enum(REGIMENES_FISCALES),
  uso_cfdi: z.enum(USOS_CFDI),
  tax_zip: z.string().trim().min(1),
  owner_phone: z.string().trim().min(1).nullish(),
  notes: z.string().nullish(),
});

export type TaxInfoInput = z.infer<typeof taxInfoSchema>;

// .strict() so a client-supplied due_date (or amount tampering via extra keys) is
// rejected outright — the due date is always derived server-side from the plan.
export const createBillingRecordSchema = z
  .object({
    concept: z.string().trim().min(1),
    amount: z.number().positive(),
    payment_type: z.enum(PAYMENT_TYPES),
    status: z.enum(BILLING_RECORD_STATUSES).default('pending'),
    cfdi_folio: z.string().trim().min(1).nullish(),
  })
  .strict();

export type CreateBillingRecordInput = z.infer<typeof createBillingRecordSchema>;

import type { BillingRecordRow, BillingReferenceRow } from '../types/billing.types';

// Serializers into the frontend's shapes (`core/models/billing-record.ts`,
// `TenantTaxInfo` in `core/models/tenant.ts`) — snake_case, tax_zip → postal_code.

export const toBillingRecordDto = (row: BillingRecordRow) => ({
  id: row.id,
  env_id: row.envId,
  concept: row.concept,
  amount: Number(row.amount),
  currency: row.currency,
  payment_type: row.paymentType,
  status: row.status,
  issued_at: row.issuedAt.toISOString(),
  // Not in the frontend model yet — additive, ready for the due-date column in the UI.
  due_date: row.dueDate,
  paid_at: row.paidAt?.toISOString() ?? null,
  cfdi_folio: row.cfdiFolio,
});

export const toTaxInfoDto = (row: BillingReferenceRow) => ({
  business_name: row.businessName,
  razon_social: row.razonSocial,
  legal_owner: row.legalOwner,
  rfc: row.rfc,
  regimen_fiscal: row.regimenFiscal,
  uso_cfdi: row.usoCfdi,
  postal_code: row.taxZip,
  owner_phone: row.ownerPhone,
  notes: row.notes,
});

export type BillingRecordDto = ReturnType<typeof toBillingRecordDto>;
export type TaxInfoDto = ReturnType<typeof toTaxInfoDto>;

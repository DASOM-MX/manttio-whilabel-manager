import type { Db } from '../../database/client';
import { findTenantByEnvId } from '../../tenants/repository/tenants.repository';
import { insertBillingRecord, upsertBillingReference } from '../repository/billing.repository';
import { dueDateFor } from '../utils/billing-cycle';
import type { BillingRecordRow, BillingReferenceRow } from '../types/billing.types';
import type { CreateBillingRecordInput, TaxInfoInput } from '../validators/billing.validator';

// Both return null when the tenant doesn't exist (controller maps null → 404).

export const saveTaxInfo = async (
  db: Db,
  envId: string,
  input: TaxInfoInput,
): Promise<BillingReferenceRow | null> => {
  const tenant = await findTenantByEnvId(db, envId);
  if (!tenant) return null;

  return upsertBillingReference(db, {
    envId,
    businessName: input.business_name,
    razonSocial: input.razon_social,
    legalOwner: input.legal_owner ?? null,
    rfc: input.rfc,
    regimenFiscal: input.regimen_fiscal,
    usoCfdi: input.uso_cfdi,
    taxZip: input.tax_zip,
    ownerPhone: input.owner_phone ?? null,
    notes: input.notes ?? null,
  });
};

export const registerBillingRecord = async (
  db: Db,
  envId: string,
  input: CreateBillingRecordInput,
): Promise<BillingRecordRow | null> => {
  const tenant = await findTenantByEnvId(db, envId);
  if (!tenant) return null;

  const issuedAt = new Date();
  return insertBillingRecord(db, {
    envId,
    concept: input.concept,
    amount: input.amount.toFixed(2),
    paymentType: input.payment_type,
    status: input.status,
    issuedAt,
    dueDate: dueDateFor(tenant.plan, issuedAt, tenant.billingAnchor),
    paidAt: input.status === 'paid' ? issuedAt : null,
    cfdiFolio: input.cfdi_folio ?? null,
  });
};

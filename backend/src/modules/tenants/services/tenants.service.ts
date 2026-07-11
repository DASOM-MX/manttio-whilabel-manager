import type { Db } from '../../database/client';
import { dbErrorMessage, isUniqueViolation } from '../../database/db-errors';
import { toIsoDate } from '../../billing/utils/billing-cycle';
import {
  findTenantWithTaxInfo,
  insertTenantWithTaxInfo,
  updateTenantRegistry,
} from '../repository/tenants.repository';
import type { RegisterTenantInput, UpdateTenantInput } from '../validators/tenants.validator';

export type RegisterTenantResult =
  | { ok: true; tenant: NonNullable<Awaited<ReturnType<typeof findTenantWithTaxInfo>>> }
  | { ok: false; error: 'slug_taken' | 'env_id_taken' };

// Provisioning step: registry row + optional tax block in one transaction.
// Status is never accepted — tenants are born `provisioning` (column default)
// and go live via the KV status switch. billing_anchor defaults to the
// registration date (first invoice date; monthly cycles bill on that day).
export const registerTenant = async (
  db: Db,
  input: RegisterTenantInput,
): Promise<RegisterTenantResult> => {
  const taxInfo = input.tax_info
    ? {
        businessName: input.tax_info.business_name,
        razonSocial: input.tax_info.razon_social,
        legalOwner: input.tax_info.legal_owner ?? null,
        rfc: input.tax_info.rfc,
        regimenFiscal: input.tax_info.regimen_fiscal,
        usoCfdi: input.tax_info.uso_cfdi,
        taxZip: input.tax_info.tax_zip,
        ownerPhone: input.tax_info.owner_phone ?? null,
        notes: input.tax_info.notes ?? null,
      }
    : null;

  let envId: string;
  try {
    const row = await insertTenantWithTaxInfo(
      db,
      {
        ...(input.env_id ? { envId: input.env_id } : {}),
        slug: input.slug,
        publicName: input.public_name,
        apiBaseUrl: input.api_base_url,
        neonProjectRef: input.neon_project_ref,
        plan: input.billing?.plan ?? 'monthly',
        billingEmail: input.billing?.billing_email ?? '',
        paymentType: input.billing?.payment_type ?? 'bank_transfer',
        billingAnchor: input.billing?.billing_anchor ?? toIsoDate(new Date()),
        billingNotes: input.billing?.notes ?? null,
        ...(input.modules ? { modules: input.modules } : {}),
        ...(input.timezone ? { timezone: input.timezone } : {}),
      },
      taxInfo,
    );
    envId = row.envId;
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Only two unique surfaces exist on the insert: the slug index and the pk.
      // Match the constraint NAME — the wrapped message also embeds the failed
      // SQL, whose column list contains "slug" for either violation.
      return {
        ok: false,
        error: /tenant_registry_slug/.test(dbErrorMessage(err)) ? 'slug_taken' : 'env_id_taken',
      };
    }
    throw err;
  }

  const tenant = await findTenantWithTaxInfo(db, envId);
  if (!tenant) throw new Error('registerTenant: inserted row not found');
  return { ok: true, tenant };
};

// Returns null when the tenant doesn't exist (controller maps null → 404).
// Response row carries the joined tax info so the frontend gets the same
// Tenant shape as the list.
export const updateTenant = async (db: Db, envId: string, input: UpdateTenantInput) => {
  const fields: Parameters<typeof updateTenantRegistry>[2] = {};
  if (input.public_name !== undefined) fields.publicName = input.public_name;
  if (input.api_base_url !== undefined) fields.apiBaseUrl = input.api_base_url;
  if (input.billing_email !== undefined) fields.billingEmail = input.billing_email;
  if (input.payment_type !== undefined) fields.paymentType = input.payment_type;
  if (input.billing_anchor !== undefined) fields.billingAnchor = input.billing_anchor;
  if (input.billing_notes !== undefined) fields.billingNotes = input.billing_notes ?? null;
  if (input.modules !== undefined) fields.modules = input.modules;
  if (input.timezone !== undefined) fields.timezone = input.timezone;

  const updated = await updateTenantRegistry(db, envId, fields);
  if (!updated) return null;
  return findTenantWithTaxInfo(db, envId);
};

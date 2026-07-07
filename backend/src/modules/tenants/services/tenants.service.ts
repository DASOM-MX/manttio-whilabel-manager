import type { Db } from '../../database/client';
import {
  findTenantWithTaxInfo,
  updateTenantRegistry,
} from '../repository/tenants.repository';
import type { UpdateTenantInput } from '../validators/tenants.validator';

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

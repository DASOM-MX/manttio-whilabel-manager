import { sql } from 'drizzle-orm';
import { check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenantRegistry } from '../../tenants/models/tenants.model';
import type { RegimenFiscal, UsoCfdi } from '../enums/billing.enum';

// One row per tenant, created when the tenant hands over their fiscal data —
// admin-side only: never sent to a tenant DB, never exposed to any client but
// the manager frontend. Reminder/setup emails go to tenant_registry.billing_email,
// not this table.
export const billingReference = pgTable(
  'billing_reference',
  {
    envId: uuid('env_id')
      .primaryKey()
      .references(() => tenantRegistry.envId),
    // Trade name; razon_social is the CFDI legal name.
    businessName: text('business_name').notNull(),
    razonSocial: text('razon_social').notNull(),
    legalOwner: text('legal_owner'),
    rfc: text('rfc').notNull(),
    regimenFiscal: text('regimen_fiscal').$type<RegimenFiscal>().notNull(),
    usoCfdi: text('uso_cfdi').$type<UsoCfdi>().notNull(),
    // Domicilio fiscal postal code, as registered with SAT (frontend: postal_code).
    taxZip: text('tax_zip').notNull(),
    ownerPhone: text('owner_phone'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      'billing_reference_regimen_fiscal_check',
      sql`${table.regimenFiscal} in ('601', '612', '626')`,
    ),
    check('billing_reference_uso_cfdi_check', sql`${table.usoCfdi} in ('G01', 'G03', 'S01')`),
  ],
);

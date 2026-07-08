import { sql } from 'drizzle-orm';
import { check, date, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenantRegistry } from '../../tenants/models/tenants.model';
import type { BillingRecordStatus, PaymentType } from '../enums/billing.enum';

// Payment/charge history per tenant — admin-side reference only, no payment
// processing. Auto-issued monthly records arrive with the reminder sweep (phase 5).
export const billingRecords = pgTable(
  'billing_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    envId: uuid('env_id')
      .notNull()
      .references(() => tenantRegistry.envId),
    concept: text('concept').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').$type<'MXN'>().notNull().default('MXN'),
    paymentType: text('payment_type').$type<PaymentType>().notNull(),
    status: text('status').$type<BillingRecordStatus>().notNull().default('pending'),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
    // Server-derived from the tenant's plan at creation (billing/utils/billing-cycle.ts) —
    // never client-supplied.
    dueDate: date('due_date').notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    // CFDI folio fiscal (UUID) once invoiced, if any.
    cfdiFolio: text('cfdi_folio'),
    // Stamped by the reminder sweep — 24h dedup guard.
    lastRemindedAt: timestamp('last_reminded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check('billing_records_currency_check', sql`${table.currency} in ('MXN')`),
    check(
      'billing_records_payment_type_check',
      sql`${table.paymentType} in ('bank_transfer', 'stripe', 'cash', 'bank_check')`,
    ),
    check('billing_records_status_check', sql`${table.status} in ('paid', 'pending', 'overdue')`),
  ],
);

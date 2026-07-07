import { sql } from 'drizzle-orm';
import { check, date, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { PaymentType, Plan } from '../../billing/enums/billing.enum';
import { DEFAULT_MODULES, DEFAULT_TIMEZONE } from '../constants/tenants.constants';
import type { ModuleFlags, TenantStatus } from '../enums/tenants.enum';

export const tenantRegistry = pgTable(
  'tenant_registry',
  {
    // Identifies the whitelabel environment everywhere (KV keys, push targets).
    // Generated here at registration; provisioning can also supply one explicitly.
    envId: uuid('env_id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    publicName: text('public_name').notNull(),
    apiBaseUrl: text('api_base_url').notNull(),
    neonProjectRef: text('neon_project_ref').notNull(),
    // Mirror of KV (`tenant:{envId}`) — UI convenience only. If they disagree, KV wins.
    status: text('status').$type<TenantStatus>().notNull().default('provisioning'),
    // Drives due-date derivation + pricing; price itself is never stored per tenant.
    plan: text('plan').$type<Plan>().notNull(),
    // Recipient for billing reminders + setup emails (the tenant owner, never end customers).
    billingEmail: text('billing_email').notNull(),
    paymentType: text('payment_type').$type<PaymentType>().notNull(),
    // First invoice date; monthly cycles bill on this day of the month.
    billingAnchor: date('billing_anchor').notNull(),
    billingNotes: text('billing_notes'),
    // Per-tenant feature flags + tenant-wide default timezone — the operational
    // config the push sends to the instance (settled 2026-07-05).
    modules: jsonb('modules').$type<ModuleFlags>().notNull().default(DEFAULT_MODULES),
    timezone: text('timezone').notNull().default(DEFAULT_TIMEZONE),
    lastPushAt: timestamp('last_push_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      'tenant_registry_status_check',
      sql`${table.status} in ('active', 'suspended', 'provisioning')`,
    ),
    check('tenant_registry_plan_check', sql`${table.plan} in ('full', 'monthly')`),
    check(
      'tenant_registry_payment_type_check',
      sql`${table.paymentType} in ('bank_transfer', 'stripe', 'cash', 'bank_check')`,
    ),
  ],
);

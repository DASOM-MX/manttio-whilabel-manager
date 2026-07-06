import { sql } from 'drizzle-orm';
import { check, date, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { tenantRegistry } from '../../tenants/models/tenants.model';
import type { Plan } from '../../billing/enums/billing.enum';
import type { ContractStatus } from '../enums/contracts.enum';

// One client (tenant) → many contracts: the original sale, renewals, addenda.
// tenant_registry.plan mirrors the single active contract; the contract wins.
export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    envId: uuid('env_id')
      .notNull()
      .references(() => tenantRegistry.envId),
    plan: text('plan').$type<Plan>().notNull(),
    status: text('status').$type<ContractStatus>().notNull().default('draft'),
    // Null while draft — stamped on activation.
    signedAt: date('signed_at'),
    startsAt: date('starts_at').notNull(),
    // Derived on create (contract-lifecycle.ts): full → starts_at + 5 years,
    // monthly → null (open-ended until terminated).
    endsAt: date('ends_at'),
    // Link to the signed document (external storage — no R2 in this Worker).
    documentUrl: text('document_url'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // At most one active contract per tenant.
    uniqueIndex('contracts_one_active_per_tenant_idx')
      .on(table.envId)
      .where(sql`${table.status} = 'active'`),
    check('contracts_plan_check', sql`${table.plan} in ('full', 'monthly')`),
    check(
      'contracts_status_check',
      sql`${table.status} in ('draft', 'active', 'expired', 'terminated')`,
    ),
  ],
);

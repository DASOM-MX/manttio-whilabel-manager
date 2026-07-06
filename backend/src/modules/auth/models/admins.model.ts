import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

// All superadmins are equal — no role tiers (see architecture.md). Add a role
// column only if a read-only operator ever exists.
export const admins = pgTable(
  'admins',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Partial unique index: only active rows enforce email uniqueness, so soft-deleted
    // admins do not block re-registration of the same email later (sibling convention).
    uniqueIndex('admins_email_active_idx')
      .on(table.email)
      .where(sql`${table.deletedAt} is null`),
  ],
);

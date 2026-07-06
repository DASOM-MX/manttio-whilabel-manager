import type { Env } from '../../../env';
import type { Db } from '../../database/client';
import { sendEmail } from '../../email/services/email.service';
import { listTenantsByPlan } from '../../tenants/repository/tenants.repository';
import type { TenantRow } from '../../tenants/types/tenants.types';
import { PLAN_PRICING } from '../constants/plans';
import { buildBillingReminderEmail, formatMxMonthYear } from '../helpers/billing-email.helpers';
import {
  flipOverdueRecords,
  hasBillingRecordWithDueDate,
  insertBillingRecord,
  listRemindableRecords,
  findBillingRecordWithTenant,
  stampLastRemindedAt,
} from '../repository/billing.repository';
import { DAY_MS, dueDateFor, toIsoDate } from '../utils/billing-cycle';
import type { BillingRecordRow } from '../types/billing.types';

// Daily sweep (cron `0 15 * * *` = 09:00 América/Monterrey) + the manual
// re-send behind POST /api/billing-records/:id/remind. One email per tenant per
// sweep; a failed send is logged and skipped WITHOUT stamping last_reminded_at,
// so the next sweep retries it.

const REMIND_HORIZON_DAYS = 3;
const REMIND_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type SweepSummary = {
  autoIssued: number;
  flippedOverdue: number;
  remindedTenants: number;
  failedTenants: number;
};

// Step 1 — auto-issue (monthly tenants only): if the current cycle (identified
// by its due date from billing_anchor) has no record yet, insert one. Idempotent
// per cycle; `full` tenants are one-time and never auto-issued. Tenants whose
// billing_anchor (first invoice date) is still in the future are skipped.
const autoIssueMonthlyRecords = async (db: Db, now: Date): Promise<number> => {
  const today = toIsoDate(now);
  let issued = 0;
  for (const tenant of await listTenantsByPlan(db, 'monthly')) {
    if (tenant.billingAnchor > today) continue;
    const dueDate = dueDateFor('monthly', now, tenant.billingAnchor);
    if (await hasBillingRecordWithDueDate(db, tenant.envId, dueDate)) continue;

    await insertBillingRecord(db, {
      envId: tenant.envId,
      concept: `Mensualidad ${formatMxMonthYear(dueDate)}`,
      amount: PLAN_PRICING.monthly.price.toFixed(2),
      paymentType: tenant.paymentType,
      status: 'pending',
      issuedAt: now,
      dueDate,
    });
    issued++;
  }
  return issued;
};

const sendReminderForTenant = async (
  db: Db,
  env: Env,
  tenant: TenantRow,
  records: BillingRecordRow[],
  now: Date,
): Promise<boolean> => {
  const { subject, html, text } = buildBillingReminderEmail(
    tenant,
    records,
    env,
    now.getUTCFullYear(),
  );
  try {
    await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.RESEND_FROM,
      to: tenant.billingEmail,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error(`billing reminder failed for tenant ${tenant.slug}:`, err);
    return false;
  }
  await stampLastRemindedAt(
    db,
    records.map((r) => r.id),
    now,
  );
  return true;
};

export const runBillingReminderSweep = async (db: Db, env: Env): Promise<SweepSummary> => {
  const now = new Date();

  const autoIssued = await autoIssueMonthlyRecords(db, now);
  const flippedOverdue = await flipOverdueRecords(db, toIsoDate(now));

  const dueSoonCutoff = toIsoDate(new Date(now.getTime() + REMIND_HORIZON_DAYS * DAY_MS));
  const remindedBefore = new Date(now.getTime() - REMIND_COOLDOWN_MS);
  const remindable = await listRemindableRecords(db, dueSoonCutoff, remindedBefore);

  // Group into one email per tenant.
  const byTenant = new Map<string, { tenant: TenantRow; records: BillingRecordRow[] }>();
  for (const { tenant, ...record } of remindable) {
    const group = byTenant.get(tenant.envId) ?? { tenant, records: [] };
    group.records.push(record);
    byTenant.set(tenant.envId, group);
  }

  let remindedTenants = 0;
  let failedTenants = 0;
  for (const { tenant, records } of byTenant.values()) {
    const sent = await sendReminderForTenant(db, env, tenant, records, now);
    if (sent) remindedTenants++;
    else failedTenants++;
  }

  return { autoIssued, flippedOverdue, remindedTenants, failedTenants };
};

export type RemindRecordResult =
  | { ok: true; recipient: string }
  | { ok: false; error: 'record_not_found' | 'record_paid' | 'reminded_recently' | 'send_failed' };

// Manual re-send for the "remind now" button: same 24h guard as the sweep,
// bypassable with ?force=true.
export const remindBillingRecord = async (
  db: Db,
  env: Env,
  id: string,
  force: boolean,
): Promise<RemindRecordResult> => {
  const row = await findBillingRecordWithTenant(db, id);
  if (!row) return { ok: false, error: 'record_not_found' };
  if (row.status === 'paid') return { ok: false, error: 'record_paid' };

  const now = new Date();
  const { tenant, ...record } = row;
  if (
    !force &&
    record.lastRemindedAt &&
    now.getTime() - record.lastRemindedAt.getTime() < REMIND_COOLDOWN_MS
  ) {
    return { ok: false, error: 'reminded_recently' };
  }

  const sent = await sendReminderForTenant(db, env, tenant, [record], now);
  if (!sent) return { ok: false, error: 'send_failed' };
  return { ok: true, recipient: tenant.billingEmail };
};

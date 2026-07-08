import type { Plan } from '../enums/billing.enum';

// The ONLY due-date math in the codebase (CLAUDE.md domain rules): due dates are
// derived from the tenant's plan, never accepted from a client. No service or
// controller computes dates inline.

/** Payment window for the one-time `full` invoice. */
export const NET_30_DAYS = 30;

const DAY_MS = 86_400_000;

const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);

// Anchor days 29–31 clamp to the last day of shorter months.
const clampedUtcDate = (year: number, monthIndex: number, day: number): Date => {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, monthIndex, Math.min(day, lastDay)));
};

/**
 * - `monthly` → the next occurrence of `billingAnchor`'s day-of-month strictly
 *   after `issuedAt` (dates compared in UTC, day precision).
 * - `full` → `issuedAt` + 30 days.
 *
 * `billingAnchor` is the `date` column value (`YYYY-MM-DD`); returns `YYYY-MM-DD`.
 */
export const dueDateFor = (plan: Plan, issuedAt: Date, billingAnchor: string): string => {
  if (plan === 'full') {
    return toIsoDate(new Date(issuedAt.getTime() + NET_30_DAYS * DAY_MS));
  }

  const anchorDay = Number(billingAnchor.slice(8, 10));
  const issuedDate = toIsoDate(issuedAt);
  const sameMonth = clampedUtcDate(issuedAt.getUTCFullYear(), issuedAt.getUTCMonth(), anchorDay);
  if (toIsoDate(sameMonth) > issuedDate) {
    return toIsoDate(sameMonth);
  }
  return toIsoDate(
    clampedUtcDate(issuedAt.getUTCFullYear(), issuedAt.getUTCMonth() + 1, anchorDay),
  );
};

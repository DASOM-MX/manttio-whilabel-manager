import type { Plan } from '../../billing/enums/billing.enum';
import type { ContractStatus } from '../enums/contracts.enum';

// Single place for contract lifecycle rules (sibling report-lifecycle pattern):
// draft → active → expired | terminated, no resurrection — a renewal is a NEW row.

/** The `full` plan's support window; drives ends_at derivation. */
export const SUPPORT_YEARS = 5;

const ALLOWED_TRANSITIONS: Record<ContractStatus, readonly ContractStatus[]> = {
  draft: ['active'],
  active: ['expired', 'terminated'],
  expired: [],
  terminated: [],
};

export const canTransition = (from: ContractStatus, to: ContractStatus): boolean =>
  ALLOWED_TRANSITIONS[from].includes(to);

export const isActive = (status: ContractStatus): boolean => status === 'active';

export const isClosed = (status: ContractStatus): boolean =>
  status === 'expired' || status === 'terminated';

/**
 * Derived on create, never client-supplied: `full` → starts_at + SUPPORT_YEARS,
 * `monthly` → null (open-ended until terminated).
 *
 * `startsAt` is the `date` column value (`YYYY-MM-DD`); returns the same shape.
 */
export const endsAtFor = (plan: Plan, startsAt: string): string | null => {
  if (plan !== 'full') return null;
  const [year, month, day] = startsAt.split('-').map(Number);
  // Date.UTC normalizes Feb 29 + 5y into Mar 1 on non-leap years.
  return new Date(Date.UTC((year ?? 0) + SUPPORT_YEARS, (month ?? 1) - 1, day ?? 1))
    .toISOString()
    .slice(0, 10);
};

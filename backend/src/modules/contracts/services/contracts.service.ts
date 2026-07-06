import type { Db } from '../../database/client';
import { isUniqueViolation } from '../../database/db-errors';
import { findTenantByEnvId, updateTenantPlan } from '../../tenants/repository/tenants.repository';
import {
  expireContractsPastEndsAt,
  findContractById,
  insertContract,
  updateContract,
} from '../repository/contracts.repository';
import { canTransition, endsAtFor } from '../utils/contract-lifecycle';
import type { ContractRow } from '../types/contracts.types';
import type { ContractStatus } from '../enums/contracts.enum';
import type { CreateContractInput, UpdateContractInput } from '../validators/contracts.validator';

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

// Returns null when the tenant doesn't exist (controller maps null → 404).
// Contracts are always born as drafts; ends_at is derived from the plan here.
export const createContract = async (
  db: Db,
  envId: string,
  input: CreateContractInput,
): Promise<ContractRow | null> => {
  const tenant = await findTenantByEnvId(db, envId);
  if (!tenant) return null;

  return insertContract(db, {
    envId,
    plan: input.plan,
    startsAt: input.starts_at,
    endsAt: endsAtFor(input.plan, input.starts_at),
    documentUrl: input.document_url ?? null,
    notes: input.notes ?? null,
  });
};

// Cron step (scheduled handler): full-plan contracts past their 5-year ends_at
// flip to expired. active → expired is a legal lifecycle transition; the plan
// mirror is untouched because no new contract became active.
export const expireLapsedContracts = async (db: Db): Promise<number> => {
  return expireContractsPastEndsAt(db, todayIsoDate());
};

export type UpdateContractResult =
  | { ok: true; contract: ContractRow; mirrorStale: boolean }
  | { ok: false; error: 'contract_not_found' | 'invalid_transition' | 'active_contract_exists' };

export const applyContractUpdate = async (
  db: Db,
  id: string,
  input: UpdateContractInput,
): Promise<UpdateContractResult> => {
  const existing = await findContractById(db, id);
  if (!existing) return { ok: false, error: 'contract_not_found' };

  const fields: Parameters<typeof updateContract>[2] = {};
  if (input.document_url !== undefined) fields.documentUrl = input.document_url;
  if (input.notes !== undefined) fields.notes = input.notes;

  const nextStatus: ContractStatus | undefined =
    input.status && input.status !== existing.status ? input.status : undefined;
  if (nextStatus) {
    if (!canTransition(existing.status, nextStatus)) {
      return { ok: false, error: 'invalid_transition' };
    }
    fields.status = nextStatus;
    // signed_at is only meaningful on activation; ignored otherwise.
    if (nextStatus === 'active') fields.signedAt = input.signed_at ?? todayIsoDate();
  }

  let row: ContractRow | null;
  try {
    row = await updateContract(db, id, fields);
  } catch (err) {
    // The one-active-per-tenant partial unique index fired.
    if (isUniqueViolation(err)) return { ok: false, error: 'active_contract_exists' };
    throw err;
  }
  if (!row) return { ok: false, error: 'contract_not_found' };

  // Mirror: tenant_registry.plan follows the newly active contract (the contract
  // wins; a mirror failure doesn't fail the request — same posture as the KV mirror).
  let mirrorStale = false;
  if (nextStatus === 'active') {
    try {
      await updateTenantPlan(db, row.envId, row.plan);
    } catch (err) {
      console.error('tenant plan mirror update failed', err);
      mirrorStale = true;
    }
  }

  return { ok: true, contract: row, mirrorStale };
};

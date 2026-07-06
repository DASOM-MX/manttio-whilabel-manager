import type { ContractRow } from '../types/contracts.types';

// snake_case serializer — same contract style as the tenant/billing DTOs
// (there is no frontend Contract model yet; this defines the API shape).
export const toContractDto = (row: ContractRow) => ({
  id: row.id,
  env_id: row.envId,
  plan: row.plan,
  status: row.status,
  signed_at: row.signedAt,
  starts_at: row.startsAt,
  ends_at: row.endsAt,
  document_url: row.documentUrl,
  notes: row.notes,
  created_at: row.createdAt.toISOString(),
});

export type ContractDto = ReturnType<typeof toContractDto>;

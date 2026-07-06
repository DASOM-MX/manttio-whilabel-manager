// Postgres SQLSTATE codes we react to. See https://www.postgresql.org/docs/current/errcodes-appendix.html
const FK_VIOLATION = '23503';
const UNIQUE_VIOLATION = '23505';

// drizzle-orm ≥0.44 wraps driver errors in DrizzleQueryError with the Postgres
// error on `cause` (the sibling's drizzle 0.36 threw it bare) — walk the chain.
const causeChain = (err: unknown): unknown[] => {
  const chain: unknown[] = [];
  let current = err;
  while (typeof current === 'object' && current !== null && chain.length < 5) {
    chain.push(current);
    current = (current as { cause?: unknown }).cause;
  }
  return chain;
};

const codeOf = (err: unknown): string | null => {
  for (const e of causeChain(err)) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return null;
};

const messageOf = (err: unknown): string =>
  causeChain(err)
    .map((e) => (e instanceof Error ? e.message : String(e)))
    .join('\n');

export const isForeignKeyViolation = (err: unknown) =>
  codeOf(err) === FK_VIOLATION || /violates foreign key/i.test(messageOf(err));

export const isUniqueViolation = (err: unknown) =>
  codeOf(err) === UNIQUE_VIOLATION || /violates unique constraint|duplicate key/i.test(messageOf(err));

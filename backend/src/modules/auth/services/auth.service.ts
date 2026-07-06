import type { Db } from '../../database/client';
import { findAdminByEmail } from '../repository/admins.repository';
import { verifyPassword } from './password.service';
import { signAuthToken } from './jwt.service';
import type { LoginInput } from '../validators/auth.validator';

// Verifies credentials and returns a signed JWT, or null when they don't match
// (the caller maps null → 401 invalid_credentials). Registration is closed:
// admins are bootstrapped via `pnpm seed:admin`.
export const login = async (
  db: Db,
  { email, password }: LoginInput,
  secret: string,
  environment: string,
): Promise<string | null> => {
  const admin = await findAdminByEmail(db, email);
  if (!admin) return null;

  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) return null;

  return signAuthToken(secret, environment, { id: admin.id });
};

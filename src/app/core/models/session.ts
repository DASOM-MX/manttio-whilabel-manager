export type Role = 'superadmin' | 'operator';

export interface SessionUser {
  name: string;
  email: string;
  role: Role;
}

/** An internal manager account as listed on the Users screen. */
export interface InternalUser extends SessionUser {
  last_login: string | null;
}

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'operator', label: 'Operator' },
];

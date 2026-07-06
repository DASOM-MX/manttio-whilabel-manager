/** An email or domain blocked from signing up on any instance. */
export interface BlacklistEntry {
  value: string;
  reason: string;
  added_at: string;
}

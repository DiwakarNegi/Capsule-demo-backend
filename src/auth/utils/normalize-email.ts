/** Normalize admin email for consistent Redis keys and lookups. */
export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

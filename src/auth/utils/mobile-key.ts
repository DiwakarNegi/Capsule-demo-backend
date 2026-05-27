/**
 * Canonical mobile identifier for Redis keys and dev logs.
 * Example: countryCode "91", mobile "9876543210" → "+919876543210"
 */
export function formatUserMobileKey(
  countryCode: string,
  mobileNumber: string,
): string {
  const cc = countryCode.trim().replace(/^\+/, '');
  const mobile = mobileNumber.replace(/\s+/g, '');
  return `+${cc}${mobile}`;
}

/** DB lookup username (unchanged) — countryCode + mobile without plus. */
export function formatUserUsername(
  countryCode: string,
  mobileNumber: string,
): string {
  return `${countryCode.trim().replace(/^\+/, '')}${mobileNumber.replace(/\s+/g, '')}`;
}

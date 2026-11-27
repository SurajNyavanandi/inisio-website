/**
 * Shared frontend privacy masking utilities for OTP and verification notices.
 * Example outputs:
 *   maskEmail('surajkumardec@gmail.com') -> 'suraj*****@gmail.com'
 *   maskPhone('+91 9876546462')          -> '+91 ******6462'
 */

export function maskEmail(email: string): string {
  const clean = String(email || '').trim().toLowerCase();
  const atIndex = clean.indexOf('@');
  if (atIndex <= 0) return clean;

  const local = clean.slice(0, atIndex);
  const domain = clean.slice(atIndex + 1);
  if (!domain) return clean;

  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }

  const visibleCount = local.length <= 4 ? 2 : Math.min(5, Math.max(2, local.length - 3));
  return `${local.slice(0, visibleCount)}*****@${domain}`;
}

export function maskPhone(phone: string): string {
  const raw = String(phone || '').trim();
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');
  if (digits.length < 6) {
    return `${'*'.repeat(Math.max(2, digits.length - 2))}${digits.slice(-2)}`;
  }

  const last4 = digits.slice(-4);
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ******${last4}`;
  }
  if (raw.startsWith('+91') || digits.length === 10) {
    return `+91 ******${last4}`;
  }

  const countryPrefix =
    raw.startsWith('+') && digits.length > 10 ? `+${digits.slice(0, digits.length - 10)} ` : '';
  return `${countryPrefix}******${last4}`;
}

/**
 * Replaces any raw email addresses embedded in server/UI status strings with masked versions.
 */
export function maskEmailsInText(text: string): string {
  if (!text) return '';
  return text.replace(
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
    (match) => maskEmail(match)
  );
}

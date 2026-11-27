/**
 * Shared privacy masking utilities for emails and phone numbers
 * used in OTP delivery notices and verification responses.
 */

export const maskEmail = (email) => {
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
};

export const maskPhone = (phone) => {
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

  const countryPrefix = raw.startsWith('+') && digits.length > 10
    ? `+${digits.slice(0, digits.length - 10)} `
    : '';
  return `${countryPrefix}******${last4}`;
};

export default {
  maskEmail,
  maskPhone,
};

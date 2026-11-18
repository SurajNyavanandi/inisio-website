/**
 * Administrative Access Configuration
 *
 * Enforces valid @gmail.com addresses for admin access while preserving
 * configured superadmin / ca_admin role mapping.
 */

export const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/i;

export function isValidGmail(email: string): boolean {
  const clean = (email || '').trim().toLowerCase();
  return Boolean(clean) && GMAIL_REGEX.test(clean);
}

export const ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL ||
  ''
).toLowerCase().trim();

export const SUPER_ADMIN_EMAIL = (
  import.meta.env.VITE_SUPER_ADMIN_EMAIL ||
  ''
).toLowerCase().trim();

export const CA_ADMIN_EMAIL = (
  import.meta.env.VITE_CA_ADMIN ||
  import.meta.env.VITE_CA_ADMIN_EMAIL ||
  ''
).toLowerCase().trim();

export type AdminRole = 'admin' | 'superadmin' | 'ca_admin';

/**
 * Validates entered email for admin access.
 * Requires a valid @gmail.com address and maps configured SUPER_ADMIN / CA_ADMIN
 * emails to their respective roles, defaulting valid Gmail addresses to 'admin'.
 */
export function validateAdminEmail(email: string): { allowed: boolean; role: AdminRole | null; error?: string } {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) {
    return { allowed: false, role: null, error: 'Please enter a Gmail address.' };
  }

  if (!isValidGmail(clean)) {
    return {
      allowed: false,
      role: null,
      error: 'Only valid @gmail.com addresses are permitted for admin access.',
    };
  }

  if (SUPER_ADMIN_EMAIL && clean === SUPER_ADMIN_EMAIL) {
    return { allowed: true, role: 'superadmin' };
  }
  if (CA_ADMIN_EMAIL && clean === CA_ADMIN_EMAIL) {
    return { allowed: true, role: 'ca_admin' };
  }
  if (ADMIN_EMAIL && clean === ADMIN_EMAIL) {
    return { allowed: true, role: 'admin' };
  }
  return { allowed: true, role: 'admin' };
}

/**
 * Validates entered email as a valid Gmail for the CA Admin Dashboard.
 */
export function validateCaAdminEmail(email: string): boolean {
  const clean = (email || '').trim().toLowerCase();
  if (!isValidGmail(clean)) return false;
  if (CA_ADMIN_EMAIL && isValidGmail(CA_ADMIN_EMAIL)) {
    return clean === CA_ADMIN_EMAIL;
  }
  return true;
}

/**
 * Administrative Access Configuration
 *
 * Enforces strict separation between standard user/promoter Gmail accounts
 * and explicitly authorized administrative Gmail accounts.
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

export const EXTRA_ADMIN_EMAILS = (
  import.meta.env.VITE_ADMIN_EMAILS ||
  ''
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter((e) => isValidGmail(e));

const configuredAdminGmails = Array.from(
  new Set(
    [ADMIN_EMAIL, SUPER_ADMIN_EMAIL, ...EXTRA_ADMIN_EMAILS].filter((e) =>
      isValidGmail(e)
    )
  )
);

const configuredCaAdminGmails = Array.from(
  new Set([CA_ADMIN_EMAIL].filter((e) => isValidGmail(e)))
);

export type AdminRole = 'admin' | 'superadmin' | 'ca_admin';

/**
 * Validates entered email for admin portal access.
 * Rejects non-Gmail addresses immediately. If VITE_* admin Gmail allowlist
 * variables are configured at build time, strictly rejects any non-allowlisted Gmail;
 * otherwise defers authoritative allowlist verification to the backend API.
 */
export function validateAdminEmail(email: string): {
  allowed: boolean;
  role: AdminRole | null;
  requiresServerVerification?: boolean;
  error?: string;
} {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) {
    return { allowed: false, role: null, error: 'Please enter an authorized admin @gmail.com address.' };
  }

  if (!isValidGmail(clean)) {
    return {
      allowed: false,
      role: null,
      error: 'Only valid @gmail.com addresses are permitted for admin access.',
    };
  }

  if (configuredCaAdminGmails.includes(clean)) {
    return { allowed: true, role: 'ca_admin' };
  }

  if (isValidGmail(SUPER_ADMIN_EMAIL) && clean === SUPER_ADMIN_EMAIL) {
    return { allowed: true, role: 'superadmin' };
  }

  if (configuredAdminGmails.includes(clean)) {
    return { allowed: true, role: 'admin' };
  }

  // If client build-time allowlist is configured, reject anything not in it immediately
  if (configuredAdminGmails.length > 0 || configuredCaAdminGmails.length > 0) {
    return {
      allowed: false,
      role: null,
      error: 'Access Denied: This Gmail address is not an authorized administrator account.',
    };
  }

  // No build-time VITE_* Gmail list was provided; let the backend enforce the authoritative allowlist
  return { allowed: true, role: null, requiresServerVerification: true };
}

/**
 * Validates entered email for the CA Admin Dashboard.
 */
export function validateCaAdminEmail(email: string): boolean {
  const clean = (email || '').trim().toLowerCase();
  if (!isValidGmail(clean)) return false;
  if (configuredCaAdminGmails.length > 0) {
    return configuredCaAdminGmails.includes(clean);
  }
  // Defer to backend CA_ADMIN allowlist check when VITE_CA_ADMIN is unset at build time
  return true;
}

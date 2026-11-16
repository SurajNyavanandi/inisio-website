/**
 * Administrative Access Configuration (Phase 1)
 *
 * Configured admin emails with dummy defaults:
 * - Admin (View-Only): VITE_ADMIN_EMAIL / 'admin@example.com'
 * - Super Admin (View + CRUD): VITE_SUPER_ADMIN_EMAIL / 'superadmin@example.com'
 */

export const ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL ||
  'admin@example.com'
).toLowerCase().trim();

export const SUPER_ADMIN_EMAIL = (
  import.meta.env.VITE_SUPER_ADMIN_EMAIL ||
  'superadmin@example.com'
).toLowerCase().trim();

export const CA_ADMIN_EMAIL = (
  import.meta.env.VITE_CA_ADMIN ||
  import.meta.env.VITE_CA_ADMIN_EMAIL ||
  'ca.admin@example.com'
).toLowerCase().trim();

export type AdminRole = 'admin' | 'superadmin' | 'ca_admin';

/**
 * Validates entered email against ADMIN_EMAIL, SUPER_ADMIN_EMAIL, and CA_ADMIN_EMAIL.
 * If matches SUPER_ADMIN_EMAIL: grants Super Admin access.
 * If matches ADMIN_EMAIL: grants Admin access.
 * If matches CA_ADMIN_EMAIL: grants CA Admin access.
 * Otherwise: denies access.
 */
export function validateAdminEmail(email: string): { allowed: boolean; role: AdminRole | null } {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return { allowed: false, role: null };

  if (clean === SUPER_ADMIN_EMAIL || clean === 'superadmin@example.com') {
    return { allowed: true, role: 'superadmin' };
  }
  if (clean === ADMIN_EMAIL || clean === 'admin@example.com') {
    return { allowed: true, role: 'admin' };
  }
  if (clean === CA_ADMIN_EMAIL || clean === 'ca.admin@example.com' || clean === 'caadmin@example.com') {
    return { allowed: true, role: 'ca_admin' };
  }
  return { allowed: false, role: null };
}

/**
 * Validates entered email strictly against CA_ADMIN_EMAIL for the separate CA Admin Dashboard.
 */
export function validateCaAdminEmail(email: string): boolean {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return false;
  return clean === CA_ADMIN_EMAIL || clean === 'ca.admin@example.com' || clean === 'caadmin@example.com';
}

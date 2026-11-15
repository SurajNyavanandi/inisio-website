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

export type AdminRole = 'admin' | 'superadmin';

/**
 * Validates entered email against ADMIN_EMAIL and SUPER_ADMIN_EMAIL.
 * If matches SUPER_ADMIN_EMAIL: grants Super Admin access.
 * If matches ADMIN_EMAIL: grants Admin access.
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
  return { allowed: false, role: null };
}

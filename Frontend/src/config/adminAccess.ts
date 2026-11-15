/**
 * Admin Access Configuration (Phase 1)
 *
 * Configured admin emails from environment specification:
 * - ADMIN_EMAIL: admin@example.com (View-Only)
 * - SUPER_ADMIN_EMAIL: superadmin@example.com (View + Full CRUD)
 */

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
export const SUPER_ADMIN_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'superadmin@example.com').toLowerCase().trim();

export type AdminRole = 'admin' | 'superadmin';

export function validateAdminEmail(email: string): { allowed: boolean; role: AdminRole | null } {
  const clean = (email || '').trim().toLowerCase();

  // Super Admin priority
  if (
    clean === SUPER_ADMIN_EMAIL ||
    clean === 'pradeep.tanuku@gmail.com' ||
    clean === 'superadmin@example.com'
  ) {
    return { allowed: true, role: 'superadmin' };
  }

  // Admin (View-Only)
  if (
    clean === ADMIN_EMAIL ||
    clean === 'admin@example.com'
  ) {
    return { allowed: true, role: 'admin' };
  }

  return { allowed: false, role: null };
}

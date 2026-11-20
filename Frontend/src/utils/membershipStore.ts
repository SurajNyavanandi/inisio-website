import { AuthUser } from '../types';
import { api } from './apiClient';

export const FREE_ASSESSMENT_LIMIT = 1;
export const FREE_ASSESSMENT_LIMIT_CODE = 'FREE_ASSESSMENT_LIMIT_REACHED';

const COMPLETED_EMAILS_KEY = 'inisio_completed_assessments';
const PAID_MEMBERSHIPS_KEY = 'inisio_paid_memberships';
const DRAFT_PREFIX = 'inisio_assessment_draft_v2_';
const LEGACY_SESSION_DRAFT_KEY = 'inisio_assessment_draft';

const PRIVILEGED_ROLES = new Set([
  'admin',
  'superadmin',
  'admin1',
  'admin2',
  'admin3',
  'ca',
  'ca_admin',
  'dpr',
  'dpr_consultant',
  'prosync',
  'prosync_admin',
]);

const FREE_TIER_NAMES = new Set([
  '',
  'free',
  'standard',
  'starter',
  'basic',
  'inisio greenfield starter',
  'standard feasibility',
]);

export interface AssessmentQuotaStatus {
  allowed: boolean;
  unlimited?: boolean;
  hasPaidMembership: boolean;
  membershipTier: string;
  usedCount: number;
  limit: number | null;
  code?: string;
  reason?: string;
  existingProjectId?: string | null;
  existingProjectName?: string | null;
  existingClientProjectId?: string | null;
  isUpdatingExisting?: boolean;
}

export interface AssessmentDraftData {
  clientProjectId: string;
  formData: Record<string, any>;
  financials: Record<string, any>;
  riskProfileData: any;
  numPromoters?: number;
  additionalPromoters?: Array<{
    id: string;
    name: string;
    experienceYears: string;
    qualification: string;
  }>;
  stage: any;
  completedSteps: number[];
  updatedAt: string;
}

const normalizeEmail = (email?: string | null): string => String(email || '').trim().toLowerCase();

export function isPrivilegedUserRole(role?: string | null): boolean {
  return PRIVILEGED_ROLES.has(String(role || '').trim().toLowerCase());
}

export function isPaidTierName(tier?: string | null): boolean {
  const clean = String(tier || '').trim().toLowerCase();
  if (!clean) return false;
  return !FREE_TIER_NAMES.has(clean);
}

export function hasActivePaidMembership(userOrEmail?: AuthUser | string | null): boolean {
  if (!userOrEmail) return false;

  if (typeof userOrEmail === 'object') {
    if (isPrivilegedUserRole(userOrEmail.role)) return true;
    const plan = (userOrEmail as any).membershipTier || userOrEmail.membershipPlan;
    if (isPaidTierName(plan)) return true;
  }

  const email = normalizeEmail(typeof userOrEmail === 'string' ? userOrEmail : userOrEmail.email);
  if (!email) return false;

  try {
    const raw = localStorage.getItem(PAID_MEMBERSHIPS_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw);
    return Boolean(map && isPaidTierName(map[email]));
  } catch {
    return false;
  }
}

export function setLocalPaidMembership(email: string, tierName: string): void {
  const clean = normalizeEmail(email);
  if (!clean) return;
  try {
    const raw = localStorage.getItem(PAID_MEMBERSHIPS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[clean] = tierName;
    localStorage.setItem(PAID_MEMBERSHIPS_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

export function getRecordedCompletionCount(email?: string | null): number {
  const clean = normalizeEmail(email);
  if (!clean) return 0;
  try {
    const raw = localStorage.getItem(COMPLETED_EMAILS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(clean) ? 1 : 0;
  } catch {
    return 0;
  }
}

export function recordAssessmentCompletion(email?: string): void {
  try {
    const clean = normalizeEmail(email);
    if (!clean) return;
    const existing = JSON.parse(localStorage.getItem(COMPLETED_EMAILS_KEY) || '[]');
    if (Array.isArray(existing) && !existing.includes(clean)) {
      existing.push(clean);
      localStorage.setItem(COMPLETED_EMAILS_KEY, JSON.stringify(existing));
    }
  } catch {
    // ignore storage errors
  }
}

export function canUserStartAssessment(
  userOrEmail?: AuthUser | string | null,
  submittedAssessmentCount = 0,
  options?: {
    isEditingExisting?: boolean;
    hasPaidMembership?: boolean;
    role?: string;
  }
): { allowed: boolean; reason?: string; code?: string } {
  if (options?.isEditingExisting) {
    return { allowed: true };
  }

  const role =
    options?.role || (typeof userOrEmail === 'object' && userOrEmail ? userOrEmail.role : undefined);
  if (isPrivilegedUserRole(role)) {
    return { allowed: true };
  }

  const isPaid = Boolean(options?.hasPaidMembership) || hasActivePaidMembership(userOrEmail);
  if (isPaid) {
    return { allowed: true };
  }

  const email =
    typeof userOrEmail === 'string'
      ? normalizeEmail(userOrEmail)
      : normalizeEmail(userOrEmail?.email);

  // Guests can start Steps 1-2 freely; they will be gated at Step 3 to sign up / sign in
  if (!email && submittedAssessmentCount < FREE_ASSESSMENT_LIMIT) {
    return { allowed: true };
  }

  const effectiveCount = Math.max(
    Number(submittedAssessmentCount) || 0,
    email ? getRecordedCompletionCount(email) : 0
  );

  if (effectiveCount >= FREE_ASSESSMENT_LIMIT) {
    return {
      allowed: false,
      code: FREE_ASSESSMENT_LIMIT_CODE,
      reason:
        'You have already used your 1 free project assessment. You can view, edit, or re-download your existing project from your Dashboard, or upgrade to a membership plan to evaluate additional projects.',
    };
  }

  return { allowed: true };
}

/**
 * Authoritative server-side quota check with safe local fallback.
 */
export async function fetchServerAssessmentQuota(params?: {
  email?: string;
  mobile?: string;
  clientProjectId?: string;
  projectId?: string;
  user?: AuthUser | null;
  localCompletedCount?: number;
}): Promise<AssessmentQuotaStatus> {
  try {
    const res = await api.assessments.getQuota({
      email: params?.email || params?.user?.email,
      mobile: params?.mobile || params?.user?.phone,
      clientProjectId: params?.clientProjectId,
      projectId: params?.projectId,
    });
    if (res && typeof res.allowed === 'boolean') {
      if (res.hasPaidMembership && (params?.email || params?.user?.email) && res.membershipTier) {
        setLocalPaidMembership(params?.email || params?.user?.email || '', res.membershipTier);
      }
      return res as AssessmentQuotaStatus;
    }
  } catch (err) {
    console.warn('[membershipStore] Server quota check unavailable, using local fallback:', err);
  }

  const localCheck = canUserStartAssessment(
    params?.user || params?.email,
    params?.localCompletedCount ?? 0,
    {
      isEditingExisting: Boolean(params?.projectId),
    }
  );

  return {
    allowed: localCheck.allowed,
    hasPaidMembership: hasActivePaidMembership(params?.user || params?.email),
    membershipTier: hasActivePaidMembership(params?.user || params?.email) ? 'Paid Plan' : 'Free',
    usedCount: localCheck.allowed ? 0 : 1,
    limit: FREE_ASSESSMENT_LIMIT,
    code: localCheck.code,
    reason: localCheck.reason,
  };
}

// ============================================================================
// Scoped Assessment Draft Persistence (localStorage) + Guest -> User Migration
// ============================================================================

export function generateClientProjectId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `proj_${Date.now()}_${rand}`;
}

function getDraftStorageKey(userEmail?: string | null): string {
  const clean = normalizeEmail(userEmail);
  return clean ? `${DRAFT_PREFIX}${clean}` : `${DRAFT_PREFIX}guest`;
}

function hasMeaningfulDraftData(draft: Partial<AssessmentDraftData> | null | undefined): boolean {
  if (!draft || !draft.formData) return false;
  const fd = draft.formData;
  return Boolean(
    String(fd.projectName || '').trim() ||
      String(fd.industry || '').trim() ||
      String(fd.location || '').trim() ||
      String(fd.totalCostCr || '').trim() ||
      String(fd.promoterContribCr || '').trim() ||
      String(fd.fullName || '').trim() ||
      String(fd.mobile || '').trim() ||
      String(fd.email || '').trim() ||
      String(fd.description || '').trim()
  );
}

export function saveAssessmentDraft(
  draft: Omit<AssessmentDraftData, 'updatedAt'>,
  userEmail?: string | null
): void {
  if (typeof window === 'undefined') return;
  if (!hasMeaningfulDraftData(draft)) return;

  const payload: AssessmentDraftData = {
    ...draft,
    clientProjectId: draft.clientProjectId || generateClientProjectId(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const key = getDraftStorageKey(userEmail);
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn('[membershipStore] Failed to save assessment draft:', err);
  }
}

export function loadAssessmentDraft(userEmail?: string | null): AssessmentDraftData | null {
  if (typeof window === 'undefined') return null;

  const tryParse = (storage: Storage, key: string): AssessmentDraftData | null => {
    try {
      const raw = storage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.formData) {
        return {
          ...parsed,
          clientProjectId: parsed.clientProjectId || generateClientProjectId(),
        } as AssessmentDraftData;
      }
    } catch {
      return null;
    }
    return null;
  };

  // 1. If logged in, try user-scoped draft first
  const clean = normalizeEmail(userEmail);
  if (clean) {
    const userDraft = tryParse(localStorage, getDraftStorageKey(clean));
    if (userDraft) return userDraft;
  }

  // 2. Fallback to guest draft (e.g., started before signing in)
  const guestDraft = tryParse(localStorage, getDraftStorageKey(null));
  if (guestDraft) return guestDraft;

  // 3. Migrate legacy sessionStorage draft if any
  const legacyDraft = tryParse(sessionStorage, LEGACY_SESSION_DRAFT_KEY);
  if (legacyDraft) return legacyDraft;

  return null;
}

export function migrateGuestDraftToUser(userEmail?: string | null): AssessmentDraftData | null {
  if (typeof window === 'undefined') return null;
  const clean = normalizeEmail(userEmail);
  if (!clean) return null;

  try {
    const guestKey = getDraftStorageKey(null);
    const userKey = getDraftStorageKey(clean);
    const guestRaw = localStorage.getItem(guestKey);
    if (!guestRaw) {
      return loadAssessmentDraft(clean);
    }

    const guestDraft = JSON.parse(guestRaw) as AssessmentDraftData;
    const existingUserRaw = localStorage.getItem(userKey);
    if (!existingUserRaw) {
      localStorage.setItem(userKey, JSON.stringify(guestDraft));
    } else {
      const existingUserDraft = JSON.parse(existingUserRaw) as AssessmentDraftData;
      const guestTime = new Date(guestDraft.updatedAt || 0).getTime();
      const userTime = new Date(existingUserDraft.updatedAt || 0).getTime();
      if (guestTime >= userTime) {
        localStorage.setItem(userKey, JSON.stringify(guestDraft));
      }
    }
    localStorage.removeItem(guestKey);
    return loadAssessmentDraft(clean);
  } catch {
    return loadAssessmentDraft(clean);
  }
}

export function clearAssessmentDraft(userEmail?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = normalizeEmail(userEmail);
    if (clean) {
      localStorage.removeItem(getDraftStorageKey(clean));
    }
    localStorage.removeItem(getDraftStorageKey(null));
    sessionStorage.removeItem(LEGACY_SESSION_DRAFT_KEY);
  } catch {
    // ignore
  }
}

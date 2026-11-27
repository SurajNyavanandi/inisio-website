import { AuthUser } from '../types';
import { api } from './apiClient';

export const FREE_ASSESSMENT_LIMIT = 1;
export const FREE_ASSESSMENT_LIMIT_CODE = 'FREE_ASSESSMENT_LIMIT_REACHED';
export const MEMBERSHIP_GST_RATE = 0.18;

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
  'free_plan',
  'free plan',
  'free starter',
  'free_starter',
  'free – project assessment',
  'standard',
  'starter',
  'basic',
  'inisio greenfield starter',
  'standard feasibility',
]);

export type MembershipPlanId = 'free_plan' | 'promoter_boost' | 'promoter_plus';

export interface MembershipPlanTier {
  id: MembershipPlanId;
  name: string;
  basePriceInr: number;
  priceInr: number;
  gstRate: number;
  gstAmountInr: number;
  totalPayableInr: number;
  priceLabel: string;
  period: string;
  validityLabel: string;
  validityDays: number | null;
  assessmentsIncluded: number;
  consultantIntroIncluded: number;
  prosyncIntroIncluded: number;
  positioning: string;
  description: string;
  features: string[];
  popular?: boolean;
  badgeText?: string;
  buttonText: string;
}

export const MEMBERSHIP_PLAN_TIERS: MembershipPlanTier[] = [
  {
    id: 'free_plan',
    name: 'Free – Project Assessment',
    basePriceInr: 0,
    priceInr: 0,
    gstRate: 0,
    gstAmountInr: 0,
    totalPayableInr: 0,
    priceLabel: '₹0',
    period: 'Free Plan',
    validityLabel: '—',
    validityDays: null,
    assessmentsIncluded: 1,
    consultantIntroIncluded: 0,
    prosyncIntroIncluded: 0,
    positioning: 'Start your project assessment.',
    description: 'Start your project assessment with preliminary bankability insights and an editable teaser.',
    features: [
      'One project assessment',
      'Preliminary project feasibility and bankability insights',
      'Project cost and means-of-finance assessment',
      'Indicative debt-to-equity analysis and DSCR',
      'AI-generated project teaser',
      'Personal project dashboard',
      'Access to basic project tracking',
    ],
    buttonText: 'Start Free Assessment',
  },
  {
    id: 'promoter_boost',
    name: 'Promoter Boost',
    basePriceInr: 2999,
    priceInr: 2999,
    gstRate: MEMBERSHIP_GST_RATE,
    gstAmountInr: Number((2999 * MEMBERSHIP_GST_RATE).toFixed(2)),
    totalPayableInr: Number((2999 * (1 + MEMBERSHIP_GST_RATE)).toFixed(2)),
    priceLabel: '₹2,999',
    period: '3 months from activation',
    validityLabel: '3 months',
    validityDays: 90,
    assessmentsIncluded: 1,
    consultantIntroIncluded: 2,
    prosyncIntroIncluded: 1,
    positioning: 'Move your project forward with professional guidance.',
    description: 'Includes all Free Plan benefits, plus independent consultant and Prosync introductions.',
    features: [
      'Two relevant consultant introductions',
      'One introduction to Prosync Consulting, Inisio’s Featured Advisory Partner',
      'Consultation request and follow-up tracking',
      'Access to independent DPR, CMA and TEV professionals',
      'Project documentation gap identification',
      'Priority consultation coordination',
    ],
    popular: true,
    badgeText: 'Recommended Entry Paid Plan',
    buttonText: 'Upgrade to Promoter Boost',
  },
  {
    id: 'promoter_plus',
    name: 'Promoter Plus',
    basePriceInr: 9999,
    priceInr: 9999,
    gstRate: MEMBERSHIP_GST_RATE,
    gstAmountInr: Number((9999 * MEMBERSHIP_GST_RATE).toFixed(2)),
    totalPayableInr: Number((9999 * (1 + MEMBERSHIP_GST_RATE)).toFixed(2)),
    priceLabel: '₹9,999',
    period: '12 months from activation',
    validityLabel: '12 months',
    validityDays: 365,
    assessmentsIncluded: 3,
    consultantIntroIncluded: 5,
    prosyncIntroIncluded: 1,
    positioning: 'Comprehensive support for serious project promoters.',
    description: 'Includes all Promoter Boost benefits, plus multi-project assessments and extended 12-month support.',
    features: [
      'Up to three project assessments during membership validity',
      'Up to six professional introductions in total, including the Prosync introduction',
      'Priority access to the Prosync advisory desk for suitable projects',
      'Project readiness review and follow-up',
      'Assistance identifying suitable funding pathways',
      'Priority access to the Inisio consultant network',
      'Extended project tracking for 12 months',
    ],
    buttonText: 'Upgrade to Promoter Plus',
  },
];

export const MEMBERSHIP_COMPARISON_ROWS = [
  { feature: 'Price', free: 'Free', boost: '₹2,999', plus: '₹9,999' },
  { feature: 'Validity', free: '—', boost: '3 months', plus: '12 months' },
  { feature: 'Project assessments', free: '1', boost: '1', plus: 'Up to 3' },
  { feature: 'Bankability insights', free: 'Yes', boost: 'Yes', plus: 'Yes' },
  { feature: 'AI project teaser', free: 'Yes', boost: 'Yes', plus: 'Yes' },
  { feature: 'Project dashboard', free: 'Yes', boost: 'Yes', plus: 'Yes' },
  { feature: 'Consultant introductions', free: 'Not included', boost: '2', plus: 'Up to 6 Featured consultants on priority' },
  { feature: 'Project readiness follow-up', free: 'Not included', boost: 'Basic', plus: 'Extended' },
  { feature: 'Project tracking', free: 'Basic', boost: '3 months', plus: '12 months' },
];

export const OFFICIAL_DISCLAIMERS = {
  membership: {
    title: 'Membership Disclaimer',
    paragraphs: [
      "Inisio memberships provide access to the platform's project assessment features, project information tools and the professional connection benefits specified under each plan.",
      'Membership fees do not include professional fees charged separately by Chartered Accountants, DPR consultants, TEV consultants, financial advisors or other independent professionals.',
      'Consultant introductions are subject to professional availability, project suitability and the applicable plan limits. An introduction does not constitute acceptance of a professional engagement or guarantee delivery of any particular service.',
      "Prosync Consulting is Inisio's Featured Advisory Partner. Any advisory engagement with Prosync will be governed by separate engagement terms, scope of work and professional fees.",
      'Inisio does not guarantee project feasibility, bankability, loan eligibility, loan sanction, subsidy approval, interest rates or funding disbursement.',
    ],
  },
  assessment: {
    title: 'Project Assessment Disclaimer',
    paragraphs: [
      'Project assessments and bankability insights generated through Inisio are preliminary and indicative, based on the information and documents submitted by the promoter.',
      'The assessment is not a formal credit rating, statutory valuation, lender appraisal, technical feasibility certificate, DPR, TEV report or loan sanction recommendation.',
      'Financial indicators such as DSCR and debt-to-equity ratios are indicative and should be independently reviewed before being relied upon for financial or lending decisions.',
      'Final project appraisal and lending decisions rest exclusively with the respective banks and financial institutions.',
    ],
  },
  consultantNetwork: {
    title: 'Consultant Network Disclaimer',
    paragraphs: [
      'Inisio facilitates introductions between project promoters and independent professionals. Such professionals operate independently and are responsible for their professional services, advice, deliverables, fees and timelines.',
      'The promoter and consultant must independently agree on the scope of work, professional fees and engagement terms.',
      'Inisio does not guarantee the quality, outcome or completion of services provided by independent professionals, subject to its own applicable platform obligations.',
    ],
  },
  prosyncAdvisory: {
    title: 'Featured Advisory Partner – Prosync Consulting',
    paragraphs: [
      'Prosync Consulting is an independent advisory partner featured on Inisio. Access to Prosync through a membership plan means an introduction or consultation request, subject to project suitability and availability.',
      'Any further advisory, debt syndication or financial structuring engagement will be governed by a separate agreement with Prosync Consulting. Professional fees, scope and deliverables will be communicated separately.',
      'Neither Inisio nor Prosync guarantees loan sanction or disbursement.',
    ],
  },
  consentStatement:
    'I have read and agree to the Inisio Membership Terms and Conditions. I understand that membership does not guarantee loan sanction, funding, consultant engagement or any specific professional outcome.',
};

export interface AssessmentQuotaStatus {
  allowed: boolean;
  unlimited?: boolean;
  planId?: MembershipPlanId;
  activePlanId?: MembershipPlanId;
  hasPaidMembership: boolean;
  membershipTier: string;
  statusLabel?: 'Free Plan' | 'Active' | 'Expiring Soon' | 'Expired';
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  daysRemaining?: number | null;
  activatedAt?: string | null;
  expiresAt?: string | null;
  autoRenew?: boolean;
  usedCount: number;
  limit: number | null;
  remainingCount?: number | null;
  consultantUsed?: number;
  consultantLimit?: number;
  consultantRemaining?: number;
  prosyncUsed?: number;
  prosyncLimit?: number;
  prosyncRemaining?: number;
  prosyncStatus?: string;
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

export function getPlanByIdOrName(idOrName?: string | null): MembershipPlanTier {
  const clean = String(idOrName || '').trim().toLowerCase();
  const match = MEMBERSHIP_PLAN_TIERS.find(
    (p) => p.id === clean || p.name.toLowerCase() === clean
  );
  if (match) return match;
  if (clean.includes('plus') && !clean.includes('pack')) return MEMBERSHIP_PLAN_TIERS[2];
  if (clean.includes('boost')) return MEMBERSHIP_PLAN_TIERS[1];
  return MEMBERSHIP_PLAN_TIERS[0];
}

export function hasActivePaidMembership(userOrEmail?: AuthUser | string | null): boolean {
  if (!userOrEmail) return false;

  if (typeof userOrEmail === 'object') {
    if (isPrivilegedUserRole(userOrEmail.role)) return true;
    if (userOrEmail.membershipStatus === 'Expired') return false;
    const plan = (userOrEmail as any).membershipPlanId || (userOrEmail as any).membershipTier || userOrEmail.membershipPlan;
    if (isPaidTierName(plan)) {
      if (userOrEmail.membershipExpiresAt && new Date(userOrEmail.membershipExpiresAt).getTime() <= Date.now()) {
        return false;
      }
      return true;
    }
  }

  const email = normalizeEmail(typeof userOrEmail === 'string' ? userOrEmail : userOrEmail.email);
  if (!email) return false;

  try {
    const raw = localStorage.getItem(PAID_MEMBERSHIPS_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw);
    const entry = map?.[email];
    if (!entry) return false;
    if (typeof entry === 'string') return isPaidTierName(entry);
    if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= Date.now()) return false;
    return isPaidTierName(entry.planName || entry.planId);
  } catch {
    return false;
  }
}

export function setLocalPaidMembership(
  email: string,
  tierName: string,
  meta?: { planId?: string; activatedAt?: string | null; expiresAt?: string | null }
): void {
  const clean = normalizeEmail(email);
  if (!clean) return;
  try {
    const raw = localStorage.getItem(PAID_MEMBERSHIPS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[clean] = meta ? { planName: tierName, ...meta } : tierName;
    localStorage.setItem(PAID_MEMBERSHIPS_KEY, JSON.stringify(map));

    // Also update inisio_active_user if it belongs to same email
    const activeRaw = localStorage.getItem('inisio_active_user');
    if (activeRaw) {
      const parsed = JSON.parse(activeRaw);
      if (normalizeEmail(parsed?.email) === clean) {
        const planDef = getPlanByIdOrName(meta?.planId || tierName);
        parsed.membershipPlanId = planDef.id;
        parsed.membershipTier = planDef.name;
        parsed.membershipPlan = planDef.name;
        if (meta?.activatedAt) parsed.membershipActivatedAt = meta.activatedAt;
        if (meta?.expiresAt) parsed.membershipExpiresAt = meta.expiresAt;
        parsed.membershipStatus = planDef.id === 'free_plan' ? 'Free Plan' : 'Active';
        localStorage.setItem('inisio_active_user', JSON.stringify(parsed));
      }
    }
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
    planId?: string;
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

  const resolvedPlan = getPlanByIdOrName(
    options?.planId ||
      (typeof userOrEmail === 'object' && userOrEmail
        ? userOrEmail.membershipPlanId || userOrEmail.membershipTier || userOrEmail.membershipPlan
        : undefined)
  );
  const isPaidActive = Boolean(options?.hasPaidMembership) || hasActivePaidMembership(userOrEmail);
  const limit = isPaidActive ? resolvedPlan.assessmentsIncluded : FREE_ASSESSMENT_LIMIT;

  const email =
    typeof userOrEmail === 'string'
      ? normalizeEmail(userOrEmail)
      : normalizeEmail(userOrEmail?.email);

  if (!email && submittedAssessmentCount < FREE_ASSESSMENT_LIMIT) {
    return { allowed: true };
  }

  const effectiveCount = Math.max(
    Number(submittedAssessmentCount) || 0,
    email ? getRecordedCompletionCount(email) : 0
  );

  if (effectiveCount >= limit) {
    return {
      allowed: false,
      code: FREE_ASSESSMENT_LIMIT_CODE,
      reason:
        limit === 1
          ? 'You have already used your 1 project assessment. You can view, edit, or re-download your existing project from your Dashboard, or upgrade to Promoter Plus for up to 3 assessments.'
          : `You have used all ${limit} project assessments included in your current plan.`,
    };
  }

  return { allowed: true };
}

/**
 * Authoritative server-side quota & membership check with safe local fallback.
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
      const targetEmail = params?.email || params?.user?.email || '';
      if (targetEmail && res.membershipTier) {
        setLocalPaidMembership(targetEmail, res.membershipTier, {
          planId: res.planId,
          activatedAt: res.activatedAt,
          expiresAt: res.expiresAt,
        });
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
  const isPaid = hasActivePaidMembership(params?.user || params?.email);
  const plan = isPaid && typeof params?.user === 'object'
    ? getPlanByIdOrName(params?.user?.membershipPlanId || params?.user?.membershipTier || params?.user?.membershipPlan)
    : MEMBERSHIP_PLAN_TIERS[0];

  const usedCount = Math.max(0, Number(params?.localCompletedCount ?? (localCheck.allowed ? 0 : 1)));

  return {
    allowed: localCheck.allowed,
    planId: plan.id,
    activePlanId: isPaid ? plan.id : 'free_plan',
    hasPaidMembership: isPaid,
    membershipTier: plan.name,
    statusLabel: isPaid ? 'Active' : 'Free Plan',
    usedCount,
    limit: plan.assessmentsIncluded,
    remainingCount: Math.max(0, plan.assessmentsIncluded - usedCount),
    consultantUsed: 0,
    consultantLimit: plan.consultantIntroIncluded,
    consultantRemaining: plan.consultantIntroIncluded,
    prosyncUsed: 0,
    prosyncLimit: plan.prosyncIntroIncluded,
    prosyncRemaining: plan.prosyncIntroIncluded,
    prosyncStatus: plan.prosyncIntroIncluded > 0 ? 'Not Requested' : 'Not Included',
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

  const clean = normalizeEmail(userEmail);
  if (clean) {
    const userDraft = tryParse(localStorage, getDraftStorageKey(clean));
    if (userDraft) return userDraft;
  }

  const guestDraft = tryParse(localStorage, getDraftStorageKey(null));
  if (guestDraft) return guestDraft;

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

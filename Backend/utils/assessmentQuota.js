import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import Project from '../models/Project.js';
import Assessment from '../models/Assessment.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import IntroductionRequest from '../models/IntroductionRequest.js';
import { isDBConnected } from '../config/db.js';
import { getMemoryPaymentsByUser } from './memoryPaymentStore.js';
import { findMemoryUserByEmail, findMemoryUserById } from './memoryUserStore.js';
import {
  MEMBERSHIP_PLAN_CATALOG,
  resolvePlanDefinition,
  computeMembershipStatusLabel,
} from './membershipPlans.js';

export const FREE_ASSESSMENT_LIMIT = 1;
export const FREE_ASSESSMENT_LIMIT_CODE = 'FREE_ASSESSMENT_LIMIT_REACHED';

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

export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const normalizeMobile10 = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return '';
};

export const normalizeProjectName = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const isPrivilegedRole = (role) =>
  PRIVILEGED_ROLES.has(String(role || '').trim().toLowerCase());

export const isPaidMembershipTier = (tier) => {
  const clean = String(tier || '').trim().toLowerCase();
  if (!clean) return false;
  return !FREE_TIER_NAMES.has(clean);
};

/**
 * Determine whether a Lead payload/record represents a Project Assessment / Teaser submission
 */
export const isAssessmentLeadRecord = (record) => {
  if (!record || typeof record !== 'object') return false;

  if (record.assessmentCompleted === true || record.downloadedPDF === true) {
    return true;
  }

  const src = String(record.source || '').trim().toLowerCase();
  const isInquirySource =
    src.includes('contact') ||
    src.includes('consultation') ||
    src.includes('callback') ||
    src.includes('advisory inquiry') ||
    src.includes('newsletter') ||
    src.includes('dpr request') ||
    src.includes('funding request') ||
    src.includes('promoter fund assistance') ||
    src.includes('nearby ca') ||
    src.includes('prosync featured');

  if (isInquirySource) {
    return false;
  }

  const isAssessmentSource =
    src.includes('assessment') ||
    src.includes('teaser') ||
    src.includes('feasibility') ||
    src.includes('appraisal') ||
    src.includes('project');

  const hasProjectMetrics = Boolean(
    record.projectName &&
      String(record.projectName).trim() &&
      (Number(record.feasibilityScore || 0) > 0 ||
        Number(record.totalCostCr || record.projectCost || 0) > 0 ||
        (record.clientProjectId && String(record.clientProjectId).trim()))
  );

  return isAssessmentSource && hasProjectMetrics;
};

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildIdentityOrFilter = ({ userId, email, mobile10 }) => {
  const orConditions = [];
  if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
    orConditions.push({ userId: new mongoose.Types.ObjectId(String(userId)) });
  }
  if (email) {
    orConditions.push({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });
  }
  if (mobile10) {
    orConditions.push({ mobile: new RegExp(`${escapeRegex(mobile10)}$`) });
  }
  return orConditions;
};

const recordMatchesIdentity = (record, { userId, email, mobile10 }) => {
  if (!record) return false;
  if (userId && record.userId && String(record.userId) === String(userId)) {
    return true;
  }
  if (email && normalizeEmail(record.email) === email) {
    return true;
  }
  if (mobile10 && normalizeMobile10(record.mobile || record.phone) === mobile10) {
    return true;
  }
  return false;
};

const getProjectDedupeKey = (rec) => {
  const cid = String(rec.clientProjectId || '').trim();
  if (cid) return `cid:${cid}`;
  const name = normalizeProjectName(rec.projectName);
  const industry = normalizeProjectName(rec.industry);
  if (name) return `proj:${name}|${industry}`;
  const id = String(rec._id || rec.id || '').trim();
  if (id) return `id:${id}`;
  return `anon:${JSON.stringify(rec).slice(0, 64)}`;
};

/**
 * Resolve the user's authoritative membership tier, activation & expiry dates, and live status label
 */
export const resolveUserMembership = async ({ user, email }) => {
  const cleanEmail = normalizeEmail(user?.email || email);
  const userId = user?._id || user?.id || null;

  let planId = 'free_plan';
  let membershipTier = MEMBERSHIP_PLAN_CATALOG.free_plan.name;
  let activatedAt = null;
  let expiresAt = null;

  const applyRecord = (rec) => {
    if (!rec) return;
    const rawTier = rec.membershipPlanId || rec.membershipTier || rec.membershipPlan || rec.planName;
    const resolved = resolvePlanDefinition(rawTier);
    if (resolved.id !== 'free_plan') {
      planId = resolved.id;
      membershipTier = resolved.name;
      activatedAt = rec.membershipActivatedAt || rec.createdAt || activatedAt;
      if (rec.membershipExpiresAt) {
        expiresAt = rec.membershipExpiresAt;
      } else if (resolved.validityDays && activatedAt) {
        expiresAt = new Date(new Date(activatedAt).getTime() + resolved.validityDays * 86400000);
      }
    }
  };

  if (user && isPaidMembershipTier(user.membershipPlanId || user.membershipTier || user.membershipPlan)) {
    applyRecord(user);
  }

  if (isDBConnected() && (userId || cleanEmail)) {
    try {
      let dbUser = null;
      if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
        dbUser = await User.findById(userId)
          .select('membershipPlanId membershipTier membershipStatus membershipActivatedAt membershipExpiresAt role email phone')
          .lean();
      } else if (cleanEmail) {
        dbUser = await User.findOne({ email: cleanEmail })
          .select('membershipPlanId membershipTier membershipStatus membershipActivatedAt membershipExpiresAt role email phone')
          .lean();
      }

      if (dbUser && isPaidMembershipTier(dbUser.membershipPlanId || dbUser.membershipTier)) {
        applyRecord(dbUser);
      } else {
        const paymentOr = [];
        if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
          paymentOr.push({ userId: new mongoose.Types.ObjectId(String(userId)) });
        }
        if (cleanEmail) {
          paymentOr.push({ userEmail: cleanEmail });
        }

        if (paymentOr.length > 0) {
          const capturedPayment = await Payment.findOne({
            $or: paymentOr,
            status: 'captured',
            itemType: 'membership',
          })
            .sort({ createdAt: -1 })
            .lean();

          if (capturedPayment) {
            applyRecord({
              membershipPlanId: capturedPayment.planId || capturedPayment.planName,
              membershipTier: capturedPayment.planName,
              membershipActivatedAt: capturedPayment.updatedAt || capturedPayment.createdAt,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[assessmentQuota] Membership DB check warning:', err.message);
    }
  }

  if (planId === 'free_plan') {
    const memUser =
      (userId && findMemoryUserById(userId)) || (cleanEmail && findMemoryUserByEmail(cleanEmail));
    if (memUser && isPaidMembershipTier(memUser.membershipPlanId || memUser.membershipTier)) {
      applyRecord(memUser);
    } else if (cleanEmail) {
      const memPayments = getMemoryPaymentsByUser(cleanEmail) || [];
      const captured = memPayments.find((p) => p.status === 'captured');
      if (captured) {
        applyRecord({
          membershipPlanId: captured.planId || captured.planName,
          membershipTier: captured.planName,
          membershipActivatedAt: captured.updatedAt || captured.createdAt,
        });
      }
    }
  }

  const statusInfo = computeMembershipStatusLabel({ planId, expiresAt });

  // Condition #7: When paid membership is expired, revert active limits back to Free Plan (preserving all historical records!)
  const activePlan = statusInfo.isPaidActive
    ? resolvePlanDefinition(planId)
    : MEMBERSHIP_PLAN_CATALOG.free_plan;

  return {
    planId,
    activePlanId: activePlan.id,
    hasPaidMembership: statusInfo.isPaidActive,
    membershipTier: planId === 'free_plan' ? MEMBERSHIP_PLAN_CATALOG.free_plan.name : membershipTier,
    statusLabel: statusInfo.statusLabel,
    isExpired: statusInfo.isExpired,
    isExpiringSoon: statusInfo.isExpiringSoon,
    daysRemaining: statusInfo.daysRemaining,
    activatedAt,
    expiresAt,
    autoRenew: false,
    assessmentsLimit: activePlan.assessmentsLimit,
    consultantIntroLimit: activePlan.consultantIntroLimit,
    prosyncIntroLimit: activePlan.prosyncIntroLimit,
    totalIntroLimit: activePlan.totalIntroLimit,
  };
};

/**
 * Authoritative server-side check enforcing plan assessment limits (Free: 1, Boost: 1, Plus: 3)
 * and returning comprehensive usage + introduction metrics.
 */
export const checkUserAssessmentQuota = async ({
  user = null,
  email = '',
  mobile = '',
  clientProjectId = '',
  existingRecordId = '',
  memoryLeads = [],
  memoryProjects = [],
  memoryAssessments = [],
} = {}) => {
  const role = user?.role || '';
  if (isPrivilegedRole(role)) {
    return {
      allowed: true,
      unlimited: true,
      hasPaidMembership: true,
      planId: 'promoter_plus',
      membershipTier: 'Staff / Institutional',
      statusLabel: 'Active',
      usedCount: 0,
      limit: null,
      remainingCount: null,
      consultantUsed: 0,
      consultantLimit: 99,
      consultantRemaining: 99,
      prosyncUsed: 0,
      prosyncLimit: 99,
      prosyncRemaining: 99,
      prosyncStatus: 'Staff Access',
      existingProjectId: null,
      existingProjectName: null,
      existingClientProjectId: null,
      isUpdatingExisting: false,
    };
  }

  const userId = user?._id || user?.id || null;
  const cleanEmail = normalizeEmail(user?.email || email);
  const mobile10 = normalizeMobile10(user?.phone || mobile);
  const incomingClientProjectId = String(clientProjectId || '').trim();
  const incomingRecordId = String(existingRecordId || '').trim();

  const membership = await resolveUserMembership({ user, email: cleanEmail });

  const identity = { userId, email: cleanEmail, mobile10 };
  const orConditions = buildIdentityOrFilter(identity);

  const matchedRecords = [];

  if (orConditions.length > 0) {
    if (isDBConnected()) {
      try {
        const [dbLeads, dbProjects, dbAssessments] = await Promise.all([
          Lead.find({ $or: orConditions })
            .select('_id userId clientProjectId email mobile projectName industry source assessmentCompleted downloadedPDF feasibilityScore totalCostCr createdAt')
            .sort({ createdAt: -1 })
            .lean(),
          Project.find({ $or: orConditions })
            .select('_id userId clientProjectId email mobile projectName industry status createdAt')
            .sort({ createdAt: -1 })
            .lean(),
          Assessment.find({ $or: orConditions })
            .select('_id userId clientProjectId email mobile industry projectCostCr createdAt')
            .sort({ createdAt: -1 })
            .lean(),
        ]);

        for (const lead of dbLeads) {
          if (isAssessmentLeadRecord(lead)) {
            matchedRecords.push({
              kind: 'lead',
              _id: String(lead._id),
              clientProjectId: lead.clientProjectId || '',
              projectName: lead.projectName || '',
              industry: lead.industry || '',
              createdAt: lead.createdAt,
            });
          }
        }

        for (const proj of dbProjects) {
          if (proj.status !== 'Draft') {
            matchedRecords.push({
              kind: 'project',
              _id: String(proj._id),
              clientProjectId: proj.clientProjectId || '',
              projectName: proj.projectName || '',
              industry: proj.industry || '',
              createdAt: proj.createdAt,
            });
          }
        }

        for (const asmt of dbAssessments) {
          matchedRecords.push({
            kind: 'assessment',
            _id: String(asmt._id),
            clientProjectId: asmt.clientProjectId || '',
            projectName: asmt.industry ? `${asmt.industry} Project` : 'Project Assessment',
            industry: asmt.industry || '',
            createdAt: asmt.createdAt,
          });
        }
      } catch (err) {
        console.warn('[assessmentQuota] DB lookup warning:', err.message);
      }
    }

    for (const lead of memoryLeads || []) {
      if (recordMatchesIdentity(lead, identity) && isAssessmentLeadRecord(lead)) {
        matchedRecords.push({
          kind: 'lead',
          _id: String(lead._id || lead.id || ''),
          clientProjectId: lead.clientProjectId || '',
          projectName: lead.projectName || '',
          industry: lead.industry || '',
          createdAt: lead.createdAt || lead.timestamp,
        });
      }
    }

    for (const proj of memoryProjects || []) {
      if (recordMatchesIdentity(proj, identity) && proj.status !== 'Draft') {
        matchedRecords.push({
          kind: 'project',
          _id: String(proj._id || proj.id || ''),
          clientProjectId: proj.clientProjectId || '',
          projectName: proj.projectName || '',
          industry: proj.industry || '',
          createdAt: proj.createdAt,
        });
      }
    }

    for (const asmt of memoryAssessments || []) {
      if (recordMatchesIdentity(asmt, identity)) {
        matchedRecords.push({
          kind: 'assessment',
          _id: String(asmt._id || asmt.id || ''),
          clientProjectId: asmt.clientProjectId || '',
          projectName: asmt.industry ? `${asmt.industry} Project` : 'Project Assessment',
          industry: asmt.industry || '',
          createdAt: asmt.createdAt,
        });
      }
    }
  }

  // Condition #2: Deduplicate records that represent the same logical project
  const uniqueProjectsMap = new Map();
  for (const rec of matchedRecords) {
    const key = getProjectDedupeKey(rec);
    if (!uniqueProjectsMap.has(key)) {
      uniqueProjectsMap.set(key, rec);
    } else {
      const existing = uniqueProjectsMap.get(key);
      if (existing.kind !== 'lead' && rec.kind === 'lead') {
        uniqueProjectsMap.set(key, rec);
      }
    }
  }

  const distinctProjects = Array.from(uniqueProjectsMap.values());
  const usedCount = distinctProjects.length;
  const primaryExisting = distinctProjects[0] || null;

  const isUpdatingExisting = Boolean(
    (incomingClientProjectId &&
      matchedRecords.some((r) => r.clientProjectId && r.clientProjectId === incomingClientProjectId)) ||
      (incomingRecordId &&
        matchedRecords.some((r) => r._id && String(r._id) === incomingRecordId))
  );

  // Separate Prosync vs independent consultant introductions tracking
  let consultantUsed = 0;
  let prosyncUsed = 0;
  let prosyncStatus = 'Not Requested';

  if (isDBConnected() && (userId || cleanEmail)) {
    try {
      const introOr = [];
      if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
        introOr.push({ userId: new mongoose.Types.ObjectId(String(userId)) });
      }
      if (cleanEmail) {
        introOr.push({ userEmail: cleanEmail });
      }
      if (introOr.length > 0) {
        const intros = await IntroductionRequest.find({ $or: introOr }).sort({ createdAt: -1 }).lean();
        const counted = intros.filter(
          (i) => i.countedAgainstQuota !== false && i.status !== 'Unavailable / Cancelled'
        );
        consultantUsed = counted.filter((i) => !i.isProsync).length;
        prosyncUsed = counted.filter((i) => Boolean(i.isProsync)).length;
        const latestProsync = intros.find((i) => Boolean(i.isProsync));
        if (latestProsync) {
          prosyncStatus = latestProsync.status;
        }
      }
    } catch (introErr) {
      console.warn('[assessmentQuota] Intro tracking check warning:', introErr.message);
    }
  }

  const assessmentLimit = membership.assessmentsLimit;
  const remainingAssessments = Math.max(0, assessmentLimit - usedCount);
  const consultantRemaining = Math.max(
    0,
    membership.activePlanId === 'promoter_plus'
      ? membership.totalIntroLimit - prosyncUsed - consultantUsed
      : membership.consultantIntroLimit - consultantUsed
  );
  const prosyncRemaining = Math.max(0, membership.prosyncIntroLimit - prosyncUsed);

  const allowed = isUpdatingExisting || usedCount < assessmentLimit;

  const basePayload = {
    allowed,
    unlimited: false,
    planId: membership.planId,
    activePlanId: membership.activePlanId,
    hasPaidMembership: membership.hasPaidMembership,
    membershipTier: membership.membershipTier,
    statusLabel: membership.statusLabel,
    isExpired: membership.isExpired,
    isExpiringSoon: membership.isExpiringSoon,
    daysRemaining: membership.daysRemaining,
    activatedAt: membership.activatedAt,
    expiresAt: membership.expiresAt,
    autoRenew: false,
    usedCount,
    limit: assessmentLimit,
    remainingCount: remainingAssessments,
    consultantUsed,
    consultantLimit:
      membership.activePlanId === 'promoter_plus'
        ? Math.max(0, membership.totalIntroLimit - prosyncUsed)
        : membership.consultantIntroLimit,
    consultantRemaining,
    prosyncUsed,
    prosyncLimit: membership.prosyncIntroLimit,
    prosyncRemaining,
    prosyncStatus,
    existingProjectId: primaryExisting?._id || null,
    existingProjectName: primaryExisting?.projectName || null,
    existingClientProjectId: primaryExisting?.clientProjectId || null,
    isUpdatingExisting,
  };

  if (!allowed) {
    return {
      ...basePayload,
      code: FREE_ASSESSMENT_LIMIT_CODE,
      reason:
        membership.activePlanId === 'promoter_plus'
          ? `You have used all ${assessmentLimit} project assessments included in your Promoter Plus membership.`
          : `You have already used your ${assessmentLimit} project assessment${
              primaryExisting?.projectName ? ` for "${primaryExisting.projectName}"` : ''
            }. You can view, edit, and re-download your existing project from your Dashboard, or upgrade to Promoter Plus for up to 3 assessments.`,
    };
  }

  return basePayload;
};

export const createQuotaExceededError = (quotaResult) => {
  const err = new Error(
    quotaResult?.reason ||
      'Project assessment limit reached for your current plan. Upgrade to Promoter Plus for up to 3 project assessments.'
  );
  err.statusCode = 403;
  err.code = FREE_ASSESSMENT_LIMIT_CODE;
  err.existingProjectId = quotaResult?.existingProjectId || null;
  err.existingProjectName = quotaResult?.existingProjectName || null;
  return err;
};

export default {
  FREE_ASSESSMENT_LIMIT,
  FREE_ASSESSMENT_LIMIT_CODE,
  normalizeEmail,
  normalizeMobile10,
  normalizeProjectName,
  isPrivilegedRole,
  isPaidMembershipTier,
  isAssessmentLeadRecord,
  buildIdentityOrFilter,
  resolveUserMembership,
  checkUserAssessmentQuota,
  createQuotaExceededError,
};

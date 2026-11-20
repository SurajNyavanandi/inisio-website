import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import Project from '../models/Project.js';
import Assessment from '../models/Assessment.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { isDBConnected } from '../config/db.js';
import { getMemoryPaymentsByUser } from './memoryPaymentStore.js';
import { findMemoryUserByEmail, findMemoryUserById } from './memoryUserStore.js';

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
 * (rather than a Contact Us form inquiry, CA consultation request, or general newsletter lead).
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
    src.includes('promoter fund assistance');

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
    (record.projectName && String(record.projectName).trim()) &&
      (Number(record.feasibilityScore || 0) > 0 ||
        Number(record.totalCostCr || record.projectCost || 0) > 0 ||
        (record.clientProjectId && String(record.clientProjectId).trim()))
  );

  return isAssessmentSource && hasProjectMetrics;
};

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Build a MongoDB $or identity filter matching userId, normalized email, or 10-digit trailing mobile.
 */
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
 * Resolve whether the user has an active paid membership tier from User doc or captured Payment records.
 */
export const resolveUserMembership = async ({ user, email }) => {
  const cleanEmail = normalizeEmail(user?.email || email);
  const userId = user?._id || user?.id || null;

  if (isPaidMembershipTier(user?.membershipTier || user?.membershipPlan)) {
    return {
      hasPaidMembership: true,
      membershipTier: user.membershipTier || user.membershipPlan,
    };
  }

  if (isDBConnected()) {
    try {
      let dbUser = null;
      if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
        dbUser = await User.findById(userId).select('membershipTier role email phone').lean();
      } else if (cleanEmail) {
        dbUser = await User.findOne({ email: cleanEmail }).select('membershipTier role email phone').lean();
      }

      if (dbUser && isPaidMembershipTier(dbUser.membershipTier)) {
        return {
          hasPaidMembership: true,
          membershipTier: dbUser.membershipTier,
        };
      }

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
        })
          .sort({ createdAt: -1 })
          .lean();

        if (capturedPayment) {
          return {
            hasPaidMembership: true,
            membershipTier: capturedPayment.planName || 'Institutional Plan',
          };
        }
      }
    } catch (err) {
      console.warn('[assessmentQuota] Membership DB check warning:', err.message);
    }
  }

  // Fallback memory user & memory payment check
  const memUser =
    (userId && findMemoryUserById(userId)) || (cleanEmail && findMemoryUserByEmail(cleanEmail));
  if (memUser && isPaidMembershipTier(memUser.membershipTier)) {
    return {
      hasPaidMembership: true,
      membershipTier: memUser.membershipTier,
    };
  }

  if (cleanEmail) {
    const memPayments = getMemoryPaymentsByUser(cleanEmail) || [];
    const captured = memPayments.find((p) => p.status === 'captured');
    if (captured) {
      return {
        hasPaidMembership: true,
        membershipTier: captured.planName || 'Institutional Plan',
      };
    }
  }

  return {
    hasPaidMembership: false,
    membershipTier: 'Free',
  };
};

/**
 * Authoritative server-side check enforcing 1 free assessment per valid user
 * across userId, normalized email, and normalized 10-digit mobile number.
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
      membershipTier: 'Staff / Institutional',
      usedCount: 0,
      limit: null,
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

    // Also include in-memory records when DB is offline or memory fallback is active
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

  // Deduplicate records that represent the same logical project
  const uniqueProjectsMap = new Map();
  for (const rec of matchedRecords) {
    const key = getProjectDedupeKey(rec);
    if (!uniqueProjectsMap.has(key)) {
      uniqueProjectsMap.set(key, rec);
    } else {
      const existing = uniqueProjectsMap.get(key);
      // Prefer lead record ID so dashboard resume links directly to the lead/project
      if (existing.kind !== 'lead' && rec.kind === 'lead') {
        uniqueProjectsMap.set(key, rec);
      }
    }
  }

  const distinctProjects = Array.from(uniqueProjectsMap.values());
  const usedCount = distinctProjects.length;
  const primaryExisting = distinctProjects[0] || null;

  // Check if incoming request is updating one of the user's already-counted existing projects
  const isUpdatingExisting = Boolean(
    (incomingClientProjectId &&
      matchedRecords.some((r) => r.clientProjectId && r.clientProjectId === incomingClientProjectId)) ||
      (incomingRecordId &&
        matchedRecords.some((r) => r._id && String(r._id) === incomingRecordId))
  );

  if (membership.hasPaidMembership) {
    return {
      allowed: true,
      unlimited: true,
      hasPaidMembership: true,
      membershipTier: membership.membershipTier,
      usedCount,
      limit: null,
      existingProjectId: primaryExisting?._id || null,
      existingProjectName: primaryExisting?.projectName || null,
      existingClientProjectId: primaryExisting?.clientProjectId || null,
      isUpdatingExisting,
    };
  }

  if (usedCount >= FREE_ASSESSMENT_LIMIT && !isUpdatingExisting) {
    return {
      allowed: false,
      unlimited: false,
      hasPaidMembership: false,
      membershipTier: 'Free',
      usedCount,
      limit: FREE_ASSESSMENT_LIMIT,
      code: FREE_ASSESSMENT_LIMIT_CODE,
      existingProjectId: primaryExisting?._id || null,
      existingProjectName: primaryExisting?.projectName || 'Your Free Project',
      existingClientProjectId: primaryExisting?.clientProjectId || null,
      isUpdatingExisting: false,
      reason: `You have already used your 1 free project assessment${
        primaryExisting?.projectName ? ` for "${primaryExisting.projectName}"` : ''
      }. You can still view, edit, and re-download your existing project from your Dashboard, or upgrade to a membership plan to assess additional projects.`,
    };
  }

  return {
    allowed: true,
    unlimited: false,
    hasPaidMembership: false,
    membershipTier: 'Free',
    usedCount,
    limit: FREE_ASSESSMENT_LIMIT,
    existingProjectId: primaryExisting?._id || null,
    existingProjectName: primaryExisting?.projectName || null,
    existingClientProjectId: primaryExisting?.clientProjectId || null,
    isUpdatingExisting,
  };
};

export const createQuotaExceededError = (quotaResult) => {
  const err = new Error(
    quotaResult?.reason ||
      'You have already used your 1 free project assessment. Upgrade to a paid membership plan to create additional project assessments.'
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

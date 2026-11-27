import Lead from '../models/Lead.js';
import Project from '../models/Project.js';
import mongoose from 'mongoose';
import { isDBConnected } from '../config/db.js';
import { isAuthorizedAdminEmail } from '../utils/memoryUserStore.js';
import { escapeRegex } from '../middleware/validateMiddleware.js';
import {
  sendLeadAssessmentConfirmationEmail,
  sendDprStatusEmail,
  sendPromoterFundAssistanceEmails,
} from '../utils/emailService.js';
import config from '../config/env.js';
import { getMemoryProjects } from './projectService.js';
import notificationService from './notificationService.js';
import {
  checkUserAssessmentQuota,
  createQuotaExceededError,
  isAssessmentLeadRecord,
  normalizeEmail,
  normalizeMobile10,
  normalizeProjectName,
} from '../utils/assessmentQuota.js';

let memoryLeads = [];

export const getMemoryLeads = () => memoryLeads;

const isSuperAdminOrAdmin = (role = '', email = '') => {
  return (
    ['superadmin', 'admin', 'admin1', 'admin2', 'admin3'].includes(role) ||
    isAuthorizedAdminEmail(email)
  );
};

const DPR_MILESTONE_STATUSES = new Set([
  'dpr requested',
  'dpr in progress',
  'in review',
  'under review',
  'dpr ready',
  'dpr completed',
  'completed',
  'approved',
  'bank sanction approved',
]);

const isDprMilestoneStatus = (status = '') => {
  const norm = String(status || '').trim().toLowerCase();
  return Boolean(norm) && (DPR_MILESTONE_STATUSES.has(norm) || norm.includes('dpr'));
};

const notifyDprMilestoneIfNeeded = (previous = {}, updated = {}) => {
  try {
    const prevStatus = String(previous?.status || '').trim();
    const nextStatus = String(updated?.status || '').trim();
    const prevAssigned = String(previous?.dprAssignedTo || '').trim();
    const nextAssigned = String(updated?.dprAssignedTo || '').trim();
    const prevCompleted = Boolean(previous?.dprCompleted);
    const nextCompleted = Boolean(updated?.dprCompleted);

    const statusChangedToMilestone =
      nextStatus && nextStatus.toLowerCase() !== prevStatus.toLowerCase() && isDprMilestoneStatus(nextStatus);
    const assignedChanged = Boolean(nextAssigned) && nextAssigned.toLowerCase() !== prevAssigned.toLowerCase();
    const completedNow = !prevCompleted && nextCompleted;

    if (!statusChangedToMilestone && !assignedChanged && !completedNow) return;

    const projectName = updated?.projectName || previous?.projectName || 'Greenfield Project';
    const promoterEmail = String(updated?.email || previous?.email || '').trim();
    const promoterName = updated?.fullName || updated?.promoterName || previous?.fullName || 'Promoter';
    const displayStatus = completedNow
      ? 'DPR Completed'
      : statusChangedToMilestone
        ? nextStatus
        : 'DPR Assigned';
    const note = updated?.caReviewNotes || updated?.notes || '';

    if (promoterEmail && promoterEmail.includes('@')) {
      sendDprStatusEmail({
        to: promoterEmail,
        name: promoterName,
        projectName,
        status: displayStatus,
        assignedTo: nextAssigned,
        note,
        recipientType: 'promoter',
      }).catch(() => {});
    }

    if (assignedChanged && nextAssigned.includes('@')) {
      sendDprStatusEmail({
        to: nextAssigned,
        name: nextAssigned.split('@')[0],
        projectName,
        status: displayStatus,
        assignedTo: nextAssigned,
        note,
        recipientType: 'consultant',
      }).catch(() => {});
    }

    if (statusChangedToMilestone && nextStatus.toLowerCase().includes('requested')) {
      const adminInbox = (process.env.ADMIN_EMAIL || config.ADMIN_EMAIL || '').trim();
      if (adminInbox && adminInbox.includes('@') && !adminInbox.endsWith('@example.com')) {
        sendDprStatusEmail({
          to: adminInbox,
          name: 'Admin',
          projectName,
          status: displayStatus,
          assignedTo: nextAssigned,
          note: `Requested by ${promoterName}${promoterEmail ? ` (${promoterEmail})` : ''}`,
          recipientType: 'admin',
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[LeadService] DPR email notification notice:', err.message);
  }
};

const isAssignedToTeamMember = (assignment, requester, team) => {
  const assigned = String(assignment || '').trim().toLowerCase();
  if (!assigned) return false;
  const identities = [requester?.email, requester?.name]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
  return (
    identities.includes(assigned) ||
    assigned === team ||
    assigned.startsWith(`${team}:`) ||
    (team === 'ca' && assigned.startsWith('ca '))
  );
};

const canAccessLead = (lead, requester) => {
  if (!requester) return false;
  if (isSuperAdminOrAdmin(requester.role, requester.email)) return true;
  if (requester.role === 'ca') return isAssignedToTeamMember(lead.assignedCA, requester, 'ca');
  if (requester.role === 'dpr' || requester.role === 'dpr_consultant') {
    return isAssignedToTeamMember(lead.dprAssignedTo, requester, 'dpr');
  }
  if (requester.role === 'prosync' || requester.role === 'prosync_admin') {
    return isAssignedToTeamMember(lead.consultationAssignedTo, requester, 'prosync');
  }
  return (
    (requester._id && String(lead.userId || '') === String(requester._id)) ||
    Boolean(lead.email && requester.email && lead.email.toLowerCase().trim() === requester.email.toLowerCase().trim())
  );
};

const mapProjectToLead = (p) => ({
  _id: p._id,
  userId: p.userId || null,
  clientProjectId: p.clientProjectId || '',
  fullName: p.promoterName || 'Promoter',
  mobile: p.mobile || '',
  email: p.email || '',
  projectName: p.projectName || 'Greenfield Project',
  industry: p.industry || 'Manufacturing',
  location: p.location || 'India',
  totalCostCr: p.capexCr ?? 0,
  loanRequiredCr: p.loanCr ?? 0,
  promoterContribCr: p.equityCr ?? 0,
  feasibilityScore: p.feasibilityScore ?? 0,
  bankabilityRating: p.bankabilityRating || '',
  dscrEstimate: p.dscr ?? 0,
  source: 'Direct Project Registry',
  downloadedPDF: false,
  status: p.status || 'Pending Audit',
  assignedCA: p.assignedCA || '',
  dprAssignedTo: p.dprAssignedTo || '',
  consultationAssignedTo: p.consultationAssignedTo || '',
  assignedBank: p.assignedBank || '',
  bankName: p.assignedBank || '',
  caReviewNotes: p.caReviewNotes || '',
  notes: p.caReviewNotes || '',
  uploadedDocuments: Array.isArray(p.uploadedDocuments) ? p.uploadedDocuments : [],
  dprFile: p.dprFile || null,
  cmaFile: p.cmaFile || null,
  documentsUploaded: Boolean(p.documentsUploaded),
  promotersList: Array.isArray(p.promotersList) ? p.promotersList : [],
  customCostComponents: Array.isArray(p.costComponents) ? p.costComponents : [],
  meansOfFinance: p.meansOfFinance || {
    equityCr: Number(p.equityCr) || 0,
    debtCr: Number(p.loanCr) || 0,
    subsidyCr: 0,
  },
  checklistUploaded: Boolean(p.checklistUploaded),
  checklistFileName: p.checklistFileName || '',
  documents: p.documents || {},
  isFunded: Boolean(p.isFunded),
  successProbability: p.isFunded ? 100 : 25,
  recordType: 'project',
  createdAt: p.createdAt || new Date(),
  updatedAt: p.updatedAt || p.createdAt || new Date(),
});

const mergeLeadsAndProjects = (leadsArr, projectsArr) => {
  const existingIds = new Set(leadsArr.map((l) => String(l._id || l.id)));
  const existingKeys = new Set(
    leadsArr
      .filter((l) => (l.email || '').trim() && (l.projectName || '').trim())
      .map((l) => `${l.email.toLowerCase().trim()}__${l.projectName.toLowerCase().trim()}`)
  );

  const mappedProjects = projectsArr
    .map(mapProjectToLead)
    .filter((p) => {
      const idStr = String(p._id);
      if (existingIds.has(idStr)) return false;
      const em = (p.email || '').toLowerCase().trim();
      const pn = (p.projectName || '').toLowerCase().trim();
      if (em && pn && existingKeys.has(`${em}__${pn}`)) return false;
      return true;
    });

  return [...leadsArr, ...mappedProjects];
};

export const getAllLeads = async (query = {}, requester = null) => {
  if (!requester) {
    const error = new Error('Authentication required to access leads.');
    error.statusCode = 401;
    throw error;
  }

  let leadsList = [];
  const isAdmin = isSuperAdminOrAdmin(requester?.role, requester?.email);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 100, 1), 200);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  if (isDBConnected()) {
    try {
      const andClauses = [];
      const projAndClauses = [];

      if (!isAdmin && requester?.role === 'user') {
        const ownerOr = [];
        if (requester._id) ownerOr.push({ userId: requester._id });
        if (requester.email) {
          ownerOr.push({ email: { $regex: new RegExp(`^${escapeRegex(requester.email.trim())}$`, 'i') } });
        }
        if (ownerOr.length > 0) {
          andClauses.push({ $or: ownerOr });
          projAndClauses.push({ $or: ownerOr });
        }
      } else if (!isAdmin && requester?.role === 'ca') {
        const patterns = [
          /^ca(:|\s|$)/i,
          ...(requester.email ? [new RegExp(`^${escapeRegex(requester.email.trim())}$`, 'i')] : []),
          ...(requester.name ? [new RegExp(`^${escapeRegex(requester.name.trim())}$`, 'i')] : []),
        ];
        andClauses.push({ assignedCA: { $in: patterns } });
        projAndClauses.push({ assignedCA: { $in: patterns } });
      } else if (!isAdmin && (requester?.role === 'dpr_consultant' || requester?.role === 'dpr')) {
        const patterns = [
          /^dpr(:|$)/i,
          ...(requester.email ? [new RegExp(`^${escapeRegex(requester.email.trim())}$`, 'i')] : []),
          ...(requester.name ? [new RegExp(`^${escapeRegex(requester.name.trim())}$`, 'i')] : []),
        ];
        andClauses.push({ dprAssignedTo: { $in: patterns } });
        projAndClauses.push({ dprAssignedTo: { $in: patterns } });
      } else if (!isAdmin && (requester?.role === 'prosync' || requester?.role === 'prosync_admin')) {
        const patterns = [
          /^prosync(:|$)/i,
          ...(requester.email ? [new RegExp(`^${escapeRegex(requester.email.trim())}$`, 'i')] : []),
          ...(requester.name ? [new RegExp(`^${escapeRegex(requester.name.trim())}$`, 'i')] : []),
        ];
        andClauses.push({ consultationAssignedTo: { $in: patterns } });
        projAndClauses.push({ consultationAssignedTo: { $in: patterns } });
      } else if (!isAdmin) {
        return [];
      }

      if (query.email) {
        const emailRegex = new RegExp(`^${escapeRegex(query.email.trim())}$`, 'i');
        andClauses.push({ email: { $regex: emailRegex } });
        projAndClauses.push({ email: { $regex: emailRegex } });
      }

      if (query.search) {
        const safeSearch = escapeRegex(query.search.trim());
        andClauses.push({
          $or: [
            { fullName: { $regex: safeSearch, $options: 'i' } },
            { mobile: { $regex: safeSearch, $options: 'i' } },
            { email: { $regex: safeSearch, $options: 'i' } },
            { projectName: { $regex: safeSearch, $options: 'i' } },
            { industry: { $regex: safeSearch, $options: 'i' } },
          ],
        });
        projAndClauses.push({
          $or: [
            { promoterName: { $regex: safeSearch, $options: 'i' } },
            { mobile: { $regex: safeSearch, $options: 'i' } },
            { email: { $regex: safeSearch, $options: 'i' } },
            { projectName: { $regex: safeSearch, $options: 'i' } },
            { industry: { $regex: safeSearch, $options: 'i' } },
          ],
        });
      }

      if (query.filterSource === 'PDF') {
        andClauses.push({ downloadedPDF: true });
      } else if (query.filterSource === 'FORM') {
        andClauses.push({ downloadedPDF: false });
      }

      const leadFilter = andClauses.length > 1 ? { $and: andClauses } : andClauses[0] || {};
      const projFilter = projAndClauses.length > 1 ? { $and: projAndClauses } : projAndClauses[0] || {};

      const fetchCap = Math.max(limit * page, 500);
      const [dbLeads, dbProjects] = await Promise.all([
        Lead.find(leadFilter).sort({ updatedAt: -1, createdAt: -1 }).limit(fetchCap).lean(),
        query.filterSource === 'PDF'
          ? Promise.resolve([])
          : Project.find(projFilter).sort({ updatedAt: -1, createdAt: -1 }).limit(fetchCap).lean().catch(() => []),
      ]);

      leadsList = mergeLeadsAndProjects(dbLeads, dbProjects);
    } catch (err) {
      console.warn('MongoDB query failed in getAllLeads, using memory fallback:', err.message);
      leadsList = mergeLeadsAndProjects([...memoryLeads], getMemoryProjects());
    }
  } else {
    leadsList = mergeLeadsAndProjects([...memoryLeads], getMemoryProjects());
  }

  // Apply in-memory security & query filtering (applies to memory store AND as defense-in-depth)
  let results = [...leadsList];

  if (!isAdmin && requester?.role === 'user') {
    const reqEmail = (requester.email || '').toLowerCase().trim();
    const reqId = String(requester._id || requester.id || '');
    results = results.filter((l) => {
      const lEmail = (l.email || '').toLowerCase().trim();
      const lUserId = String(l.userId || '');
      return (reqEmail && lEmail === reqEmail) || (reqId && lUserId === reqId);
    });
  } else if (!isAdmin && requester?.role === 'ca') {
    results = results.filter((lead) => isAssignedToTeamMember(lead.assignedCA, requester, 'ca'));
  } else if (!isAdmin && (requester?.role === 'dpr' || requester?.role === 'dpr_consultant')) {
    results = results.filter((lead) => isAssignedToTeamMember(lead.dprAssignedTo, requester, 'dpr'));
  } else if (!isAdmin && (requester?.role === 'prosync' || requester?.role === 'prosync_admin')) {
    results = results.filter((lead) => isAssignedToTeamMember(lead.consultationAssignedTo, requester, 'prosync'));
  } else if (!isAdmin) {
    return [];
  }

  if (query.email) {
    const em = query.email.toLowerCase().trim();
    results = results.filter((l) => (l.email || '').toLowerCase().trim() === em);
  }

  if (query.search) {
    const s = query.search.toLowerCase().trim();
    results = results.filter(
      (l) =>
        (l.fullName && l.fullName.toLowerCase().includes(s)) ||
        (l.mobile && l.mobile.includes(s)) ||
        (l.email && l.email.toLowerCase().includes(s)) ||
        (l.projectName && l.projectName.toLowerCase().includes(s)) ||
        (l.industry && l.industry.toLowerCase().includes(s))
    );
  }
  if (query.filterSource === 'PDF') {
    results = results.filter((l) => l.downloadedPDF);
  } else if (query.filterSource === 'FORM') {
    results = results.filter((l) => !l.downloadedPDF);
  }

  // Sort by recent activity
  results.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || b.timestamp || 0).getTime() -
      new Date(a.updatedAt || a.createdAt || a.timestamp || 0).getTime()
  );

  // Deduplicate strictly by unique database ID
  const uniqueById = new Map();
  results.forEach((item) => {
    const idKey = String(item._id || item.id);
    if (!uniqueById.has(idKey)) {
      uniqueById.set(idKey, item);
    }
  });

  const finalResults = Array.from(uniqueById.values());
  const skip = (page - 1) * limit;

  return finalResults.slice(skip, skip + limit);
};

export const createLead = async (rawLeadData, userOrId = null) => {
  const userObj =
    userOrId && typeof userOrId === 'object' && (userOrId._id || userOrId.email || userOrId.role)
      ? userOrId
      : null;
  const userId = userObj ? userObj._id : userOrId || null;

  const leadData = { ...rawLeadData };
  const clientProjectId = String(leadData.clientProjectId || '').trim();
  const existingRecordId = String(leadData._id || leadData.id || '').trim();
  delete leadData._id;
  delete leadData.id;
  delete leadData.assignedCA;
  delete leadData.assignedTeam;
  delete leadData.assignedRole;
  delete leadData.dprAssignedTo;
  delete leadData.consultationAssignedTo;
  delete leadData.adminVisibilityConfirmed;

  const cleanEmail = normalizeEmail(leadData.email || userObj?.email);
  const cleanMobile = String(leadData.mobile || userObj?.phone || '').trim();
  const cleanMobile10 = normalizeMobile10(cleanMobile);
  const cleanProjectName = normalizeProjectName(leadData.projectName);

  if (cleanEmail) leadData.email = cleanEmail;
  if (cleanMobile) leadData.mobile = cleanMobile;
  if (clientProjectId) leadData.clientProjectId = clientProjectId;

  const isAssessmentSubmission = isAssessmentLeadRecord(leadData);

  // 1. Idempotent upsert check (prevent duplicate rows on Back/Edit/Re-submit/PDF download)
  if (isDBConnected()) {
    try {
      let existingLead = null;

      if (clientProjectId) {
        existingLead = await Lead.findOne({ clientProjectId });
      }

      if (!existingLead && existingRecordId && mongoose.Types.ObjectId.isValid(existingRecordId)) {
        const candidate = await Lead.findById(existingRecordId);
        if (
          candidate &&
          ((userId && String(candidate.userId || '') === String(userId)) ||
            (cleanEmail && normalizeEmail(candidate.email) === cleanEmail) ||
            (cleanMobile10 && normalizeMobile10(candidate.mobile) === cleanMobile10))
        ) {
          existingLead = candidate;
        }
      }

      // Secondary deduplication for assessment submissions with the exact same project name & owner
      if (!existingLead && isAssessmentSubmission && cleanProjectName && (userId || cleanEmail || cleanMobile10)) {
        const ownerOr = [];
        if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
          ownerOr.push({ userId });
        }
        if (cleanEmail) {
          ownerOr.push({ email: new RegExp(`^${escapeRegex(cleanEmail)}$`, 'i') });
        }
        if (cleanMobile10) {
          ownerOr.push({ mobile: new RegExp(`${escapeRegex(cleanMobile10)}$`) });
        }
        if (ownerOr.length > 0) {
          const candidates = await Lead.find({ $or: ownerOr }).sort({ updatedAt: -1 }).limit(10);
          existingLead = candidates.find(
            (c) => isAssessmentLeadRecord(c) && normalizeProjectName(c.projectName) === cleanProjectName
          );
        }
      }

      if (existingLead) {
        Object.assign(existingLead, {
          ...leadData,
          userId: userId || existingLead.userId || null,
          clientProjectId: clientProjectId || existingLead.clientProjectId || '',
          timestamp: new Date(),
        });
        await existingLead.save();
        return existingLead;
      }
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('MongoDB upsert check warning in createLead:', err.message);
    }
  } else {
    // In-memory idempotent upsert check
    const existingMemIdx = memoryLeads.findIndex((item) => {
      if (clientProjectId && item.clientProjectId === clientProjectId) return true;
      if (existingRecordId && String(item._id) === existingRecordId) return true;
      if (
        isAssessmentSubmission &&
        cleanProjectName &&
        isAssessmentLeadRecord(item) &&
        normalizeProjectName(item.projectName) === cleanProjectName &&
        ((userId && String(item.userId || '') === String(userId)) ||
          (cleanEmail && normalizeEmail(item.email) === cleanEmail) ||
          (cleanMobile10 && normalizeMobile10(item.mobile) === cleanMobile10))
      ) {
        return true;
      }
      return false;
    });

    if (existingMemIdx !== -1) {
      memoryLeads[existingMemIdx] = {
        ...memoryLeads[existingMemIdx],
        ...leadData,
        userId: userId || memoryLeads[existingMemIdx].userId || null,
        clientProjectId: clientProjectId || memoryLeads[existingMemIdx].clientProjectId || '',
        updatedAt: new Date(),
      };
      return memoryLeads[existingMemIdx];
    }
  }

  // 2. Enforce 1-free-assessment-per-user quota ONLY for assessment/teaser project leads
  // (Never block Contact Us form submissions or general CA consultation inquiries)
  if (isAssessmentSubmission) {
    const quota = await checkUserAssessmentQuota({
      user: userObj,
      email: cleanEmail,
      mobile: cleanMobile10,
      clientProjectId,
      existingRecordId,
      memoryLeads,
      memoryProjects: getMemoryProjects(),
    });

    if (!quota.allowed) {
      throw createQuotaExceededError(quota);
    }
  }

  if (isDBConnected()) {
    try {
      const lead = await Lead.create({
        ...leadData,
        userId,
        timestamp: new Date(),
      });

      const isTeaser = lead.downloadedPDF || lead.source?.includes('PDF');
      await notificationService.createNotification({
        type: isTeaser ? 'TEASER_DOWNLOAD' : 'LEAD_CREATED',
        title: isTeaser ? 'Project Teaser Downloaded' : 'New Greenfield Lead Received',
        message: `${lead.fullName} (${lead.email || lead.mobile}) ${isTeaser ? 'downloaded Teaser PDF for' : 'submitted project'} '${lead.projectName}' (₹${lead.totalCostCr} Cr).`,
        userEmail: lead.email,
        userName: lead.fullName,
        projectName: lead.projectName,
        metadata: { totalCostCr: lead.totalCostCr, loanRequiredCr: lead.loanRequiredCr, source: lead.source },
      }).catch(() => {});

      sendLeadAssessmentConfirmationEmail(lead).catch(() => {});
      return lead;
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('MongoDB create failed in createLead, storing in memory fallback:', err.message);
    }
  }

  const created = {
    _id: `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    status: 'In Appraisal',
    ...leadData,
    userId: userId || null,
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryLeads.unshift(created);

  const isTeaser = created.downloadedPDF || created.source?.includes('PDF');
  await notificationService.createNotification({
    type: isTeaser ? 'TEASER_DOWNLOAD' : 'LEAD_CREATED',
    title: isTeaser ? 'Project Teaser Downloaded' : 'New Greenfield Lead Received',
    message: `${created.fullName} (${created.email || created.mobile}) ${isTeaser ? 'downloaded Teaser PDF for' : 'submitted project'} '${created.projectName}' (₹${created.totalCostCr || 0} Cr).`,
    userEmail: created.email,
    userName: created.fullName,
    projectName: created.projectName,
    metadata: { totalCostCr: created.totalCostCr, loanRequiredCr: created.loanRequiredCr, source: created.source },
  }).catch(() => {});

  sendLeadAssessmentConfirmationEmail(created).catch(() => {});
  return created;
};

export const getLeadById = async (id, requester = null) => {
  if (!requester) {
    const error = new Error('Authentication required to access lead record');
    error.statusCode = 401;
    throw error;
  }

  if (isDBConnected()) {
    try {
      const lead = await Lead.findById(id).lean();
      if (lead) {
        if (!canAccessLead(lead, requester)) {
          const error = new Error('Access denied. You do not have permission to view this lead.');
          error.statusCode = 403;
          throw error;
        }
        return lead;
      }
      const proj = await Project.findById(id).lean();
      if (proj) {
        const mapped = mapProjectToLead(proj);
        if (!canAccessLead(mapped, requester)) {
          const error = new Error('Access denied. You do not have permission to view this project.');
          error.statusCode = 403;
          throw error;
        }
        return mapped;
      }
    } catch (err) {
      if (err.statusCode) throw err;
    }
  }

  let found = memoryLeads.find((l) => String(l._id) === String(id));
  if (!found) {
    const memProj = getMemoryProjects().find((p) => String(p._id) === String(id));
    if (memProj) found = mapProjectToLead(memProj);
  }
  if (!found) {
    const error = new Error('Lead not found');
    error.statusCode = 404;
    throw error;
  }
  if (!canAccessLead(found, requester)) {
    const error = new Error('Access denied. You do not have permission to view this lead.');
    error.statusCode = 403;
    throw error;
  }
  return found;
};

const applyUpdatesToProjectPayload = (updates) => {
  const mapped = {};
  if (updates.fullName !== undefined) mapped.promoterName = updates.fullName;
  if (updates.projectName !== undefined) mapped.projectName = updates.projectName;
  if (updates.industry !== undefined) mapped.industry = updates.industry;
  if (updates.location !== undefined) mapped.location = updates.location;
  if (updates.email !== undefined) mapped.email = updates.email;
  if (updates.mobile !== undefined || updates.phone !== undefined) mapped.mobile = updates.mobile ?? updates.phone;
  if (updates.totalCostCr !== undefined || updates.projectCost !== undefined) {
    mapped.capexCr = Number(updates.totalCostCr ?? updates.projectCost) || 0;
  }
  if (updates.loanRequiredCr !== undefined || updates.proposedLoan !== undefined) {
    mapped.loanCr = Number(updates.loanRequiredCr ?? updates.proposedLoan) || 0;
  }
  if (updates.promoterContribCr !== undefined) mapped.equityCr = Number(updates.promoterContribCr) || 0;
  if (updates.dscrEstimate !== undefined || updates.dscr !== undefined) {
    mapped.dscr = Number(updates.dscrEstimate ?? updates.dscr) || 0;
  }
  if (updates.feasibilityScore !== undefined) mapped.feasibilityScore = Number(updates.feasibilityScore) || 0;
  if (updates.bankabilityRating !== undefined) mapped.bankabilityRating = updates.bankabilityRating;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.assignedCA !== undefined) mapped.assignedCA = updates.assignedCA;
  if (updates.dprAssignedTo !== undefined) mapped.dprAssignedTo = updates.dprAssignedTo;
  if (updates.consultationAssignedTo !== undefined) mapped.consultationAssignedTo = updates.consultationAssignedTo;
  if (updates.assignedBank !== undefined || updates.bankName !== undefined) {
    mapped.assignedBank = updates.assignedBank ?? updates.bankName;
  }
  if (updates.caReviewNotes !== undefined || updates.notes !== undefined) {
    mapped.caReviewNotes = updates.caReviewNotes ?? updates.notes;
  }
  if (updates.promotersList !== undefined) mapped.promotersList = updates.promotersList;
  if (updates.customCostComponents !== undefined) mapped.costComponents = updates.customCostComponents;
  if (updates.meansOfFinance !== undefined) mapped.meansOfFinance = updates.meansOfFinance;
  if (updates.checklistUploaded !== undefined) mapped.checklistUploaded = Boolean(updates.checklistUploaded);
  if (updates.checklistFileName !== undefined) mapped.checklistFileName = updates.checklistFileName;
  if (updates.documents !== undefined) mapped.documents = updates.documents;
  if (updates.isFunded !== undefined) mapped.isFunded = Boolean(updates.isFunded);
  return mapped;
};

export const updateLead = async (id, rawUpdates, requester = null) => {
  if (requester?.role === 'superadmin') {
    const error = new Error('Super Admin has view-only permissions. Modifying data requires an Admin account.');
    error.statusCode = 403;
    throw error;
  }

  const updates = { ...rawUpdates };
  delete updates._id;
  delete updates.id;
  const isAdmin = isSuperAdminOrAdmin(requester?.role, requester?.email);
  if (!isAdmin) {
    delete updates.userId;
    delete updates.assignedCA;
    delete updates.assignedTeam;
    delete updates.assignedRole;
    delete updates.dprAssignedTo;
    delete updates.consultationAssignedTo;
    delete updates.adminVisibilityConfirmed;
    delete updates.isFunded;
  }

  const normEmail = (updates.email || '').trim().toLowerCase();
  const normProject = (updates.projectName || '').trim().toLowerCase();

  if (isDBConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const lead = await Lead.findById(id);
        if (lead) {
          if (!canAccessLead(lead, requester)) {
            const error = new Error('Access denied. You do not have permission to update this lead.');
            error.statusCode = 403;
            throw error;
          }
          const prevSnap = {
            status: lead.status,
            dprAssignedTo: lead.dprAssignedTo,
            dprCompleted: lead.dprCompleted,
            email: lead.email,
            fullName: lead.fullName,
            projectName: lead.projectName,
          };
          Object.assign(lead, updates);
          lead.updatedAt = new Date();
          const savedLead = await lead.save();
          notifyDprMilestoneIfNeeded(prevSnap, savedLead);
          return savedLead;
        }

        const proj = await Project.findById(id);
        if (proj) {
          if (!canAccessLead(mapProjectToLead(proj), requester)) {
            const error = new Error('Access denied. You do not have permission to update this project.');
            error.statusCode = 403;
            throw error;
          }
          const prevSnap = mapProjectToLead(proj.toObject());
          Object.assign(proj, applyUpdatesToProjectPayload(updates));
          const savedProj = await proj.save();
          const mappedSaved = mapProjectToLead(savedProj.toObject());
          notifyDprMilestoneIfNeeded(prevSnap, mappedSaved);
          return mappedSaved;
        }
      }

      if (normEmail && normProject) {
        const existing = await Lead.findOne({
          email: { $regex: new RegExp(`^${escapeRegex(normEmail)}$`, 'i') },
          projectName: { $regex: new RegExp(`^${escapeRegex(normProject)}$`, 'i') },
        });
        if (existing) {
          if (!canAccessLead(existing, requester)) {
            const error = new Error('Access denied. You do not have permission to update this lead.');
            error.statusCode = 403;
            throw error;
          }
          const prevSnap = {
            status: existing.status,
            dprAssignedTo: existing.dprAssignedTo,
            dprCompleted: existing.dprCompleted,
            email: existing.email,
            fullName: existing.fullName,
            projectName: existing.projectName,
          };
          Object.assign(existing, updates);
          existing.updatedAt = new Date();
          const savedExisting = await existing.save();
          notifyDprMilestoneIfNeeded(prevSnap, savedExisting);
          return savedExisting;
        }
      }
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('MongoDB updateLead error, attempting fallback:', err.message);
    }
  }

  const idx = memoryLeads.findIndex((l) => String(l._id) === String(id) || String(l.id) === String(id));
  if (idx !== -1) {
    if (!canAccessLead(memoryLeads[idx], requester)) {
      const error = new Error('Access denied. You do not have permission to update this lead.');
      error.statusCode = 403;
      throw error;
    }
    const prevSnap = { ...memoryLeads[idx] };
    memoryLeads[idx] = { ...memoryLeads[idx], ...updates, updatedAt: new Date() };
    notifyDprMilestoneIfNeeded(prevSnap, memoryLeads[idx]);
    return memoryLeads[idx];
  }

  const memProjects = getMemoryProjects();
  const projIdx = memProjects.findIndex((p) => String(p._id) === String(id) || String(p.id) === String(id));
  if (projIdx !== -1) {
    if (!canAccessLead(mapProjectToLead(memProjects[projIdx]), requester)) {
      const error = new Error('Access denied. You do not have permission to update this project.');
      error.statusCode = 403;
      throw error;
    }
    const prevSnap = mapProjectToLead(memProjects[projIdx]);
    memProjects[projIdx] = {
      ...memProjects[projIdx],
      ...applyUpdatesToProjectPayload(updates),
      updatedAt: new Date(),
    };
    const mappedSaved = mapProjectToLead(memProjects[projIdx]);
    notifyDprMilestoneIfNeeded(prevSnap, mappedSaved);
    return mappedSaved;
  }

  const error = new Error('Lead not found');
  error.statusCode = 404;
  throw error;
};

export const assignLead = async (id, { dprAssignedTo, consultationAssignedTo }, requester) => {
  if (requester?.role === 'superadmin') {
    const error = new Error('Super Admin has view-only permissions. Team assignment requires an Admin account.');
    error.statusCode = 403;
    throw error;
  }
  if (!['admin', 'admin1', 'admin2', 'admin3'].includes(requester?.role) && !isAuthorizedAdminEmail(requester?.email)) {
    const error = new Error('Only an Admin can assign project work');
    error.statusCode = 403;
    throw error;
  }

  if (isDBConnected()) {
    const lead = await Lead.findById(id).catch(() => null);
    if (lead) {
      const prevSnap = {
        status: lead.status,
        dprAssignedTo: lead.dprAssignedTo,
        dprCompleted: lead.dprCompleted,
        email: lead.email,
        fullName: lead.fullName,
        projectName: lead.projectName,
      };
      if (dprAssignedTo !== undefined) lead.dprAssignedTo = dprAssignedTo;
      if (consultationAssignedTo !== undefined) {
        lead.consultationAssignedTo = consultationAssignedTo;
        if (consultationAssignedTo) lead.consultationStatus = 'New';
      }
      lead.assignedAt = new Date().toISOString();
      const savedLead = await lead.save();
      notifyDprMilestoneIfNeeded(prevSnap, savedLead);
      return savedLead;
    }

    const proj = await Project.findById(id).catch(() => null);
    if (proj) {
      const prevSnap = mapProjectToLead(proj.toObject());
      if (dprAssignedTo !== undefined) proj.dprAssignedTo = dprAssignedTo;
      if (consultationAssignedTo !== undefined) proj.consultationAssignedTo = consultationAssignedTo;
      const saved = await proj.save();
      const mappedSaved = mapProjectToLead(saved.toObject());
      notifyDprMilestoneIfNeeded(prevSnap, mappedSaved);
      return mappedSaved;
    }
  }

  const idx = memoryLeads.findIndex((l) => String(l._id) === String(id) || String(l.id) === String(id));
  if (idx !== -1) {
    const prevSnap = { ...memoryLeads[idx] };
    if (dprAssignedTo !== undefined) memoryLeads[idx].dprAssignedTo = dprAssignedTo;
    if (consultationAssignedTo !== undefined) {
      memoryLeads[idx].consultationAssignedTo = consultationAssignedTo;
      if (consultationAssignedTo) memoryLeads[idx].consultationStatus = 'New';
    }
    memoryLeads[idx].assignedAt = new Date().toISOString();
    memoryLeads[idx].updatedAt = new Date();
    notifyDprMilestoneIfNeeded(prevSnap, memoryLeads[idx]);
    return memoryLeads[idx];
  }

  const memProjects = getMemoryProjects();
  const projIdx = memProjects.findIndex((p) => String(p._id) === String(id) || String(p.id) === String(id));
  if (projIdx !== -1) {
    const prevSnap = mapProjectToLead(memProjects[projIdx]);
    if (dprAssignedTo !== undefined) memProjects[projIdx].dprAssignedTo = dprAssignedTo;
    if (consultationAssignedTo !== undefined) memProjects[projIdx].consultationAssignedTo = consultationAssignedTo;
    memProjects[projIdx].updatedAt = new Date();
    const mappedSaved = mapProjectToLead(memProjects[projIdx]);
    notifyDprMilestoneIfNeeded(prevSnap, mappedSaved);
    return mappedSaved;
  }

  const error = new Error('Lead not found');
  error.statusCode = 404;
  throw error;
};

export const updateLeadProgress = async (id, progress, requester) => {
  if (requester?.role === 'superadmin') {
    const error = new Error('Super Admin has view-only permissions. Modifying progress requires an Admin account.');
    error.statusCode = 403;
    throw error;
  }
  const fields = ['assessmentCompleted', 'documentsUploaded', 'dprCompleted', 'bankApplicationSubmitted', 'isFunded'];

  if (isDBConnected()) {
    const lead = await Lead.findById(id).catch(() => null);
    if (lead) {
      if (!canAccessLead(lead, requester)) {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
      }
      const prevSnap = {
        status: lead.status,
        dprAssignedTo: lead.dprAssignedTo,
        dprCompleted: lead.dprCompleted,
        email: lead.email,
        fullName: lead.fullName,
        projectName: lead.projectName,
      };
      fields.forEach((field) => {
        if (progress[field] !== undefined) lead[field] = Boolean(progress[field]);
      });
      if (lead.bankApplicationSubmitted) lead.bankAppliedAt = lead.bankAppliedAt || new Date().toISOString();
      if (lead.isFunded) lead.fundingDisbursedAt = lead.fundingDisbursedAt || new Date().toISOString();
      lead.successProbability = lead.isFunded
        ? 100
        : 25 + (lead.assessmentCompleted ? 15 : 0) + (lead.documentsUploaded ? 15 : 0) + (lead.dprCompleted ? 20 : 0) + (lead.bankApplicationSubmitted ? 25 : 0);
      const savedLead = await lead.save();
      notifyDprMilestoneIfNeeded(prevSnap, savedLead);
      return savedLead;
    }

    const proj = await Project.findById(id).catch(() => null);
    if (proj) {
      if (!canAccessLead(mapProjectToLead(proj), requester)) {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
      }
      if (progress.isFunded !== undefined) proj.isFunded = Boolean(progress.isFunded);
      if (progress.documentsUploaded !== undefined) proj.documentsUploaded = Boolean(progress.documentsUploaded);
      const saved = await proj.save();
      return mapProjectToLead(saved.toObject());
    }
  }

  const idx = memoryLeads.findIndex((l) => String(l._id) === String(id) || String(l.id) === String(id));
  if (idx !== -1) {
    if (!canAccessLead(memoryLeads[idx], requester)) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    const prevSnap = { ...memoryLeads[idx] };
    fields.forEach((field) => {
      if (progress[field] !== undefined) memoryLeads[idx][field] = Boolean(progress[field]);
    });
    if (memoryLeads[idx].bankApplicationSubmitted) memoryLeads[idx].bankAppliedAt = memoryLeads[idx].bankAppliedAt || new Date().toISOString();
    if (memoryLeads[idx].isFunded) memoryLeads[idx].fundingDisbursedAt = memoryLeads[idx].fundingDisbursedAt || new Date().toISOString();
    memoryLeads[idx].successProbability = memoryLeads[idx].isFunded
      ? 100
      : 25 + (memoryLeads[idx].assessmentCompleted ? 15 : 0) + (memoryLeads[idx].documentsUploaded ? 15 : 0) + (memoryLeads[idx].dprCompleted ? 20 : 0) + (memoryLeads[idx].bankApplicationSubmitted ? 25 : 0);
    memoryLeads[idx].updatedAt = new Date();
    notifyDprMilestoneIfNeeded(prevSnap, memoryLeads[idx]);
    return memoryLeads[idx];
  }

  const memProjects = getMemoryProjects();
  const projIdx = memProjects.findIndex((p) => String(p._id) === String(id) || String(p.id) === String(id));
  if (projIdx !== -1) {
    if (!canAccessLead(mapProjectToLead(memProjects[projIdx]), requester)) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    if (progress.isFunded !== undefined) memProjects[projIdx].isFunded = Boolean(progress.isFunded);
    if (progress.documentsUploaded !== undefined) memProjects[projIdx].documentsUploaded = Boolean(progress.documentsUploaded);
    memProjects[projIdx].updatedAt = new Date();
    return mapProjectToLead(memProjects[projIdx]);
  }

  const error = new Error('Project not found');
  error.statusCode = 404;
  throw error;
};

export const deleteLead = async (id, requester) => {
  if (requester?.role === 'superadmin') {
    const error = new Error('Super Admin has view-only permissions. Deletion requires an Admin account.');
    error.statusCode = 403;
    throw error;
  }
  if (isDBConnected()) {
    try {
      const lead = await Lead.findByIdAndDelete(id);
      if (lead) return lead;
      const proj = await Project.findByIdAndDelete(id);
      if (proj) return proj;
    } catch (err) {}
  }
  const idx = memoryLeads.findIndex((l) => String(l._id) === String(id));
  if (idx !== -1) {
    return memoryLeads.splice(idx, 1)[0];
  }
  const memProjects = getMemoryProjects();
  const projIdx = memProjects.findIndex((p) => String(p._id) === String(id));
  if (projIdx !== -1) {
    return memProjects.splice(projIdx, 1)[0];
  }
  const error = new Error('Lead not found');
  error.statusCode = 404;
  throw error;
};

export const clearAllLeads = async (requester) => {
  if (requester?.role === 'superadmin') {
    const error = new Error('Super Admin has view-only permissions. Clearing leads requires an Admin account.');
    error.statusCode = 403;
    throw error;
  }
  if (isDBConnected()) {
    try {
      await Lead.deleteMany({});
    } catch (err) {}
  }
  memoryLeads = [];
  return { message: 'All leads cleared successfully' };
};

export const requestPromoterFundAssistance = async (payload = {}, requester = null) => {
  const cleanEmail = normalizeEmail(payload.email || requester?.email);
  const cleanName = String(payload.fullName || requester?.name || 'Promoter').trim();
  const cleanMobile = String(payload.mobile || payload.phone || requester?.phone || '9999999999').trim();
  const projectName = String(payload.projectName || 'Greenfield Project').trim();
  const clientProjectId = String(payload.clientProjectId || '').trim();
  const existingRecordId = String(payload.projectId || payload.leadId || '').trim();
  const requiredAmountCr = String(payload.requiredAmountCr || '').trim();
  const assistanceType = String(payload.assistanceType || 'Equity Co-Investment / Angel Syndication').trim();
  const notes = String(payload.notes || '').trim();

  const requestObj = {
    requiredAmountCr,
    assistanceType,
    notes,
    tagged: true,
    tagLabel: 'Promoter Fund Assistance',
    submittedAt: new Date().toISOString(),
  };

  let leadRecord = null;
  let leadOwnerEmail = String(payload.leadOwnerEmail || '').trim().toLowerCase();

  if (isDBConnected()) {
    try {
      if (existingRecordId && mongoose.Types.ObjectId.isValid(existingRecordId)) {
        leadRecord = await Lead.findById(existingRecordId);
      }
      if (!leadRecord && clientProjectId) {
        leadRecord = await Lead.findOne({ clientProjectId });
      }
      if (!leadRecord && cleanEmail) {
        leadRecord = await Lead.findOne({ email: cleanEmail }).sort({ updatedAt: -1 });
      }

      if (leadRecord) {
        const ownerCandidates = [
          leadRecord.assignedCA,
          leadRecord.consultationAssignedTo,
          leadRecord.dprAssignedTo,
        ].filter((v) => v && String(v).includes('@'));
        if (!leadOwnerEmail && ownerCandidates.length > 0) {
          leadOwnerEmail = String(ownerCandidates[0]).trim().toLowerCase();
        }
        const tags = Array.isArray(leadRecord.leadTags) ? [...leadRecord.leadTags] : [];
        if (!tags.includes('Promoter Fund Assistance')) tags.push('Promoter Fund Assistance');

        leadRecord.promoterContributionAvailable = 'No';
        leadRecord.promoterFundAssistanceStatus = 'Request Submitted (Tagged)';
        leadRecord.promoterFundAssistanceTagged = true;
        leadRecord.promoterFundAssistanceRequest = requestObj;
        leadRecord.leadTags = tags;
        await leadRecord.save();
      } else {
        leadRecord = await Lead.create({
          userId: requester?._id || undefined,
          clientProjectId,
          fullName: cleanName,
          mobile: cleanMobile,
          email: cleanEmail || 'promoter@inisio.in',
          projectName,
          industry: payload.industry || '',
          location: payload.location || '',
          totalCostCr: payload.totalCostCr || '',
          loanRequiredCr: payload.loanRequiredCr || '',
          promoterContribCr: payload.promoterContribCr || '',
          source: 'Promoter Fund Assistance Request',
          status: 'Promoter Fund Assistance Tagged',
          promoterContributionAvailable: 'No',
          promoterFundAssistanceStatus: 'Request Submitted (Tagged)',
          promoterFundAssistanceTagged: true,
          promoterFundAssistanceRequest: requestObj,
          leadTags: ['Promoter Fund Assistance'],
          notes: `Equity Support Needed: ₹${requiredAmountCr} Cr (${assistanceType})`,
        });
      }
    } catch (err) {
      console.warn('[LeadService] DB error in requestPromoterFundAssistance:', err.message);
    }
  }

  if (!leadRecord) {
    const idx = memoryLeads.findIndex(
      (l) =>
        (existingRecordId && String(l._id) === existingRecordId) ||
        (clientProjectId && l.clientProjectId === clientProjectId) ||
        (cleanEmail && normalizeEmail(l.email) === cleanEmail)
    );

    if (idx !== -1) {
      const existing = memoryLeads[idx];
      const ownerCandidates = [
        existing.assignedCA,
        existing.consultationAssignedTo,
        existing.dprAssignedTo,
      ].filter((v) => v && String(v).includes('@'));
      if (!leadOwnerEmail && ownerCandidates.length > 0) {
        leadOwnerEmail = String(ownerCandidates[0]).trim().toLowerCase();
      }
      const tags = Array.isArray(existing.leadTags) ? [...existing.leadTags] : [];
      if (!tags.includes('Promoter Fund Assistance')) tags.push('Promoter Fund Assistance');
      memoryLeads[idx] = {
        ...existing,
        promoterContributionAvailable: 'No',
        promoterFundAssistanceStatus: 'Request Submitted (Tagged)',
        promoterFundAssistanceTagged: true,
        promoterFundAssistanceRequest: requestObj,
        leadTags: tags,
        updatedAt: new Date(),
      };
      leadRecord = memoryLeads[idx];
    } else {
      leadRecord = {
        _id: `lead_pfa_${Date.now()}`,
        userId: requester?._id || null,
        clientProjectId,
        fullName: cleanName,
        mobile: cleanMobile,
        email: cleanEmail || 'promoter@inisio.in',
        projectName,
        source: 'Promoter Fund Assistance Request',
        status: 'Promoter Fund Assistance Tagged',
        promoterContributionAvailable: 'No',
        promoterFundAssistanceStatus: 'Request Submitted (Tagged)',
        promoterFundAssistanceTagged: true,
        promoterFundAssistanceRequest: requestObj,
        leadTags: ['Promoter Fund Assistance'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryLeads.unshift(leadRecord);
    }
  }

  if (!leadOwnerEmail) {
    leadOwnerEmail = (process.env.ADMIN_EMAIL || config.ADMIN_EMAIL || '').trim().toLowerCase();
  }

  await notificationService.createNotification({
    type: 'PROMOTER_FUND_ASSISTANCE',
    title: 'Tagged Lead: Promoter Fund Assistance',
    message: `${cleanName} requested ₹${requiredAmountCr} Cr equity support (${assistanceType}) for ${projectName}. Separate notifications sent to Promoter & Lead Owner.`,
    userEmail: cleanEmail,
    userName: cleanName,
    projectName,
  }).catch(() => {});

  const emailResult = await sendPromoterFundAssistanceEmails({
    promoterEmail: cleanEmail,
    promoterName: cleanName,
    promoterPhone: cleanMobile,
    leadOwnerEmail,
    projectName,
    requiredAmountCr,
    assistanceType,
    notes,
  }).catch(() => ({ dispatchedCount: 0 }));

  return {
    lead: leadRecord,
    tagged: true,
    tag: 'Promoter Fund Assistance',
    emailDispatch: emailResult,
  };
};

export default {
  getMemoryLeads,
  getAllLeads,
  createLead,
  getLeadById,
  updateLead,
  assignLead,
  updateLeadProgress,
  deleteLead,
  clearAllLeads,
  requestPromoterFundAssistance,
};

import Project from '../models/Project.js';
import notificationService from './notificationService.js';
import { isDBConnected } from '../config/db.js';
import config from '../config/env.js';
import { escapeRegex } from '../middleware/validateMiddleware.js';
import { sendDprStatusEmail } from '../utils/emailService.js';
import {
  checkUserAssessmentQuota,
  createQuotaExceededError,
  normalizeEmail,
  normalizeMobile10,
} from '../utils/assessmentQuota.js';

let memoryProjects = [];

export const getMemoryProjects = () => memoryProjects;

const PRIVILEGED_PROJECT_ROLES = new Set([
  'admin',
  'superadmin',
  'ca',
  'dpr',
  'dpr_consultant',
  'prosync',
  'prosync_admin',
  'admin1',
  'admin2',
  'admin3',
]);

const DPR_STATUS_MILESTONES = new Set([
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

const notifyProjectDprUpdate = (previous = {}, updated = {}) => {
  try {
    const prevStatus = String(previous?.status || '').trim();
    const nextStatus = String(updated?.status || '').trim();
    const prevAssigned = String(previous?.dprAssignedTo || '').trim();
    const nextAssigned = String(updated?.dprAssignedTo || '').trim();

    const normNext = nextStatus.toLowerCase();
    const statusHit =
      Boolean(nextStatus) &&
      normNext !== prevStatus.toLowerCase() &&
      (DPR_STATUS_MILESTONES.has(normNext) || normNext.includes('dpr'));
    const assignedHit = Boolean(nextAssigned) && nextAssigned.toLowerCase() !== prevAssigned.toLowerCase();

    if (!statusHit && !assignedHit) return;

    const projectName = updated?.projectName || previous?.projectName || 'Greenfield Project';
    const promoterEmail = String(updated?.email || previous?.email || '').trim();
    const promoterName = updated?.promoterName || previous?.promoterName || 'Promoter';
    const displayStatus = statusHit ? nextStatus : 'DPR Assigned';
    const note = updated?.caReviewNotes || '';

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

    if (assignedHit && nextAssigned.includes('@')) {
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

    if (statusHit && normNext.includes('requested')) {
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
    console.warn('[ProjectService] DPR email notification notice:', err.message);
  }
};

export const getProjects = async (filter = {}, userRole = 'admin', userId = null, userEmail = null) => {
  if (userRole === 'user' && !userId && !userEmail) {
    return [];
  }

  const limit = Math.min(100, Math.max(1, parseInt(filter.limit || '100', 10)));
  const page = Math.max(1, parseInt(filter.page || '1', 10));
  const skip = (page - 1) * limit;

  if (isDBConnected()) {
    try {
      const andClauses = [];

      if (userRole === 'user') {
        const ownerOr = [];
        if (userId) ownerOr.push({ userId });
        if (userEmail) ownerOr.push({ email: { $regex: new RegExp(`^${escapeRegex(userEmail.trim())}$`, 'i') } });
        if (ownerOr.length > 0) andClauses.push({ $or: ownerOr });
      } else if (!PRIVILEGED_PROJECT_ROLES.has(userRole)) {
        return [];
      }

      if (filter.email) {
        andClauses.push({ email: { $regex: new RegExp(`^${escapeRegex(filter.email.trim())}$`, 'i') } });
      }
      if (filter.status) {
        andClauses.push({ status: { $regex: new RegExp(`^${escapeRegex(filter.status.trim())}$`, 'i') } });
      }
      if (filter.search) {
        const safeSearch = escapeRegex(filter.search.trim());
        andClauses.push({
          $or: [
            { projectName: { $regex: safeSearch, $options: 'i' } },
            { promoterName: { $regex: safeSearch, $options: 'i' } },
            { industry: { $regex: safeSearch, $options: 'i' } },
            { location: { $regex: safeSearch, $options: 'i' } },
            { email: { $regex: safeSearch, $options: 'i' } },
          ],
        });
      }

      const query = andClauses.length > 1 ? { $and: andClauses } : andClauses[0] || {};
      const projects = await Project.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean();
      return projects;
    } catch (err) {
      console.warn('MongoDB query failed in getProjects, using memory fallback:', err.message);
    }
  }

  // Memory fallback filtering
  let results = [...memoryProjects];
  if (userRole === 'user') {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    results = results.filter(
      (p) =>
        (userId && String(p.userId) === String(userId)) ||
        (cleanEmail && p.email && p.email.toLowerCase().trim() === cleanEmail)
    );
  } else if (!PRIVILEGED_PROJECT_ROLES.has(userRole)) {
    return [];
  }

  if (filter.email) {
    const em = filter.email.toLowerCase().trim();
    results = results.filter((p) => p.email && p.email.toLowerCase().trim() === em);
  }
  if (filter.status) {
    const st = filter.status.toLowerCase().trim();
    results = results.filter((p) => (p.status || '').toLowerCase().trim() === st);
  }
  if (filter.search) {
    const s = filter.search.toLowerCase().trim();
    results = results.filter(
      (p) =>
        (p.projectName && p.projectName.toLowerCase().includes(s)) ||
        (p.promoterName && p.promoterName.toLowerCase().includes(s)) ||
        (p.industry && p.industry.toLowerCase().includes(s)) ||
        (p.location && p.location.toLowerCase().includes(s)) ||
        (p.email && p.email.toLowerCase().includes(s))
    );
  }

  return results
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
    .slice(skip, skip + limit);
};

export const createProject = async (rawProjectData, userOrId = null, explicitRole = null) => {
  const userObj =
    userOrId && typeof userOrId === 'object' && (userOrId._id || userOrId.email || userOrId.role)
      ? userOrId
      : null;
  const userId = userObj ? userObj._id : userOrId || null;
  const userRole = explicitRole || userObj?.role || 'user';

  const projectData = { ...rawProjectData };
  const clientProjectId = String(projectData.clientProjectId || '').trim();
  const existingRecordId = String(projectData._id || projectData.id || '').trim();
  delete projectData._id;
  delete projectData.id;

  const isPrivileged = ['admin', 'admin1', 'admin2', 'admin3', 'superadmin'].includes(userRole);
  if (!isPrivileged) {
    delete projectData.status;
    delete projectData.assignedCA;
    delete projectData.assignedBank;
    delete projectData.caReviewNotes;
    delete projectData.dprAssignedTo;
    delete projectData.consultationAssignedTo;
    delete projectData.isFunded;
  }

  const cleanEmail = normalizeEmail(userObj?.email || projectData.email);
  const cleanMobile = projectData.mobile || userObj?.phone || '';

  // Server-side 1-free-assessment quota enforcement
  const quota = await checkUserAssessmentQuota({
    user: userObj,
    email: cleanEmail,
    mobile: normalizeMobile10(cleanMobile),
    clientProjectId,
    existingRecordId,
    memoryProjects,
  });

  if (!quota.allowed) {
    throw createQuotaExceededError(quota);
  }

  const normalizedPayload = {
    location: 'India',
    equityCr: 0,
    dscr: 0,
    feasibilityScore: 0,
    bankabilityRating: '',
    subsidyEligible: false,
    status: 'Pending Audit',
    caReviewNotes: '',
    assignedCA: '',
    dprAssignedTo: '',
    consultationAssignedTo: '',
    uploadedDocuments: [],
    documentsUploaded: false,
    assignedBank: '',
    promotersList: [],
    costComponents: [],
    meansOfFinance: null,
    checklistUploaded: false,
    checklistFileName: '',
    documents: {},
    isFunded: false,
    ...projectData,
    clientProjectId,
    email: cleanEmail || projectData.email || '',
    mobile: cleanMobile,
    userId: userId || null,
  };

  if (isDBConnected()) {
    try {
      // Idempotent upsert by clientProjectId so re-saves never duplicate rows
      if (clientProjectId) {
        const existingProject = await Project.findOne({ clientProjectId });
        if (existingProject) {
          Object.assign(existingProject, {
            ...projectData,
            clientProjectId,
            email: cleanEmail || existingProject.email,
            mobile: cleanMobile || existingProject.mobile,
            ...(userId ? { userId } : {}),
          });
          await existingProject.save();
          return existingProject;
        }
      }

      const project = await Project.create(normalizedPayload);

      await notificationService.createNotification({
        type: 'PROJECT_MODIFIED',
        title: 'New Greenfield Project Created',
        message: `${project.promoterName || 'Promoter'} (${project.email || 'N/A'}) created project '${project.projectName}' (₹${project.capexCr} Cr).`,
        userEmail: project.email,
        userName: project.promoterName,
        projectName: project.projectName,
        metadata: { capexCr: project.capexCr, loanCr: project.loanCr, status: project.status },
      }).catch(() => {});

      return project;
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('MongoDB create failed in createProject, using memory fallback:', err.message);
    }
  }

  // Memory fallback idempotent upsert
  if (clientProjectId) {
    const existingIdx = memoryProjects.findIndex(
      (p) => p.clientProjectId && p.clientProjectId === clientProjectId
    );
    if (existingIdx !== -1) {
      memoryProjects[existingIdx] = {
        ...memoryProjects[existingIdx],
        ...projectData,
        clientProjectId,
        email: cleanEmail || memoryProjects[existingIdx].email,
        mobile: cleanMobile || memoryProjects[existingIdx].mobile,
        ...(userId ? { userId } : {}),
        updatedAt: new Date(),
      };
      return memoryProjects[existingIdx];
    }
  }

  const created = {
    _id: `proj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ...normalizedPayload,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryProjects.unshift(created);

  await notificationService.createNotification({
    type: 'PROJECT_MODIFIED',
    title: 'New Greenfield Project Created',
    message: `${created.promoterName || 'Promoter'} (${created.email || 'N/A'}) created project '${created.projectName}' (₹${created.capexCr} Cr).`,
    userEmail: created.email,
    userName: created.promoterName,
    projectName: created.projectName,
    metadata: { capexCr: created.capexCr, loanCr: created.loanCr, status: created.status },
  }).catch(() => {});

  return created;
};

export const getProjectById = async (id, requester = null) => {
  if (!requester) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
  let project = null;
  if (isDBConnected()) {
    try {
      project = await Project.findById(id).lean();
    } catch (err) {}
  }
  if (!project) {
    project = memoryProjects.find((p) => String(p._id) === String(id));
  }
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check (prevent IDOR)
  const isPrivileged = PRIVILEGED_PROJECT_ROLES.has(requester.role);
  const isOwner =
    String(project.userId || '') === String(requester._id || '') ||
    Boolean(project.email && requester.email && project.email.toLowerCase() === requester.email.toLowerCase());
  if (!isPrivileged && !isOwner) {
    const error = new Error('Access denied: You are not authorized to view this project.');
    error.statusCode = 403;
    throw error;
  }
  return project;
};

export const updateProject = async (id, rawUpdates = {}, requester = null) => {
  if (requester?.role === 'superadmin') {
    const error = new Error('Super Admin has view-only permissions. Modifying data requires an Admin account.');
    error.statusCode = 403;
    throw error;
  }

  const updates = { ...rawUpdates };
  delete updates._id;
  delete updates.id;

  const allowedFields = [
    'promoterName',
    'projectName',
    'industry',
    'location',
    'email',
    'mobile',
    'capexCr',
    'loanCr',
    'equityCr',
    'dscr',
    'feasibilityScore',
    'bankabilityRating',
    'subsidyEligible',
    'status',
    'caReviewNotes',
    'assignedCA',
    'dprAssignedTo',
    'consultationAssignedTo',
    'uploadedDocuments',
    'dprFile',
    'cmaFile',
    'documentsUploaded',
    'assignedBank',
    'sanctionDate',
    'promotersList',
    'costComponents',
    'meansOfFinance',
    'checklistUploaded',
    'checklistFileName',
    'documents',
    'isFunded',
  ];

  const sanitizedUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      sanitizedUpdates[field] = updates[field];
    }
  }

  if (isDBConnected()) {
    try {
      const project = await Project.findById(id);
      if (project) {
        const prevSnap = {
          status: project.status,
          dprAssignedTo: project.dprAssignedTo,
          email: project.email,
          promoterName: project.promoterName,
          projectName: project.projectName,
        };
        Object.assign(project, sanitizedUpdates);
        const saved = await project.save();
        notifyProjectDprUpdate(prevSnap, saved);
        return saved;
      }
    } catch (err) {
      if (err.name === 'ValidationError') {
        err.statusCode = 400;
        throw err;
      }
    }
  }

  const idx = memoryProjects.findIndex((p) => String(p._id) === String(id));
  if (idx === -1) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const prevSnap = { ...memoryProjects[idx] };
  memoryProjects[idx] = {
    ...memoryProjects[idx],
    ...sanitizedUpdates,
    updatedAt: new Date(),
  };
  notifyProjectDprUpdate(prevSnap, memoryProjects[idx]);
  return memoryProjects[idx];
};

export const updateProjectAudit = async (id, status, caReviewNotes, assignedCA, updates = {}) => {
  const merged = { ...updates };
  if (status !== undefined) merged.status = status;
  if (caReviewNotes !== undefined) merged.caReviewNotes = caReviewNotes;
  if (assignedCA !== undefined) merged.assignedCA = assignedCA;

  return updateProject(id, merged, null);
};

export const deleteProject = async (id) => {
  if (isDBConnected()) {
    try {
      const project = await Project.findByIdAndDelete(id);
      if (project) return project;
    } catch (err) {}
  }
  const idx = memoryProjects.findIndex((p) => String(p._id) === String(id));
  if (idx === -1) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }
  const removed = memoryProjects.splice(idx, 1)[0];
  return removed;
};

export default {
  getMemoryProjects,
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  updateProjectAudit,
  deleteProject,
};


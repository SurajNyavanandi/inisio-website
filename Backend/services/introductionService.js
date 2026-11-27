import mongoose from 'mongoose';
import IntroductionRequest from '../models/IntroductionRequest.js';
import { isDBConnected } from '../config/db.js';
import { sendConsultationConfirmationEmail } from '../utils/emailService.js';
import notificationService from './notificationService.js';
import leadService from './leadService.js';
import {
  resolveUserMembership,
  normalizeEmail,
} from '../utils/assessmentQuota.js';
import { resolvePlanDefinition } from '../utils/membershipPlans.js';

let memoryIntroductions = [];

export const getMemoryIntroductions = () => memoryIntroductions;

const VALID_TRACKING_STATUSES = [
  'Submitted',
  'Contacted',
  'Discussion',
  'Engagement / Closed',
  'Unavailable / Cancelled',
];

export const getUserIntroductionCounts = async ({ user, email }) => {
  const cleanEmail = normalizeEmail(user?.email || email);
  const userId = user?._id || user?.id || null;

  let records = [];
  if (isDBConnected() && (userId || cleanEmail)) {
    try {
      const orCond = [];
      if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
        orCond.push({ userId: new mongoose.Types.ObjectId(String(userId)) });
      }
      if (cleanEmail) {
        orCond.push({ userEmail: cleanEmail });
      }
      records = await IntroductionRequest.find({ $or: orCond }).sort({ createdAt: -1 }).lean();
    } catch (err) {
      console.warn('[introductionService] DB lookup warning:', err.message);
    }
  } else {
    records = memoryIntroductions.filter(
      (r) =>
        (userId && String(r.userId || '') === String(userId)) ||
        (cleanEmail && normalizeEmail(r.userEmail) === cleanEmail)
    );
  }

  // Condition #4: Do not count an unsuccessful or unavailable consultant match as a fulfilled introduction.
  // Condition #5: Maintain separate tracking for Prosync introductions and independent consultant introductions.
  const counted = records.filter(
    (r) => r.countedAgainstQuota !== false && r.status !== 'Unavailable / Cancelled'
  );

  const prosyncRecords = counted.filter((r) => Boolean(r.isProsync));
  const independentRecords = counted.filter((r) => !r.isProsync);

  const latestProsync = records.find((r) => Boolean(r.isProsync)) || null;

  return {
    records,
    totalCounted: counted.length,
    consultantUsed: independentRecords.length,
    prosyncUsed: prosyncRecords.length,
    prosyncStatus: latestProsync ? latestProsync.status : 'Not Requested',
  };
};

export const createIntroductionRequest = async (payload = {}, requester = null) => {
  const cleanEmail = normalizeEmail(requester?.email || payload.userEmail || payload.email);
  const userId = requester?._id || requester?.id || null;

  if (!cleanEmail) {
    const err = new Error('Please sign in to request a consultant introduction.');
    err.statusCode = 401;
    throw err;
  }

  if (payload.consentToShareProjectData !== true) {
    const err = new Error('Explicit consent is required before sharing project details with a consultant or Prosync.');
    err.statusCode = 400;
    throw err;
  }

  const membership = await resolveUserMembership({ user: requester, email: cleanEmail });
  const planDef = resolvePlanDefinition(membership.planId);
  const counts = await getUserIntroductionCounts({ user: requester, email: cleanEmail });

  const isProsync = Boolean(payload.isProsync) || String(payload.consultantName || '').toLowerCase().includes('prosync');

  const isPrivileged = ['admin', 'superadmin', 'ca_admin'].includes(String(requester?.role || '').toLowerCase());

  if (!isPrivileged) {
    if (!membership.hasPaidMembership || membership.statusLabel === 'Expired') {
      const err = new Error(
        membership.statusLabel === 'Expired'
          ? 'Your paid membership has expired. Renew or upgrade your membership plan to request consultant introductions.'
          : 'Consultant introductions require Promoter Boost (₹2,999) or Promoter Plus (₹9,999).'
      );
      err.statusCode = 403;
      err.code = 'MEMBERSHIP_UPGRADE_REQUIRED';
      throw err;
    }

    if (isProsync) {
      if (counts.prosyncUsed >= planDef.prosyncIntroLimit) {
        const err = new Error(
          `You have already used your ${planDef.prosyncIntroLimit} Prosync Consulting introduction under ${planDef.name}.`
        );
        err.statusCode = 403;
        err.code = 'PROSYNC_QUOTA_REACHED';
        throw err;
      }
    } else {
      const independentLimit = planDef.id === 'promoter_plus'
        ? Math.max(0, planDef.totalIntroLimit - counts.prosyncUsed)
        : planDef.consultantIntroLimit;

      if (counts.consultantUsed >= independentLimit || counts.totalCounted >= planDef.totalIntroLimit) {
        const err = new Error(
          `You have used all ${independentLimit} consultant introductions included in ${planDef.name}. Upgrade to Promoter Plus for additional introductions.`
        );
        err.statusCode = 403;
        err.code = 'CONSULTANT_QUOTA_REACHED';
        throw err;
      }
    }
  }

  const recordPayload = {
    userId: userId && mongoose.Types.ObjectId.isValid(String(userId)) ? userId : undefined,
    userEmail: cleanEmail,
    promoterName: payload.promoterName || requester?.name || 'Promoter',
    promoterPhone: payload.promoterPhone || requester?.phone || '',
    projectId: String(payload.projectId || ''),
    projectName: payload.projectName || 'Greenfield Project',
    projectLocation: payload.projectLocation || '',
    projectCostCr: String(payload.projectCostCr || ''),
    consultantId: String(payload.consultantId || ''),
    consultantName: payload.consultantName || (isProsync ? 'Prosync Consulting' : 'Independent Consultant'),
    consultantEmail: String(payload.consultantEmail || '').trim().toLowerCase(),
    consultantPhone: String(payload.consultantPhone || '').trim(),
    consultantCity: String(payload.consultantCity || '').trim(),
    consultantState: String(payload.consultantState || '').trim(),
    isProsync,
    serviceCategory: payload.serviceCategory || 'CMA & Financial Analysis',
    preferredDate: String(payload.preferredDate || ''),
    preferredSlot: String(payload.preferredSlot || 'Morning (10:00 AM - 1:00 PM)'),
    notes: String(payload.notes || ''),
    status: 'Submitted',
    callCenterStatus: 'Assigned to Call Center (Slot Confirmation & WhatsApp Handoff Pending)',
    whatsappSharedToConsultant: Boolean(payload.whatsappSharedToConsultant),
    countedAgainstQuota: true,
    consentToShareProjectData: true,
    consentAcceptedAt: new Date(),
    membershipPlanIdAtRequest: membership.planId,
  };

  let created = null;
  if (isDBConnected()) {
    try {
      created = await IntroductionRequest.create(recordPayload);
    } catch (err) {
      console.warn('[introductionService] DB create warning, using memory store:', err.message);
    }
  }

  if (!created) {
    created = {
      _id: `intro_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      ...recordPayload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryIntroductions.unshift(created);
  }

  // Generate/link Call Center Lead for follow-up & coordination
  try {
    await leadService.createLead({
      fullName: recordPayload.promoterName,
      mobile: recordPayload.promoterPhone || '9999999999',
      email: recordPayload.userEmail,
      projectName: recordPayload.projectName,
      location: recordPayload.projectLocation || recordPayload.consultantCity || 'India',
      totalCostCr: recordPayload.projectCostCr || '0',
      source: isProsync
        ? 'Prosync Featured Partner Introduction'
        : `Nearby CA / Consultant Connect (${recordPayload.serviceCategory})`,
      consultationStatus: 'In Progress',
      consultationNotes: `Consultant: ${recordPayload.consultantName} (${recordPayload.consultantCity || 'India'}) | Service: ${recordPayload.serviceCategory} | Preferred Slot: ${recordPayload.preferredDate || 'Flexible'} ${recordPayload.preferredSlot} | Call Center Workflow: Confirm time with both CA & Promoter and share details via WhatsApp.`,
    }, requester);
  } catch (leadErr) {
    console.warn('[introductionService] Lead sync notice:', leadErr.message);
  }

  await notificationService.createNotification({
    type: 'CONSULTANT_INTRODUCTION',
    title: isProsync ? 'Prosync Featured Introduction Requested' : 'Nearby Consultant Introduction Requested',
    message: `${recordPayload.promoterName} requested ${recordPayload.serviceCategory} introduction with ${recordPayload.consultantName} (${recordPayload.projectLocation || 'India'}). Call center confirmation required.`,
    userEmail: recordPayload.userEmail,
    userName: recordPayload.promoterName,
    projectName: recordPayload.projectName,
  }).catch(() => {});

  sendConsultationConfirmationEmail({
    to: recordPayload.userEmail,
    name: recordPayload.promoterName,
    phone: recordPayload.promoterPhone,
    projectCostCr: recordPayload.projectCostCr,
    preferredDate: recordPayload.preferredDate,
    preferredTime: recordPayload.preferredSlot,
    topic: `${recordPayload.serviceCategory} with ${recordPayload.consultantName}`,
  }).catch(() => {});

  const whatsappMessage = [
    `*INISIO CONSULTANT INTRODUCTION BRIEF*`,
    `Promoter: ${recordPayload.promoterName}`,
    `Mobile: ${recordPayload.promoterPhone || 'Provided on call center confirmation'}`,
    `Email: ${recordPayload.userEmail}`,
    `Project: ${recordPayload.projectName}`,
    `Location: ${recordPayload.projectLocation || 'India'}`,
    recordPayload.projectCostCr ? `Project Outlay: ₹${recordPayload.projectCostCr} Cr` : '',
    `Requested Service: ${recordPayload.serviceCategory}`,
    `Preferred Slot: ${recordPayload.preferredDate || 'Flexible'} (${recordPayload.preferredSlot})`,
    recordPayload.notes ? `Notes: ${recordPayload.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const phoneDigits = String(recordPayload.consultantPhone || '').replace(/\D/g, '');
  const waNumber = phoneDigits.length >= 10 ? `91${phoneDigits.slice(-10)}` : '916302026462';
  const whatsappShareUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return {
    introduction: created,
    whatsappShareUrl,
    whatsappMessage,
  };
};

export const listIntroductionsForUser = async (requester = null, query = {}) => {
  const role = String(requester?.role || '').toLowerCase();
  const isStaff = ['admin', 'superadmin', 'ca_admin'].includes(role);
  const cleanEmail = normalizeEmail(requester?.email || query.email);

  if (isDBConnected()) {
    try {
      const filter = isStaff ? {} : { userEmail: cleanEmail };
      return await IntroductionRequest.find(filter).sort({ createdAt: -1 }).lean();
    } catch (err) {
      console.warn('[introductionService] DB list warning:', err.message);
    }
  }

  return isStaff
    ? memoryIntroductions
    : memoryIntroductions.filter((r) => normalizeEmail(r.userEmail) === cleanEmail);
};

export const updateIntroductionStatus = async (id, { status, callCenterStatus, whatsappSharedToConsultant }) => {
  if (status && !VALID_TRACKING_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${VALID_TRACKING_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // Condition #4: If unavailable or cancelled, do not count against quota!
  const countedAgainstQuota = status === 'Unavailable / Cancelled' ? false : undefined;

  if (isDBConnected() && mongoose.Types.ObjectId.isValid(String(id))) {
    const doc = await IntroductionRequest.findById(id);
    if (doc) {
      if (status) doc.status = status;
      if (callCenterStatus !== undefined) doc.callCenterStatus = callCenterStatus;
      if (whatsappSharedToConsultant !== undefined) doc.whatsappSharedToConsultant = Boolean(whatsappSharedToConsultant);
      if (countedAgainstQuota !== undefined) doc.countedAgainstQuota = countedAgainstQuota;
      return await doc.save();
    }
  }

  const idx = memoryIntroductions.findIndex((r) => String(r._id) === String(id));
  if (idx === -1) {
    const err = new Error('Introduction request not found');
    err.statusCode = 404;
    throw err;
  }
  if (status) memoryIntroductions[idx].status = status;
  if (callCenterStatus !== undefined) memoryIntroductions[idx].callCenterStatus = callCenterStatus;
  if (whatsappSharedToConsultant !== undefined) {
    memoryIntroductions[idx].whatsappSharedToConsultant = Boolean(whatsappSharedToConsultant);
  }
  if (countedAgainstQuota !== undefined) memoryIntroductions[idx].countedAgainstQuota = countedAgainstQuota;
  memoryIntroductions[idx].updatedAt = new Date();
  return memoryIntroductions[idx];
};

export default {
  getUserIntroductionCounts,
  createIntroductionRequest,
  listIntroductionsForUser,
  updateIntroductionStatus,
};

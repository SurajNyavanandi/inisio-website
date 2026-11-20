import Assessment from '../models/Assessment.js';
import { calculateUnderwritingMetrics } from '../utils/underwritingScorer.js';
import { isDBConnected } from '../config/db.js';
import {
  checkUserAssessmentQuota,
  createQuotaExceededError,
  normalizeEmail,
  normalizeMobile10,
} from '../utils/assessmentQuota.js';
import { getMemoryLeads } from './leadService.js';
import { getMemoryProjects } from './projectService.js';

let memoryAssessments = [];

export const getMemoryAssessments = () => memoryAssessments;

export const getAssessmentQuota = async ({
  user = null,
  email = '',
  mobile = '',
  clientProjectId = '',
  existingRecordId = '',
} = {}) => {
  return checkUserAssessmentQuota({
    user,
    email,
    mobile,
    clientProjectId,
    existingRecordId,
    memoryLeads: getMemoryLeads(),
    memoryProjects: getMemoryProjects(),
    memoryAssessments,
  });
};

export const evaluateProject = async (inputData, userOrId = null) => {
  const userObj =
    userOrId && typeof userOrId === 'object' && (userOrId._id || userOrId.email || userOrId.role)
      ? userOrId
      : null;
  const userId = userObj ? userObj._id : userOrId || null;
  const clientProjectId = String(inputData?.clientProjectId || '').trim();
  const cleanEmail = normalizeEmail(userObj?.email || inputData?.email);
  const cleanMobile10 = normalizeMobile10(userObj?.phone || inputData?.mobile);

  // Enforce 1-free-assessment-per-user quota on the server
  const quota = await checkUserAssessmentQuota({
    user: userObj,
    email: cleanEmail,
    mobile: cleanMobile10,
    clientProjectId,
    existingRecordId: inputData?.assessmentId || inputData?._id || '',
    memoryLeads: getMemoryLeads(),
    memoryProjects: getMemoryProjects(),
    memoryAssessments,
  });

  if (!quota.allowed) {
    throw createQuotaExceededError(quota);
  }

  const metrics = calculateUnderwritingMetrics(inputData);
  const payloadToPersist = {
    ...inputData,
    ...metrics,
    clientProjectId,
    email: cleanEmail || inputData?.email || '',
    mobile: inputData?.mobile || userObj?.phone || '',
    userId: userId || null,
  };
  delete payloadToPersist._id;
  delete payloadToPersist.id;

  if (isDBConnected()) {
    try {
      // Idempotent upsert when clientProjectId is present
      if (clientProjectId) {
        const existingDoc = await Assessment.findOne({ clientProjectId });
        if (existingDoc) {
          Object.assign(existingDoc, payloadToPersist);
          await existingDoc.save();
          return {
            assessmentId: existingDoc._id,
            ...existingDoc.toObject(),
          };
        }
      }

      const assessmentDoc = await Assessment.create(payloadToPersist);
      return {
        assessmentId: assessmentDoc._id,
        ...assessmentDoc.toObject(),
      };
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('MongoDB create failed in evaluateProject, using memory fallback:', err.message);
    }
  }

  // Memory fallback with idempotent upsert
  if (clientProjectId) {
    const existingIdx = memoryAssessments.findIndex(
      (a) => a.clientProjectId && a.clientProjectId === clientProjectId
    );
    if (existingIdx !== -1) {
      memoryAssessments[existingIdx] = {
        ...memoryAssessments[existingIdx],
        ...payloadToPersist,
        updatedAt: new Date(),
      };
      return memoryAssessments[existingIdx];
    }
  }

  const nowId = `assess_${Date.now()}`;
  const item = {
    _id: nowId,
    assessmentId: nowId,
    ...payloadToPersist,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryAssessments.unshift(item);
  return item;
};

export const getUserAssessments = async (userId) => {
  if (isDBConnected()) {
    try {
      return await Assessment.find({ userId }).sort({ createdAt: -1 });
    } catch (err) {}
  }
  return memoryAssessments.filter((a) => String(a.userId) === String(userId));
};

export const getAllAssessments = async () => {
  if (isDBConnected()) {
    try {
      return await Assessment.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
    } catch (err) {}
  }
  return memoryAssessments;
};

export default {
  getMemoryAssessments,
  getAssessmentQuota,
  evaluateProject,
  getUserAssessments,
  getAllAssessments,
};

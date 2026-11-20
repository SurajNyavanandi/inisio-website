import assessmentService from '../services/assessmentService.js';
import { calculateUnderwritingMetrics } from '../utils/underwritingScorer.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const getAssessmentQuota = async (req, res, next) => {
  try {
    const quota = await assessmentService.getAssessmentQuota({
      user: req.user || null,
      email: req.query?.email || '',
      mobile: req.query?.mobile || '',
      clientProjectId: req.query?.clientProjectId || '',
      existingRecordId: req.query?.projectId || req.query?.existingRecordId || '',
    });
    return sendSuccess(res, quota, 'Assessment quota status retrieved');
  } catch (error) {
    next(error);
  }
};

export const evaluateProject = async (req, res, next) => {
  try {
    const result = await assessmentService.evaluateProject(req.body, req.user || null);
    return sendSuccess(res, result, 'Bankability assessment evaluated successfully');
  } catch (error) {
    next(error);
  }
};

export const calculateQuickMetrics = async (req, res, next) => {
  try {
    const result = calculateUnderwritingMetrics(req.body);
    return sendSuccess(res, result, 'Quick underwriting calculation completed');
  } catch (error) {
    next(error);
  }
};

export const getUserAssessments = async (req, res, next) => {
  try {
    const assessments = await assessmentService.getUserAssessments(req.user._id);
    return sendSuccess(res, assessments, 'User project assessments retrieved');
  } catch (error) {
    next(error);
  }
};

export const getAllAssessments = async (req, res, next) => {
  try {
    const list = await assessmentService.getAllAssessments();
    return sendSuccess(res, list, 'All assessments retrieved');
  } catch (error) {
    next(error);
  }
};

export default {
  getAssessmentQuota,
  evaluateProject,
  calculateQuickMetrics,
  getUserAssessments,
  getAllAssessments,
};

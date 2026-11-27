import consultationService from '../services/consultationService.js';
import introductionService from '../services/introductionService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const createConsultation = async (req, res, next) => {
  try {
    const consultation = await consultationService.createConsultation(req.body);
    return sendSuccess(res, consultation, 'Advisory consultation scheduled successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getConsultations = async (req, res, next) => {
  try {
    const list = await consultationService.getAllConsultations(req.query);
    return sendSuccess(res, list, 'Consultations retrieved');
  } catch (error) {
    next(error);
  }
};

export const getConsultationById = async (req, res, next) => {
  try {
    const item = await consultationService.getConsultationById(req.params.id);
    return sendSuccess(res, item, 'Consultation details fetched');
  } catch (error) {
    next(error);
  }
};

export const updateConsultationStatus = async (req, res, next) => {
  try {
    const { status, feedback } = req.body;
    const item = await consultationService.updateConsultationStatus(req.params.id, status, feedback);
    return sendSuccess(res, item, 'Consultation status updated');
  } catch (error) {
    next(error);
  }
};

export const createIntroduction = async (req, res, next) => {
  try {
    const result = await introductionService.createIntroductionRequest(req.body, req.user);
    return sendSuccess(
      res,
      result,
      'Consultant introduction request submitted and routed for call center confirmation',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getIntroductions = async (req, res, next) => {
  try {
    const list = await introductionService.listIntroductionsForUser(req.user, req.query);
    return sendSuccess(res, list, 'Introduction requests retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateIntroductionTrackingStatus = async (req, res, next) => {
  try {
    const item = await introductionService.updateIntroductionStatus(req.params.id, req.body);
    return sendSuccess(res, item, 'Introduction tracking status updated');
  } catch (error) {
    next(error);
  }
};

export default {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultationStatus,
  createIntroduction,
  getIntroductions,
  updateIntroductionTrackingStatus,
};

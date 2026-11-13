import statService from '../services/statService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const getAllStats = async (req, res, next) => {
  try {
    const list = await statService.getAllStats();
    return sendSuccess(res, list, 'Platform stats retrieved');
  } catch (error) {
    next(error);
  }
};

export const createStat = async (req, res, next) => {
  try {
    const item = await statService.createStat(req.body);
    return sendSuccess(res, item, 'Platform stat created', 201);
  } catch (error) {
    next(error);
  }
};

export default {
  getAllStats,
  createStat,
};

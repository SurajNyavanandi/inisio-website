import faqService from '../services/faqService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const getAllFAQs = async (req, res, next) => {
  try {
    const list = await faqService.getAllFAQs();
    return sendSuccess(res, list, 'FAQs retrieved');
  } catch (error) {
    next(error);
  }
};

export const createFAQ = async (req, res, next) => {
  try {
    const item = await faqService.createFAQ(req.body);
    return sendSuccess(res, item, 'FAQ created', 201);
  } catch (error) {
    next(error);
  }
};

export default {
  getAllFAQs,
  createFAQ,
};

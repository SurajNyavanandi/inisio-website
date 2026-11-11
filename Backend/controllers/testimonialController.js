import testimonialService from '../services/testimonialService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const getAllTestimonials = async (req, res, next) => {
  try {
    const { industry } = req.query;
    const list = await testimonialService.getAllTestimonials(industry);
    return sendSuccess(res, list, 'Testimonials retrieved');
  } catch (error) {
    next(error);
  }
};

export const createTestimonial = async (req, res, next) => {
  try {
    const item = await testimonialService.createTestimonial(req.body);
    return sendSuccess(res, item, 'Testimonial created', 201);
  } catch (error) {
    next(error);
  }
};

export default {
  getAllTestimonials,
  createTestimonial,
};

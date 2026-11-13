import blogService from '../services/blogService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const getAllBlogs = async (req, res, next) => {
  try {
    const list = await blogService.getAllBlogs();
    return sendSuccess(res, list, 'Blog articles retrieved');
  } catch (error) {
    next(error);
  }
};

export const getBlogBySlug = async (req, res, next) => {
  try {
    const item = await blogService.getBlogBySlug(req.params.slug);
    return sendSuccess(res, item, 'Blog article retrieved');
  } catch (error) {
    next(error);
  }
};

export const createBlog = async (req, res, next) => {
  try {
    const item = await blogService.createBlog(req.body);
    return sendSuccess(res, item, 'Blog article created', 201);
  } catch (error) {
    next(error);
  }
};

export default {
  getAllBlogs,
  getBlogBySlug,
  createBlog,
};

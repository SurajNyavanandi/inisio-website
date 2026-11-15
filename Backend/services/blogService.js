import BlogPost from '../models/BlogPost.js';
import { DEFAULT_BLOGS } from '../data/defaultData.js';
import { isDBConnected } from '../config/db.js';
import cache from '../utils/cache.js';

let memoryBlogs = [...DEFAULT_BLOGS];
const CACHE_KEY = 'all_blogs';

export const getAllBlogs = async () => {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  let results = memoryBlogs.filter((b) => b.active);
  if (isDBConnected()) {
    try {
      const list = await BlogPost.find({ active: true }).sort({ createdAt: -1 }).lean();
      if (list && list.length > 0) results = list;
    } catch (err) {
      console.warn('MongoDB query failed in getAllBlogs, using memory fallback:', err.message);
    }
  }

  cache.set(CACHE_KEY, results, 5 * 60 * 1000);
  return results;
};

export const getBlogBySlug = async (slug) => {
  const cacheKey = `blog_${slug}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let result = null;
  if (isDBConnected()) {
    try {
      const post = await BlogPost.findOne({ slug, active: true }).lean();
      if (post) result = post;
    } catch (err) {
      console.warn('MongoDB query failed in getBlogBySlug, using memory fallback:', err.message);
    }
  }
  if (!result) {
    const found = memoryBlogs.find((b) => b.slug === slug);
    if (!found) {
      throw new Error(`Blog post '${slug}' not found`);
    }
    result = found;
  }

  cache.set(cacheKey, result, 5 * 60 * 1000);
  return result;
};

export const createBlog = async (data) => {
  cache.clear();
  if (isDBConnected()) {
    try {
      return await BlogPost.create(data);
    } catch (err) {
      console.warn('MongoDB create failed in createBlog, saving to memory fallback:', err.message);
    }
  }
  const item = { ...data, _id: `blog_${Date.now()}`, createdAt: new Date() };
  memoryBlogs.push(item);
  return item;
};

export default {
  getAllBlogs,
  getBlogBySlug,
  createBlog,
};

import Testimonial from '../models/Testimonial.js';
import { DEFAULT_TESTIMONIALS } from '../data/defaultData.js';
import { isDBConnected } from '../config/db.js';
import cache from '../utils/cache.js';

let memoryTestimonials = [...DEFAULT_TESTIMONIALS];

export const getAllTestimonials = async (industry) => {
  const cacheKey = `testimonials_${industry || 'all'}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let results = memoryTestimonials.filter((t) => t.active);
  if (industry && industry !== 'All') {
    results = results.filter((t) => t.industry === industry);
  }

  if (isDBConnected()) {
    try {
      const query = { active: true };
      if (industry && industry !== 'All') {
        query.industry = industry;
      }
      const list = await Testimonial.find(query).sort({ createdAt: -1 }).lean();
      if (list && list.length > 0) results = list;
    } catch (err) {
      console.warn('MongoDB query failed in getAllTestimonials, using memory fallback:', err.message);
    }
  }

  cache.set(cacheKey, results, 5 * 60 * 1000);
  return results;
};

export const createTestimonial = async (data) => {
  cache.clear();
  if (isDBConnected()) {
    try {
      return await Testimonial.create(data);
    } catch (err) {
      console.warn('MongoDB create failed in createTestimonial, saving to memory fallback:', err.message);
    }
  }
  const item = { ...data, _id: `test_${Date.now()}`, createdAt: new Date() };
  memoryTestimonials.push(item);
  return item;
};

export default {
  getAllTestimonials,
  createTestimonial,
};

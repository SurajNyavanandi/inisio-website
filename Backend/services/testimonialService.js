import Testimonial from '../models/Testimonial.js';
import { DEFAULT_TESTIMONIALS } from '../data/defaultData.js';
import { isDBConnected } from '../config/db.js';
import cache from '../utils/cache.js';

let memoryTestimonials = [...DEFAULT_TESTIMONIALS];

export const getAllTestimonials = async (industry) => {
  const cacheKey = `testimonials_v2_${industry || 'all'}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let results = memoryTestimonials.filter((t) => t.active);
  if (industry && industry !== 'All') {
    const target = industry.toLowerCase();
    results = results.filter((t) => String(t.industry || '').toLowerCase() === target || String(t.industry || '').toLowerCase().includes(target));
  }

  if (isDBConnected()) {
    try {
      const query = { active: true };
      const list = await Testimonial.find(query).sort({ createdAt: -1 }).lean();
      const verifiedList = list.filter((t) => t.recordType === 'case_study' || t.writtenPermission === true);
      if (verifiedList.length > 0) {
        results = verifiedList;
        if (industry && industry !== 'All') {
          const target = industry.toLowerCase();
          results = results.filter((t) => String(t.industry || '').toLowerCase() === target || String(t.industry || '').toLowerCase().includes(target));
        }
      }
    } catch (err) {
      console.warn('MongoDB query failed in getAllTestimonials, using compliant defaults:', err.message);
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

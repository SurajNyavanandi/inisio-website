import FAQ from '../models/FAQ.js';
import { DEFAULT_FAQS } from '../data/defaultData.js';
import { isDBConnected } from '../config/db.js';
import cache from '../utils/cache.js';

let memoryFAQs = [...DEFAULT_FAQS];
const CACHE_KEY = 'all_faqs';

export const getAllFAQs = async () => {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  let results = memoryFAQs.filter((f) => f.active);
  if (isDBConnected()) {
    try {
      const list = await FAQ.find({ active: true }).sort({ order: 1 }).lean();
      if (list && list.length > 0) results = list;
    } catch (err) {
      console.warn('MongoDB query failed in getAllFAQs, using memory fallback:', err.message);
    }
  }

  cache.set(CACHE_KEY, results, 5 * 60 * 1000);
  return results;
};

export const createFAQ = async (data) => {
  cache.del(CACHE_KEY);
  if (isDBConnected()) {
    try {
      return await FAQ.create(data);
    } catch (err) {
      console.warn('MongoDB create failed in createFAQ, saving to memory fallback:', err.message);
    }
  }
  const item = { ...data, _id: `faq_${Date.now()}`, createdAt: new Date() };
  memoryFAQs.push(item);
  return item;
};

export default {
  getAllFAQs,
  createFAQ,
};

import Industry from '../models/Industry.js';
import { DEFAULT_INDUSTRIES } from '../data/defaultData.js';
import { isDBConnected } from '../config/db.js';

let memoryIndustries = [...DEFAULT_INDUSTRIES];

// In-memory TTL cache for read-heavy public benchmark catalog
let cachedIndustries = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const getAllIndustries = async () => {
  const now = Date.now();
  if (cachedIndustries && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedIndustries;
  }

  if (isDBConnected()) {
    try {
      const list = await Industry.find({}).sort({ category: 1, name: 1 }).lean();
      if (list && list.length > 0) {
        cachedIndustries = list;
        lastCacheTime = now;
        return list;
      }
    } catch (err) {
      console.warn('MongoDB query failed in getAllIndustries, using memory fallback:', err.message);
    }
  }

  cachedIndustries = memoryIndustries;
  lastCacheTime = now;
  return memoryIndustries;
};

export const getIndustryBySlug = async (slug) => {
  if (isDBConnected()) {
    try {
      const ind = await Industry.findOne({ slug }).lean();
      if (ind) return ind;
    } catch (err) {
      console.warn('MongoDB query failed in getIndustryBySlug, using memory fallback:', err.message);
    }
  }
  const found = memoryIndustries.find((i) => i.slug === slug);
  if (!found) {
    throw new Error(`Industry '${slug}' not found`);
  }
  return found;
};

export const createIndustry = async (data) => {
  // Invalidate cache on new creation
  cachedIndustries = null;
  lastCacheTime = 0;

  if (isDBConnected()) {
    try {
      return await Industry.create(data);
    } catch (err) {
      console.warn('MongoDB create failed in createIndustry, saving to memory fallback:', err.message);
    }
  }
  const item = { ...data, _id: `ind_${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
  memoryIndustries.push(item);
  return item;
};

export default {
  getAllIndustries,
  getIndustryBySlug,
  createIndustry,
};

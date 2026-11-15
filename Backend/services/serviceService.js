import Service from '../models/Service.js';
import { DEFAULT_SERVICES } from '../data/defaultData.js';
import { isDBConnected } from '../config/db.js';

let memoryServices = [...DEFAULT_SERVICES];

// In-memory TTL cache for read-heavy public service catalog
let cachedServices = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const getAllServices = async () => {
  const now = Date.now();
  if (cachedServices && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedServices;
  }

  if (isDBConnected()) {
    try {
      const list = await Service.find({ active: true }).lean();
      if (list && list.length > 0) {
        cachedServices = list;
        lastCacheTime = now;
        return list;
      }
    } catch (err) {
      console.warn('MongoDB query failed in getAllServices, using memory fallback:', err.message);
    }
  }

  cachedServices = memoryServices;
  lastCacheTime = now;
  return memoryServices;
};

export const getServiceBySlug = async (slug) => {
  if (isDBConnected()) {
    try {
      const service = await Service.findOne({ slug }).lean();
      if (service) return service;
    } catch (err) {
      console.warn('MongoDB query failed in getServiceBySlug, using memory fallback:', err.message);
    }
  }
  const found = memoryServices.find((s) => s.slug === slug);
  if (!found) {
    throw new Error(`Service '${slug}' not found`);
  }
  return found;
};

export const createService = async (data) => {
  // Invalidate cache
  cachedServices = null;
  lastCacheTime = 0;

  if (isDBConnected()) {
    try {
      return await Service.create(data);
    } catch (err) {
      console.warn('MongoDB create failed in createService, saving to memory fallback:', err.message);
    }
  }
  const item = { ...data, _id: `srv_${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
  memoryServices.push(item);
  return item;
};

export default {
  getAllServices,
  getServiceBySlug,
  createService,
};

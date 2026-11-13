import PlatformStat from '../models/PlatformStat.js';
import { DEFAULT_PLATFORM_STATS } from '../data/defaultData.js';
import { isDBConnected } from '../config/db.js';
import cache from '../utils/cache.js';

let memoryStats = [...DEFAULT_PLATFORM_STATS];
const CACHE_KEY = 'platform_stats';

export const getAllStats = async () => {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  let results = memoryStats.filter((s) => s.active);
  if (isDBConnected()) {
    try {
      const list = await PlatformStat.find({ active: true }).sort({ order: 1 }).lean();
      if (list && list.length > 0) results = list;
    } catch (err) {
      console.warn('MongoDB query failed in getAllStats, using memory fallback:', err.message);
    }
  }
  cache.set(CACHE_KEY, results, 5 * 60 * 1000);
  return results;
};

export const createStat = async (data) => {
  cache.del(CACHE_KEY);
  if (isDBConnected()) {
    try {
      return await PlatformStat.create(data);
    } catch (err) {
      console.warn('MongoDB create failed in createStat, saving to memory fallback:', err.message);
    }
  }
  const item = { ...data, _id: `stat_${Date.now()}`, createdAt: new Date() };
  memoryStats.push(item);
  return item;
};

export default {
  getAllStats,
  createStat,
};

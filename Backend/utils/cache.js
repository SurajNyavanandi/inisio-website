class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.data;
  }

  set(key, data, ttlMs = 5 * 60 * 1000) {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  del(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

export const cache = new MemoryCache();
export default cache;

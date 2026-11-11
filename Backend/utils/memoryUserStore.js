import bcrypt from 'bcryptjs';
import config from '../config/env.js';

/**
 * Dynamically resolves authorized administrative emails from environment configuration
 */
export const getAdminEmail1 = () => {
  return config.admin.email1 || 'admin@inisio.in';
};

export const getAdminEmail2 = () => {
  return config.admin.email2 || 'superadmin@inisio.in';
};

export const getAuthorizedAdminEmails = () => {
  const admin1 = getAdminEmail1();
  const admin2 = getAdminEmail2();
  const extra = config.admin.extraEmails || [];

  const set = new Set([admin1, admin2, ...extra]);
  return Array.from(set).filter(Boolean);
};

export const isAuthorizedAdminEmail = (email) => {
  if (!email) return false;
  const clean = String(email).toLowerCase().trim();
  return getAuthorizedAdminEmails().includes(clean);
};

// Legacy array export that dynamically reflects current environment config
export const AUTHORIZED_ADMIN_EMAILS = new Proxy([], {
  get(target, prop) {
    const list = getAuthorizedAdminEmails();
    if (prop === 'length') return list.length;
    if (prop === 'includes') return (val) => isAuthorizedAdminEmail(val);
    if (prop in list) return list[prop];
    return target[prop];
  },
});

export let memoryUsers = [];

export const getMemoryUsers = () => {
  if (config.isProduction && !config.allowMemoryFallback) {
    return [];
  }
  return memoryUsers;
};

export const findMemoryUserByEmail = (email) => {
  if (!email) return null;
  const clean = String(email).toLowerCase().trim();
  return memoryUsers.find((u) => (u.email || '').toLowerCase().trim() === clean) || null;
};

export const findMemoryUserById = (id) => {
  if (!id) return null;
  const strId = String(id);
  return memoryUsers.find((u) => String(u._id || u.id) === strId) || null;
};

export const addMemoryUser = (user) => {
  const cleanEmail = (user.email || '').toLowerCase().trim();
  const idx = memoryUsers.findIndex((u) => (u.email || '').toLowerCase().trim() === cleanEmail);
  const userRecord = {
    ...user,
    _id: user._id || user.id || `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    email: cleanEmail,
    createdAt: user.createdAt || new Date(),
    updatedAt: new Date(),
  };

  if (idx >= 0) {
    memoryUsers[idx] = { ...memoryUsers[idx], ...userRecord };
    return memoryUsers[idx];
  }
  memoryUsers.unshift(userRecord);
  return userRecord;
};

export const updateMemoryUser = (id, updates) => {
  const strId = String(id);
  const idx = memoryUsers.findIndex((u) => String(u._id || u.id) === strId);
  if (idx >= 0) {
    memoryUsers[idx] = {
      ...memoryUsers[idx],
      ...updates,
      updatedAt: new Date(),
    };
    return memoryUsers[idx];
  }
  return null;
};

export const deleteMemoryUser = (id) => {
  const strId = String(id);
  const idx = memoryUsers.findIndex((u) => String(u._id || u.id) === strId);
  if (idx >= 0) {
    memoryUsers.splice(idx, 1);
    return true;
  }
  return false;
};

export default {
  getAdminEmail1,
  getAdminEmail2,
  getAuthorizedAdminEmails,
  isAuthorizedAdminEmail,
  AUTHORIZED_ADMIN_EMAILS,
  memoryUsers,
  getMemoryUsers,
  findMemoryUserByEmail,
  findMemoryUserById,
  addMemoryUser,
  updateMemoryUser,
  deleteMemoryUser,
};

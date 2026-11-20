import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import config from '../config/env.js';

/**
 * Dynamically resolves authorized administrative emails from environment configuration
 */
export const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/i;

export const isValidGmail = (email) => {
  if (!email) return false;
  const clean = String(email).toLowerCase().trim();
  return Boolean(clean) && GMAIL_REGEX.test(clean);
};

export const getAdminEmail1 = () => {
  return (process.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL_1 || 'admin@example.com').toLowerCase().trim();
};

export const getAdminEmail2 = () => {
  return (process.env.SUPER_ADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || process.env.ADMIN_EMAIL_2 || 'superadmin@example.com').toLowerCase().trim();
};

export const getCaAdminEmail = () => {
  return (process.env.CA_ADMIN || process.env.CA_ADMIN_EMAIL || 'ca.admin@example.com').toLowerCase().trim();
};

export const getExtraCaAdminEmails = () => {
  return (process.env.CA_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
};

export const isCaAdminEmail = (email) => {
  if (!email) return false;
  const clean = String(email).toLowerCase().trim();
  const extraCa = getExtraCaAdminEmails();
  return clean === getCaAdminEmail() || extraCa.includes(clean) || clean === 'ca.admin@example.com' || clean === 'caadmin@example.com';
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

export const isAuthorizedAdminGmail = (email) => {
  if (!isValidGmail(email)) return false;
  const clean = String(email).toLowerCase().trim();
  return getAuthorizedAdminEmails().includes(clean);
};

export const isAuthorizedCaAdminGmail = (email) => {
  if (!isValidGmail(email)) return false;
  const clean = String(email).toLowerCase().trim();
  const caAdmin = getCaAdminEmail();
  const extraCa = getExtraCaAdminEmails();
  return (isValidGmail(caAdmin) && clean === caAdmin) || extraCa.includes(clean);
};

export const getAdminTestPassword = () => {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  const configured = (process.env.ADMIN_TEST_PASSWORD || 'password26@gmail.com').trim();
  return configured || 'password26@gmail.com';
};

export const isAdminTestPasswordMatch = (enteredPassword) => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  const testPassword = getAdminTestPassword();
  return Boolean(testPassword) && Boolean(enteredPassword) && String(enteredPassword) === testPassword;
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

  const admin1 = getAdminEmail1();
  const admin2 = getAdminEmail2();
  const caAdmin = getCaAdminEmail();
  const testPassword = getAdminTestPassword();
  const getSeedPasswordHash = () =>
    bcrypt.hashSync(testPassword || crypto.randomBytes(24).toString('hex'), 10);
  const seedInitialized = Boolean(testPassword);

  if (caAdmin && !memoryUsers.some((u) => u.email.toLowerCase() === caAdmin)) {
    memoryUsers.unshift({
      _id: 'user_ca_admin_dynamic',
      name: 'CA Operations Admin',
      email: caAdmin,
      password: getSeedPasswordHash(),
      passwordInitialized: seedInitialized,
      role: 'ca_admin',
      company: 'Inisio CA Network Administration',
      phone: process.env.CA_ADMIN_PHONE || '+91 98765 43210',
      isVerified: true,
      createdAt: new Date(),
    });
  }

  if (admin2 && !memoryUsers.some((u) => u.email.toLowerCase() === admin2)) {
    memoryUsers.unshift({
      _id: 'user_superadmin_dynamic',
      name: 'Executive Super Admin',
      email: admin2,
      password: getSeedPasswordHash(),
      passwordInitialized: seedInitialized,
      role: 'superadmin',
      company: 'Inisio Executive Board',
      phone: process.env.SUPERADMIN_PHONE || '',
      isVerified: true,
      createdAt: new Date(),
    });
  }

  if (admin1 && !memoryUsers.some((u) => u.email.toLowerCase() === admin1)) {
    memoryUsers.unshift({
      _id: 'user_admin_dynamic',
      name: 'Inisio Operations Admin',
      email: admin1,
      password: getSeedPasswordHash(),
      passwordInitialized: seedInitialized,
      role: 'admin',
      company: 'Inisio HQ Operations',
      phone: process.env.ADMIN_PHONE || '',
      isVerified: true,
      createdAt: new Date(),
    });
  }

  return memoryUsers;
};

export const findMemoryUserByEmail = (email) => {
  if (!email) return null;
  const clean = String(email).toLowerCase().trim();
  return getMemoryUsers().find((u) => (u.email || '').toLowerCase().trim() === clean) || null;
};

export const findMemoryUserById = (id) => {
  if (!id) return null;
  const strId = String(id);
  return getMemoryUsers().find((u) => String(u._id || u.id) === strId) || null;
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
  GMAIL_REGEX,
  isValidGmail,
  getAdminEmail1,
  getAdminEmail2,
  getCaAdminEmail,
  getExtraCaAdminEmails,
  isCaAdminEmail,
  getAuthorizedAdminEmails,
  isAuthorizedAdminEmail,
  isAuthorizedAdminGmail,
  isAuthorizedCaAdminGmail,
  getAdminTestPassword,
  isAdminTestPasswordMatch,
  AUTHORIZED_ADMIN_EMAILS,
  memoryUsers,
  getMemoryUsers,
  findMemoryUserByEmail,
  findMemoryUserById,
  addMemoryUser,
  updateMemoryUser,
  deleteMemoryUser,
};

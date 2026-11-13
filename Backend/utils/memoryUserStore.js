import bcrypt from 'bcryptjs';

// Memory store for local non-production development resilience

/**
 * Dynamically resolves authorized administrative emails from environment variables
 */
export const getAdminEmail1 = () => {
  return (process.env.ADMIN_EMAIL_1 || process.env.ADMIN_EMAIL || 'inisio2026@gmail.com').toLowerCase().trim();
};

export const getAdminEmail2 = () => {
  return (process.env.ADMIN_EMAIL_2 || process.env.SUPERADMIN_EMAIL || 'junnupravalika59@gmail.com').toLowerCase().trim();
};

export const getAuthorizedAdminEmails = () => {
  const admin1 = getAdminEmail1();
  const admin2 = getAdminEmail2();
  const extra = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

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
  const admin1 = getAdminEmail1();
  const admin2 = getAdminEmail2();

  if (admin2 && !memoryUsers.some((u) => u.email.toLowerCase() === admin2)) {
    memoryUsers.unshift({
      _id: 'user_superadmin_dynamic',
      name: 'Executive Super Admin',
      email: admin2,
      password: '',
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
      password: '',
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
  const clean = email.toLowerCase().trim();
  const list = getMemoryUsers();
  return list.find((u) => u.email.toLowerCase().trim() === clean) || null;
};

export const findMemoryUserById = (id) => {
  if (!id) return null;
  const list = getMemoryUsers();
  return list.find((u) => String(u._id) === String(id) || u.email.toLowerCase() === String(id).toLowerCase()) || null;
};

export const addMemoryUser = (user) => {
  memoryUsers.push(user);
  return user;
};

export const updateMemoryUser = (id, updates) => {
  const idx = memoryUsers.findIndex((u) => String(u._id) === String(id) || u.email.toLowerCase() === String(id).toLowerCase());
  if (idx !== -1) {
    memoryUsers[idx] = { ...memoryUsers[idx], ...updates };
    return memoryUsers[idx];
  }
  return null;
};

export const deleteMemoryUser = (id) => {
  const initialLen = memoryUsers.length;
  memoryUsers = memoryUsers.filter((u) => String(u._id) !== String(id) && u.email.toLowerCase() !== String(id).toLowerCase());
  return memoryUsers.length < initialLen;
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

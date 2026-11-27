import { z } from 'zod';
import { sendError } from '../utils/responseHandler.js';

/**
 * Escapes user input to safely use in regex queries without NoSQL injection
 */
export const escapeRegex = (string = '') => {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Recursively strips MongoDB operator keys ($...) and prototype pollution keys from plain objects
 */
export const stripUnsafeKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripUnsafeKeys);
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k === '__proto__' || k === 'constructor' || k === 'prototype') {
        continue;
      }
      clean[k] = stripUnsafeKeys(v);
    }
    return clean;
  }
  return value;
};

/**
 * Middleware factory to validate req.body against a Zod schema
 */
export const validateSchema = (schema) => {
  return (req, res, next) => {
    const sanitizedBody = stripUnsafeKeys(req.body || {});
    const result = schema.safeParse(sanitizedBody);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`);
      return sendError(
        res,
        `Validation error: ${issues.join('; ')}`,
        400,
        result.error.format(),
        'VALIDATION_ERROR'
      );
    }
    req.body = result.data;
    next();
  };
};

/**
 * Strict authentication & user schemas to reject unknown fields and prevent mass assignment
 */
export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    phone: z.string().optional(),
    company: z.string().max(150).optional(),
    role: z.enum(['user', 'ca', 'dpr_consultant', 'prosync', 'prosync_admin', 'promoter']).default('user').optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required').max(100),
  })
  .strict();

export const adminLoginSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email address')
      .toLowerCase()
      .trim()
      .regex(/^[^\s@]+@gmail\.com$/i, 'Only valid @gmail.com addresses are permitted for admin access'),
    password: z.string().min(1, 'Password is required').max(100),
  })
  .strict();

export const otpVerifySchema = z
  .object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
  })
  .strict();

export const emailOnlySchema = z
  .object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters').max(100),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    company: z.string().max(150).optional(),
    avatarUrl: z.string().optional(),
  })
  .strict();

export const createOrderSchema = z
  .object({
    amount: z.coerce.number().positive('Payment amount must be greater than zero').max(10000000),
    currency: z.string().min(3).max(6).default('INR').optional(),
    userEmail: z.string().email('Invalid email address').toLowerCase().trim().optional().or(z.literal('')),
    userName: z.string().max(120).optional(),
    userPhone: z.string().max(24).optional(),
    itemType: z.string().max(60).optional(),
    itemId: z.string().max(100).optional(),
    planName: z.string().max(120).optional(),
    billingCycle: z.string().max(40).optional(),
  })
  .passthrough();

export const verifyPaymentSchema = z
  .object({
    razorpay_order_id: z.string().trim().min(1, 'Order ID is required').max(120),
    razorpay_payment_id: z.string().trim().min(1, 'Payment ID is required').max(120),
    razorpay_signature: z.string().max(256).optional(),
    userEmail: z.string().email('Invalid email address').toLowerCase().trim().optional().or(z.literal('')),
    planName: z.string().max(120).optional(),
    paymentMethod: z.string().max(60).optional(),
  })
  .passthrough();

export const caProfileCreateSchema = z
  .object({
    name: z.string().trim().min(2, 'CA name is required').max(120),
    email: z.string().email('Valid email address is required').toLowerCase().trim(),
    phone: z.string().max(30).optional(),
    firmName: z.string().max(160).optional(),
    membershipNumber: z.string().max(60).optional(),
    city: z.string().max(80).optional(),
    state: z.string().max(80).optional(),
    sourceTag: z.string().max(80).optional(),
  })
  .passthrough();

export const activateCaSchema = z
  .object({
    token: z.string().trim().min(10, 'Invalid activation token').max(256),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().max(30).optional(),
    firmName: z.string().max(160).optional(),
    city: z.string().max(80).optional(),
  })
  .passthrough();

export const leadCreateSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required').max(150),
    email: z.string().email('Valid email address is required').toLowerCase().trim(),
    mobile: z.string().trim().min(10, 'Valid mobile number is required').max(24),
  })
  .passthrough();

/**
 * Validate required fields in request body (legacy helper)
 */
export const validateBody = (requiredFields = []) => {
  return (req, res, next) => {
    const missing = [];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return sendError(
        res,
        `Missing required fields: ${missing.join(', ')}`,
        400,
        { missingFields: missing },
        'MISSING_FIELDS'
      );
    }

    next();
  };
};

export const validateIndianPhone = (field) => {
  return (req, res, next) => {
    const value = req.body[field];
    if (value === undefined || value === null || value === '') {
      return next();
    }

    const clean = String(value).trim().replace(/[\s\-+()]/g, '')
      .replace(/^91(?=\d{10}$)/, '')
      .replace(/^0(?=\d{10}$)/, '');
    const dummyNumbers = new Set(['0123456789', '1234567890', '9876543210', '9848012345']);
    const isSequential = clean.length === 10 && clean.split('').every((digit, index, digits) => {
      if (index === 0) return true;
      const difference = Number(digit) - Number(digits[index - 1]);
      return difference === 1 || difference === -1;
    });

    if (
      clean.length !== 10 ||
      !/^\d{10}$/.test(clean) ||
      !/^[6-9]\d{9}$/.test(clean) ||
      /^(\d)\1{9}$/.test(clean) ||
      dummyNumbers.has(clean) ||
      isSequential
    ) {
      return sendError(res, `Please provide a valid 10-digit Indian mobile number for ${field}`, 400);
    }

    next();
  };
};

export default {
  validateSchema,
  stripUnsafeKeys,
  escapeRegex,
  registerSchema,
  loginSchema,
  adminLoginSchema,
  otpVerifySchema,
  emailOnlySchema,
  resetPasswordSchema,
  updateProfileSchema,
  createOrderSchema,
  verifyPaymentSchema,
  caProfileCreateSchema,
  activateCaSchema,
  leadCreateSchema,
  validateBody,
  validateIndianPhone,
};

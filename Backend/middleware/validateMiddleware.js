import { z } from 'zod';
import validator from 'validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
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

export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password must not exceed 100 characters')
  .refine((val) => /[A-Z]/.test(val), 'Password must include at least one uppercase letter')
  .refine((val) => /[a-z]/.test(val), 'Password must include at least one lowercase letter')
  .refine((val) => /\d/.test(val), 'Password must include at least one number')
  .refine((val) => /[^A-Za-z0-9]/.test(val), 'Password must include at least one special character');

const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((val) => validator.isEmail(val), 'Invalid email address');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: normalizedEmailSchema,
    password: strongPasswordSchema,
    phone: z.string().optional(),
    company: z.string().max(150).optional(),
    role: z.enum(['user', 'ca', 'dpr_consultant', 'prosync', 'prosync_admin', 'promoter']).default('user').optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: normalizedEmailSchema,
    password: z.string().min(1, 'Password is required').max(100),
  })
  .strict();

export const adminLoginSchema = z
  .object({
    email: normalizedEmailSchema.refine((val) => /^[^\s@]+@gmail\.com$/i.test(val), 'Only valid @gmail.com addresses are permitted for admin access'),
    password: z.string().min(1, 'Password is required').max(100),
  })
  .strict();

export const otpVerifySchema = z
  .object({
    email: normalizedEmailSchema,
    otp: z.string().trim().refine((val) => validator.isNumeric(val, { no_symbols: true }) && val.length === 6, 'OTP must be exactly 6 digits'),
  })
  .strict();

export const emailOnlySchema = z
  .object({
    email: normalizedEmailSchema,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    email: normalizedEmailSchema,
    otp: z.string().trim().refine((val) => validator.isNumeric(val, { no_symbols: true }) && val.length === 6, 'OTP must be exactly 6 digits'),
    newPassword: strongPasswordSchema,
  })
  .strict();

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().optional(),
    company: z.string().max(150).optional(),
    avatarUrl: z
      .string()
      .optional()
      .refine((val) => !val || validator.isURL(val, { protocols: ['https', 'http'], require_protocol: true }), 'Invalid avatar URL'),
  })
  .strict();

export const createOrderSchema = z
  .object({
    amount: z.coerce.number().positive('Payment amount must be greater than zero').max(10000000),
    currency: z.string().min(3).max(6).default('INR').optional(),
    userEmail: normalizedEmailSchema.optional().or(z.literal('')),
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
    userEmail: normalizedEmailSchema.optional().or(z.literal('')),
    planName: z.string().max(120).optional(),
    paymentMethod: z.string().max(60).optional(),
  })
  .passthrough();

export const caProfileCreateSchema = z
  .object({
    name: z.string().trim().min(2, 'CA name is required').max(120),
    email: normalizedEmailSchema,
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
    password: strongPasswordSchema,
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().max(30).optional(),
    firmName: z.string().max(160).optional(),
    city: z.string().max(80).optional(),
  })
  .passthrough();

export const leadCreateSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required').max(150),
    email: normalizedEmailSchema,
    mobile: z.string().trim().min(10, 'Valid mobile number is required').max(24),
  })
  .passthrough();

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

    const parsed = parsePhoneNumberFromString(String(value).trim(), 'IN');
    const clean = parsed?.nationalNumber || String(value).trim().replace(/\D/g, '').slice(-10);

    const dummyNumbers = new Set(['0123456789', '1234567890', '9876543210', '9848012345']);
    const isSequential =
      clean.length === 10 &&
      clean.split('').every((digit, index, digits) => {
        if (index === 0) return true;
        const difference = Number(digit) - Number(digits[index - 1]);
        return difference === 1 || difference === -1;
      });

    if (
      (parsed && !parsed.isValid()) ||
      clean.length !== 10 ||
      !/^[6-9]\d{9}$/.test(clean) ||
      /^(\d)\1{9}$/.test(clean) ||
      dummyNumbers.has(clean) ||
      isSequential
    ) {
      return sendError(res, `Please provide a valid 10-digit Indian mobile number for ${field}`, 400);
    }

    req.body[field] = parsed?.number || `+91${clean}`;
    next();
  };
};

export default {
  validateSchema,
  stripUnsafeKeys,
  escapeRegex,
  strongPasswordSchema,
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

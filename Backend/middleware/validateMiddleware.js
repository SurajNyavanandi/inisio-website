import { z } from 'zod';
import { sendError } from '../utils/responseHandler.js';

/**
 * Escapes user input to safely use in regex queries without NoSQL injection
 */
export const escapeRegex = (string = '') => {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Middleware factory to validate req.body against a Zod schema
 */
export const validateSchema = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
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
    password: z.string().max(100).optional(),
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
  escapeRegex,
  registerSchema,
  loginSchema,
  adminLoginSchema,
  otpVerifySchema,
  emailOnlySchema,
  resetPasswordSchema,
  updateProfileSchema,
  validateBody,
  validateIndianPhone,
};

import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/responseHandler.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login/register requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return sendError(
      res,
      'Too many authentication requests from this IP. Please try again after 15 minutes.',
      429,
      undefined,
      'RATE_LIMIT_EXCEEDED'
    );
  },
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8, // Limit each IP to 8 OTP requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return sendError(
      res,
      'Too many OTP verification requests. Please try again after 15 minutes.',
      429,
      undefined,
      'OTP_RATE_LIMIT_EXCEEDED'
    );
  },
});

export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  handler: (_req, res) => {
    return sendError(
      res,
      'Too many requests to the API. Please slow down and try again shortly.',
      429,
      undefined,
      'RATE_LIMIT_EXCEEDED'
    );
  },
});

export default {
  authLimiter,
  otpLimiter,
  generalApiLimiter,
};

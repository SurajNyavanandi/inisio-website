import { isIP } from 'node:net';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { sendError } from '../utils/responseHandler.js';

const normalizeForwardedIp = (rawValue) => {
  if (!rawValue || typeof rawValue !== 'string') return '';
  let value = rawValue.trim().replace(/^"|"$/g, '');
  if (!value || value.startsWith('_') || value.toLowerCase() === 'unknown') {
    return '';
  }

  // Handle bracketed IPv6 like [2001:db8::1] or [2001:db8::1]:4711
  if (value.startsWith('[')) {
    const closingBracketIdx = value.indexOf(']');
    if (closingBracketIdx !== -1) {
      value = value.slice(1, closingBracketIdx);
    }
  } else if (value.includes('.') && value.includes(':')) {
    // Strip port from IPv4:port like 203.0.113.10:12345
    value = value.split(':')[0];
  }

  return isIP(value) ? value : '';
};

const parseForwardedHeader = (forwardedHeader) => {
  if (!forwardedHeader || typeof forwardedHeader !== 'string') return '';
  const entries = forwardedHeader.split(',');
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const directives = entries[i].split(';');
    for (const directive of directives) {
      const [rawKey, ...rawRest] = directive.split('=');
      if (rawKey && rawKey.trim().toLowerCase() === 'for' && rawRest.length > 0) {
        const ip = normalizeForwardedIp(rawRest.join('='));
        if (ip) return ip;
      }
    }
  }
  return '';
};

const extractClientIp = (req) => {
  // When trust proxy is enabled and X-Forwarded-For is set, Express resolves req.ip
  if (req.ip && req.ip !== req.socket?.remoteAddress) {
    return req.ip;
  }

  // Fall back to RFC 7239 Forwarded header if present
  const forwardedHeader = Array.isArray(req.headers?.forwarded)
    ? req.headers.forwarded.join(',')
    : req.headers?.forwarded;
  const forwardedIp = parseForwardedHeader(forwardedHeader);
  if (forwardedIp) {
    return forwardedIp;
  }

  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

const rateLimitKeyGenerator = (req) => {
  const clientIp = extractClientIp(req);
  return isIP(clientIp) ? ipKeyGenerator(clientIp, 56) : String(clientIp);
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login/register requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimitKeyGenerator,
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
  keyGenerator: rateLimitKeyGenerator,
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
  keyGenerator: rateLimitKeyGenerator,
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

import config from '../config/env.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'jwt',
  'otp',
  'secret',
  'authorization',
  'razorpay_signature',
  'cardnumber',
  'cvv',
]);

const maskSensitiveData = (data) => {
  if (!data) return data;
  if (typeof data === 'string') {
    // Mask potential token/jwt strings or passwords
    if (data.length > 30 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data)) {
      return '[MASKED_TOKEN]';
    }
    return data;
  }
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(maskSensitiveData);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      clean[key] = '[REDACTED]';
    } else {
      clean[key] = maskSensitiveData(value);
    }
  }
  return clean;
};

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  if (meta !== undefined) {
    const sanitizedMeta = maskSensitiveData(meta);
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${
      typeof sanitizedMeta === 'object' ? JSON.stringify(sanitizedMeta) : sanitizedMeta
    }`;
  }
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

export const logger = {
  info: (message, meta) => {
    console.log(formatMessage('info', message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatMessage('warn', message, meta));
  },
  error: (message, meta) => {
    console.error(formatMessage('error', message, meta));
  },
  debug: (message, meta) => {
    if (!config.isProd) {
      console.log(formatMessage('debug', message, meta));
    }
  },
};

export default logger;

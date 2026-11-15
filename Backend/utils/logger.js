import config from '../config/env.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'newpassword',
  'currentpassword',
  'otp',
  'token',
  'jwt',
  'secret',
  'key_secret',
  'authorization',
  'razorpay_signature',
  'cardnumber',
  'cvv',
  'pan',
  'aadhaar',
]);

export const redactSensitiveData = (data) => {
  if (!data) return data;
  if (typeof data === 'string') {
    // Redact JWT tokens or OTP patterns
    if (data.length > 30 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data)) {
      return '[MASKED_TOKEN]';
    }
    return data.replace(/(otp|code|password)\s*[:=]\s*['"]?([a-zA-Z0-9]{4,32})['"]?/gi, '$1: [REDACTED]');
  }
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  const sanitized = {};
  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = redactSensitiveData(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
};

const formatMessage = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  const safeArgs = args.map(redactSensitiveData);
  return {
    timestamp,
    level,
    message: redactSensitiveData(message),
    ...(safeArgs.length > 0 ? { details: safeArgs.length === 1 ? safeArgs[0] : safeArgs } : {}),
  };
};

export const logger = {
  info: (msg, ...args) => {
    const formatted = formatMessage('INFO', msg, ...args);
    console.log(`[${formatted.timestamp}] [INFO] ${typeof formatted.message === 'string' ? formatted.message : JSON.stringify(formatted.message)}`, formatted.details ? JSON.stringify(formatted.details) : '');
  },
  warn: (msg, ...args) => {
    const formatted = formatMessage('WARN', msg, ...args);
    console.warn(`[${formatted.timestamp}] [WARN] ${typeof formatted.message === 'string' ? formatted.message : JSON.stringify(formatted.message)}`, formatted.details ? JSON.stringify(formatted.details) : '');
  },
  error: (msg, ...args) => {
    const formatted = formatMessage('ERROR', msg, ...args);
    console.error(`[${formatted.timestamp}] [ERROR] ${typeof formatted.message === 'string' ? formatted.message : JSON.stringify(formatted.message)}`, formatted.details ? JSON.stringify(formatted.details) : '');
  },
  debug: (msg, ...args) => {
    if (!config.isProd && !config.isProduction) {
      const formatted = formatMessage('DEBUG', msg, ...args);
      console.log(`[${formatted.timestamp}] [DEBUG] ${typeof formatted.message === 'string' ? formatted.message : JSON.stringify(formatted.message)}`, formatted.details ? JSON.stringify(formatted.details) : '');
    }
  },
};

export default logger;

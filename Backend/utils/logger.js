import pino from 'pino';
import pinoHttp from 'pino-http';
import config from '../config/env.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'newpassword',
  'currentpassword',
  'otp',
  'token',
  'refreshtoken',
  'jwt',
  'secret',
  'key_secret',
  'authorization',
  'cookie',
  'razorpay_signature',
  'cardnumber',
  'cvv',
  'pan',
  'aadhaar',
]);

export const redactSensitiveData = (data) => {
  if (!data) return data;
  if (typeof data === 'string') {
    if (data.length > 30 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data)) {
      return '[MASKED_TOKEN]';
    }
    return data.replace(/(otp|code|password|token)\s*[:=]\s*['"]?([a-zA-Z0-9._-]{4,64})['"]?/gi, '$1: [REDACTED]');
  }
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactSensitiveData);

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

export const pinoInstance = pino({
  level: process.env.LOG_LEVEL || (config.isProduction ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.newPassword',
      '*.otp',
      '*.token',
      '*.refreshToken',
      '*.razorpay_signature',
      '*.key_secret',
      '*.pan',
      '*.aadhaar',
    ],
    censor: '[REDACTED]',
  },
  base: {
    service: 'inisio-backend',
    env: config.NODE_ENV,
  },
});

export const httpLogger = pinoHttp({
  logger: pinoInstance,
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url?.startsWith('/assets/'),
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return config.isProduction ? 'info' : 'debug';
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

export const logger = {
  info: (msg, meta) => {
    if (meta && typeof meta === 'object') {
      pinoInstance.info(redactSensitiveData(meta), redactSensitiveData(msg));
    } else {
      pinoInstance.info(redactSensitiveData(msg));
    }
  },
  warn: (msg, meta) => {
    if (meta && typeof meta === 'object') {
      pinoInstance.warn(redactSensitiveData(meta), redactSensitiveData(msg));
    } else {
      pinoInstance.warn(redactSensitiveData(msg));
    }
  },
  error: (msg, meta) => {
    if (meta && typeof meta === 'object') {
      pinoInstance.error(redactSensitiveData(meta), redactSensitiveData(msg));
    } else {
      pinoInstance.error(redactSensitiveData(msg));
    }
  },
  debug: (msg, meta) => {
    if (meta && typeof meta === 'object') {
      pinoInstance.debug(redactSensitiveData(meta), redactSensitiveData(msg));
    } else {
      pinoInstance.debug(redactSensitiveData(msg));
    }
  },
  httpLogger,
  pinoInstance,
};

export default logger;

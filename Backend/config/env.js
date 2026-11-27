import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search for .env in Backend root, repository root, or current working directory
const candidateEnvPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), 'Backend/.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config();

/**
 * Validates required backend environment variables on startup and fails fast
 * if any required variable is missing or malformed.
 */
export const validateEnv = () => {
  const missing = [];
  const isProd = process.env.NODE_ENV === 'production';

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length < 16) {
    missing.push('JWT_SECRET (must be set with at least 16 characters)');
  }

  if (isProd) {
    if (!process.env.MONGO_URI && !process.env.MONGODB_URI && !process.env.MONGO_URL) {
      missing.push('MONGO_URI / MONGODB_URI (required in production)');
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[Startup Validation Error] Missing required environment variables:\n  - ${missing.join(
      '\n  - '
    )}\nPlease define them in your .env file or deployment dashboard.`;
    console.error(errorMsg);
    if (isProd) throw new Error(errorMsg);
  }
};

const portRaw = process.env.PORT || process.env.APP_PORT || '5000';
const parsedPort = parseInt(portRaw, 10);
const validPort = !isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535 ? parsedPort : 3000;

const corsOriginRaw = process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS || '*';
const allowedOrigins = corsOriginRaw === '*'
  ? ['*']
  : corsOriginRaw.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';
const databaseUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/inisio';
const configuredJwtSecret = (process.env.JWT_SECRET || '').trim();
if (isProduction && configuredJwtSecret.length < 16) {
  throw new Error('[Startup Validation Error] JWT_SECRET (min 16 characters) is required in production.');
}
const jwtSecret = configuredJwtSecret || crypto.randomBytes(32).toString('hex');
const adminEmail1 = (process.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL_1 || 'admin@example.com').trim().toLowerCase();
const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || process.env.ADMIN_EMAIL_2 || 'superadmin@example.com').trim().toLowerCase();
const caAdminEmail = (process.env.CA_ADMIN || process.env.CA_ADMIN_EMAIL || 'ca.admin@example.com').trim().toLowerCase();

export const config = {
  // Flat properties (Phase 1 standard)
  PORT: validPort,
  port: validPort,
  NODE_ENV: process.env.NODE_ENV || 'development',
  env: process.env.NODE_ENV || 'development',
  isProd: isProduction,
  isProduction,
  MONGO_URI: databaseUri,
  databaseUri,
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d',
  RESEND_API_KEY: (process.env.RESEND_API_KEY || '').trim(),
  RESEND_DOMAIN: (process.env.RESEND_DOMAIN || '').trim().toLowerCase(),
  EMAIL_FROM: (
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.FROM_EMAIL ||
    process.env.MAIL_FROM ||
    'Inisio Advisory <no-reply@inisio.in>'
  ).trim(),
  ADMIN_EMAIL: adminEmail1,
  SUPERADMIN_EMAIL: superAdminEmail,
  SUPER_ADMIN_EMAIL: superAdminEmail,
  CA_ADMIN: caAdminEmail,
  CA_ADMIN_EMAIL: caAdminEmail,
  ALLOW_MEMORY_FALLBACK:
    process.env.ALLOW_MEMORY_FALLBACK === 'true' ||
    !isProduction ||
    !(process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL),
  allowMemoryFallback:
    process.env.ALLOW_MEMORY_FALLBACK === 'true' ||
    !isProduction ||
    !(process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL),
  APP_URL: (process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, ''),
  CORS_ORIGIN: corsOriginRaw,
  ALLOWED_ORIGINS: allowedOrigins,
  RAZORPAY_KEY_ID: (process.env.RAZORPAY_KEY_ID || '').trim(),
  RAZORPAY_KEY_SECRET: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
  RAZORPAY_WEBHOOK_SECRET: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),

  // Nested properties (compatibility)
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    allowedOrigins,
  },
  email: {
    resendApiKey: (process.env.RESEND_API_KEY || '').trim(),
    resendDomain: (process.env.RESEND_DOMAIN || '').trim().toLowerCase(),
    from: (
      process.env.EMAIL_FROM ||
      process.env.RESEND_FROM ||
      process.env.RESEND_FROM_EMAIL ||
      process.env.FROM_EMAIL ||
      process.env.MAIL_FROM ||
      'Inisio Advisory <no-reply@inisio.in>'
    ).trim(),
  },
  razorpay: {
    keyId: (process.env.RAZORPAY_KEY_ID || '').trim(),
    keySecret: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
    webhookSecret: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
  },
  admin: {
    email1: adminEmail1,
    email2: superAdminEmail,
    caAdmin: caAdminEmail,
    extraEmails: (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  },
  storage: {
    documentDir: process.env.DOCUMENT_STORAGE_DIR || '',
  },
};

export default config;

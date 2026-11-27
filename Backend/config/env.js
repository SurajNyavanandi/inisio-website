import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';

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

const isProduction = process.env.NODE_ENV === 'production';

const isDummySecret = (val = '') => {
  const clean = String(val || '').trim().toLowerCase();
  if (!clean) return true;
  return (
    clean.includes('dummy') ||
    clean.includes('placeholder') ||
    clean.includes('replace_me') ||
    clean.includes('changeme') ||
    clean === 'secret' ||
    clean === 'test_secret'
  );
};

const envValidationSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  JWT_SECRET: z.string().trim().optional(),
  JWT_REFRESH_SECRET: z.string().trim().optional(),
  MONGO_URI: z.string().trim().optional(),
  RAZORPAY_KEY_ID: z.string().trim().optional(),
  RAZORPAY_KEY_SECRET: z.string().trim().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().trim().optional(),
  RESEND_API_KEY: z.string().trim().optional(),
});

/**
 * Validates required backend environment variables on startup and fails fast in production
 * if any required secret is missing, malformed, or left at a dummy placeholder.
 */
export const validateEnv = () => {
  const parsed = envValidationSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || process.env.APP_PORT || 5000,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  });

  const issues = [];
  if (!parsed.success) {
    issues.push(...parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
  }

  const jwtSecretVal = (process.env.JWT_SECRET || '').trim();
  if (jwtSecretVal.length < 16 || (isProduction && (jwtSecretVal.length < 32 || isDummySecret(jwtSecretVal)))) {
    issues.push('JWT_SECRET (min 16 chars dev / min 32 chars non-dummy required in production)');
  }

  const refreshSecretVal = (process.env.JWT_REFRESH_SECRET || '').trim();
  if (isProduction && refreshSecretVal && (refreshSecretVal.length < 32 || isDummySecret(refreshSecretVal))) {
    issues.push('JWT_REFRESH_SECRET (min 32 chars non-dummy required when set in production)');
  }

  const mongoUriVal = (process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || '').trim();
  const rzpKeyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const rzpKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();

  if (isProduction) {
    if (!mongoUriVal || (!mongoUriVal.startsWith('mongodb://') && !mongoUriVal.startsWith('mongodb+srv://'))) {
      issues.push('MONGO_URI (valid MongoDB connection string required in production)');
    }
    if (isDummySecret(rzpKeyId) || isDummySecret(rzpKeySecret)) {
      issues.push('RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET (live non-dummy credentials required in production)');
    }
    if (isDummySecret(resendKey)) {
      issues.push('RESEND_API_KEY (valid non-dummy email API key required in production)');
    }
  }

  if (issues.length > 0) {
    const errorMsg = `[Startup Validation Error] Environment configuration issues:\n  - ${issues.join('\n  - ')}`;
    console.error(errorMsg);
    if (isProduction) {
      throw new Error(errorMsg);
    }
  }
};

validateEnv();

const portRaw = process.env.PORT || process.env.APP_PORT || '5000';
const parsedPort = parseInt(portRaw, 10);
const validPort = !isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535 ? parsedPort : 5000;

const corsOriginRaw = process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS || (isProduction ? '' : 'http://localhost:5173,http://localhost:5000');
const allowedOrigins = corsOriginRaw === '*'
  ? ['*']
  : corsOriginRaw.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);

const databaseUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/inisio';
const configuredJwtSecret = (process.env.JWT_SECRET || '').trim();
const jwtSecret = configuredJwtSecret || crypto.randomBytes(32).toString('hex');
const configuredRefreshSecret = (process.env.JWT_REFRESH_SECRET || '').trim();
const jwtRefreshSecret = configuredRefreshSecret || crypto.createHash('sha256').update(`${jwtSecret}:refresh`).digest('hex');
const otpHmacSecret = (process.env.OTP_HMAC_SECRET || '').trim() || crypto.createHash('sha256').update(`${jwtSecret}:otp`).digest('hex');

const adminEmail1 = (process.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL_1 || 'admin@example.com').trim().toLowerCase();
const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || process.env.ADMIN_EMAIL_2 || 'superadmin@example.com').trim().toLowerCase();
const caAdminEmail = (process.env.CA_ADMIN || process.env.CA_ADMIN_EMAIL || 'ca.admin@example.com').trim().toLowerCase();

const parsedBcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const bcryptRounds = Number.isFinite(parsedBcryptRounds) && parsedBcryptRounds >= 12 && parsedBcryptRounds <= 15 ? parsedBcryptRounds : 12;

// Strictly disallow in-memory fallback in production
const allowMemoryFallback = !isProduction && process.env.ALLOW_MEMORY_FALLBACK === 'true';

export const config = {
  PORT: validPort,
  port: validPort,
  NODE_ENV: process.env.NODE_ENV || 'development',
  env: process.env.NODE_ENV || 'development',
  isProd: isProduction,
  isProduction,
  MONGO_URI: databaseUri,
  databaseUri,
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '15m',
  JWT_REFRESH_SECRET: jwtRefreshSecret,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  OTP_HMAC_SECRET: otpHmacSecret,
  BCRYPT_ROUNDS: bcryptRounds,
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
  ALLOW_MEMORY_FALLBACK: allowMemoryFallback,
  allowMemoryFallback,
  APP_URL: (process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5000').replace(/\/$/, ''),
  CORS_ORIGIN: corsOriginRaw,
  ALLOWED_ORIGINS: allowedOrigins,
  RAZORPAY_KEY_ID: (process.env.RAZORPAY_KEY_ID || '').trim(),
  RAZORPAY_KEY_SECRET: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
  RAZORPAY_WEBHOOK_SECRET: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),

  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '15m',
    refreshSecret: jwtRefreshSecret,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
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
    s3Bucket: (process.env.S3_BUCKET || '').trim(),
    s3Region: (process.env.S3_REGION || 'ap-south-1').trim(),
    s3Endpoint: (process.env.S3_ENDPOINT || '').trim(),
    s3AccessKeyId: (process.env.S3_ACCESS_KEY_ID || '').trim(),
    s3SecretAccessKey: (process.env.S3_SECRET_ACCESS_KEY || '').trim(),
  },
  ocr: {
    provider: (process.env.OCR_PROVIDER || 'tesseract').trim().toLowerCase(),
    googleVisionApiKey: (process.env.GOOGLE_VISION_API_KEY || '').trim(),
  },
};

export default config;

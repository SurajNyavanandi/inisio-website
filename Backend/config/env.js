import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
<<<<<<< HEAD
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Look for .env in current working dir, parent dir, or package root
const potentialEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
];

for (const envPath of potentialEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config(); // Fallback default

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
    if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
      missing.push('MONGO_URI / MONGODB_URI (required in production)');
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[Startup Validation Error] Missing required environment variables:\n  - ${missing.join(
      '\n  - '
    )}\nPlease define them in your .env file or deployment dashboard.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
=======
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search for .env at repository root, current working directory, and backend directory
const candidateEnvPaths = [
  path.resolve(__dirname, '../../.env'), // Repository root from Backend/config/
  path.resolve(process.cwd(), '.env'),   // Current working directory
  path.resolve(__dirname, '../.env'),    // Backend root fallback
];

const resolvedEnvPath = candidateEnvPaths.find((p) => fs.existsSync(p));
if (resolvedEnvPath) {
  dotenv.config({ path: resolvedEnvPath });
} else {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  MONGO_URI: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ALLOWED_ORIGINS: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Inisio Capital Advisory <onboarding@resend.dev>'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  ADMIN_EMAIL_1: z.string().email().optional(),
  ADMIN_EMAIL_2: z.string().email().optional(),
  ADMIN_EMAILS: z.string().optional(),
  DOCUMENT_STORAGE_DIR: z.string().optional(),
  ALLOW_MEMORY_FALLBACK: z.string().default('true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ FATAL: Invalid environment variables configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
  }
}

const rawConfig = parsed.success ? parsed.data : process.env;

// Production checks
if (rawConfig.NODE_ENV === 'production') {
  const missing = [];
  if (!rawConfig.MONGO_URI && !rawConfig.MONGODB_URI) {
    missing.push('MONGO_URI or MONGODB_URI');
  }
  if (!rawConfig.JWT_SECRET) {
    missing.push('JWT_SECRET (min 16 chars)');
  }
  if (missing.length > 0) {
    console.error(`❌ FATAL: Missing critical production environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

// Normalized values
const databaseUri = rawConfig.MONGO_URI || rawConfig.MONGODB_URI || '';
const jwtSecret = rawConfig.JWT_SECRET || 'inisio_dev_fallback_secret_must_override_in_prod';
const isProduction = rawConfig.NODE_ENV === 'production';

// Parse allowed CORS origins
const resolveAllowedOrigins = () => {
  const rawOrigins = rawConfig.ALLOWED_ORIGINS || rawConfig.CORS_ORIGIN;
  if (!rawOrigins || rawOrigins === '*') {
    if (isProduction) {
      console.warn('⚠️ WARNING: Wildcard or empty CORS origin detected in production. Specify exact domains in ALLOWED_ORIGINS.');
    }
    return ['*'];
  }
  return rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);
};

<<<<<<< HEAD
const portRaw = process.env.PORT || '5000';
const parsedPort = parseInt(portRaw, 10);
const validPort = !isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535 ? parsedPort : 5000;

const corsOriginRaw = process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = corsOriginRaw
  ? corsOriginRaw.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean)
  : [];

export const config = {
  PORT: validPort,
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/inisio',
  JWT_SECRET: (process.env.JWT_SECRET || '').trim(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d',
  RESEND_API_KEY: (process.env.RESEND_API_KEY || '').trim(),
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL_1 || '').trim().toLowerCase(),
  SUPERADMIN_EMAIL: (process.env.SUPERADMIN_EMAIL || process.env.ADMIN_EMAIL_2 || '').trim().toLowerCase(),
  ALLOW_MEMORY_FALLBACK: process.env.ALLOW_MEMORY_FALLBACK === 'true' || process.env.NODE_ENV !== 'production',
  APP_URL: (process.env.APP_URL || process.env.FRONTEND_URL || 'https://inisio.in').replace(/\/$/, ''),
  CORS_ORIGIN: corsOriginRaw,
  ALLOWED_ORIGINS: allowedOrigins,
  RAZORPAY_KEY_ID: (process.env.RAZORPAY_KEY_ID || '').trim(),
  RAZORPAY_KEY_SECRET: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
  RAZORPAY_WEBHOOK_SECRET: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
};
=======
export const config = Object.freeze({
  env: rawConfig.NODE_ENV,
  isProduction,
  port: rawConfig.PORT || 5000,
  databaseUri,
  jwt: {
    secret: jwtSecret,
    expiresIn: rawConfig.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    allowedOrigins: resolveAllowedOrigins(),
  },
  email: {
    resendApiKey: rawConfig.RESEND_API_KEY || '',
    from: rawConfig.EMAIL_FROM,
  },
  razorpay: {
    keyId: rawConfig.RAZORPAY_KEY_ID || '',
    keySecret: rawConfig.RAZORPAY_KEY_SECRET || '',
    webhookSecret: rawConfig.RAZORPAY_WEBHOOK_SECRET || '',
  },
  admin: {
    email1: (rawConfig.ADMIN_EMAIL_1 || '').toLowerCase().trim(),
    email2: (rawConfig.ADMIN_EMAIL_2 || '').toLowerCase().trim(),
    extraEmails: (rawConfig.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  },
  storage: {
    documentDir: rawConfig.DOCUMENT_STORAGE_DIR || '',
  },
  allowMemoryFallback: isProduction ? rawConfig.ALLOW_MEMORY_FALLBACK === 'true' : true,
});
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92

export default config;

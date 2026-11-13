import dotenv from 'dotenv';
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
  }
};

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

export default config;

import dotenv from 'dotenv';

dotenv.config();

/**
 * Validate essential backend environment variables on startup
 */
export const validateEnv = () => {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && !process.env.JWT_SECRET) {
    console.error('❌ CRITICAL: JWT_SECRET environment variable is missing in production!');
    process.exit(1);
  }
};

export const config = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/inisio',
  JWT_SECRET: process.env.JWT_SECRET || 'inisio_secure_jwt_secret_token_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d',
  RESEND_API_KEY: (process.env.RESEND_API_KEY || '').trim(),
  ALLOW_MEMORY_FALLBACK: process.env.ALLOW_MEMORY_FALLBACK !== 'false',
  APP_URL: (process.env.APP_URL || process.env.FRONTEND_URL || 'https://inisio.in').replace(/\/$/, ''),
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  RAZORPAY_KEY_ID: (process.env.RAZORPAY_KEY_ID || '').trim(),
  RAZORPAY_KEY_SECRET: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
};

export default config;

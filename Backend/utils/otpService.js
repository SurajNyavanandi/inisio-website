import crypto from 'crypto';
import config from '../config/env.js';

/**
 * Centralized OTP Service for Authentication & Password Reset
 * Generates cryptographically secure 6-digit OTP codes and stores/verifies HMAC-SHA256 digests.
 */

export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Generate a cryptographically random 6-digit OTP code.
 */
export const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Derive an HMAC-SHA256 digest of a 6-digit OTP before persisting to storage.
 */
export const hashOtpCode = (otp) => {
  if (!otp) return null;
  const clean = String(otp).trim();
  return crypto
    .createHmac('sha256', config.OTP_HMAC_SECRET)
    .update(clean)
    .digest('hex');
};

/**
 * Timing-safe verification of a submitted OTP against a stored HMAC digest.
 */
export const verifyOtpCode = (storedDigest, submittedOtp) => {
  if (!storedDigest || !submittedOtp) return false;
  const cleanStored = String(storedDigest).trim();
  const submittedDigest = hashOtpCode(submittedOtp);
  if (!submittedDigest) return false;

  try {
    if (cleanStored.length === submittedDigest.length) {
      return crypto.timingSafeEqual(
        Buffer.from(cleanStored, 'utf8'),
        Buffer.from(submittedDigest, 'utf8')
      );
    }
    return false;
  } catch {
    return false;
  }
};

export default {
  isProduction,
  generateOtp,
  hashOtpCode,
  verifyOtpCode,
};

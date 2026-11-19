import crypto from 'crypto';

/**
 * Centralized OTP Service for Authentication & Password Reset
 * Generates cryptographically secure 6-digit OTP codes for real-time email delivery via Resend.
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
 * Strictly verify a submitted 6-digit OTP against the expected OTP.
 */
export const verifyOtpCode = (expectedOtp, submittedOtp) => {
  if (!expectedOtp || !submittedOtp) return false;
  const cleanExpected = String(expectedOtp).trim();
  const cleanSubmitted = String(submittedOtp).trim();
  if (cleanExpected.length !== cleanSubmitted.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(cleanExpected), Buffer.from(cleanSubmitted));
  } catch {
    return cleanExpected === cleanSubmitted;
  }
};

export const FIXED_TEST_OTP = '';

export default {
  FIXED_TEST_OTP,
  isProduction,
  generateOtp,
  verifyOtpCode,
};

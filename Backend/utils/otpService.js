/**
 * Centralized OTP Service for Authentication, Verification, and Testing
 *
 * In non-production environments, uses a fixed test OTP ('123456') so users
 * and role accounts do not have to type it manually during local tests.
 * In production, generates cryptographically random 6-digit codes.
 *
 * Can be swapped with Resend, Twilio, or another email/SMS service later.
 */

export const FIXED_TEST_OTP = '123456';

export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Generate a 6-digit OTP code.
 */
export const generateOtp = () => {
  if (!isProduction()) {
    return FIXED_TEST_OTP;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Verify a submitted OTP against expected OTP.
 */
export const verifyOtpCode = (expectedOtp, submittedOtp) => {
  if (!submittedOtp) return false;
  const cleanSubmitted = String(submittedOtp).trim();

  // In non-production, the fixed test OTP is always accepted
  if (!isProduction() && cleanSubmitted === FIXED_TEST_OTP) {
    return true;
  }

  if (!expectedOtp) return false;
  const cleanExpected = String(expectedOtp).trim();

  return cleanExpected === cleanSubmitted;
};

export default {
  FIXED_TEST_OTP,
  isProduction,
  generateOtp,
  verifyOtpCode,
};

/**
 * Centralized Client-Side OTP Service
 *
 * In non-production environments, provides fixed test OTP ('123456') to auto-fill
 * verification and login flows so users do not have to type it manually during testing.
 */

export const FIXED_TEST_OTP = '123456';

export const isNonProduction = (): boolean => {
  return import.meta.env.MODE !== 'production';
};

/**
 * Returns the auto-fill OTP in non-production environments.
 */
export const getAutoFillOtp = (): string => {
  return isNonProduction() ? FIXED_TEST_OTP : '';
};

export default {
  FIXED_TEST_OTP,
  isNonProduction,
  getAutoFillOtp,
};

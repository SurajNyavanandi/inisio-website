/**
 * Centralized Client-Side OTP Helper
 *
 * Real 6-digit verification and reset codes are delivered in real time via Resend.
 */

export const isNonProduction = (): boolean => {
  return import.meta.env.MODE !== 'production';
};

export const getAutoFillOtp = (): string => {
  return '';
};

export default {
  isNonProduction,
  getAutoFillOtp,
};

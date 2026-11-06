import Razorpay from 'razorpay';
import { config } from './env.js';

let razorpayInstance = null;

/**
 * Returns the current Razorpay gateway configuration state.
 */
export const getRazorpayConfig = () => {
  const key_id = config.RAZORPAY_KEY_ID;
  const key_secret = config.RAZORPAY_KEY_SECRET;
  const webhook_secret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  const isConfigured = Boolean(key_id && key_secret);

  return {
    key_id,
    key_secret,
    webhook_secret,
    isConfigured,
    isTestMode: key_id.startsWith('rzp_test_') || !isConfigured,
  };
};

/**
 * Lazily initializes and returns the Razorpay instance.
 */
export const getRazorpayInstance = () => {
  const cfg = getRazorpayConfig();
  if (!cfg.isConfigured) {
    return null;
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: cfg.key_id,
      key_secret: cfg.key_secret,
    });
  }
  return razorpayInstance;
};

export default {
  getRazorpayConfig,
  getRazorpayInstance,
};

import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  adminLogin,
  verifyEmail,
  getMe,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
  sendVerificationOtp,
} from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import {
  validateSchema,
  registerSchema,
  loginSchema,
  otpVerifySchema,
  emailOnlySchema,
  resetPasswordSchema,
  updateProfileSchema,
  validateIndianPhone,
} from '../middleware/validateMiddleware.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Public authentication routes (Rate limited + Schema validated)
router.post('/register', authLimiter, validateSchema(registerSchema), validateIndianPhone('phone'), register);
router.post('/login', authLimiter, validateSchema(loginSchema), login);
router.post('/admin-login', authLimiter, validateSchema(loginSchema), adminLogin);

// OTP routes (Strict rate limiting)
router.post('/verify-email', otpLimiter, validateSchema(otpVerifySchema), verifyEmail);
router.post('/verify-otp', otpLimiter, validateSchema(otpVerifySchema), verifyOtp);
router.post('/forgot-password', otpLimiter, validateSchema(emailOnlySchema), forgotPassword);
router.post('/reset-password', otpLimiter, validateSchema(resetPasswordSchema), resetPassword);
router.post('/send-verification', otpLimiter, validateSchema(emailOnlySchema), sendVerificationOtp);
router.post('/resend-verification', otpLimiter, validateSchema(emailOnlySchema), sendVerificationOtp);

// Protected routes
router.get('/me', authenticateUser, getMe);
router.put('/profile', authenticateUser, validateSchema(updateProfileSchema), validateIndianPhone('phone'), updateProfile);

export default router;

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

<<<<<<< HEAD
// Strict rate limiter for sensitive authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 429,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// Public auth routes with rate limiting
router.post('/register', authLimiter, validateBody(['name', 'email', 'password']), validateIndianPhone('phone'), register);
router.post('/login', authLimiter, validateBody(['email', 'password']), login);
router.post('/admin-login', authLimiter, validateBody(['email', 'password']), adminLogin);
router.post('/verify-email', authLimiter, validateBody(['email', 'otp']), verifyEmail);
router.post('/verify-otp', authLimiter, validateBody(['email', 'otp']), verifyOtp);
router.post('/forgot-password', authLimiter, validateBody(['email']), forgotPassword);
router.post('/reset-password', authLimiter, validateBody(['email', 'otp', 'newPassword']), resetPassword);
router.post('/send-verification', authLimiter, validateBody(['email']), sendVerificationOtp);
router.post('/resend-verification', authLimiter, validateBody(['email']), sendVerificationOtp);

// Protected routes with rate limiting
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120, // 120 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/me', profileLimiter, authenticateUser, getMe);
router.put('/profile', profileLimiter, authenticateUser, validateIndianPhone('phone'), updateProfile);
=======
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
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92

export default router;

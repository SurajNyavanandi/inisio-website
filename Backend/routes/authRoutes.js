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
import { validateBody, validateIndianPhone } from '../middleware/validateMiddleware.js';

const router = express.Router();

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

export default router;

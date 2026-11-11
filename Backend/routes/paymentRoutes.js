import express from 'express';
import {
  getGatewayConfig,
  createCheckoutOrder,
  verifyPaymentSignature,
  getPaymentHistory,
  getPaymentById,
  handleWebhook,
} from '../controllers/paymentController.js';
import { authenticateUser, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public gateway configuration
router.get('/config', getGatewayConfig);

// Create checkout order
router.post('/create-order', optionalAuth, createCheckoutOrder);

// Verify signature and fulfill payment
router.post('/verify-signature', optionalAuth, verifyPaymentSignature);

// Payment history (Authenticated & scoped to user)
router.get('/history', authenticateUser, getPaymentHistory);

// Single transaction lookup (Authenticated & owner-checked)
router.get('/:id', authenticateUser, getPaymentById);

// Razorpay Webhook endpoint
router.post('/webhook', handleWebhook);

export default router;

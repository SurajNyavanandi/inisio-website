import express from 'express';
import {
  getGatewayConfig,
  getMembershipSummary,
  createCheckoutOrder,
  verifyPaymentSignature,
  getPaymentHistory,
  getPaymentById,
  handleWebhook,
} from '../controllers/paymentController.js';
import { authenticateUser, optionalAuth } from '../middleware/authMiddleware.js';
import {
  validateSchema,
  createOrderSchema,
  verifyPaymentSchema,
} from '../middleware/validateMiddleware.js';

const router = express.Router();

// Public gateway configuration
router.get('/config', getGatewayConfig);

// Authoritative membership status & quota summary
router.get('/membership-summary', optionalAuth, getMembershipSummary);

// Create checkout order
router.post('/create-order', optionalAuth, validateSchema(createOrderSchema), createCheckoutOrder);

// Verify signature and fulfill payment
router.post('/verify-signature', optionalAuth, validateSchema(verifyPaymentSchema), verifyPaymentSignature);

// Payment history (Authenticated - strictly scoped by user or admin)
router.get('/history', authenticateUser, getPaymentHistory);

// Single transaction lookup (Authenticated - verified ownership)
router.get('/:id', authenticateUser, getPaymentById);

// Razorpay Webhook endpoint
router.post('/webhook', handleWebhook);

export default router;

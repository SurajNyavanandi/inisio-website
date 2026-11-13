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

<<<<<<< HEAD
// Payment history (Authenticated - strictly scoped by user or admin)
router.get('/history', authenticateUser, getPaymentHistory);

// Single transaction lookup (Authenticated - verified ownership)
=======
// Payment history (Authenticated & scoped to user)
router.get('/history', authenticateUser, getPaymentHistory);

// Single transaction lookup (Authenticated & owner-checked)
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
router.get('/:id', authenticateUser, getPaymentById);

// Razorpay Webhook endpoint
router.post('/webhook', handleWebhook);

export default router;

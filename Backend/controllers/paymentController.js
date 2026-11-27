import {
  createOrder,
  verifyPayment as verifyRazorpayPayment,
  verifyAndProcessWebhook,
  getUserPayments,
  getPaymentDetails,
} from '../services/razorpayService.js';
import { getRazorpayConfig } from '../config/razorpay.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { MEMBERSHIP_PLANS_LIST, GST_RATE } from '../utils/membershipPlans.js';
import { checkUserAssessmentQuota } from '../utils/assessmentQuota.js';
import { getMemoryLeads } from '../services/leadService.js';
import { getMemoryProjects } from '../services/projectService.js';
import notificationService from '../services/notificationService.js';
import logger from '../utils/logger.js';

export const MEMBERSHIP_PLANS = MEMBERSHIP_PLANS_LIST;

/**
 * @desc Get public payment gateway config (Key ID, currency, test mode status, GST-separated plans)
 * @route GET /api/payments/config
 * @access Public
 */
export const getGatewayConfig = async (req, res, next) => {
  try {
    const config = getRazorpayConfig();
    return sendSuccess(
      res,
      {
        keyId: config.key_id || '',
        isConfigured: config.isConfigured,
        isTestMode: config.isTestMode,
        currency: 'INR',
        gstRate: GST_RATE,
        gstPercentage: Math.round(GST_RATE * 100),
        merchantName: 'Inisio Advisory Platform',
        themeColor: '#2563EB',
        plans: MEMBERSHIP_PLANS_LIST,
      },
      'Payment gateway configuration retrieved'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get authoritative membership summary, quota counts & expiry alert status for logged-in user
 * @route GET /api/payments/membership-summary
 * @access Authenticated / Optional
 */
export const getMembershipSummary = async (req, res, next) => {
  try {
    const summary = await checkUserAssessmentQuota({
      user: req.user || null,
      email: req.query?.email || req.user?.email || '',
      mobile: req.query?.mobile || req.user?.phone || '',
      memoryLeads: getMemoryLeads(),
      memoryProjects: getMemoryProjects(),
    });

    // Notify promoter in-app before expiry if expiring soon
    if (summary.isExpiringSoon && (req.user?.email || req.query?.email)) {
      const targetEmail = String(req.user?.email || req.query?.email).toLowerCase().trim();
      notificationService.createNotification({
        type: 'MEMBERSHIP_EXPIRY_NOTICE',
        title: 'Membership Expiring Soon',
        message: `Your ${summary.membershipTier} plan expires in ${summary.daysRemaining} day(s). Your project records remain safe; renew anytime to retain paid benefits.`,
        userEmail: targetEmail,
      }).catch(() => {});
    }

    return sendSuccess(res, summary, 'Membership summary retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create a new Razorpay checkout order
 * @route POST /api/payments/create-order
 * @access Public / Authenticated
 */
export const createCheckoutOrder = async (req, res, next) => {
  try {
    const {
      amount,
      currency,
      userEmail,
      userName,
      userPhone,
      itemType,
      itemId,
      planId,
      planName,
      billingCycle,
      consentAccepted,
      notes,
    } = req.body;

    const email = req.user?.email || userEmail;
    const name = req.user?.name || userName;
    const phone = req.user?.phone || userPhone;

    const order = await createOrder({
      amount,
      currency,
      userEmail: email,
      userName: name,
      userPhone: phone,
      itemType: itemType || 'membership',
      itemId,
      planId,
      planName,
      billingCycle,
      consentAccepted,
      notes,
    });

    return sendSuccess(res, order, 'Checkout order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Verify Razorpay payment signature & activate membership
 * @route POST /api/payments/verify-signature
 * @access Public / Authenticated
 */
export const verifyPaymentSignature = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userEmail,
      planId,
      planName,
      paymentMethod,
    } = req.body;

    const email = req.user?.email || userEmail;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return sendError(res, 'Missing razorpay_order_id or razorpay_payment_id', 400);
    }

    const result = await verifyRazorpayPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userEmail: email,
      planId,
      planName,
      paymentMethod,
    });

    return sendSuccess(res, result, 'Payment verified and membership activated', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get payment / transaction history
 * @route GET /api/payments/history
 * @access Authenticated
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const isPrivileged = ['admin', 'superadmin', 'admin1', 'admin2', 'admin3'].includes(req.user?.role);
    const targetEmail = isPrivileged && req.query.email ? req.query.email : req.user?.email;
    if (!targetEmail) {
      return sendError(res, 'User email not found', 400);
    }
    const payments = await getUserPayments(targetEmail);
    return sendSuccess(res, payments, 'Payment transactions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get payment transaction by Order ID or Payment ID
 * @route GET /api/payments/:id
 * @access Authenticated (Owner or Admin)
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await getPaymentDetails(id);
    if (!payment) {
      return sendError(res, 'Payment transaction not found', 404);
    }

    const isPrivileged = ['admin', 'superadmin', 'admin1', 'admin2', 'admin3'].includes(req.user?.role);
    const isOwner = Boolean(
      (payment.userEmail && req.user?.email && payment.userEmail.toLowerCase() === req.user.email.toLowerCase()) ||
        (payment.userId && req.user?._id && String(payment.userId) === String(req.user._id))
    );

    if (!isPrivileged && !isOwner) {
      return sendError(res, 'Access denied: You are not authorized to view this payment record', 403);
    }
    return sendSuccess(res, payment, 'Payment transaction retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Razorpay Webhook Handler (receives raw body buffer via express.raw)
 * @route POST /api/payments/webhook
 * @access Public (Strict HMAC-SHA256 timingSafeEqual Signature Verified)
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const result = await verifyAndProcessWebhook({
      rawBody: req.body,
      signature: webhookSignature,
    });
    logger.info(`[Razorpay Webhook] Processed event: ${result.eventReceived}`);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ status: 'invalid_signature', message: error.message });
    }
    next(error);
  }
};

export default {
  getGatewayConfig,
  getMembershipSummary,
  createCheckoutOrder,
  verifyPaymentSignature,
  getPaymentHistory,
  getPaymentById,
  handleWebhook,
};

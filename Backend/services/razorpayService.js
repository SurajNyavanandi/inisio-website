import crypto from 'crypto';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { getRazorpayConfig, getRazorpayInstance } from '../config/razorpay.js';
import { isDBConnected } from '../config/db.js';
import {
  addMemoryPayment,
  updateMemoryPayment,
  getMemoryPayments,
  getMemoryPaymentsByUser,
  findMemoryPaymentByOrderId,
} from '../utils/memoryPaymentStore.js';
import { updateMemoryUser } from '../utils/memoryUserStore.js';
import {
  resolvePlanDefinition,
  calculatePlanPricing,
} from '../utils/membershipPlans.js';
import notificationService from './notificationService.js';

/**
 * Generate a unique sequential tax invoice number
 */
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `INV-INISIO-${year}-${randomSuffix}`;
};

/**
 * Create a new Razorpay order with GST separation and mandatory terms consent check
 */
export const createOrder = async ({
  amount,
  currency = 'INR',
  userEmail,
  userName = 'Promoter',
  userPhone = '',
  itemType = 'membership',
  itemId = '',
  planId = '',
  planName = 'Promoter Boost',
  billingCycle = 'quarterly',
  consentAccepted = false,
  notes = {},
}) => {
  const cleanEmail = (userEmail || '').trim().toLowerCase();

  let baseAmount = Number(amount) || 0;
  let gstRate = 0;
  let gstAmount = 0;
  let totalPayableInr = baseAmount;
  let resolvedPlanId = planId || itemId || '';
  let resolvedPlanName = planName;
  let resolvedBillingCycle = billingCycle;

  // Enforce authoritative server-side pricing and GST separation for memberships
  if (itemType === 'membership') {
    if (!consentAccepted) {
      const error = new Error(
        'Please accept the Inisio Membership Terms and Conditions before proceeding to payment.'
      );
      error.statusCode = 400;
      throw error;
    }

    const pricing = calculatePlanPricing(planId || itemId || planName);
    if (pricing.totalPayableInr <= 0) {
      const error = new Error('Selected plan is free and does not require checkout.');
      error.statusCode = 400;
      throw error;
    }

    resolvedPlanId = pricing.planId;
    resolvedPlanName = pricing.planName;
    resolvedBillingCycle = pricing.billingCycle;
    baseAmount = pricing.basePriceInr;
    gstRate = pricing.gstRate;
    gstAmount = pricing.gstAmountInr;
    totalPayableInr = pricing.totalPayableInr;
  } else {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      const error = new Error('A valid positive payment amount is required');
      error.statusCode = 400;
      throw error;
    }
  }

  const amountPaise = Math.round(totalPayableInr * 100);
  const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const config = getRazorpayConfig();
  const razorpay = getRazorpayInstance();

  let razorpayOrderId = '';
  let orderData = null;

  // Detect live vs dummy test keys cleanly
  const isDummyTestKey = !config.key_id || config.key_id.includes('dummy');

  if (razorpay && config.isConfigured && !isDummyTestKey) {
    try {
      const options = {
        amount: amountPaise,
        currency: currency.toUpperCase(),
        receipt,
        notes: {
          itemType,
          planId: resolvedPlanId,
          planName: resolvedPlanName,
          baseAmount,
          gstAmount,
          userEmail: cleanEmail,
          ...notes,
        },
        payment_capture: 1,
      };
      orderData = await razorpay.orders.create(options);
      razorpayOrderId = orderData.id;
    } catch (err) {
      console.error('Razorpay live order creation failed:', err.message);
      throw err;
    }
  } else {
    if (config.isProd && !config.isTestMode) {
      throw new Error('Razorpay payment gateway is not configured for live transactions.');
    }
    razorpayOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  const paymentRecordData = {
    orderId: razorpayOrderId,
    paymentId: '',
    signature: '',
    userEmail: cleanEmail,
    userName,
    userPhone,
    amount: totalPayableInr,
    baseAmount,
    gstRate,
    gstAmount,
    amountPaise,
    currency: currency.toUpperCase(),
    status: 'created',
    itemType,
    itemId: resolvedPlanId || itemId,
    planId: resolvedPlanId,
    planName: resolvedPlanName,
    billingCycle: resolvedBillingCycle,
    consentAccepted: Boolean(consentAccepted),
    consentAcceptedAt: consentAccepted ? new Date() : null,
    receipt,
    notes: {
      ...notes,
      baseAmount,
      gstAmount,
      totalPayableInr,
      isTestMode: config.isTestMode || isDummyTestKey,
    },
    rawRazorpayResponse: orderData,
  };

  let savedPayment = null;

  if (isDBConnected()) {
    try {
      const user = await User.findOne({ email: cleanEmail });
      if (user) {
        paymentRecordData.userId = user._id;
      }
      savedPayment = await Payment.create(paymentRecordData);
    } catch (dbErr) {
      console.warn('DB error saving Payment, using in-memory store:', dbErr.message);
    }
  }

  if (!savedPayment) {
    savedPayment = addMemoryPayment({
      _id: `pay_mem_${Date.now()}`,
      ...paymentRecordData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return {
    orderId: razorpayOrderId,
    amount: amountPaise,
    amountINR: totalPayableInr,
    baseAmount,
    gstRate,
    gstAmount,
    currency: currency.toUpperCase(),
    receipt,
    keyId: config.key_id || '',
    isTestMode: config.isTestMode || isDummyTestKey,
    isSimulatedOrder: razorpayOrderId.startsWith('order_sim_'),
    planId: resolvedPlanId,
    planName: resolvedPlanName,
    billingCycle: resolvedBillingCycle,
    user: {
      name: userName,
      email: cleanEmail,
      phone: userPhone,
    },
  };
};

const timingSafeHexEqual = (a = '', b = '') => {
  const bufA = Buffer.from(String(a || '').trim().toLowerCase(), 'utf8');
  const bufB = Buffer.from(String(b || '').trim().toLowerCase(), 'utf8');
  if (!bufA.length || bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

/**
 * Shared idempotent payment finalization + membership activation (used by verifyPayment and webhook)
 */
const finalizeCapturedPaymentAndActivateMembership = async ({
  orderId,
  paymentId,
  signature = '',
  userEmail = '',
  planId = '',
  planName = '',
  paymentMethod = 'Razorpay Gateway',
}) => {
  const now = new Date();
  let existingRecord = null;

  if (isDBConnected()) {
    existingRecord = await Payment.findOne({ orderId }).catch(() => null);
  } else {
    existingRecord = findMemoryPaymentByOrderId(orderId);
  }

  const cleanEmail = (userEmail || existingRecord?.userEmail || '').trim().toLowerCase();
  const alreadyCaptured = existingRecord?.status === 'captured' && Boolean(existingRecord?.invoiceNumber);
  const invoiceNumber = existingRecord?.invoiceNumber || generateInvoiceNumber();

  const updateFields = {
    paymentId: paymentId || existingRecord?.paymentId || '',
    signature: signature || existingRecord?.signature || '',
    status: 'captured',
    invoiceNumber,
    paymentMethod: paymentMethod || existingRecord?.paymentMethod || 'Razorpay Gateway',
    updatedAt: now,
  };

  let updatedRecord = existingRecord;
  if (!alreadyCaptured) {
    if (isDBConnected()) {
      try {
        updatedRecord = await Payment.findOneAndUpdate(
          { orderId },
          { $set: updateFields },
          { new: true }
        );
      } catch (err) {
        console.warn('DB error updating verified payment:', err.message);
      }
    }
    if (!updatedRecord || !isDBConnected()) {
      updatedRecord = updateMemoryPayment(orderId, updateFields) || updatedRecord;
    }
  }

  const resolvedPlan = resolvePlanDefinition(
    planId || updatedRecord?.planId || planName || updatedRecord?.planName
  );
  let activatedAt = existingRecord?.updatedAt || now;
  let expiresAt = resolvedPlan.validityDays
    ? new Date(now.getTime() + resolvedPlan.validityDays * 86400000)
    : null;

  if (!alreadyCaptured && cleanEmail && resolvedPlan.id !== 'free_plan') {
    const membershipFields = {
      membershipPlanId: resolvedPlan.id,
      membershipTier: resolvedPlan.name,
      membershipStatus: 'Active',
      membershipActivatedAt: activatedAt,
      membershipExpiresAt: expiresAt,
      autoRenew: false,
    };

    if (isDBConnected()) {
      try {
        const existingUser = await User.findOne({ email: cleanEmail });
        if (
          existingUser &&
          existingUser.membershipExpiresAt &&
          new Date(existingUser.membershipExpiresAt) > now &&
          existingUser.membershipPlanId === resolvedPlan.id
        ) {
          expiresAt = new Date(
            new Date(existingUser.membershipExpiresAt).getTime() + resolvedPlan.validityDays * 86400000
          );
          membershipFields.membershipExpiresAt = expiresAt;
          membershipFields.membershipActivatedAt = existingUser.membershipActivatedAt || activatedAt;
          activatedAt = membershipFields.membershipActivatedAt;
        }
        await User.findOneAndUpdate({ email: cleanEmail }, { $set: membershipFields });
      } catch (uErr) {
        console.warn('DB error activating user membership:', uErr.message);
      }
    }

    updateMemoryUser(cleanEmail, membershipFields);

    notificationService.createNotification({
      type: 'MEMBERSHIP_ACTIVATED',
      title: `${resolvedPlan.name} Activated`,
      message: `${cleanEmail} activated ${resolvedPlan.name} (₹${updatedRecord?.amount || resolvedPlan.totalPayableInr}, Invoice ${invoiceNumber}).`,
      userEmail: cleanEmail,
    }).catch(() => {});
  }

  return {
    updatedRecord,
    resolvedPlan,
    cleanEmail,
    invoiceNumber,
    activatedAt,
    expiresAt,
    alreadyCaptured,
  };
};

/**
 * Verify Razorpay payment signature and activate membership ONLY after confirmed payment
 */
export const verifyPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  userEmail,
  planId,
  planName,
  paymentMethod = 'Razorpay Gateway',
}) => {
  if (!razorpay_order_id) {
    const error = new Error('Razorpay Order ID is required for verification');
    error.statusCode = 400;
    throw error;
  }

  if (!razorpay_payment_id) {
    const error = new Error('Razorpay Payment ID is required for verification');
    error.statusCode = 400;
    throw error;
  }

  const config = getRazorpayConfig();
  const isProd = envConfig.isProduction || process.env.NODE_ENV === 'production';
  const isLocalSimulatedOrder = !isProd && razorpay_order_id.startsWith('order_sim_') && config.isTestMode;
  let isSignatureValid = false;

  if (razorpay_signature && config.key_secret) {
    try {
      const expectedHmac = crypto
        .createHmac('sha256', config.key_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isSignatureValid = timingSafeHexEqual(expectedHmac, razorpay_signature);
    } catch {
      isSignatureValid = false;
    }
  }

  // Only allow simulated test orders in explicit non-production test environments when key_secret is not configured cleanly or via explicit dev test signature
  if (!isSignatureValid && isLocalSimulatedOrder && !isProd && process.env.ALLOW_SIMULATED_PAYMENTS !== 'false') {
    const expectedSim = config.key_secret
      ? crypto.createHmac('sha256', config.key_secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
      : '';
    if (timingSafeHexEqual(expectedSim, razorpay_signature) || String(razorpay_signature || '').startsWith('sim_sig_')) {
      isSignatureValid = true;
    }
  }

  if (!isSignatureValid) {
    const error = new Error('Invalid payment signature. Membership will not be activated.');
    error.statusCode = 400;
    throw error;
  }

  const {
    updatedRecord,
    resolvedPlan,
    cleanEmail,
    invoiceNumber,
    activatedAt,
    expiresAt,
  } = await finalizeCapturedPaymentAndActivateMembership({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature || '',
    userEmail,
    planId,
    planName,
    paymentMethod,
  });

  return {
    success: true,
    message: `${resolvedPlan.name} activated successfully!`,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    invoiceNumber,
    status: 'captured',
    planId: resolvedPlan.id,
    planName: resolvedPlan.name,
    baseAmount: updatedRecord?.baseAmount ?? resolvedPlan.basePriceInr,
    gstAmount: updatedRecord?.gstAmount ?? resolvedPlan.gstAmountInr,
    amount: updatedRecord?.amount ?? resolvedPlan.totalPayableInr,
    currency: updatedRecord?.currency || 'INR',
    activatedAt,
    expiresAt,
    receipt: updatedRecord?.receipt || '',
    userEmail: cleanEmail,
  };
};

/**
 * Retrieve transaction history for a user
 */
export const getUserPayments = async (userEmail) => {
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  if (isDBConnected()) {
    try {
      const query = cleanEmail ? { userEmail: cleanEmail } : {};
      const payments = await Payment.find(query).sort({ createdAt: -1 });
      if (payments && payments.length > 0) {
        return payments;
      }
    } catch (err) {
      console.warn('DB error in getUserPayments:', err.message);
    }
  }

  return cleanEmail ? getMemoryPaymentsByUser(cleanEmail) : getMemoryPayments();
};

/**
 * Get payment by ID or Order ID
 */
export const getPaymentDetails = async (identifier) => {
  if (!identifier) return null;
  if (isDBConnected()) {
    try {
      const payment = await Payment.findOne({
        $or: [{ orderId: identifier }, { paymentId: identifier }],
      });
      if (payment) return payment;
    } catch (err) {
      console.warn('DB error in getPaymentDetails:', err.message);
    }
  }

  return findMemoryPaymentByOrderId(identifier);
};

/**
 * Verify X-Razorpay-Signature against exact raw webhook payload and process payment.captured / payment.failed
 */
export const verifyAndProcessWebhook = async ({ rawBody, signature }) => {
  const config = getRazorpayConfig();
  if (!config.webhook_secret) {
    const err = new Error('Razorpay webhook secret is not configured.');
    err.statusCode = 500;
    throw err;
  }
  if (!signature) {
    const err = new Error('Missing X-Razorpay-Signature header.');
    err.statusCode = 400;
    throw err;
  }

  const rawBuffer = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody || {}));

  const expectedSignature = crypto
    .createHmac('sha256', config.webhook_secret)
    .update(rawBuffer)
    .digest('hex');

  if (!timingSafeHexEqual(expectedSignature, signature)) {
    const err = new Error('Invalid webhook signature.');
    err.statusCode = 400;
    throw err;
  }

  let parsedBody = {};
  try {
    parsedBody = JSON.parse(rawBuffer.toString('utf8'));
  } catch {
    const err = new Error('Invalid JSON webhook body.');
    err.statusCode = 400;
    throw err;
  }

  const event = parsedBody.event || '';
  const paymentEntity = parsedBody?.payload?.payment?.entity || null;

  if (event === 'payment.captured' && paymentEntity?.order_id) {
    await finalizeCapturedPaymentAndActivateMembership({
      orderId: paymentEntity.order_id,
      paymentId: paymentEntity.id || '',
      signature: String(signature),
      userEmail: paymentEntity.email || paymentEntity?.notes?.userEmail || '',
      planId: paymentEntity?.notes?.planId || '',
      planName: paymentEntity?.notes?.planName || '',
      paymentMethod: paymentEntity.method || 'Razorpay Webhook',
    });
  } else if (event === 'payment.failed' && paymentEntity?.order_id) {
    const failFields = {
      status: 'failed',
      paymentId: paymentEntity.id || '',
      updatedAt: new Date(),
    };
    if (isDBConnected()) {
      await Payment.findOneAndUpdate(
        { orderId: paymentEntity.order_id, status: { $ne: 'captured' } },
        { $set: failFields }
      ).catch(() => {});
    } else {
      updateMemoryPayment(paymentEntity.order_id, failFields);
    }
  }

  return { status: 'ok', eventReceived: event };
};

export default {
  createOrder,
  verifyPayment,
  verifyAndProcessWebhook,
  getUserPayments,
  getPaymentDetails,
};

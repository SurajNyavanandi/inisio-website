/**
 * Canonical Promoter Membership Plans, GST Configuration, and Benefit Limits
 */

export const GST_RATE = Number(process.env.MEMBERSHIP_GST_RATE || 0.18);

export const MEMBERSHIP_PLAN_CATALOG = {
  free_plan: {
    id: 'free_plan',
    name: 'Free – Project Assessment',
    shortName: 'Free Plan',
    aliases: ['free', 'free_starter', 'free starter', 'free plan', 'free – project assessment', 'standard', 'starter'],
    basePriceInr: 0,
    gstRate: 0,
    gstAmountInr: 0,
    totalPayableInr: 0,
    validityDays: null,
    validityLabel: '—',
    billingCycle: 'one-time',
    assessmentsLimit: 1,
    consultantIntroLimit: 0,
    prosyncIntroLimit: 0,
    totalIntroLimit: 0,
    readinessFollowUp: 'Not included',
    trackingLabel: 'Basic',
  },
  promoter_boost: {
    id: 'promoter_boost',
    name: 'Promoter Boost',
    shortName: 'Promoter Boost',
    aliases: ['promoter_boost', 'promoter boost', 'boost', 'plus_pack'],
    basePriceInr: 2999,
    gstRate: GST_RATE,
    gstAmountInr: Number((2999 * GST_RATE).toFixed(2)),
    totalPayableInr: Number((2999 * (1 + GST_RATE)).toFixed(2)),
    validityDays: 90, // 3 months
    validityLabel: '3 months',
    billingCycle: 'quarterly',
    assessmentsLimit: 1,
    consultantIntroLimit: 2,
    prosyncIntroLimit: 1,
    totalIntroLimit: 3, // 2 relevant consultant introductions + 1 Prosync introduction
    readinessFollowUp: 'Basic',
    trackingLabel: '3 months',
  },
  promoter_plus: {
    id: 'promoter_plus',
    name: 'Promoter Plus',
    shortName: 'Promoter Plus',
    aliases: ['promoter_plus', 'promoter plus', 'plus', 'pro_growth'],
    basePriceInr: 9999,
    gstRate: GST_RATE,
    gstAmountInr: Number((9999 * GST_RATE).toFixed(2)),
    totalPayableInr: Number((9999 * (1 + GST_RATE)).toFixed(2)),
    validityDays: 365, // 12 months
    validityLabel: '12 months',
    billingCycle: 'annual',
    assessmentsLimit: 3,
    consultantIntroLimit: 5, // Up to 6 total including 1 Prosync introduction
    prosyncIntroLimit: 1,
    totalIntroLimit: 6,
    readinessFollowUp: 'Extended',
    trackingLabel: '12 months',
  },
};

export const MEMBERSHIP_PLANS_LIST = [
  MEMBERSHIP_PLAN_CATALOG.free_plan,
  MEMBERSHIP_PLAN_CATALOG.promoter_boost,
  MEMBERSHIP_PLAN_CATALOG.promoter_plus,
];

export const resolvePlanDefinition = (planKeyOrName = '') => {
  const clean = String(planKeyOrName || '').trim().toLowerCase();
  if (!clean) return MEMBERSHIP_PLAN_CATALOG.free_plan;

  for (const plan of MEMBERSHIP_PLANS_LIST) {
    if (plan.id === clean || plan.name.toLowerCase() === clean || plan.aliases.includes(clean)) {
      return plan;
    }
  }
  if (clean.includes('plus') && !clean.includes('pack')) return MEMBERSHIP_PLAN_CATALOG.promoter_plus;
  if (clean.includes('boost')) return MEMBERSHIP_PLAN_CATALOG.promoter_boost;
  return MEMBERSHIP_PLAN_CATALOG.free_plan;
};

export const calculatePlanPricing = (planKeyOrName) => {
  const plan = resolvePlanDefinition(planKeyOrName);
  const basePriceInr = plan.basePriceInr;
  const gstAmountInr = basePriceInr > 0 ? Number((basePriceInr * GST_RATE).toFixed(2)) : 0;
  const totalPayableInr = Number((basePriceInr + gstAmountInr).toFixed(2));
  return {
    planId: plan.id,
    planName: plan.name,
    basePriceInr,
    gstRate: basePriceInr > 0 ? GST_RATE : 0,
    gstPercentage: basePriceInr > 0 ? Math.round(GST_RATE * 100) : 0,
    gstAmountInr,
    totalPayableInr,
    validityDays: plan.validityDays,
    validityLabel: plan.validityLabel,
    billingCycle: plan.billingCycle,
  };
};

export const computeMembershipStatusLabel = ({ planId, expiresAt }) => {
  if (!planId || planId === 'free_plan') {
    return { statusLabel: 'Free Plan', isPaidActive: false, isExpired: false, isExpiringSoon: false, daysRemaining: null };
  }
  if (!expiresAt) {
    return { statusLabel: 'Active', isPaidActive: true, isExpired: false, isExpiringSoon: false, daysRemaining: null };
  }
  const now = Date.now();
  const expMs = new Date(expiresAt).getTime();
  const diffMs = expMs - now;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) {
    return { statusLabel: 'Expired', isPaidActive: false, isExpired: true, isExpiringSoon: false, daysRemaining: 0 };
  }
  if (daysRemaining <= 14) {
    return { statusLabel: 'Expiring Soon', isPaidActive: true, isExpired: false, isExpiringSoon: true, daysRemaining };
  }
  return { statusLabel: 'Active', isPaidActive: true, isExpired: false, isExpiringSoon: false, daysRemaining };
};

export default {
  GST_RATE,
  MEMBERSHIP_PLAN_CATALOG,
  MEMBERSHIP_PLANS_LIST,
  resolvePlanDefinition,
  calculatePlanPricing,
  computeMembershipStatusLabel,
};

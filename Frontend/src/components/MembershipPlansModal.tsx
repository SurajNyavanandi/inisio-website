import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Crown,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Receipt,
} from 'lucide-react';
import { AuthUser } from '../types';
import {
  MEMBERSHIP_PLAN_TIERS,
  MembershipPlanTier,
  OFFICIAL_DISCLAIMERS,
  hasActivePaidMembership,
  setLocalPaidMembership,
} from '../utils/membershipStore';
import { api } from '../utils/apiClient';
import { showToast } from './ui/Toast';

interface MembershipPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  onOpenConsultation?: () => void;
  onViewFullPricingPage?: () => void;
  onMembershipActivated?: (result: any) => void;
  initialReason?: string;
  initialPlanId?: 'promoter_boost' | 'promoter_plus' | null;
}

export const MembershipPlansModal: React.FC<MembershipPlansModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onViewFullPricingPage,
  onMembershipActivated,
  initialReason,
  initialPlanId = null,
}) => {
  const [checkoutPlan, setCheckoutPlan] = useState<MembershipPlanTier | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showTermsView, setShowTermsView] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [activationReceipt, setActivationReceipt] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setCheckoutPlan(null);
      setConsentChecked(false);
      setShowTermsView(false);
      setCheckoutError('');
      setActivationReceipt(null);
      return;
    }
    if (initialPlanId) {
      const target = MEMBERSHIP_PLAN_TIERS.find((p) => p.id === initialPlanId);
      if (target && target.basePriceInr > 0) {
        setCheckoutPlan(target);
      }
    }
  }, [isOpen, initialPlanId]);

  if (!isOpen) return null;

  const isPaid = hasActivePaidMembership(currentUser);
  const currentPlanId = (currentUser as any)?.membershipPlanId || '';
  const currentTier = String(
    (currentUser as any)?.membershipTier || currentUser?.membershipPlan || ''
  )
    .trim()
    .toLowerCase();

  const handleSelectPlan = (plan: MembershipPlanTier) => {
    if (plan.id === 'free_plan') {
      if (!currentUser && onOpenAuth) {
        onClose();
        onOpenAuth('signup');
        return;
      }
      onClose();
      return;
    }

    if (!currentUser && onOpenAuth) {
      showToast('Please sign in or create a free account before upgrading your membership.', {
        type: 'info',
      });
      onClose();
      onOpenAuth('login');
      return;
    }

    setCheckoutError('');
    setConsentChecked(false);
    setCheckoutPlan(plan);
  };

  const handleConfirmPayment = async () => {
    if (!checkoutPlan || !currentUser) return;
    if (!consentChecked) {
      setCheckoutError('Please accept the Inisio Membership Terms and Conditions checkbox to continue.');
      return;
    }

    setProcessing(true);
    setCheckoutError('');

    try {
      const order = await api.payments.createOrder({
        amount: checkoutPlan.totalPayableInr,
        currency: 'INR',
        userEmail: currentUser.email,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        itemType: 'membership',
        itemId: checkoutPlan.id,
        planId: checkoutPlan.id,
        planName: checkoutPlan.name,
        billingCycle: checkoutPlan.id === 'promoter_plus' ? 'annual' : 'quarterly',
        consentAccepted: true,
      });

      const completeVerification = async (
        paymentId: string,
        signature: string,
        paymentMethod = 'Razorpay Checkout'
      ) => {
        const verified = await api.payments.verifySignature({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          userEmail: currentUser.email,
          planId: checkoutPlan.id,
          planName: checkoutPlan.name,
          paymentMethod,
        });

        setLocalPaidMembership(currentUser.email, checkoutPlan.name, {
          planId: checkoutPlan.id,
          activatedAt: verified.activatedAt,
          expiresAt: verified.expiresAt,
        });

        window.dispatchEvent(new CustomEvent('inisio_membership_updated', { detail: verified }));
        setActivationReceipt(verified);
        showToast(`${checkoutPlan.name} activated successfully!`, { type: 'success' });
        if (onMembershipActivated) {
          onMembershipActivated(verified);
        }
      };

      const RazorpaySDK = (window as any).Razorpay;
      if (RazorpaySDK && order.keyId && !order.isSimulatedOrder && !order.keyId.includes('dummy')) {
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Inisio Advisory Platform',
          description: `${checkoutPlan.name} (${checkoutPlan.validityLabel})`,
          order_id: order.orderId,
          prefill: {
            name: currentUser.name || '',
            email: currentUser.email,
            contact: currentUser.phone || '',
          },
          theme: { color: '#2563EB' },
          handler: async (response: any) => {
            try {
              await completeVerification(
                response.razorpay_payment_id,
                response.razorpay_signature,
                'Razorpay Gateway'
              );
            } catch (err: any) {
              setCheckoutError(err?.message || 'Payment verification failed.');
            } finally {
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: () => setProcessing(false),
          },
        };
        const rzp = new RazorpaySDK(options);
        rzp.open();
        return;
      }

      // Test-mode / simulated order checkout confirmation
      const simPaymentId = `pay_sim_${Date.now()}`;
      const simSignature = `sim_sig_${order.orderId}`;
      await completeVerification(simPaymentId, simSignature, 'Razorpay Test Mode');
      setProcessing(false);
    } catch (err: any) {
      setCheckoutError(err?.message || 'Unable to process checkout right now. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs font-inter">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close membership plans"
          className="absolute top-3 right-3 sm:top-5 sm:right-5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Terms & Disclaimers Sub-Modal View */}
        {showTermsView ? (
          <div className="space-y-5 max-w-3xl mx-auto">
            <button
              type="button"
              onClick={() => setShowTermsView(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Checkout</span>
            </button>
            <div className="space-y-1">
              <h2 className="font-manrope text-xl font-extrabold text-slate-900">
                Inisio Membership Terms, Conditions &amp; Disclaimers
              </h2>
              <p className="text-xs text-slate-500">
                Please review all applicable platform terms before activating a paid membership.
              </p>
            </div>
            {[
              OFFICIAL_DISCLAIMERS.membership,
              OFFICIAL_DISCLAIMERS.consultantNetwork,
              OFFICIAL_DISCLAIMERS.prosyncAdvisory,
              OFFICIAL_DISCLAIMERS.assessment,
            ].map((block) => (
              <div key={block.title} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  {block.title}
                </h3>
                {block.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-xs text-slate-600 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : activationReceipt ? (
          /* Success Receipt View */
          <div className="max-w-lg mx-auto text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Membership Activated
              </span>
              <h2 className="font-manrope text-2xl font-extrabold text-slate-900">
                {activationReceipt.planName}
              </h2>
              <p className="text-xs text-slate-600">
                Payment confirmed and tax invoice recorded against your promoter account.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tax Invoice #:</span>
                <span className="font-mono font-bold text-slate-900">{activationReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment ID:</span>
                <span className="font-mono font-semibold text-slate-700">{activationReceipt.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Taxable Value:</span>
                <span className="font-semibold text-slate-900">₹ {Number(activationReceipt.baseAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Applicable GST (18%):</span>
                <span className="font-semibold text-slate-900">₹ {Number(activationReceipt.gstAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                <span>Total Paid:</span>
                <span className="text-blue-700">₹ {Number(activationReceipt.amount || 0).toFixed(2)}</span>
              </div>
              {activationReceipt.expiresAt && (
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Valid Until (No Auto-Renew):</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(activationReceipt.expiresAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Continue to Promoter Workspace
            </button>
          </div>
        ) : checkoutPlan ? (
          /* GST & Consent Checkout Summary View */
          <div className="max-w-xl mx-auto space-y-5">
            <button
              type="button"
              onClick={() => setCheckoutPlan(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Membership Plans</span>
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                <Receipt className="w-3.5 h-3.5" />
                <span>Membership Checkout &amp; Tax Summary</span>
              </div>
              <h2 className="font-manrope text-xl sm:text-2xl font-extrabold text-slate-900">
                Confirm Upgrade: {checkoutPlan.name}
              </h2>
              <p className="text-xs text-slate-500">
                Validity: <strong>{checkoutPlan.period}</strong> · Manual renewal only (no automatic recurring charges)
              </p>
            </div>

            {/* Key Benefits & Usage Limits */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-800">Included Benefits &amp; Plan Limits</div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {checkoutPlan.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* GST & Pricing Breakdown */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Selected Plan ({checkoutPlan.name} — {checkoutPlan.validityLabel})</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  ₹ {checkoutPlan.basePriceInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Applicable GST (18%)</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  ₹ {checkoutPlan.gstAmountInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200 text-sm font-extrabold text-slate-900">
                <span>Total Payable Amount</span>
                <span className="text-blue-700 tabular-nums">
                  ₹ {checkoutPlan.totalPayableInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Membership fees do not include separate professional fees charged independently by CAs, DPR, TEV consultants, or Prosync Consulting.
              </p>
            </div>

            {/* Mandatory Consent Checkbox */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 leading-relaxed">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => {
                    setConsentChecked(e.target.checked);
                    if (e.target.checked) setCheckoutError('');
                  }}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 shrink-0 cursor-pointer"
                />
                <span>{OFFICIAL_DISCLAIMERS.consentStatement}</span>
              </label>

              <div className="pl-7">
                <button
                  type="button"
                  onClick={() => setShowTermsView(true)}
                  className="text-[11px] font-bold text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3" />
                  <span>Read Membership Terms and Conditions &amp; Disclaimers</span>
                </button>
              </div>
            </div>

            {checkoutError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={processing || !consentChecked}
              className="w-full min-h-[46px] py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming Payment...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    Proceed to Pay ₹ {checkoutPlan.totalPayableInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Plan Selection Cards View */
          <>
            <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 pt-2 sm:pt-0 space-y-2 pr-6 sm:pr-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                <Crown className="w-3.5 h-3.5" />
                <span>Inisio Promoter Membership Plans</span>
              </div>
              <h2 className="font-manrope text-xl sm:text-3xl font-extrabold text-slate-900">
                Choose the Right Plan for Your Project
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {initialReason ||
                  'Start with your free project assessment and upgrade when you need independent professional introductions and extended project support.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {MEMBERSHIP_PLAN_TIERS.map((plan) => {
                const isCurrentFree = plan.id === 'free_plan' && !isPaid;
                const isCurrentPaid =
                  plan.id !== 'free_plan' &&
                  isPaid &&
                  (currentPlanId === plan.id ||
                    currentTier === plan.name.toLowerCase() ||
                    currentTier === plan.id);
                const isCurrent = isCurrentFree || isCurrentPaid;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all ${
                      plan.popular
                        ? 'border-2 border-blue-600 bg-blue-50/20 shadow-md relative'
                        : 'border border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {plan.badgeText && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full tracking-wider whitespace-nowrap">
                        {plan.badgeText}
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-manrope font-bold text-lg text-slate-900">{plan.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{plan.positioning}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-manrope text-2xl sm:text-3xl font-black text-slate-900">
                            {plan.priceLabel}
                          </span>
                          <span className="text-xs text-slate-500">
                            {plan.basePriceInr > 0 ? `+ GST · ${plan.validityLabel}` : '· 1 Free Assessment'}
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-2 pt-1 text-xs text-slate-600">
                        {plan.basePriceInr === 2999 && (
                          <li className="text-[11px] font-bold text-blue-700">Includes all Free Plan benefits, plus:</li>
                        )}
                        {plan.basePriceInr === 9999 && (
                          <li className="text-[11px] font-bold text-blue-700">Includes all Promoter Boost benefits, plus:</li>
                        )}
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-5 mt-4">
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : plan.popular
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isCurrent ? 'Current Active Plan' : plan.buttonText}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Links & Disclaimer Summary */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
              <span>
                Inisio does not guarantee loan sanction or funding. Separate fees apply for independent consultants.
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTermsView(true)}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Membership Terms &amp; Disclaimers
                </button>
                {onViewFullPricingPage && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewFullPricingPage();
                    }}
                    className="text-slate-800 font-bold hover:text-blue-600 cursor-pointer"
                  >
                    View Comparison Table →
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

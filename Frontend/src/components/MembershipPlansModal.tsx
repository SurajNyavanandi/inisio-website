import React from 'react';
import { X, Check, Crown } from 'lucide-react';
import { AuthUser } from '../types';
import { MEMBERSHIP_PLAN_TIERS, hasActivePaidMembership } from '../utils/membershipStore';

interface MembershipPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  onOpenConsultation?: () => void;
  initialReason?: string;
}

export const MembershipPlansModal: React.FC<MembershipPlansModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onOpenConsultation,
  initialReason,
}) => {
  if (!isOpen) return null;

  const isPaid = hasActivePaidMembership(currentUser);
  const currentTier = String(
    (currentUser as any)?.membershipTier || currentUser?.membershipPlan || ''
  )
    .trim()
    .toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-inter">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close membership plans"
          className="absolute top-3 right-3 sm:top-5 sm:right-5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8 pt-2 sm:pt-0 space-y-2 pr-6 sm:pr-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            <Crown className="w-3.5 h-3.5" />
            <span>Simple &amp; Affordable Plans</span>
          </div>
          <h2 className="font-manrope text-xl sm:text-3xl font-extrabold text-slate-900">
            Choose Your Assessment Plan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {initialReason || 'Transparent, everyday Indian pricing built for individual founders and growing MSMEs.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {MEMBERSHIP_PLAN_TIERS.map((plan) => {
            const isCurrentFree = plan.id === 'free_starter' && !isPaid;
            const isCurrentPaid =
              plan.id !== 'free_starter' &&
              currentTier !== '' &&
              (currentTier === plan.name.toLowerCase() || currentTier === plan.id);
            const isCurrent = isCurrentFree || isCurrentPaid;

            const handlePlanClick = () => {
              if (plan.id === 'free_starter') {
                if (!currentUser && onOpenAuth) {
                  onClose();
                  onOpenAuth('signup');
                  return;
                }
                onClose();
                return;
              }
              if (onOpenConsultation) {
                onOpenConsultation();
              } else if (!currentUser && onOpenAuth) {
                onOpenAuth('signup');
              }
              onClose();
            };

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all ${
                  plan.popular
                    ? 'border-2 border-blue-600 bg-blue-50/20 shadow-md relative'
                    : 'border border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full tracking-wider whitespace-nowrap">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-manrope font-bold text-lg text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{plan.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-manrope text-2xl sm:text-3xl font-black text-slate-900">
                        {plan.priceLabel}
                      </span>
                      <span className="text-xs text-slate-500">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 pt-1 text-xs text-slate-600">
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
                    onClick={handlePlanClick}
                    className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : plan.buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

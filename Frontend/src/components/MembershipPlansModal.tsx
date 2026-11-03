import React from 'react';
import { X, Check, Crown, ShieldCheck, Zap, ArrowRight, Star } from 'lucide-react';
import { AuthUser } from '../types';

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
  initialReason
}) => {
  if (!isOpen) return null;

  const plans = [
    {
      id: 'free',
      name: 'Standard Feasibility',
      price: 'Free',
      period: 'lifetime',
      description: 'Instant institutional bankability score, preliminary DSCR test, and summary project teaser.',
      features: [
        'Instant Feasibility & Bankability Scoring',
        'Preliminary DSCR & Means of Finance Breakdown',
        'Summary Project Teaser PDF Preview',
        'Access to Sector Benchmark Guidelines'
      ],
      current: true,
      buttonText: 'Current Plan'
    },
    {
      id: 'pro',
      name: 'Institutional DPR & CMA',
      price: '₹ 45,000',
      period: 'per project',
      description: 'Comprehensive 85-page bankable DPR, 7-year detailed CMA data, and direct CA sign-off.',
      features: [
        'Complete 80+ Page Bank-Ready DPR (DOCX & PDF)',
        '7-Year Audited CMA Model with Sensitivity Analysis',
        'Chartered Accountant (CA/CMA) Review & Ratio Sign-off',
        'Subsidy & Incentive Claim Roadmap',
        'Techno-Economic Viability (TEV) Checklist'
      ],
      popular: true,
      buttonText: 'Request Institutional Plan'
    },
    {
      id: 'enterprise',
      name: 'Full Debt Syndication',
      price: 'Custom / Retainer',
      period: 'success-aligned',
      description: 'End-to-end debt structuring, multi-bank committee presentation, and sanction letter facilitation.',
      features: [
        'Everything in Institutional DPR & CMA',
        'Direct Liaison with Empaneled PSU & Private Banks',
        'Credit Committee Query Resolution Support',
        'Collateral Optimization & Interest Subvention Structuring',
        'Dedicated Senior Banking Advisor & Partner Desk'
      ],
      buttonText: 'Consult Partner Desk'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-inter overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            <Crown className="w-3.5 h-3.5" />
            <span>Advisory &amp; Syndication Tiers</span>
          </div>
          <h2 className="font-manrope text-2xl sm:text-3xl font-extrabold text-slate-900">
            Institutional Debt Syndication Services
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {initialReason || 'Select an advisory tier to accelerate your greenfield project credit sanction.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all ${
                p.popular
                  ? 'border-2 border-blue-600 bg-blue-50/20 shadow-md relative'
                  : 'border border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full tracking-wider">
                  Most Recommended
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-manrope font-bold text-lg text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="font-manrope text-2xl sm:text-3xl font-black text-slate-900">{p.price}</span>
                    <span className="text-xs text-slate-400">/{p.period}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 pt-2 text-xs text-slate-600">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenConsultation) onOpenConsultation();
                    onClose();
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    p.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {p.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

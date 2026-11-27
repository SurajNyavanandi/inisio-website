import React, { useState } from 'react';
import { Check, Crown, ArrowRight, ShieldCheck, Info, HelpCircle } from 'lucide-react';
import { AuthUser } from '../types';
import {
  MEMBERSHIP_PLAN_TIERS,
  MEMBERSHIP_COMPARISON_ROWS,
  OFFICIAL_DISCLAIMERS,
  MembershipPlanId,
} from '../utils/membershipStore';
import { Reveal, StaggerGroup, StaggerItem } from './ui/MotionPrimitives';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/Accordion';

interface MembershipSectionProps {
  currentUser?: AuthUser | null;
  onStartFreeAssessment: () => void;
  onUpgradePlan: (planId: 'promoter_boost' | 'promoter_plus') => void;
  onViewAllBenefits?: () => void;
  isStandalone?: boolean;
  onNavigateToPage?: (tab: string) => void;
}

const PRICING_FAQS = [
  {
    id: 'pfaq_1',
    question: 'Does my Inisio membership guarantee loan approval or bank funding?',
    answer:
      'No. Inisio memberships cover platform assessment tools and professional introduction benefits specified in the plan. Final lending decisions rest independently with banks and financial institutions.',
  },
  {
    id: 'pfaq_2',
    question: 'Do membership fees cover DPR, CMA, or TEV consultant charges?',
    answer:
      'No. Membership fees cover your Inisio platform access and introductions. Independent Chartered Accountants, DPR/TEV consultants, and Prosync Consulting communicate and agree their professional engagement scope and fees directly with you.',
  },
  {
    id: 'pfaq_3',
    question: 'What happens to my project documents when my paid membership expires?',
    answer:
      'Your saved project details, financial models, and previously generated project teasers remain accessible in your personal dashboard. Expired accounts automatically revert to Free Plan limits without any automatic renewal charges.',
  },
  {
    id: 'pfaq_4',
    question: 'What is counted as a consultant introduction?',
    answer:
      'Only valid consultant introductions submitted with your project consent count toward your plan limit. If a matched consultant is unavailable or cannot take up the request, it is not counted as a fulfilled introduction.',
  },
];

export const MembershipSection: React.FC<MembershipSectionProps> = ({
  currentUser,
  onStartFreeAssessment,
  onUpgradePlan,
  onViewAllBenefits,
  isStandalone = false,
  onNavigateToPage,
}) => {
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleCardAction = (planId: MembershipPlanId) => {
    if (planId === 'free_plan') {
      onStartFreeAssessment();
      return;
    }
    onUpgradePlan(planId);
  };

  return (
    <section
      id="membership-plans"
      className="py-16 sm:py-24 bg-white border-t border-slate-200/80 font-inter"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-14">
        {/* Header */}
        <Reveal className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-blue-700 font-inter">
            <Crown className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Promoter Membership Tiers</span>
          </div>

          {isStandalone ? (
            <h1
              className="font-manrope text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Choose the Right Plan for Your Project
            </h1>
          ) : (
            <h2
              className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Choose the Right Plan for Your Project
            </h2>
          )}

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Begin with your free initial project assessment and upgrade when you are ready to connect with independent CAs, DPR, CMA, TEV professionals, and Prosync Consulting.
          </p>
        </Reveal>

        {/* Three Membership Cards */}
        <StaggerGroup className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {MEMBERSHIP_PLAN_TIERS.map((plan) => {
            const isCurrentFree =
              plan.id === 'free_plan' &&
              (!currentUser || !currentUser.membershipPlanId || currentUser.membershipPlanId === 'free_plan');
            const isCurrentPaid =
              plan.id !== 'free_plan' &&
              currentUser?.membershipPlanId === plan.id &&
              currentUser?.membershipStatus !== 'Expired';

            return (
              <StaggerItem key={plan.id} className="h-full">
                <div
                  className={`h-full rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                    plan.popular
                      ? 'border-2 border-blue-600 bg-blue-50/25 shadow-[0_18px_40px_-20px_rgba(37,99,235,0.3)] relative'
                      : 'border border-slate-200/90 bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/80'
                  }`}
                >
                  {plan.badgeText && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3.5 py-1 rounded-full tracking-wider whitespace-nowrap shadow-xs">
                      {plan.badgeText}
                    </span>
                  )}

                  <div className="space-y-5">
                    <div>
                      <h3 className="font-manrope text-lg sm:text-xl font-bold text-slate-900">
                        {plan.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">{plan.positioning}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80">
                      <div className="flex items-baseline gap-2">
                        <span className="font-manrope text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                          {plan.priceLabel}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {plan.basePriceInr > 0
                            ? `+ 18% GST · Validity: ${plan.validityLabel}`
                            : '· First assessment free'}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                      {plan.basePriceInr === 2999 && (
                        <li className="text-xs font-bold text-blue-700 pb-0.5">
                          Includes all Free Plan benefits, plus:
                        </li>
                      )}
                      {plan.basePriceInr === 9999 && (
                        <li className="text-xs font-bold text-blue-700 pb-0.5">
                          Includes all Promoter Boost benefits, plus:
                        </li>
                      )}
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleCardAction(plan.id)}
                      className={`w-full min-h-[44px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2 ${
                        isCurrentPaid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                          : isCurrentFree
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>{isCurrentPaid ? 'Current Active Plan' : plan.buttonText}</span>
                      {!isCurrentPaid && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>

        {/* Homepage View All Benefits Link */}
        {!isStandalone && onViewAllBenefits && (
          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={onViewAllBenefits}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <span>View All Benefits &amp; Plan Comparison Table</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>
            <p className="text-[11px] text-slate-500 max-w-2xl mx-auto">
              Applicable GST shown clearly at checkout. Membership fees do not include independent CA, DPR, TEV or advisory engagement fees and do not guarantee loan sanction.
            </p>
          </div>
        )}

        {/* Standalone Pricing Page Full Comparison, Disclaimers & FAQs */}
        {isStandalone && (
          <>
            {/* Comparison Table */}
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="font-manrope text-xl sm:text-2xl font-extrabold text-slate-900">
                  Plan Feature Comparison
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Compare assessment allowances, professional introductions, and project workspace validity.
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
                <table className="w-full min-w-[640px] text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 font-manrope">
                      <th className="py-3.5 px-5 font-bold">Feature</th>
                      <th className="py-3.5 px-5 font-bold">Free</th>
                      <th className="py-3.5 px-5 font-bold text-blue-700 bg-blue-50/40">Promoter Boost</th>
                      <th className="py-3.5 px-5 font-bold">Promoter Plus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {MEMBERSHIP_COMPARISON_ROWS.map((row) => (
                      <tr key={row.feature} className="hover:bg-slate-50/70">
                        <td className="py-3 px-5 font-semibold text-slate-900">{row.feature}</td>
                        <td className="py-3 px-5">{row.free}</td>
                        <td className="py-3 px-5 font-semibold text-blue-900 bg-blue-50/20">{row.boost}</td>
                        <td className="py-3 px-5 font-semibold text-slate-900">{row.plus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pricing FAQs */}
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Membership FAQs</span>
              </div>
              <Accordion type="single" collapsible className="space-y-3">
                {PRICING_FAQS.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>
                      <p>{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Official Disclaimers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {[
                OFFICIAL_DISCLAIMERS.membership,
                OFFICIAL_DISCLAIMERS.prosyncAdvisory,
                OFFICIAL_DISCLAIMERS.consultantNetwork,
                OFFICIAL_DISCLAIMERS.assessment,
              ].map((disc) => (
                <div
                  key={disc.title}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left"
                >
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{disc.title}</span>
                  </div>
                  {disc.paragraphs.map((p, idx) => (
                    <p key={idx} className="text-xs text-slate-600 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowTermsModal(!showTermsModal)}
                className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{showTermsModal ? 'Hide Membership Consent Terms' : 'View Membership Terms & Conditions Summary'}</span>
              </button>
              {showTermsModal && (
                <div className="mt-3 max-w-3xl mx-auto p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-slate-700 text-left space-y-1.5">
                  <p className="font-bold text-slate-900">Checkout Consent Statement:</p>
                  <p>{OFFICIAL_DISCLAIMERS.consentStatement}</p>
                </div>
              )}
            </div>

            {onNavigateToPage && (
              <nav
                aria-label="Related advisory pages"
                className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold"
              >
                <a
                  href="/assessment"
                  onClick={(e) => {
                    e.preventDefault();
                    onStartFreeAssessment();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  Start Free Assessment
                </a>
                <a
                  href="/how-it-works"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateToPage('how-it-works');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Your Project Journey
                </a>
                <a
                  href="/faq"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateToPage('faq');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Project Appraisal FAQs
                </a>
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateToPage('contact');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Request a Project Consultation
                </a>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default MembershipSection;

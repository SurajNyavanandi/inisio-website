import React from 'react';
import {
  FileText,
  Landmark,
  CheckCircle2,
  Calculator,
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Scale,
} from 'lucide-react';
import { Reveal, StaggerGroup, StaggerItem } from './ui/MotionPrimitives';

interface WhyChooseInisioProps {
  onOpenAssessment?: () => void;
  onOpenConsultation?: () => void;
  isStandalone?: boolean;
}

export const WhyChooseInisio: React.FC<WhyChooseInisioProps> = ({
  onOpenAssessment,
  onOpenConsultation,
  isStandalone = false,
}) => {
  return (
    <section className="py-16 sm:py-24 bg-slate-50/60 relative font-inter overflow-hidden border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-16">
        {/* Section Header */}
        <Reveal className="max-w-3xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-blue-700 font-inter">
            <span>Institutional Advantage</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Greenfield Debt Advisory</span>
          </div>

          {isStandalone ? (
            <h1
              className="font-manrope text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Why Greenfield Promoters &amp; Institutional Lenders Partner with Inisio
            </h1>
          ) : (
            <h2
              className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Why Greenfield Promoters &amp; Institutional Lenders Partner with Inisio
            </h2>
          )}

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Most greenfield projects face delays or loan rejections because promoters approach banks without institutional credit appraisal readiness. Based in Madhapur, Hyderabad and serving industrial promoters across Telangana and India, Inisio Capital structures your debt capacity, CMA financial ratios, Detailed Project Reports (DPR), and technical feasibility to clear lender underwriting committees.
          </p>
        </Reveal>

        {/* 1. Asymmetric Zig-Zag Bento Grid of Core Capabilities (7/5 then 5/7) */}
        <StaggerGroup className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Bento Card 1 (Col Span 7) */}
          <StaggerItem className="lg:col-span-7 h-full">
            <div className="h-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_36px_-16px_rgba(37,99,235,0.18)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Bank-Grade DPR &amp; CMA Financial Modeling
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Lenders scrutinize capex structure, sensitivity margins, and debt service coverage capacity (DSCR). We prepare credit-grade Detailed Project Reports (DPR) and CMA data aligned strictly with PSU &amp; Private commercial bank norms.
                  </p>
                </div>

                <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-100">
                  <div className="space-y-0.5 pt-2">
                    <span className="text-xs font-medium text-slate-500 block">DSCR Target</span>
                    <span className="font-manrope font-bold text-base text-slate-900 tabular-nums">
                      ≥ 1.35x – 1.60x
                    </span>
                  </div>
                  <div className="space-y-0.5 pt-2">
                    <span className="text-xs font-medium text-slate-500 block">Debt-to-Equity</span>
                    <span className="font-manrope font-bold text-base text-slate-900 tabular-nums">
                      70:30 – 75:25
                    </span>
                  </div>
                  <div className="space-y-0.5 pt-2 col-span-2 sm:col-span-1">
                    <span className="text-xs font-medium text-slate-500 block">Audit Alignment</span>
                    <span className="font-manrope font-bold text-base text-blue-700">CA Verified</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 flex items-center justify-between gap-3 border-t border-slate-100 mt-6">
                <span className="text-xs font-medium text-slate-500">
                  Includes 7–10 year financial projections
                </span>
                {onOpenAssessment && (
                  <button
                    type="button"
                    onClick={onOpenAssessment}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                  >
                    <span>Evaluate Project</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </StaggerItem>

          {/* Bento Card 2 (Col Span 5) */}
          <StaggerItem className="lg:col-span-5 h-full">
            <div className="h-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_36px_-16px_rgba(37,99,235,0.18)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Landmark className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Multi-Bank Syndication Liaison
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Instead of single-bank dependency, we connect your project to an active network of 30+ leading PSU banks, private institutions, and specialized clean-tech infrastructure funds (IREDA, REC, PFC, SIDBI).
                  </p>
                </div>

                <div className="pt-2 space-y-2.5 border-t border-slate-100">
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium pt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Direct submission to relevant credit &amp; zonal committees</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Competitive interest rates &amp; flexible moratorium structuring</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 mt-6 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  Term Loans ₹5 Cr – ₹250+ Cr
                </span>
                {onOpenConsultation && (
                  <button
                    type="button"
                    onClick={onOpenConsultation}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                  >
                    <span>Talk to Advisor</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </StaggerItem>

          {/* Bento Card 3 (Col Span 5) */}
          <StaggerItem className="lg:col-span-5 h-full">
            <div className="h-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_36px_-16px_rgba(37,99,235,0.18)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <BarChart3 className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Transparent Promoter Tracking Desk
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Track every stage of your project finance lifecycle through a real-time dashboard. Receive live updates on technical appraisals, CA sign-offs, document compliance, and lender reviews.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Project Appraisal Pipeline</span>
                    <span className="text-emerald-700 font-semibold">Live Tracking</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full w-3/4" />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Intake &amp; TEFR</span>
                    <span>Credit Sizing</span>
                    <span>Bank Sanction</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 mt-6 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500">256-Bit SSL Encrypted Vault</span>
                <span className="text-xs font-semibold text-emerald-700">DPDP Compliant</span>
              </div>
            </div>
          </StaggerItem>

          {/* Bento Card 4 (Col Span 7) */}
          <StaggerItem className="lg:col-span-7 h-full">
            <div className="h-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_36px_-16px_rgba(37,99,235,0.18)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Scale className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Capital Structuring &amp; State/Central Subsidies
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Optimize your capital outlays through eligible central and state incentives, including PMKSY, PM-KUSUM, TUFS textile schemes, interest subventions, and capital investment subsidies (up to 35%–50%).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-bold text-slate-900 block font-manrope">
                      Subsidies Integration
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Accurate mapping of eligible industrial &amp; clean-tech capital grants.
                    </p>
                  </div>
                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-bold text-slate-900 block font-manrope">
                      Equity Gap Solutions
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Advisory for promoter contribution readiness and co-investor tie-ups.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 mt-6 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500">
                  Government Incentive Structuring
                </span>
                {onOpenConsultation && (
                  <button
                    type="button"
                    onClick={onOpenConsultation}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                  >
                    <span>Explore Schemes</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </StaggerItem>
        </StaggerGroup>

        {/* 2. Structured Process Narrative Strip */}
        <Reveal>
          <div className="rounded-3xl bg-slate-950 bg-section-grid-dark text-white p-6 sm:p-10 border border-slate-800 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.4)]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 text-left">
              <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-800 pb-5 md:pb-0 md:pr-6">
                <span className="font-manrope text-xs font-bold text-blue-400 tabular-nums">
                  01. Discovery
                </span>
                <h3 className="font-manrope font-bold text-base text-white">
                  Understand Requirements
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Detailed review of capex outlays, production capacities, land status, and machinery.
                </p>
              </div>

              <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-800 pb-5 md:pb-0 md:pr-6">
                <span className="font-manrope text-xs font-bold text-blue-400 tabular-nums">
                  02. Modeling
                </span>
                <h3 className="font-manrope font-bold text-base text-white">
                  Credit Feasibility (TEFR)
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Financial engineering of DSCR, sensitivity thresholds, and break-even capacity.
                </p>
              </div>

              <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-800 pb-5 md:pb-0 md:pr-6">
                <span className="font-manrope text-xs font-bold text-blue-400 tabular-nums">
                  03. Documentation
                </span>
                <h3 className="font-manrope font-bold text-base text-white">
                  Bank-Grade DPR Compilation
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Accredited CA &amp; DPR partner certification matching target bank appraisal norms.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-manrope text-xs font-bold text-emerald-400 tabular-nums">
                  04. Disbursement
                </span>
                <h3 className="font-manrope font-bold text-base text-white">
                  Sanction &amp; Debt Closing
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Direct representation before lender credit committees to achieve final sanction.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Independent Investment Banking &amp; Project Advisory Standards</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {onOpenAssessment && (
                  <button
                    type="button"
                    onClick={onOpenAssessment}
                    className="min-h-[40px] px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-manrope font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Start Free Project Assessment</span>
                  </button>
                )}
                {onOpenConsultation && (
                  <button
                    type="button"
                    onClick={onOpenConsultation}
                    className="min-h-[40px] px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-manrope font-semibold text-xs rounded-xl transition-all border border-white/15 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                    <span>Book Consultation</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
export default WhyChooseInisio;

import React from 'react';
import {
  FileText,
  Landmark,
  IndianRupee,
  CheckCircle2,
  Calculator,
  PhoneCall,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  BarChart3,
  Scale,
  Award
} from 'lucide-react';

interface WhyChooseInisioProps {
  onOpenAssessment?: () => void;
  onOpenConsultation?: () => void;
  isStandalone?: boolean;
}

export const WhyChooseInisio: React.FC<WhyChooseInisioProps> = ({
  onOpenAssessment,
  onOpenConsultation,
  isStandalone = false
}) => {
  return (
    <section className="py-16 sm:py-24 bg-white relative font-inter overflow-hidden border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            <span>Institutional Advantage</span>
            <span aria-hidden="true">·</span>
            <span>Greenfield Debt Advisory</span>
          </div>

          {isStandalone ? (
            <h1 className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]" style={{ textWrap: 'balance' }}>
              Why Greenfield Promoters &amp; Institutional Lenders Partner with Inisio
            </h1>
          ) : (
            <h2 className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]" style={{ textWrap: 'balance' }}>
              Why Greenfield Promoters &amp; Institutional Lenders Partner with Inisio
            </h2>
          )}

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Most greenfield projects face delays or loan rejections because promoters approach banks without institutional credit appraisal readiness. Inisio structures your debt capacity, financial ratios, and technical feasibility to clear lender underwriting committees.
          </p>
        </div>

        {/* 1. Asymmetric Bento Grid of Core Capabilities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Bento Card 1: Bank-Grade DPR & CMA Modeling (Col Span 7) */}
          <div className="lg:col-span-7 bg-slate-50/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 flex flex-col justify-between hover:border-slate-300 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="space-y-2">
                <h3 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Bank-Grade DPR &amp; CMA Financial Modeling
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Lenders scrutinize capex structure, sensitivity margins, and debt service coverage capacity (DSCR). We prepare credit-grade Detailed Project Reports (DPR) and CMA data aligned strictly with PSU &amp; Private commercial bank norms.
                </p>
              </div>

              {/* Sample Financial Metric Strip */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">DSCR Target</span>
                  <span className="font-manrope font-bold text-base text-slate-900 tabular-nums">≥ 1.35x – 1.60x</span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Debt-to-Equity</span>
                  <span className="font-manrope font-bold text-base text-slate-900 tabular-nums">70:30 – 75:25</span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Audit Alignment</span>
                  <span className="font-manrope font-bold text-base text-blue-700">CA Verified</span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between border-t border-slate-200/60 mt-6">
              <span className="text-xs font-medium text-slate-500">Includes 7–10 year financial projections</span>
              {onOpenAssessment && (
                <button
                  onClick={onOpenAssessment}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group cursor-pointer"
                >
                  <span>Evaluate Project</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Bento Card 2: Multi-Bank Syndication Liaison (Col Span 5) */}
          <div className="lg:col-span-5 bg-slate-50/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 flex flex-col justify-between hover:border-slate-300 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Landmark className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="space-y-2">
                <h3 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Multi-Bank Syndication Liaison
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Instead of single-bank dependency, we connect your project to an active network of 30+ leading PSU banks, private institutions, and specialized clean-tech infrastructure funds (IREDA, REC, PFC, SIDBI).
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct submission to relevant credit &amp; zonal committees</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Competitive interest rates &amp; flexible moratorium structuring</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/60 mt-6 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Term Loans ₹5 Cr – ₹250+ Cr</span>
              {onOpenConsultation && (
                <button
                  onClick={onOpenConsultation}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group cursor-pointer"
                >
                  <span>Talk to Advisor</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Bento Card 3: Dedicated Promoter Dashboard & Data Room (Col Span 5) */}
          <div className="lg:col-span-5 bg-slate-50/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 flex flex-col justify-between hover:border-slate-300 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <BarChart3 className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="space-y-2">
                <h3 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Transparent Promoter Tracking Desk
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Track every stage of your project finance lifecycle through a real-time dashboard. Receive live updates on technical appraisals, CA sign-offs, document compliance, and lender reviews.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Project Appraisal Pipeline</span>
                  <span className="text-emerald-700 font-bold">Live Tracking</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full w-3/4" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>Intake &amp; TEFR</span>
                  <span>Credit Sizing</span>
                  <span>Bank Sanction</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/60 mt-6 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">256-Bit SSL Encrypted Vault</span>
              <span className="text-xs font-semibold text-emerald-700">DPDP Compliant</span>
            </div>
          </div>

          {/* Bento Card 4: Promoter Equity & Subsidy Optimization (Col Span 7) */}
          <div className="lg:col-span-7 bg-slate-50/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 flex flex-col justify-between hover:border-slate-300 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Scale className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="space-y-2">
                <h3 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Capital Structuring &amp; State/Central Subsidies
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Optimize your capital outlays through eligible central and state incentives, including PMKSY, PM-KUSUM, TUFS textile schemes, interest subventions, and capital investment subsidies (up to 35%–50%).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">Subsidies Integration</span>
                  <p className="text-[11px] text-slate-500 leading-tight">Accurate mapping of eligible industrial &amp; clean-tech capital grants.</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">Equity Gap Solutions</span>
                  <p className="text-[11px] text-slate-500 leading-tight">Advisory for promoter contribution readiness and co-investor tie-ups.</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/60 mt-6 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Government Incentive Structuring</span>
              {onOpenConsultation && (
                <button
                  onClick={onOpenConsultation}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group cursor-pointer"
                >
                  <span>Explore Schemes</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* 2. Structured Process Narrative Strip */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-10 border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4">
              <span className="font-mono text-xs font-bold text-blue-400">01 / DISCOVERY</span>
              <h4 className="font-manrope font-bold text-sm text-white">Understand Requirements</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Detailed review of capex outlays, production capacities, land status, and machinery.</p>
            </div>

            <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4">
              <span className="font-mono text-xs font-bold text-blue-400">02 / MODELING</span>
              <h4 className="font-manrope font-bold text-sm text-white">Credit Feasibility (TEFR)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Financial engineering of DSCR, sensitivity thresholds, and break-even capacity.</p>
            </div>

            <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4">
              <span className="font-mono text-xs font-bold text-blue-400">03 / DOCUMENTATION</span>
              <h4 className="font-manrope font-bold text-sm text-white">Bank-Grade DPR Compilation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Accredited CA &amp; DPR partner certification matching target bank appraisal norms.</p>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-emerald-400">04 / DISBURSEMENT</span>
              <h4 className="font-manrope font-bold text-sm text-white">Sanction &amp; Debt Closing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Direct representation before lender credit committees to achieve final sanction.</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Independent Investment Banking &amp; Project Advisory Standards</span>
            </div>

            <div className="flex items-center gap-3">
              {onOpenAssessment && (
                <button
                  onClick={onOpenAssessment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-manrope font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Start Free Project Assessment</span>
                </button>
              )}
              {onOpenConsultation && (
                <button
                  onClick={onOpenConsultation}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-manrope font-semibold text-xs rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                  <span>Book Consultation</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

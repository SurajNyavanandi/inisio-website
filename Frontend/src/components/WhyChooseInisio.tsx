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
  onNavigateToPage?: (tab: string) => void;
  isStandalone?: boolean;
}

export const WhyChooseInisio: React.FC<WhyChooseInisioProps> = ({
  onOpenAssessment,
  onOpenConsultation,
  onNavigateToPage,
  isStandalone = false,
}) => {
  const CardHeading = isStandalone ? 'h2' : 'h3';
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
            Most projects face preventable delays when promoters approach lenders without structured feasibility and documentation. Inisio helps promoters evaluate indicative funding readiness, organise capital outlays, and connect with independent project finance professionals.
          </p>
        </Reveal>

        {/* 1. Core Platform Capabilities (2 Cards) */}
        <StaggerGroup className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Card 1 (Col Span 6) */}
          <StaggerItem className="lg:col-span-6 h-full">
            <div className="h-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_36px_-16px_rgba(37,99,235,0.18)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="space-y-2">
                  <CardHeading className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Project Feasibility &amp; Indicative Structuring
                  </CardHeading>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Assess estimated project cost, means of finance, indicative debt-to-equity structure, and preliminary DSCR insights, and generate an editable preliminary project teaser before engaging independent professionals.
                  </p>
                </div>

                <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-100">
                  <div className="space-y-0.5 pt-2">
                    <span className="text-xs font-medium text-slate-500 block">Indicative DSCR</span>
                    <span className="font-manrope font-bold text-base text-slate-900 tabular-nums">
                      Debt Servicing Check
                    </span>
                  </div>
                  <div className="space-y-0.5 pt-2">
                    <span className="text-xs font-medium text-slate-500 block">Means of Finance</span>
                    <span className="font-manrope font-bold text-base text-slate-900 tabular-nums">
                      Debt vs Equity Split
                    </span>
                  </div>
                  <div className="space-y-0.5 pt-2 col-span-2 sm:col-span-1">
                    <span className="text-xs font-medium text-slate-500 block">Project Teaser</span>
                    <span className="font-manrope font-bold text-base text-blue-700">Editable DOCX &amp; PDF</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 flex items-center justify-between gap-3 border-t border-slate-100 mt-6">
                <span className="text-xs font-medium text-slate-500">
                  Preliminary indicative evaluation only
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

          {/* Card 2 (Col Span 6) */}
          <StaggerItem className="lg:col-span-6 h-full">
            <div className="h-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_36px_-16px_rgba(37,99,235,0.18)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <BarChart3 className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="space-y-2">
                  <CardHeading className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Transparent Promoter Tracking &amp; Expert Directory
                  </CardHeading>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Keep your project information, uploaded documents, consultant introductions, and readiness progress organised in one dashboard while connecting with independent CAs, DPR, CMA, and TEV consultants.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Project Readiness Workspace</span>
                    <span className="text-emerald-700 font-semibold">Organised Tracking</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full w-3/4" />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Project Details</span>
                    <span>Teaser &amp; Checklist</span>
                    <span>Expert Connect</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 mt-6 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500">Encrypted Document Workspace</span>
                <span className="text-xs font-semibold text-emerald-700">DPDP Aligned</span>
              </div>
            </div>
          </StaggerItem>
        </StaggerGroup>

        {/* 2. Structured Process Narrative Strip */}
        <Reveal>
          <div className="rounded-3xl bg-slate-950 bg-section-grid-dark text-white p-6 sm:p-10 border border-slate-800 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.4)]">
            {isStandalone && (
              <h2 className="sr-only">
                Four-Stage Institutional Project Appraisal and Loan Sanction Process
              </h2>
            )}
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
                  Preliminary Teaser &amp; Checklist
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Editable project teaser and indicative document checklist before engaging professionals.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-manrope text-xs font-bold text-emerald-400 tabular-nums">
                  04. Expert Connect
                </span>
                <h3 className="font-manrope font-bold text-base text-white">
                  CA, DPR &amp; Advisory Discovery
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Connect with independent CAs, DPR/TEV consultants, or Prosync Consulting as needed.
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

        {isStandalone && onNavigateToPage && (
          <nav aria-label="Related advisory pages" className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
            {onOpenAssessment && (
              <a
                href="/assessment"
                onClick={(e) => { e.preventDefault(); onOpenAssessment(); }}
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                Free Bankability Scorecard
              </a>
            )}
            <a
              href="/how-it-works"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('how-it-works'); }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              6-Step Funding Process
            </a>
            <a
              href="/industries"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('industries'); }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Explore Priority Sectors
            </a>
            <a
              href="/blogs"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('blogs'); }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Advisory Blogs &amp; Research
            </a>
            <a
              href="/faq"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('faq'); }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Greenfield Funding FAQs
            </a>
            <a
              href="/contact"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('contact'); }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Contact Hyderabad Advisory Desk
            </a>
          </nav>
        )}
      </div>
    </section>
  );
};
export default WhyChooseInisio;

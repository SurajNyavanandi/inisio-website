import React, { useState } from 'react';
import {
  MessageSquare,
  FileSearch,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  ShieldCheck,
  Clock,
  Sparkles,
  FileCheck,
  Briefcase,
  BarChart3,
  FileText,
  CreditCard,
  Target,
} from 'lucide-react';
import { Reveal, StaggerGroup, StaggerItem } from './ui/MotionPrimitives';
import { cn } from '../lib/utils';

interface HowItWorksProps {
  onOpenConsultation: () => void;
  onOpenAssessment: () => void;
  onNavigateToContact: () => void;
  onNavigateToPage?: (tab: string) => void;
  isStandalone?: boolean;
}

interface StepItem {
  number: number;
  id: string;
  title: string;
  shortTitle: string;
  timeframe: string;
  description: string;
  icon: React.ElementType;
  points: string[];
  deliverables: string[];
}

export const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    number: 1,
    id: 'project-details',
    title: 'Project Details',
    shortTitle: 'Project Details',
    timeframe: 'STEP 01',
    description:
      'Share initial information about your project vision, proposed location, planned capacity, and capital requirements.',
    icon: MessageSquare,
    points: [
      'Project name & concept overview',
      'Proposed State & City location',
      'Optional sector classification & capacity scope',
      'Initial project readiness snapshot',
    ],
    deliverables: ['Project Intake Record', 'Initial Parameter Setup'],
  },
  {
    number: 2,
    id: 'project-assessment',
    title: 'Project Assessment',
    shortTitle: 'Project Assessment',
    timeframe: 'STEP 02',
    description:
      'Structure your estimated project cost, promoter equity contribution, proposed debt requirement, and capital expenditure breakup.',
    icon: FileSearch,
    points: [
      'Plant, machinery & civil works outlay',
      'Promoter equity vs proposed debt structure',
      'Promoter fund readiness check',
      'Working capital & capital structure inputs',
    ],
    deliverables: ['Feasibility Summary', 'Capex & Means of Finance'],
  },
  {
    number: 3,
    id: 'credit-profile',
    title: 'Credit Profile',
    shortTitle: 'Credit Profile',
    timeframe: 'STEP 03',
    description:
      'Evaluate promoter background, management experience, land readiness, collateral status, and existing credit profile.',
    icon: CreditCard,
    points: [
      'Land & site acquisition readiness',
      'Collateral & security status review',
      'Promoter track record & business constitution',
      'Key documentation readiness checks',
    ],
    deliverables: ['Credit Profile Summary', 'Readiness Gap Check'],
  },
  {
    number: 4,
    id: 'bankability-insights',
    title: 'Bankability Insights',
    shortTitle: 'Bankability Insights',
    timeframe: 'STEP 04',
    description:
      'Receive preliminary indicative bankability insights, DSCR estimates, and debt-to-equity structure to highlight areas needing attention before approaching lenders.',
    icon: BarChart3,
    points: [
      'Indicative bankability rating & feasibility score',
      'Indicative DSCR & debt-to-equity metrics',
      'Identification of documentation & readiness gaps',
      'Preliminary project viability overview',
    ],
    deliverables: ['Indicative Bankability Insights', 'DSCR & Debt Capacity Overview'],
  },
  {
    number: 5,
    id: 'project-teaser',
    title: 'Project Teaser',
    shortTitle: 'Project Teaser',
    timeframe: 'STEP 05',
    description:
      'Generate and download a preliminary project teaser in editable Word (DOCX) and PDF formats to review and share with consultants or financial institutions.',
    icon: FileText,
    points: [
      'Structured executive project summary',
      'Cost of project & means of finance summary',
      'Indicative financial ratios & DSCR snapshot',
      'Editable DOCX & PDF formats + Document Checklist',
    ],
    deliverables: ['Editable Project Teaser DOCX & PDF', 'Indicative Document Checklist'],
  },
  {
    number: 6,
    id: 'connect-with-experts',
    title: 'Connect with Experts',
    shortTitle: 'Connect with Experts',
    timeframe: 'STEP 06',
    description:
      'Discover and connect with independent Chartered Accountants, DPR, CMA and TEV consultants or Prosync Consulting for professional assistance.',
    icon: Target,
    points: [
      'CMA & Financial Analysis professionals',
      'DPR Preparation & TEV Study consultants',
      'Debt Syndication & Featured Advisory Partner (Prosync Consulting)',
      'Project workspace tracking & consultation coordination',
    ],
    deliverables: ['Independent Expert Introductions', 'Project Tracking Workspace'],
  },
];

export const HowItWorks: React.FC<HowItWorksProps> = ({
  onOpenConsultation,
  onOpenAssessment,
  onNavigateToPage,
  isStandalone = false,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const highlightCards = [
    { icon: Briefcase, title: 'Assess Project Viability' },
    { icon: FileCheck, title: 'Understand Funding Structure' },
    { icon: Clock, title: 'Check Bankability Readiness' },
    { icon: ShieldCheck, title: 'Prepare for the Next Step' },
  ];

  const partnerCards = [
    {
      icon: Briefcase,
      title: 'Project Feasibility Assessment',
      description: 'Understand project cost, funding structure and indicative bankability.',
    },
    {
      icon: FileCheck,
      title: 'Structured Project Documentation',
      description: 'Generate an editable project teaser and organise project information.',
    },
    {
      icon: Clock,
      title: 'Access to Project Experts',
      description: 'Discover independent CAs, DPR, CMA and TEV consultants.',
    },
    {
      icon: ShieldCheck,
      title: 'Project Tracking',
      description: 'Keep documents, consultant interactions and project progress organised.',
    },
  ];

  const scrollToStep = (stepNumber: number) => {
    setActiveStep(stepNumber);
    document.getElementById(`step-${stepNumber}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  return (
    <div className="bg-white text-slate-900 py-16 sm:py-24 font-inter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        {/* 1. Section Intro & Core Pillars */}
        <section className="text-center max-w-3xl mx-auto space-y-5">
          <Reveal className="space-y-4">
            <p className="text-xs font-semibold tracking-wide text-blue-700 inline-flex items-center justify-center gap-2 font-inter">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Project Assessment Platform (Not a Bank)</span>
            </p>

            {isStandalone ? (
              <h1
                className="font-manrope text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-[1.14]"
                style={{ textWrap: 'balance' }}
              >
                Your Project Journey:{' '}
                <span className="text-blue-600">From Project Details to Funding Readiness</span>
              </h1>
            ) : (
              <h2
                className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Your Project Journey:{' '}
                <span className="text-blue-600">From Project Details to Funding Readiness</span>
              </h2>
            )}

            <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Understand your project&apos;s funding structure, evaluate indicative bankability insights, generate an editable project teaser, and connect with independent project finance professionals across India.
            </p>
          </Reveal>

          <StaggerGroup className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-3 max-w-4xl mx-auto">
            {highlightCards.map((item) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.title} className="h-full">
                  <div className="h-full p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-center shadow-[0_1px_4px_rgba(15,23,42,0.03)] hover:bg-white hover:border-blue-300/90 hover:shadow-[0_10px_24px_-12px_rgba(37,99,235,0.18)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center justify-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 font-manrope leading-snug">
                      {item.title}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>

          <Reveal delay={0.08} className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={onOpenAssessment}
              className="min-h-[44px] px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-manrope font-bold text-sm rounded-xl transition-all shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)] inline-flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <span>Start Free Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Reveal>
        </section>

        {/* 2. Interactive Step Progression Track */}
        <Reveal>
          <section className="max-w-7xl mx-auto">
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_-6px_rgba(15,23,42,0.06)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-left">
                  {isStandalone ? (
                    <h2 className="text-xs font-bold tracking-wide text-slate-900 font-manrope">
                      Your Project Journey · From Project Details to Funding Readiness
                    </h2>
                  ) : (
                    <span className="text-xs font-bold tracking-wide text-slate-900 font-manrope">
                      Your Project Journey · From Project Details to Funding Readiness
                    </span>
                  )}
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-xs font-semibold text-blue-700 font-inter">
                    STEP 0{activeStep}: {HOW_IT_WORKS_STEPS[activeStep - 1]?.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollToStep(Math.max(1, activeStep - 1))}
                    disabled={activeStep === 1}
                    className="min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToStep(Math.min(6, activeStep + 1))}
                    disabled={activeStep === 6}
                    className="min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {HOW_IT_WORKS_STEPS.map((step) => {
                  const isActive = activeStep === step.number;
                  const isCompleted = activeStep > step.number;
                  return (
                    <button
                      type="button"
                      key={step.id}
                      onClick={() => scrollToStep(step.number)}
                      className={cn(
                        'p-3 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-1 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-[0_6px_18px_-8px_rgba(37,99,235,0.65)]'
                          : isCompleted
                          ? 'bg-blue-50/70 text-blue-900 border-blue-200 hover:bg-blue-100/70'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[11px] font-semibold tabular-nums',
                          isActive ? 'text-blue-100' : isCompleted ? 'text-blue-600' : 'text-slate-400'
                        )}
                      >
                        Step {step.number}
                      </span>
                      <span className="text-xs font-bold leading-tight truncate w-full font-manrope">
                        {step.shortTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </Reveal>

        {/* 3. Alternating Zig-Zag 6-Step Timeline */}
        <section className="relative max-w-7xl mx-auto space-y-8 sm:space-y-12">
          {/* Vertical Spine on Desktop */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute left-1/2 top-6 bottom-6 w-px bg-gradient-to-b from-slate-200 via-blue-300 to-slate-200 -translate-x-1/2 z-0"
          />

          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 1;
            const isActive = activeStep === step.number;

            return (
              <Reveal key={step.id} delay={0.03 * (index % 3)}>
                <div
                  id={`step-${step.number}`}
                  className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center scroll-mt-24"
                >
                  {/* Center Step Node (Desktop) */}
                  <button
                    type="button"
                    onClick={() => setActiveStep(step.number)}
                    aria-label={`Step ${step.number}: ${step.title}`}
                    className={cn(
                      'hidden md:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 shadow-sm items-center justify-center font-manrope font-extrabold text-sm tabular-nums z-20 transition-all duration-200 cursor-pointer',
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-[0_6px_18px_-4px_rgba(37,99,235,0.55)]'
                        : 'bg-white border-blue-200 text-blue-700 hover:border-blue-500'
                    )}
                  >
                    {step.number}
                  </button>

                  {/* Primary Step Card (Alternating Left/Right) */}
                  <div className={cn(isEven ? 'md:col-start-2' : 'md:col-start-1')}>
                    <div
                      onClick={() => setActiveStep(step.number)}
                      className={cn(
                        'bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-200 cursor-pointer hover:-translate-y-0.5',
                        isActive
                          ? 'border-blue-500 shadow-[0_14px_34px_-14px_rgba(37,99,235,0.22)]'
                          : 'border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/90 hover:shadow-[0_12px_28px_-12px_rgba(37,99,235,0.16)]'
                      )}
                    >
                      <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-inter">
                            <span className="font-semibold text-blue-700 tabular-nums">
                              Step {step.number}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="tabular-nums">{step.timeframe}</span>
                          </div>
                          <h3 className="font-manrope text-lg font-bold text-slate-900 mt-0.5 leading-snug">
                            {step.title}
                          </h3>
                        </div>
                      </div>

                      <p className="font-inter text-sm text-slate-600 leading-relaxed py-4">
                        {step.description}
                      </p>

                      <div className="space-y-2.5">
                        <span className="text-xs font-semibold text-slate-500 block font-inter">
                          What Inisio Does:
                        </span>
                        <ul className="space-y-2">
                          {step.points.map((pt, pIdx) => (
                            <li
                              key={pIdx}
                              className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed"
                            >
                              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                        <span className="font-semibold text-slate-500">Deliverables:</span>
                        {step.deliverables.map((del, dIdx) => (
                          <React.Fragment key={del}>
                            <span className="font-semibold text-blue-700">✓ {del}</span>
                            {dIdx < step.deliverables.length - 1 && (
                              <span aria-hidden="true" className="text-slate-300">·</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Opposite Zig-Zag Milestone Card (Desktop) */}
                  <div
                    className={cn(
                      'hidden md:flex flex-col justify-center',
                      isEven
                        ? 'md:col-start-1 md:row-start-1 items-end text-right'
                        : 'md:col-start-2 items-start text-left'
                    )}
                  >
                    <div className="p-6 rounded-2xl bg-slate-50/90 border border-slate-200/80 max-w-sm w-full space-y-2 hover:border-blue-200 transition-colors">
                      <span className="text-xs font-semibold text-blue-700 block font-inter tabular-nums">
                        Step {step.number} Milestone
                      </span>
                      <h4 className="font-manrope text-base font-bold text-slate-900 leading-snug">
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-inter">
                        {step.deliverables.join(' · ')}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </section>

        {/* 4. Featured Partner Strip (Prosync Consulting) */}
        <Reveal>
          <section className="relative overflow-hidden rounded-3xl bg-[#0B2A6B] bg-gradient-to-r from-[#0B2A6B] via-[#133E96] to-[#1D4ED8] p-6 sm:p-8 lg:p-10 text-white border border-blue-800/70 shadow-[0_18px_40px_-18px_rgba(11,42,107,0.45)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-section-grid-dark opacity-70"
            />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
              <div className="space-y-2 text-center lg:text-left max-w-xl">
                <p className="text-xs font-semibold tracking-wide text-sky-200 font-inter uppercase">
                  Featured Partner
                </p>
                <h2 className="font-manrope text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Prosync Consulting — Featured Advisory Partner
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 font-inter leading-relaxed">
                  Prosync Consulting is an independent advisory partner featured on Inisio for project finance structuring, institutional debt syndication coordination, and lender advisory support.
                </p>
                <p className="text-[11px] text-sky-200/80 font-inter">
                  Separate engagement terms, scope, and fees apply. Neither Inisio nor Prosync guarantees loan sanction or disbursement.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full lg:w-auto shrink-0">
                <div className="px-5 py-4 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/20 text-center">
                  <span className="font-manrope text-sm sm:text-base font-extrabold text-white block">
                    Financial Structuring
                  </span>
                  <span className="text-xs text-blue-100 font-medium mt-1 block">DPR &amp; Debt Advisory</span>
                </div>

                <div className="px-5 py-4 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/20 text-center">
                  <span className="font-manrope text-sm sm:text-base font-extrabold text-sky-200 block">
                    Independent Partner
                  </span>
                  <span className="text-xs text-blue-100 font-medium mt-1 block">Direct Engagement Terms</span>
                </div>

                <div className="px-5 py-4 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/20 text-center">
                  <span className="font-manrope text-sm sm:text-base font-extrabold text-emerald-300 block">
                    Multi-Sector Desk
                  </span>
                  <span className="text-xs text-blue-100 font-medium mt-1 block">Greenfield &amp; Expansion</span>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* 5. Why Choose Inisio Feature Cards */}
        <section className="space-y-10">
          <Reveal className="text-center max-w-2xl mx-auto space-y-2.5">
            <p className="text-xs font-semibold tracking-wide text-blue-700 font-inter">
              Why Choose Inisio
            </p>
            <h2
              className="font-manrope text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Make Better-Informed Project Funding Decisions
            </h2>
            <p className="text-sm text-slate-600 font-inter leading-relaxed">
              Assess your project, understand funding gaps, organise your information and connect with the right professionals.
            </p>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {partnerCards.map((card) => {
              const Icon = card.icon;
              return (
                <StaggerItem key={card.title} className="h-full">
                  <div className="group h-full bg-white p-6 rounded-2xl border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/90 hover:shadow-[0_14px_30px_-14px_rgba(37,99,235,0.18)] hover:-translate-y-0.5 transition-all duration-200 space-y-3.5 text-left">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-manrope text-base font-bold text-slate-900 leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-inter">
                      {card.description}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </section>

        {/* 6. Call-to-Action Banner */}
        <Reveal>
          <section className="pt-2">
            <div className="relative rounded-3xl bg-[#0B2A6B] bg-gradient-to-br from-[#0B2A6B] via-[#133E96] to-[#1E40AF] p-8 sm:p-12 text-white text-center border border-blue-800/70 shadow-[0_20px_50px_-20px_rgba(11,42,107,0.48)] overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-section-grid-dark opacity-70"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-20 -top-20 w-72 h-72 bg-blue-300/15 rounded-full blur-3xl"
              />

              <div className="max-w-3xl mx-auto space-y-5 relative z-10">
                <p className="text-xs font-semibold tracking-wide text-sky-200 inline-flex items-center justify-center gap-2 font-inter">
                  <Sparkles className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>Greenfield Project Finance</span>
                </p>

                <h2
                  className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight"
                  style={{ textWrap: 'balance' }}
                >
                  Ready to Assess Your Greenfield Project?
                </h2>

                <p className="font-inter text-sm sm:text-base text-blue-100 leading-relaxed max-w-2xl mx-auto">
                  Whether you&apos;re setting up a manufacturing unit, food processing plant, warehouse, hospital, hotel, renewable energy project, or any other Greenfield Project, Inisio helps you evaluate its viability and prepare for institutional funding with confidence.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
                  <button
                    type="button"
                    onClick={onOpenAssessment}
                    className="min-h-[44px] px-7 py-3.5 bg-white hover:bg-blue-50 active:scale-[0.98] text-blue-900 font-manrope font-bold text-sm rounded-xl transition-all shadow-[0_10px_24px_-8px_rgba(15,23,42,0.35)] inline-flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900"
                  >
                    <span>Start Free Assessment</span>
                    <ArrowRight className="w-4 h-4 text-blue-700" />
                  </button>

                  <button
                    type="button"
                    onClick={onOpenConsultation}
                    className="min-h-[44px] px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/50 font-manrope font-semibold text-sm rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <PhoneCall className="w-4 h-4 text-sky-200" />
                    <span>Talk to an Assessment Expert</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-white/20 text-xs text-blue-100 font-inter flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                  <span>✓ Preliminary Indicative Insights</span>
                  <span>✓ Structured Teaser &amp; Checklist</span>
                  <span>✓ Independent CA &amp; Consultant Access</span>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {isStandalone && onNavigateToPage && (
          <nav aria-label="Related advisory pages" className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
            <a
              href="/assessment"
              onClick={(e) => { e.preventDefault(); onOpenAssessment(); }}
              className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Free Bankability Scorecard
            </a>
            <a
              href="/about"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('about'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Why Choose Inisio Capital
            </a>
            <a
              href="/industries"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('industries'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Explore Priority Sectors
            </a>
            <a
              href="/blogs"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('blogs'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Advisory Blogs &amp; Research
            </a>
            <a
              href="/faq"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('faq'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Greenfield Funding FAQs
            </a>
            <a
              href="/contact"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('contact'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Contact Hyderabad Advisory Desk
            </a>
          </nav>
        )}
      </div>
    </div>
  );
};
export default HowItWorks;

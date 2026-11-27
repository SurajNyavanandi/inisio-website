import React from 'react';
import { ArrowRight, ShieldCheck, PhoneCall, CheckCircle2, Calculator } from 'lucide-react';
import { Reveal } from './ui/MotionPrimitives';

interface FinalCTAProps {
  onOpenAssessment: () => void;
  onOpenConsultation: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({
  onOpenAssessment,
  onOpenConsultation,
}) => {
  return (
    <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative rounded-3xl bg-[#0B2A6B] bg-gradient-to-br from-[#0B2A6B] via-[#133E96] to-[#1D4ED8] text-white p-8 sm:p-12 lg:p-16 border border-blue-800/70 shadow-[0_24px_60px_-20px_rgba(11,42,107,0.48)] overflow-hidden text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-section-grid-dark opacity-70"
            />
            {/* Subtle Ambient Radial Light */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-sky-400/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-blue-300/15 blur-3xl"
            />

            <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
              <p className="text-xs font-semibold tracking-wide text-sky-200 flex items-center justify-center gap-2 font-inter">
                <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                <span>Zero-Cost Initial Feasibility Review</span>
              </p>

              <h2
                className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Ready to Assess Your <span className="text-sky-300">Greenfield Project</span>?
              </h2>

              <p className="font-inter text-sm sm:text-base text-blue-100 leading-relaxed max-w-2xl mx-auto">
                Start your free preliminary project assessment to review funding structure, identify documentation gaps, and connect with independent project finance professionals.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 font-inter">
                <a
                  href="/assessment"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenAssessment();
                  }}
                  className="w-full sm:w-auto min-h-[44px] px-7 py-3.5 text-sm font-bold text-blue-900 bg-white hover:bg-blue-50 active:scale-[0.98] rounded-xl shadow-[0_10px_28px_-8px_rgba(15,23,42,0.35)] transition-all inline-flex items-center justify-center gap-2 group cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900"
                >
                  <Calculator className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Start Free Assessment</span>
                  <ArrowRight className="w-4 h-4 text-blue-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </a>

                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 rounded-xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900"
                >
                  <PhoneCall className="w-4 h-4 text-sky-200 shrink-0" />
                  <span>Book 1-on-1 Consultation</span>
                </button>
              </div>

              {/* Clean Trust Strip */}
              <div className="pt-6 border-t border-white/20 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-blue-100 font-medium font-inter">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  No credit card required
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  100% Confidential NDA
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  Instant Feasibility Check Report
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
export default FinalCTA;

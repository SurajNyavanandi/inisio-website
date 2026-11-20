import React from 'react';
import { Landmark } from 'lucide-react';
import { Marquee } from './ui/MotionPrimitives';

export const BankLogosCarousel: React.FC = () => {
  const banks = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'Axis Bank',
    'SIDBI',
    'IREDA',
    'Kotak Mahindra Bank',
    'Yes Bank',
  ];

  return (
    <section
      aria-label="Empaneled and Underwriting Partners"
      className="relative bg-slate-50/80 border-y border-slate-200/80 py-5 sm:py-6 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
          <div className="flex items-center justify-center lg:justify-start gap-2 shrink-0">
            <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Landmark className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-semibold tracking-wide text-slate-700 font-manrope whitespace-nowrap">
              Empaneled &amp; Underwriting Partners
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <Marquee
              pauseOnHover
              durationSeconds={36}
              repeat={2}
              fadeBgClass="from-slate-50"
              className="py-1"
            >
              {banks.map((bank) => (
                <div
                  key={bank}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-blue-300/80 hover:text-blue-700 transition-colors duration-200 shrink-0"
                >
                  <span className="text-xs font-semibold text-slate-700 font-inter whitespace-nowrap">
                    {bank}
                  </span>
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      </div>
    </section>
  );
};

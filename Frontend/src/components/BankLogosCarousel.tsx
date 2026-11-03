import React from 'react';
import { Landmark } from 'lucide-react';

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
    'Yes Bank'
  ];

  return (
    <div className="bg-slate-100/70 border-b border-slate-200/80 py-4 sm:py-5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 shrink-0">
            <Landmark className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-inter">
              Empaneled &amp; Underwriting Partners
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2 text-xs font-semibold text-slate-500 font-inter">
            {banks.map((bank, index) => (
              <span key={index} className="hover:text-blue-700 transition-colors cursor-default whitespace-nowrap">
                {bank}
                {index < banks.length - 1 && <span className="text-slate-300 ml-4 font-normal">|</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

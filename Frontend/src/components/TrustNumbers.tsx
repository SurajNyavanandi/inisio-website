import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  TrendingUp,
  Building2,
  Award,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';
import api from '../utils/apiClient';
import { TrustNumber } from '../types';
import { NumberTicker, Reveal, StaggerGroup, StaggerItem } from './ui/MotionPrimitives';

export const TrustNumbers: React.FC = () => {
  const [stats, setStats] = useState<TrustNumber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.stats
      .getAll()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data as any)?.data || [];
        setStats(list);
      })
      .catch((err) => {
        console.error('Failed to load trust statistics:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileCheck':
        return <FileCheck className="w-4 h-4" />;
      case 'TrendingUp':
        return <TrendingUp className="w-4 h-4" />;
      case 'Building2':
        return <Building2 className="w-4 h-4" />;
      case 'Award':
        return <Award className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <section
      className="relative py-12 sm:py-16 bg-white bg-section-grid border-b border-slate-200/80"
      aria-labelledby="trust-numbers-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <h2 id="trust-numbers-heading" className="sr-only">
          Inisio Capital Track Record and Pan-India Debt Syndication Benchmarks
        </h2>

        <Reveal className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200/70">
          <p className="text-xs font-semibold tracking-wide text-blue-700 flex items-center gap-2 font-inter">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Proven Track Record · Pan-India Debt Advisory</span>
          </p>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-500 font-medium text-xs font-inter">
            <span>HDFC Bank</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>ICICI Bank</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>SBI</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Axis Bank</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Canara Bank</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>SIDBI</span>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 animate-pulse space-y-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)]"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-8 w-24 bg-slate-200 rounded-lg" />
                  <div className="h-4 w-36 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : stats.length > 0 ? (
          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {stats.map((item, index) => (
              <StaggerItem key={item.id || item.statId || index} className="h-full">
                <div className="group h-full bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] hover:shadow-[0_14px_32px_-12px_rgba(37,99,235,0.18)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50/90 border border-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors duration-200">
                    {getIcon(item.icon)}
                  </div>

                  <div className="space-y-1">
                    <NumberTicker
                      value={item.value}
                      prefix={item.prefix || ''}
                      suffix={item.suffix || ''}
                      className="font-manrope font-extrabold text-3xl sm:text-[34px] text-slate-900 tracking-tight leading-none block"
                    />
                    <h3 className="font-inter font-medium text-slate-600 text-xs sm:text-sm leading-snug pt-1">
                      {item.label}
                    </h3>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        ) : null}
      </div>
    </section>
  );
};
export default TrustNumbers;

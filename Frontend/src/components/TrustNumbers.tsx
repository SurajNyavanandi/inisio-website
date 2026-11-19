import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import {
  FileCheck,
  TrendingUp,
  Building2,
  Award,
  CheckCircle,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import api from '../utils/apiClient';
import { TrustNumber } from '../types';

interface CounterProps {
  end: number;
  prefix?: string;
  suffix?: string;
}

const AnimatedCounter: React.FC<CounterProps> = ({ end, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = end / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, end]);

  return (
    <span ref={ref} className="font-manrope font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight tabular-nums">
      {prefix}
      {count.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
};

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
        return <FileCheck className="w-4 h-4 text-blue-600" />;
      case 'TrendingUp':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'Building2':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'Award':
        return <Award className="w-4 h-4 text-blue-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <section className="py-6 sm:py-8 bg-slate-50/60 border-y border-slate-200/80 relative" aria-labelledby="trust-numbers-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="trust-numbers-heading" className="sr-only">
          Inisio Capital Track Record and Pan-India Debt Syndication Benchmarks
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Proven Track Record · Pan-India Debt Advisory</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-500 font-semibold uppercase text-[11px] tracking-wider font-inter">
            <span>HDFC Bank</span>
            <span className="text-slate-300">·</span>
            <span>ICICI Bank</span>
            <span className="text-slate-300">·</span>
            <span>SBI</span>
            <span className="text-slate-300">·</span>
            <span>Axis Bank</span>
            <span className="text-slate-300">·</span>
            <span>Canara Bank</span>
            <span className="text-slate-300">·</span>
            <span>SIDBI</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-slate-200/80 p-4 animate-pulse space-y-2">
                <div className="w-6 h-6 bg-slate-200 rounded-md" />
                <div className="h-7 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : stats.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((item, index) => (
              <motion.div
                key={item.id || item.statId || index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:shadow-sm hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                    {React.cloneElement(getIcon(item.icon), {
                      className: "w-3 h-3 text-blue-600 group-hover:text-white transition-colors"
                    })}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <AnimatedCounter
                    end={item.value}
                    prefix={item.prefix || ''}
                    suffix={item.suffix || ''}
                  />
                  <h3 className="font-manrope font-semibold text-slate-800 text-xs tracking-tight">
                    {item.label}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};
export default TrustNumbers;

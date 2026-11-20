import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Award, Quote } from 'lucide-react';
import api from '../utils/apiClient';
import { TestimonialItem } from '../types';
import { Marquee, Reveal } from './ui/MotionPrimitives';
import { cn } from '../lib/utils';

const TestimonialCard: React.FC<{ item: TestimonialItem }> = ({ item }) => {
  const initials = (item.name || 'IN')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="w-[310px] sm:w-[380px] lg:w-[410px] shrink-0 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_36px_-16px_rgba(37,99,235,0.2)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-5 relative">
      <Quote
        aria-hidden="true"
        className="absolute top-5 right-5 w-9 h-9 text-blue-100/80 pointer-events-none"
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
          <div className="flex items-center gap-1 text-amber-400">
            {[...Array(item.rating || 5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-xs font-semibold text-slate-700 ml-1 tabular-nums">5.0 / 5.0</span>
          </div>

          {item.fundingAmount && (
            <div className="text-xs font-semibold text-blue-700 inline-flex items-center gap-1 tabular-nums">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{item.fundingAmount} Debt Sanctioned</span>
            </div>
          )}
        </div>

        <p className="font-inter text-sm text-slate-700 leading-relaxed">
          &ldquo;{item.quote}&rdquo;
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center gap-3 font-inter">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-manrope font-bold text-xs flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="font-manrope font-bold text-sm text-slate-900 truncate">
            {item.name}
          </h3>
          <p className="text-xs text-slate-500 truncate">
            {item.title}, <span className="font-semibold text-slate-700">{item.company}</span>
          </p>
        </div>
      </div>
    </article>
  );
};

export const Testimonials: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);

  const industries = ['All', 'Manufacturing', 'Healthcare', 'Food Processing', 'Solar & Renewable'];

  // Fetch testimonials dynamically from backend API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.testimonials
      .getAll(selectedIndustry)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data as any)?.data || [];
        setTestimonials(list);
      })
      .catch((err) => {
        console.error('Failed to load testimonials:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedIndustry]);

  const hasDualRows = testimonials.length >= 4;
  const splitIndex = Math.ceil(testimonials.length / 2);
  const firstRow = hasDualRows ? testimonials.slice(0, splitIndex) : testimonials;
  const secondRow = hasDualRows ? testimonials.slice(splitIndex) : [];

  return (
    <section
      id="testimonials"
      className="py-16 sm:py-24 bg-slate-50/70 bg-section-dots border-y border-slate-200/80 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3">
          <p className="text-xs font-semibold tracking-wide text-blue-700 inline-flex items-center justify-center gap-1.5 font-inter">
            <Award className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Client Track Record · Bank-Sanctioned Case Studies</span>
          </p>
          <h2
            className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
            style={{ textWrap: 'balance' }}
          >
            Proven Greenfield Project Appraisals
          </h2>
          <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed">
            Verified founder feedback on debt syndication, DPR preparation, and commercial bank sanction timelines.
          </p>

          {/* Industry Filter Segmented Control */}
          <div className="pt-3 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-1 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
              {industries.map((ind) => (
                <button
                  type="button"
                  key={ind}
                  onClick={() => setSelectedIndustry(ind)}
                  className={cn(
                    'min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
                    selectedIndustry === ind
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* Infinite Auto-Scrolling Marquee Container */}
      <div className="max-w-[1440px] mx-auto">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 animate-pulse shadow-2xs"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-4 w-28 bg-slate-100 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-100 rounded" />
                    <div className="h-4 w-5/6 bg-slate-100 rounded" />
                    <div className="h-4 w-2/3 bg-slate-100 rounded" />
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-28 bg-slate-200 rounded" />
                      <div className="h-3 w-36 bg-slate-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="sr-only">Loading verified case studies...</p>
          </div>
        ) : testimonials.length === 1 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
            <TestimonialCard item={testimonials[0]} />
          </div>
        ) : testimonials.length > 1 ? (
          <div className="space-y-5">
            {/* Row 1: Forward Auto-Scrolling Marquee */}
            <Marquee
              pauseOnHover
              durationSeconds={hasDualRows ? 38 : 34}
              repeat={2}
              fadeBgClass="from-slate-50"
              className="py-1"
            >
              {firstRow.map((item, idx) => (
                <TestimonialCard
                  key={`${item.id || item.testimonialId || idx}-r1`}
                  item={item}
                />
              ))}
            </Marquee>

            {/* Row 2: Opposite-Direction Marquee (when enough items exist) */}
            {hasDualRows && secondRow.length > 0 && (
              <Marquee
                reverse
                pauseOnHover
                durationSeconds={42}
                repeat={2}
                fadeBgClass="from-slate-50"
                className="py-1"
              >
                {secondRow.map((item, idx) => (
                  <TestimonialCard
                    key={`${item.id || item.testimonialId || idx}-r2`}
                    item={item}
                  />
                ))}
              </Marquee>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              No testimonials available for this category yet.
            </div>
          </div>
        )}
      </div>

      {/* Turnaround Benchmark Footer */}
      <Reveal delay={0.08} className="mt-10 text-center max-w-xl mx-auto px-4">
        <p className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-700 font-semibold font-inter">
          <Award className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Average Credit Approval Turnaround Time: 28 Days</span>
        </p>
      </Reveal>
    </section>
  );
};
export default Testimonials;

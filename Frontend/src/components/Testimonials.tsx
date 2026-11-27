import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Briefcase, Building2, ShieldCheck, Quote } from 'lucide-react';
import api from '../utils/apiClient';
import { TestimonialItem } from '../types';
import { Marquee, Reveal } from './ui/MotionPrimitives';
import { cn } from '../lib/utils';

const CaseStudyCard: React.FC<{ item: TestimonialItem }> = ({ item }) => {
  const showClientIdentity = Boolean(item.writtenPermission);

  return (
    <article className="w-[320px] sm:w-[390px] lg:w-[420px] shrink-0 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_36px_-16px_rgba(37,99,235,0.2)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-4 relative">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-700">
            {item.industry}
          </span>

          {item.fundingAmount && (
            <div className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1 tabular-nums">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{item.fundingAmount}</span>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-manrope font-bold text-base text-slate-900 leading-snug">
            {item.projectType || item.company || `${item.industry} Advisory Assignment`}
          </h3>
          {item.fundingRequirement && (
            <p className="text-xs font-semibold text-blue-700 mt-1 tabular-nums">
              Funding Requirement: {item.fundingRequirement}
            </p>
          )}
        </div>

        {item.advisoryScope && (
          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Advisory Scope
            </span>
            <p className="leading-relaxed">{item.advisoryScope}</p>
          </div>
        )}

        <p className="font-inter text-xs sm:text-sm text-slate-600 leading-relaxed">
          {item.quote}
        </p>
      </div>

      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 font-inter">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-manrope font-bold text-xs text-slate-900 truncate">
              {showClientIdentity ? item.name : (item.advisoryPartner || 'Prosync Consulting')}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {showClientIdentity ? `${item.title}, ${item.company}` : "Inisio's Featured Advisory Partner"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
};

const VerifiedTestimonialCard: React.FC<{ item: TestimonialItem }> = ({ item }) => (
  <article className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4 text-left relative">
    <Quote aria-hidden="true" className="absolute top-5 right-5 w-7 h-7 text-blue-100 pointer-events-none" />
    <div className="flex items-center gap-2">
      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
        {item.industry}
      </span>
      <span className="text-[11px] font-semibold text-emerald-700">Verified Client Consent</span>
    </div>
    <p className="font-inter text-sm text-slate-700 leading-relaxed pr-6">
      &ldquo;{item.quote}&rdquo;
    </p>
    <div className="pt-3 border-t border-slate-100">
      <p className="font-manrope font-bold text-sm text-slate-900">{item.name}</p>
      <p className="text-xs text-slate-500">
        {item.title}, <span className="font-semibold text-slate-700">{item.company}</span>
      </p>
    </div>
  </article>
);

export const Testimonials: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);

  const industries = [
    'All',
    'Manufacturing',
    'Healthcare',
    'Food Processing',
    'Infrastructure',
    'Solar & Renewable Energy',
  ];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.testimonials
      .getAll(selectedIndustry)
      .then((data) => {
        if (!isMounted) return;
        const rawList: TestimonialItem[] = Array.isArray(data) ? data : (data as any)?.data || [];
        // Remove duplicates cleanly by testimonialId / projectType + industry
        const seen = new Set<string>();
        const deduped = rawList.filter((item) => {
          const key = String(item.testimonialId || `${item.industry}_${item.projectType || item.company}`).toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setItems(deduped);
      })
      .catch((err) => {
        console.error('Failed to load case studies:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedIndustry]);

  // Separate actual advisory case studies (Prosync Consulting) from permitted customer testimonials
  const caseStudies = items.filter((i) => i.recordType !== 'testimonial');
  const permittedTestimonials = items.filter((i) => i.recordType === 'testimonial' && i.writtenPermission === true);

  const hasDualRows = caseStudies.length >= 4;
  const splitIndex = Math.ceil(caseStudies.length / 2);
  const firstRow = hasDualRows ? caseStudies.slice(0, splitIndex) : caseStudies;
  const secondRow = hasDualRows ? caseStudies.slice(splitIndex) : [];

  return (
    <section
      id="testimonials"
      className="py-16 sm:py-24 bg-slate-50/70 bg-section-dots border-y border-slate-200/80 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-3">
          <p className="text-xs font-semibold tracking-wide text-blue-700 inline-flex items-center justify-center gap-1.5 font-inter">
            <Award className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Featured Advisory Partner · Prosync Consulting Past Assignments</span>
          </p>
          <h2
            className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
            style={{ textWrap: 'balance' }}
          >
            Project Finance Experience &amp; Success Stories
          </h2>
          <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed">
            Explore project finance assignments, financial structuring experience and outcomes achieved through advisory engagements.
          </p>

          {/* Sector Filters */}
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

      {/* Case Studies Section */}
      <div className="max-w-[1440px] mx-auto space-y-10">
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
                </div>
              ))}
            </div>
            <p className="sr-only">Loading advisory case studies...</p>
          </div>
        ) : caseStudies.length === 1 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
            <CaseStudyCard item={caseStudies[0]} />
          </div>
        ) : caseStudies.length > 1 ? (
          <div className="space-y-5">
            <Marquee
              pauseOnHover
              durationSeconds={hasDualRows ? 38 : 34}
              repeat={2}
              fadeBgClass="from-slate-50"
              className="py-1"
            >
              {firstRow.map((item, idx) => (
                <CaseStudyCard
                  key={`${item.id || item.testimonialId || idx}-r1`}
                  item={item}
                />
              ))}
            </Marquee>

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
                  <CaseStudyCard
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
              No advisory case studies available for this sector yet.
            </div>
          </div>
        )}

        {/* Separated Customer Testimonials Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Client Testimonials</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Client names, quotations, and company names are published only with written permission.
              </span>
            </div>

            {permittedTestimonials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permittedTestimonials.map((item, idx) => (
                  <VerifiedTestimonialCard key={item.id || item.testimonialId || idx} item={item} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Individual client quotations and identifying company records are withheld unless explicit written permission is recorded. Advisory assignments listed above represent historical engagements delivered through <strong>Prosync Consulting</strong>, Inisio&apos;s Featured Advisory Partner.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Past Engagement Disclaimer */}
      <Reveal delay={0.08} className="mt-8 max-w-4xl mx-auto px-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-left flex items-start gap-2.5 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Disclaimer:</strong> The project finance assignments and case studies highlighted above represent historical advisory work undertaken by Prosync Consulting (Inisio&apos;s Featured Advisory Partner), not outcomes generated by the Inisio software platform alone. Outcomes relate to specific past engagements under their respective project facts and do not guarantee similar results, loan sanction, or timelines for future projects.
          </p>
        </div>
      </Reveal>
    </section>
  );
};
export default Testimonials;

import React, { useState, useEffect } from 'react';
import {
  Factory,
  Sun,
  Utensils,
  Pill,
  Warehouse,
  Hotel,
  Server,
  Shirt,
  Sparkles,
  ArrowRight,
  Wheat,
  Sprout,
  Activity,
  Building2,
  LucideIcon,
} from 'lucide-react';
import api from '../utils/apiClient';
import { Reveal, StaggerGroup, StaggerItem } from './ui/MotionPrimitives';
import { cn } from '../lib/utils';

interface IndustriesSectionProps {
  onSelectIndustryForAssessment: (industryName: string) => void;
  onOpenAssessment: () => void;
  onOpenConsultation: () => void;
  selectedIndustryName?: string;
  onNavigateToPage?: (tab: string) => void;
  isStandalone?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Factory,
  Sun,
  Utensils,
  Pill,
  Warehouse,
  Hotel,
  Server,
  Shirt,
  Wheat,
  Sprout,
  Activity,
  Building2,
};

export const IndustriesSection: React.FC<IndustriesSectionProps> = ({
  onSelectIndustryForAssessment,
  onOpenAssessment,
  selectedIndustryName,
  onNavigateToPage,
  isStandalone = false,
}) => {
  const SectorHeading = isStandalone ? 'h2' : 'h3';
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [industriesList, setIndustriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.industries
      .getAll()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data as any)?.data || [];
        const normalized = list.map((item: any, idx: number) => {
          const iconKey = item.iconName || '';
          const matchedIcon = ICON_MAP[iconKey] || Factory;
          return {
            id: item.slug || item._id || `ind_${idx}`,
            name: item.name,
            category: item.category || 'Manufacturing',
            icon: matchedIcon,
            ticketSize: item.avgLoanSize || item.projectCostRange || '₹5 Cr – ₹100 Cr',
            dscr: item.dscrNorms || '≥ 1.35',
            subsidy:
              Array.isArray(item.subsidiesAndSchemes) && item.subsidiesAndSchemes.length > 0
                ? item.subsidiesAndSchemes[0]
                : 'Central & State Industrial Policy Subsidies',
            feasibility: item.feasibilityRate
              ? `${item.feasibilityRate} Sanction Success`
              : '92% Sanction Success',
            description: item.description || item.overview || '',
          };
        });
        setIndustriesList(normalized);
      })
      .catch((err) => {
        console.error('API fetch for industries failed:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const dynamicCategories = [
    'All',
    ...Array.from(new Set(industriesList.map((i) => i.category))).filter(Boolean),
  ];

  const filtered =
    selectedCategory === 'All'
      ? industriesList
      : industriesList.filter((i) => i.category === selectedCategory);

  return (
    <section
      id="industries"
      className="py-16 sm:py-24 bg-white relative border-t border-slate-200/80 font-inter"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold tracking-wide text-blue-700 inline-flex items-center gap-1.5 font-inter">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Sector-Specific Underwriting Criteria</span>
            </p>
            {isStandalone ? (
              <h1
                className="font-manrope text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Greenfield Project Sectors &amp; Bankability Benchmarks
              </h1>
            ) : (
              <h2
                className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Greenfield Project Sectors &amp; Bankability Benchmarks
              </h2>
            )}
            <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed">
              Every industrial domain carries distinct bank DSCR norms, promoter equity thresholds, and central or state capital subsidy schemes. Explore Inisio Capital&apos;s sector benchmarks across food processing, solar power, warehousing, healthcare, and hospitality in Telangana and across India.
            </p>
          </div>

          <a
            href="/assessment"
            onClick={(e) => {
              e.preventDefault();
              onOpenAssessment();
            }}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-manrope font-bold text-sm rounded-xl shadow-[0_8px_20px_-8px_rgba(37,99,235,0.55)] transition-all shrink-0 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <span>Run Free Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </Reveal>

        {/* Interactive Segmented Category Filter */}
        {dynamicCategories.length > 1 && (
          <Reveal delay={0.05} className="mb-10">
            <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl">
              {dynamicCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'min-h-[36px] px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/80'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Reveal>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 animate-pulse space-y-4 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.05)]"
              >
                <div className="flex justify-between items-center">
                  <div className="w-11 h-11 bg-slate-100 rounded-xl" />
                  <div className="h-4 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-5 w-3/4 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="h-4 w-full bg-slate-100 rounded" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                </div>
                <div className="h-10 w-full bg-slate-200 rounded-xl mt-2" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          /* Bento-Inspired Staggered Industry Card Grid */
          <StaggerGroup
            key={selectedCategory}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
          >
            {filtered.map((item, idx) => {
              const IconComponent = item.icon;
              const isSelected = selectedIndustryName === item.name;
              const isFeaturedBento =
                selectedCategory === 'All' && filtered.length >= 6 && idx === 0;

              return (
                <StaggerItem
                  key={item.id}
                  className={cn('h-full', isFeaturedBento && 'md:col-span-2')}
                >
                  <div
                    className={cn(
                      'group h-full flex flex-col justify-between bg-white rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-0.5',
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/15 shadow-[0_14px_32px_-12px_rgba(37,99,235,0.22)]'
                        : 'border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/90 hover:shadow-[0_16px_34px_-14px_rgba(37,99,235,0.18)]'
                    )}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors duration-200">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 tabular-nums text-right">
                          {item.feasibility}
                        </span>
                      </div>

                      <div>
                        <SectorHeading className="font-manrope font-bold text-base sm:text-lg text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                          {item.name}
                        </SectorHeading>
                        <p className="font-inter text-xs sm:text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs font-inter">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Ticket Size:</span>
                          <span className="font-semibold text-slate-900 tabular-nums">
                            {item.ticketSize}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Target DSCR:</span>
                          <span className="font-semibold text-slate-900 tabular-nums">
                            {item.dscr}
                          </span>
                        </div>
                        <p className="pt-2 border-t border-slate-100 text-xs text-blue-800 font-medium leading-relaxed">
                          {item.subsidy}
                        </p>
                      </div>
                    </div>

                    <div className="pt-5 mt-3">
                      <button
                        type="button"
                        onClick={() => onSelectIndustryForAssessment(item.name)}
                        className="w-full min-h-[40px] py-2.5 px-3.5 bg-slate-900 hover:bg-blue-600 active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                      >
                        <span>Check Feasibility</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        ) : (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
            No industry sectors available for the selected category.
          </div>
        )}

        {isStandalone && onNavigateToPage && (
          <nav aria-label="Related advisory pages" className="mt-12 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
            <a
              href="/assessment"
              onClick={(e) => { e.preventDefault(); onOpenAssessment(); }}
              className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Free Bankability Scorecard
            </a>
            <a
              href="/how-it-works"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('how-it-works'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              6-Step Funding Process
            </a>
            <a
              href="/about"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('about'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Why Choose Inisio Capital
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
    </section>
  );
};
export default IndustriesSection;

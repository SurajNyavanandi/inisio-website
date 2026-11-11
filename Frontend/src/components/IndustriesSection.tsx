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
  LucideIcon
} from 'lucide-react';
import api from '../utils/apiClient';

interface IndustriesSectionProps {
  onSelectIndustryForAssessment: (industryName: string) => void;
  onOpenAssessment: () => void;
  onOpenConsultation: () => void;
  selectedIndustryName?: string;
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
  selectedIndustryName
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [industriesList, setIndustriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.industries.getAll()
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
            subsidy: Array.isArray(item.subsidiesAndSchemes) && item.subsidiesAndSchemes.length > 0
              ? item.subsidiesAndSchemes[0]
              : 'Central & State Industrial Policy Subsidies',
            feasibility: item.feasibilityRate ? `${item.feasibilityRate} Sanction Success` : '92% Sanction Success',
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
    ...Array.from(new Set(industriesList.map((i) => i.category))).filter(Boolean)
  ];

  const filtered = selectedCategory === 'All'
    ? industriesList
    : industriesList.filter(i => i.category === selectedCategory);

  return (
    <section id="industries" className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700 flex items-center gap-1.5 font-inter">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Sector-Specific Underwriting Criteria</span>
            </p>
            <h2 className="font-manrope text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Greenfield Project Sectors &amp; Bankability Benchmarks
            </h2>
            <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed">
              Every industrial domain has distinct debt-service norms, promoter contribution thresholds, and state subsidy schemes. Select your sector to evaluate bank loan feasibility.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAssessment}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span>Run Free Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Badges */}
        {dynamicCategories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10 pb-2 border-b border-slate-100">
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                  <div className="h-5 w-24 bg-slate-200 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="h-4 w-full bg-slate-100 rounded" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                </div>
                <div className="h-10 w-full bg-slate-200 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          /* Grid of Industry Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((item) => {
              const IconComponent = item.icon;
              const isSelected = selectedIndustryName === item.name;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between bg-white rounded-2xl p-6 border transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200 hover:border-blue-400 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        {item.feasibility}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-manrope font-bold text-base text-slate-900 leading-snug">
                        {item.name}
                      </h3>
                      <p className="font-inter text-xs text-slate-500 mt-2 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-inter">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Ticket Size:</span>
                        <span className="font-bold text-slate-800">{item.ticketSize}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Target DSCR:</span>
                        <span className="font-bold text-slate-800">{item.dscr}</span>
                      </div>
                      <div className="pt-1 text-[11px] text-blue-800 bg-blue-50/70 p-2 rounded-lg font-medium leading-relaxed">
                        💡 {item.subsidy}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-4">
                    <button
                      type="button"
                      onClick={() => onSelectIndustryForAssessment(item.name)}
                      className="w-full py-2.5 px-3 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Check Feasibility</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            No industry sectors available for the selected category.
          </div>
        )}
      </div>
    </section>
  );
};
export default IndustriesSection;

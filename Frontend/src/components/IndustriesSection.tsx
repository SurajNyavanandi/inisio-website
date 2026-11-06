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
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
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
  onOpenConsultation,
  selectedIndustryName
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [industriesList, setIndustriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fallbackIndustries = [
    {
      id: 'ind-1',
      name: 'Manufacturing & Engineering Unit',
      category: 'Manufacturing',
      icon: Factory,
      ticketSize: '₹5 Cr – ₹100 Cr',
      dscr: '≥ 1.45',
      subsidy: 'Up to 25% Capital Subsidy + State SGST Reimbursement',
      feasibility: '94% Sanction Success',
      description: 'Capital-intensive machining, auto components, forging, and heavy structural fabrication units.'
    },
    {
      id: 'ind-2',
      name: 'Solar Power Plant (Ground & Rooftop)',
      category: 'Renewables',
      icon: Sun,
      ticketSize: '₹3 Cr – ₹150 Cr',
      dscr: '≥ 1.25',
      subsidy: 'PM-KUSUM / Accelerated Depreciation / Concessional Debt',
      feasibility: '96% Sanction Success',
      description: 'Grid-connected and captive solar installations backed by long-term Power Purchase Agreements (PPA).'
    },
    {
      id: 'ind-3',
      name: 'Food Processing & Cold Storage',
      category: 'Agro-Tech',
      icon: Utensils,
      ticketSize: '₹2 Cr – ₹40 Cr',
      dscr: '≥ 1.50',
      subsidy: 'PMKSY 35%-50% Grants + Priority Sector Concessions',
      feasibility: '92% Sanction Success',
      description: 'Modern grain processing, multi-commodity cold storage, frozen foods, and dairy processing lines.'
    },
    {
      id: 'ind-4',
      name: 'Pharma & Medical Device Unit',
      category: 'Healthcare',
      icon: Pill,
      ticketSize: '₹10 Cr – ₹120 Cr',
      dscr: '≥ 1.60',
      subsidy: 'PLI Scheme & Medical Devices Park Special Incentives',
      feasibility: '91% Sanction Success',
      description: 'WHO-GMP compliant active pharmaceutical ingredient (API) manufacturing and sterile medical formulations.'
    },
    {
      id: 'ind-5',
      name: 'Industrial Logistics & Warehousing',
      category: 'Logistics',
      icon: Warehouse,
      ticketSize: '₹8 Cr – ₹80 Cr',
      dscr: '≥ 1.35',
      subsidy: 'National Logistics Policy Infrastructure Status Benefits',
      feasibility: '95% Sanction Success',
      description: 'Grade-A PEB pre-engineered warehousing parks, cross-dock hubs, and automated fulfillment centers.'
    },
    {
      id: 'ind-6',
      name: 'Commercial Hospital & Diagnostic Center',
      category: 'Healthcare',
      icon: Hotel,
      ticketSize: '₹15 Cr – ₹200 Cr',
      dscr: '≥ 1.40',
      subsidy: 'Healthcare Priority Sector Lending + NABH Accreditations',
      feasibility: '93% Sanction Success',
      description: 'Tertiary-care multi-speciality hospitals, medical colleges, and oncology centers with medical equipment financing.'
    },
    {
      id: 'ind-7',
      name: 'Tier-3 Data Center & Cloud Edge Facility',
      category: 'Tech & Infra',
      icon: Server,
      ticketSize: '₹25 Cr – ₹350 Cr',
      dscr: '≥ 1.30',
      subsidy: 'Power Tariff Subsidies & Dual-Grid State Incentives',
      feasibility: '89% Sanction Success',
      description: 'High-density colocation data centers with redundant power, fiber connectivity, and green cooling.'
    },
    {
      id: 'ind-8',
      name: 'Textiles & Apparel Processing Unit',
      category: 'Manufacturing',
      icon: Shirt,
      ticketSize: '₹4 Cr – ₹60 Cr',
      dscr: '≥ 1.55',
      subsidy: 'ATUFS Capital Subsidies + PM MITRA Park Benefits',
      feasibility: '90% Sanction Success',
      description: 'Integrated spinning, weaving, technical textile manufacturing, and zero-liquid discharge dyeing plants.'
    }
  ];

  useEffect(() => {
    let isMounted = true;
    api.industries.getAll()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data as any)?.data || [];
        if (list.length > 0) {
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
        } else {
          setIndustriesList(fallbackIndustries);
        }
      })
      .catch((err) => {
        console.warn('API fetch for industries deferred, using fallback:', err);
        if (isMounted) setIndustriesList(fallbackIndustries);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeIndustries = industriesList.length > 0 ? industriesList : fallbackIndustries;

  const dynamicCategories = [
    'All',
    ...Array.from(new Set(activeIndustries.map((i) => i.category))).filter(Boolean)
  ];

  const filtered = selectedCategory === 'All'
    ? activeIndustries
    : activeIndustries.filter(i => i.category === selectedCategory);

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

        {/* Grid of Industry Cards */}
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
      </div>
    </section>
  );
};

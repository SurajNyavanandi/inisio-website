import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  ArrowUpRight,
  Lock,
  FileCheck2,
  Building2
} from 'lucide-react';

interface FooterProps {
  onSelectTab?: (tab: string) => void;
  onOpenAssessment: () => void;
  onOpenConsultation: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenAssessment,
  onOpenConsultation,
}) => {
  const handleNav = (target: string) => {
    if (onSelectTab) {
      onSelectTab(target);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 pt-12 pb-8 font-inter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Main Content Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Brand & Overview Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                <TrendingUp className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-manrope text-xl font-bold text-white tracking-tight leading-tight">
                  Inisio
                </span>
                <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase font-inter">
                  Greenfield Project Advisory &amp; Debt Syndication
                </span>
              </div>
            </button>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              End-to-end investment banking advisory for greenfield industrial and commercial ventures. Bankability scorecards, Detailed Project Reports (DPR), and streamlined multi-bank term loan syndication across India.
            </p>

            {/* Compliance Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400 font-medium">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>RBI Guidelines Aligned</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>DPDP Act 2023 Compliant</span>
              </span>
            </div>
          </div>

          {/* Solutions & Advisory Column (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-manrope font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-blue-400" />
              <span>Advisory Solutions</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => handleNav('solutions')} className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1 group">
                  <span>Reality Check &amp; TEFR Feasibility</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button onClick={onOpenAssessment} className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer text-left flex items-center gap-1 group">
                  <span>Free Bankability Assessment</span>
                  <ArrowUpRight className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button onClick={onOpenConsultation} className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1 group">
                  <span>CMA Data &amp; Financial Modeling</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('solutions')} className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1 group">
                  <span>Bank-Grade DPR Preparation</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button onClick={onOpenConsultation} className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1 group">
                  <span>Promoter Equity Assistance</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('solutions')} className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1 group">
                  <span>Multi-Bank Debt Syndication</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
            </ul>
          </div>

          {/* Priority Sectors Column (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-manrope font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Priority Sectors</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => handleNav('industries')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Food Processing &amp; Agri
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('industries')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Solar &amp; Clean Energy
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('industries')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Hospitals &amp; Healthcare
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('industries')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Warehousing &amp; Cold Storage
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('industries')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Textiles &amp; Manufacturing
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('faqs')} className="hover:text-white transition-colors cursor-pointer text-left text-blue-400">
                  FAQs &amp; Advisory Blogs
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Desk Info (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-manrope font-bold text-white text-sm tracking-tight">
              Advisory Desk &amp; Headquarters
            </h4>
            
            <div className="space-y-2.5 text-xs text-slate-400 leading-relaxed">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Plot 24 &amp; 25, Kakatiya Hills, Road No 9, Madhapur, Hyderabad, Telangana 500081</span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Mon – Sat: 9:30 AM – 6:30 PM IST</span>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <a
                  href="tel:+916302026462"
                  className="flex items-center gap-2 text-slate-200 hover:text-white font-medium transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                  <span>+91 63020 26462</span>
                </a>

                <a
                  href="https://wa.me/916302026462?text=Hello%20Inisio%20Advisory%20Team%2C%20I%20would%20like%20to%20inquire%20about%20greenfield%20project%20advisory."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.553 4.11 1.522 5.836L.055 23.513l5.833-1.528A11.936 11.936 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.932 9.932 0 01-5.067-1.39l-.364-.216-3.762.986.1-3.666-.238-.378A9.948 9.948 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  <span>WhatsApp: +91 63020 26462</span>
                </a>

                <a
                  href="mailto:contact@inisio.com"
                  className="flex items-center gap-2 text-slate-300 hover:text-white font-medium transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>contact@inisio.com</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Regulatory Disclaimer & Copyright Bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Inisio Greenfield Advisory Platform. All rights reserved.</p>

          <p className="text-slate-400 text-center md:text-right max-w-xl text-[10px] leading-relaxed">
            Inisio is an independent private project consultancy &amp; debt syndication platform. Feasibility assessments and scorecards are analytical estimates based on standard bank credit underwriting criteria.
          </p>
        </div>

      </div>
    </footer>
  );
};

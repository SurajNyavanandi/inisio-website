import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export interface DetailedRiskProfileData {
  educationalBackground?: string;
  businessConstitution?: string;
  businessVintage?: string;
  collateralCoveragePct?: number | string;
  isNewToCredit?: boolean;
  cibilScore?: number | string;
  equityPercent?: number | string;
  promoterExpYears?: number | string;
  managementTeamStrength?: string;
  offtakeSecurity?: string;
}

interface DetailedRiskProfileFormProps {
  defaultEquityPercent?: number;
  defaultPromoterExpYears?: number;
  initialData?: DetailedRiskProfileData | null;
  onSubmitSuccess: (data: DetailedRiskProfileData) => void;
  sectionId?: string;
}

export const DetailedRiskProfileForm: React.FC<DetailedRiskProfileFormProps> = ({
  defaultEquityPercent = 30,
  defaultPromoterExpYears = 8,
  initialData,
  onSubmitSuccess,
  sectionId
}) => {
  const [formData, setFormData] = useState<DetailedRiskProfileData>({
    businessConstitution: initialData?.businessConstitution || 'Private Limited (Pvt Ltd)',
    businessVintage: initialData?.businessVintage || '5-10 Years',
    collateralCoveragePct: initialData?.collateralCoveragePct || 100,
    isNewToCredit: initialData?.isNewToCredit || false,
    cibilScore: initialData?.cibilScore || 780,
    equityPercent: initialData?.equityPercent || defaultEquityPercent,
    promoterExpYears: initialData?.promoterExpYears || defaultPromoterExpYears,
    educationalBackground: initialData?.educationalBackground || 'Post Graduate / Professional (MBA, CA, Engg)',
    offtakeSecurity: initialData?.offtakeSecurity || 'Signed LOIs / Long-Term Supply Contracts',
    managementTeamStrength: initialData?.managementTeamStrength || 'Established Second-Line Management'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitSuccess(formData);
  };

  return (
    <form id={sectionId} onSubmit={handleSubmit} className="space-y-6 font-inter text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Business Constitution *
          </label>
          <select
            value={formData.businessConstitution}
            onChange={(e) => setFormData({ ...formData, businessConstitution: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
          >
            <option>Private Limited (Pvt Ltd)</option>
            <option>Public Limited (Unlisted / Listed)</option>
            <option>Limited Liability Partnership (LLP)</option>
            <option>Proprietorship / Partnership Firm</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Promoter Group Vintage *
          </label>
          <select
            value={formData.businessVintage}
            onChange={(e) => setFormData({ ...formData, businessVintage: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
          >
            <option>10+ Years Established Operations</option>
            <option>5-10 Years</option>
            <option>3-5 Years</option>
            <option>First Generation / Greenfield New Entity</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Lead Promoter CIBIL Score (or Commercial CMR) *
          </label>
          <input
            type="number"
            min="300"
            max="900"
            value={formData.cibilScore}
            onChange={(e) => setFormData({ ...formData, cibilScore: Number(e.target.value) })}
            className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Available Collateral Coverage (% of Loan) *
          </label>
          <select
            value={formData.collateralCoveragePct}
            onChange={(e) => setFormData({ ...formData, collateralCoveragePct: Number(e.target.value) })}
            className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
          >
            <option value="125">125%+ (High Tangible Security)</option>
            <option value="100">100% (Fully Secured by Land / Fixed Assets)</option>
            <option value="75">75% - 99%</option>
            <option value="50">50% - 74%</option>
            <option value="0">CGTMSE / Clean Infrastructure Lending (No Extra Collateral)</option>
          </select>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <span>Calculate Bankability Score &amp; Credit Rating</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

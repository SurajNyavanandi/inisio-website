import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { UISelect } from './ui/Select';
import { Input } from './ui/Input';
import { Checkbox } from './ui/Checkbox';
import {
  blockInvalidNumberKeys,
  sanitizeIntegerInput,
  validateCibilScore,
} from '../utils/validation';

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
  industryExperience?: string;
  contributionType?: string;
  debtEquityRatio?: string;
  managementTeamSize?: string;
  technicalWorkforceCount?: string;
  [key: string]: any;
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
    collateralCoveragePct: initialData?.collateralCoveragePct ?? 100,
    isNewToCredit: initialData?.isNewToCredit || false,
    cibilScore:
      initialData?.cibilScore !== undefined && initialData?.cibilScore !== null
        ? String(initialData.cibilScore)
        : '780',
    equityPercent: initialData?.equityPercent ?? defaultEquityPercent,
    promoterExpYears: initialData?.promoterExpYears ?? defaultPromoterExpYears,
    educationalBackground: initialData?.educationalBackground || 'Post Graduate / Professional (MBA, CA, Engg)',
    offtakeSecurity: initialData?.offtakeSecurity || 'Signed LOIs / Long-Term Supply Contracts',
    managementTeamStrength: initialData?.managementTeamStrength || 'Established Second-Line Management'
  });

  const [cibilTouched, setCibilTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const cibilValidation = validateCibilScore(formData.cibilScore, Boolean(formData.isNewToCredit));
  const showCibilError = (cibilTouched || submitted) && !cibilValidation.isValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setCibilTouched(true);

    if (!cibilValidation.isValid) {
      return;
    }

    const cleanedCibil = formData.isNewToCredit
      ? ''
      : formData.cibilScore !== '' && formData.cibilScore !== undefined
      ? Number(formData.cibilScore)
      : '';

    onSubmitSuccess({
      ...formData,
      cibilScore: cleanedCibil,
    });
  };

  return (
    <form id={sectionId} onSubmit={handleSubmit} noValidate className="space-y-6 font-inter text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Business Constitution *
          </label>
          <UISelect
            value={formData.businessConstitution || ''}
            onValueChange={(val) => setFormData({ ...formData, businessConstitution: val })}
            options={[
              'Private Limited (Pvt Ltd)',
              'Public Limited (Unlisted / Listed)',
              'Limited Liability Partnership (LLP)',
              'Proprietorship / Partnership Firm'
            ]}
            triggerClassName="bg-white border-slate-300 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Promoter Group Vintage *
          </label>
          <UISelect
            value={formData.businessVintage || ''}
            onValueChange={(val) => setFormData({ ...formData, businessVintage: val })}
            options={[
              '10+ Years Established Operations',
              '5-10 Years',
              '3-5 Years',
              'First Generation / Greenfield New Entity'
            ]}
            triggerClassName="bg-white border-slate-300 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Lead Promoter CIBIL Score (or Commercial CMR) {!formData.isNewToCredit && '*'}
          </label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={3}
            disabled={Boolean(formData.isNewToCredit)}
            value={formData.isNewToCredit ? '' : String(formData.cibilScore ?? '')}
            onKeyDown={(e) => blockInvalidNumberKeys(e, false)}
            onChange={(e) => {
              const sanitized = sanitizeIntegerInput(e.target.value, 3);
              setFormData({ ...formData, cibilScore: sanitized });
            }}
            onBlur={() => setCibilTouched(true)}
            placeholder={formData.isNewToCredit ? 'Not applicable (New to Credit)' : '300 - 900 (e.g. 780)'}
            error={showCibilError}
            className="bg-white border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
          />
          {showCibilError && (
            <p className="text-[11px] text-red-600 font-medium">{cibilValidation.error}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Available Collateral Coverage (% of Loan) *
          </label>
          <UISelect
            value={String(formData.collateralCoveragePct ?? '100')}
            onValueChange={(val) => setFormData({ ...formData, collateralCoveragePct: Number(val) })}
            options={[
              { value: '125', label: '125%+ (High Tangible Security)' },
              { value: '100', label: '100% (Fully Secured by Land / Fixed Assets)' },
              { value: '75', label: '75% - 99%' },
              { value: '50', label: '50% - 74%' },
              { value: '0', label: 'CGTMSE / Clean Infrastructure Lending (No Extra Collateral)' }
            ]}
            triggerClassName="bg-white border-slate-300 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 pt-1">
        <Checkbox
          id="isNewToCredit"
          checked={!!formData.isNewToCredit}
          onCheckedChange={(checked) => {
            const isNtc = !!checked;
            setFormData({ ...formData, isNewToCredit: isNtc });
            if (isNtc) setCibilTouched(false);
          }}
        />
        <label htmlFor="isNewToCredit" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
          First-time commercial borrower / New to commercial credit (NTC)
        </label>
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

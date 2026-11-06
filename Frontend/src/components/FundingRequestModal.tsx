import React, { useState } from 'react';
import { X, Landmark, CheckCircle2, Loader2 } from 'lucide-react';
import { AuthUser } from '../types';
import { saveLeadRecord } from '../utils/leadStore';

interface FundingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  industry: string;
  totalCostCr: string;
  loanRequiredCr: string;
  user: AuthUser | null;
  onSubmitSuccess: (msg: string) => void;
}

export const FundingRequestModal: React.FC<FundingRequestModalProps> = ({
  isOpen,
  onClose,
  projectName,
  industry,
  totalCostCr,
  loanRequiredCr,
  user,
  onSubmitSuccess
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [bankPreference, setBankPreference] = useState('PSU Nationalized Bank');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await saveLeadRecord({
        fullName: user?.name || 'Promoter',
        email: user?.email || '',
        phone: user?.phone || '',
        industry,
        projectCost: totalCostCr,
        proposedLoan: loanRequiredCr,
        status: 'Bank Syndication Requested',
        notes: `Project: ${projectName} | Preferred Lender: ${bankPreference}`
      });
    } finally {
      setSubmitting(false);
      onClose();
      onSubmitSuccess(`Funding syndication request for ₹${loanRequiredCr} Cr submitted to partner banking desk.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-inter">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <Landmark className="w-3.5 h-3.5" />
              <span>Debt Syndication &amp; Sanction</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-manrope">
              Request Bank Debt Syndication
            </h2>
            <p className="text-xs text-slate-500">
              Direct connection with commercial credit committees and underwriting officers.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Target Term Loan:</span>
              <span className="font-bold text-blue-700">₹ {loanRequiredCr} Cr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estimated Capex:</span>
              <span className="font-bold text-slate-800">₹ {totalCostCr} Cr</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Preferred Banking Channel
            </label>
            <select
              value={bankPreference}
              onChange={(e) => setBankPreference(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
            >
              <option>PSU Nationalized Bank (SBI, PNB, BoB, Canara)</option>
              <option>Private Commercial Bank (HDFC, ICICI, Axis)</option>
              <option>Concessional Green Financing (IREDA / SIDBI)</option>
              <option>Consortium / Multiple Lenders</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit Syndication Mandate</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

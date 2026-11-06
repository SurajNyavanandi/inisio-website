import React, { useState } from 'react';
import { X, Coins, CheckCircle2, Loader2 } from 'lucide-react';
import { AuthUser } from '../types';

interface PromoterFundAssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id?: string;
    projectName?: string;
    totalCostCr?: number;
    loanRequiredCr?: number;
    promoterContribCr?: number;
    fullName?: string;
    mobile?: string;
    email?: string;
    promoterFundAssistanceStatus?: string;
    promoterFundAssistanceRequest?: any;
  };
  user: AuthUser | null;
  onRequestSubmitted: (req: any) => void;
}

export const PromoterFundAssistanceModal: React.FC<PromoterFundAssistanceModalProps> = ({
  isOpen,
  onClose,
  project,
  user,
  onRequestSubmitted
}) => {
  const [requiredAmountCr, setRequiredAmountCr] = useState(
    project.promoterContribCr ? String(project.promoterContribCr) : '2.50'
  );
  const [assistanceType, setAssistanceType] = useState('Equity Co-Investment / Angel Syndication');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onRequestSubmitted({
        requiredAmountCr,
        assistanceType,
        submittedAt: new Date().toISOString()
      });
      onClose();
    }, 500);
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
              <Coins className="w-3.5 h-3.5" />
              <span>Promoter Equity Support</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-manrope">
              Promoter Contribution Assistance
            </h2>
            <p className="text-xs text-slate-500">
              Need assistance meeting the mandatory promoter margin requirement? Connect with equity syndicates and subsidy advances.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Required Equity Support Amount (₹ Crores) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={requiredAmountCr}
              onChange={(e) => setRequiredAmountCr(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Assistance Structure
            </label>
            <select
              value={assistanceType}
              onChange={(e) => setAssistanceType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
            >
              <option>Equity Co-Investment / Angel Syndication</option>
              <option>Mezzanine Debt / Quasi-Equity</option>
              <option>Government Subsidy Bridge Advance</option>
              <option>Equipment Vendor Supplier Credit</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit Assistance Request</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

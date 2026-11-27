import React, { useState } from 'react';
import { X, Coins, Loader2, Tag, MailCheck } from 'lucide-react';
import { AuthUser } from '../types';
import { UISelect } from './ui/Select';
import { api } from '../utils/apiClient';
import { showToast } from './ui/Toast';

interface PromoterFundAssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id?: string;
    clientProjectId?: string;
    projectName?: string;
    industry?: string;
    location?: string;
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
  onRequestSubmitted,
}) => {
  const [requiredAmountCr, setRequiredAmountCr] = useState(
    project.promoterContribCr ? String(project.promoterContribCr) : '2.50'
  );
  const [assistanceType, setAssistanceType] = useState('Equity Co-Investment / Angel Syndication');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const requestPayload = {
      projectId: project.id,
      clientProjectId: project.clientProjectId,
      projectName: project.projectName || 'Greenfield Project',
      industry: project.industry || '',
      location: project.location || '',
      totalCostCr: project.totalCostCr,
      loanRequiredCr: project.loanRequiredCr,
      promoterContribCr: project.promoterContribCr,
      fullName: project.fullName || user?.name || 'Promoter',
      mobile: project.mobile || user?.phone || '',
      email: project.email || user?.email || '',
      requiredAmountCr,
      assistanceType,
      notes,
    };

    try {
      const result = await api.leads.requestPromoterFundAssistance(requestPayload);
      onRequestSubmitted({
        requiredAmountCr,
        assistanceType,
        notes,
        tagged: true,
        tag: result?.tag || 'Promoter Fund Assistance',
        leadId: result?.lead?._id || result?.lead?.id,
        submittedAt: new Date().toISOString(),
      });
      showToast(
        'Request tagged as Promoter Fund Assistance. Separate confirmation emails sent to you and the Lead Owner.',
        { type: 'success' }
      );
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Could not record promoter fund assistance request.', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-inter">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
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
              Your request is tagged as <strong>Promoter Fund Assistance</strong> in our advisory pipeline and sends separate email notifications to both you and the assigned Lead Owner.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <Tag className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Routing &amp; Tagging:</strong> Tagged under Lead Tag <code className="font-semibold">Promoter Fund Assistance</code> · Separate emails dispatched to Promoter &amp; Lead Owner.
            </span>
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
            <UISelect
              value={assistanceType}
              onValueChange={setAssistanceType}
              options={[
                'Equity Co-Investment / Angel Syndication',
                'Mezzanine Debt / Quasi-Equity',
                'Government Subsidy Bridge Advance',
                'Equipment Vendor Supplier Credit',
              ]}
              triggerClassName="bg-white border-slate-300 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Additional Context (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific timelines or co-investor preferences..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <MailCheck className="w-4 h-4" />
                <span>Submit &amp; Notify Promoter + Lead Owner</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

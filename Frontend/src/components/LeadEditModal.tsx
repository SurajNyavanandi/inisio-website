import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { LeadRecord, updateLeadRecord } from '../utils/leadStore';
import { UISelect } from './ui/Select';

interface LeadEditModalProps {
  lead: LeadRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  user?: any;
  readOnly?: boolean;
}

export const LeadEditModal: React.FC<LeadEditModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSaved,
  readOnly
}) => {
  const [formData, setFormData] = useState<Partial<LeadRecord>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setFormData({ ...lead });
      setError('');
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setError('');
    try {
      const payload: Partial<LeadRecord> = {
        ...formData,
        totalCostCr: formData.projectCost,
        loanRequiredCr: formData.proposedLoan,
      };
      await updateLeadRecord(lead.id || lead._id || '', payload, undefined, { throwOnError: true });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update record in database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-inter">
      <div className="relative w-full max-w-lg bg-white rounded-xl p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close edit modal"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 font-manrope pr-8">Edit Project / Lead Record</h2>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Promoter / Full Name</label>
              <input
                type="text"
                required
                disabled={readOnly}
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Project Name</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.projectName || ''}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Email</label>
              <input
                type="email"
                disabled={readOnly}
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Phone</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Industry</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.industry || ''}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Location</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Cost (₹ Cr)</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.projectCost ?? ''}
                onChange={(e) => setFormData({ ...formData, projectCost: e.target.value, totalCostCr: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Loan (₹ Cr)</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.proposedLoan ?? ''}
                onChange={(e) => setFormData({ ...formData, proposedLoan: e.target.value, loanRequiredCr: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Status</label>
            <UISelect
              value={formData.status || 'Active Lead'}
              onValueChange={(val) => setFormData({ ...formData, status: val })}
              options={[
                'Pending Audit',
                'New Lead',
                'Active Lead',
                'Under Review',
                'CA Review Requested',
                'Underwriting In Progress',
                'DPR Drafted',
                'Approved',
                'Bank Sanction Approved',
                'Funded',
              ]}
              disabled={readOnly}
              triggerClassName="text-xs border-slate-200 bg-slate-50"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || readOnly}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

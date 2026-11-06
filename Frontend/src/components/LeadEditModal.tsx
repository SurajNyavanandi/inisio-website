import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { LeadRecord, updateLeadRecord } from '../utils/leadStore';

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

  useEffect(() => {
    if (lead) {
      setFormData({ ...lead });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setTimeout(() => {
      updateLeadRecord(lead.id, formData);
      setSaving(false);
      onSaved();
      onClose();
    }, 400);
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 font-manrope">Edit Lead Record</h2>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
            <input
              type="text"
              value={formData.fullName || ''}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Phone</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Cost (₹ Cr)</label>
              <input
                type="text"
                value={formData.projectCost || ''}
                onChange={(e) => setFormData({ ...formData, projectCost: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Loan (₹ Cr)</label>
              <input
                type="text"
                value={formData.proposedLoan || ''}
                onChange={(e) => setFormData({ ...formData, proposedLoan: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Status</label>
            <select
              value={formData.status || 'Active Lead'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            >
              <option>New Lead</option>
              <option>Active Lead</option>
              <option>Underwriting In Progress</option>
              <option>DPR Drafted</option>
              <option>Bank Sanction Approved</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || readOnly}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Changes</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

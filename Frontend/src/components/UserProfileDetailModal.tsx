import React from 'react';
import { X, Phone, Mail, Building, TrendingUp, Trash2, Edit } from 'lucide-react';
import { LeadRecord } from '../utils/leadStore';

interface UserProfileDetailModalProps {
  lead: LeadRecord | null;
  onClose: () => void;
  readOnly?: boolean;
  onEdit?: (lead: LeadRecord) => void;
  onDelete?: (id: string) => void;
}

export const UserProfileDetailModal: React.FC<UserProfileDetailModalProps> = ({
  lead,
  onClose,
  readOnly,
  onEdit,
  onDelete
}) => {
  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-inter">
      <div className="relative w-full max-w-xl bg-white rounded-xl p-6 shadow-xl border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close profile modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-5">
          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold text-base font-manrope shrink-0">
              {(lead.fullName || 'P').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 font-manrope truncate">{lead.fullName}</h2>
              <span className="text-xs text-blue-600 font-semibold">{lead.status || 'Active Lead'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-lg space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
              <p className="font-semibold text-slate-900 break-all">{lead.email || 'N/A'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-lg space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
              <p className="font-semibold text-slate-900 tabular-nums">{lead.phone || lead.mobile || 'N/A'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-lg space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Industry</span>
              <p className="font-semibold text-slate-900">{lead.industry || 'General'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-lg space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Outlay / Loan</span>
              <p className="font-semibold text-slate-900 tabular-nums">
                ₹{lead.projectCost || lead.totalCostCr || 0} Cr / ₹{lead.proposedLoan || lead.loanRequiredCr || 0} Cr
              </p>
            </div>
          </div>

          {lead.notes && (
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs space-y-1">
              <span className="text-slate-500">Notes &amp; Activity</span>
              <p className="text-slate-700 leading-relaxed">{lead.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            {!readOnly && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(lead)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Lead</span>
              </button>
            )}
            {!readOnly && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(lead.id);
                  onClose();
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Lead</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

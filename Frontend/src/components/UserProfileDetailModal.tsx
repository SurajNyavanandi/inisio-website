import React from 'react';
import { X, User, Phone, Mail, Building, TrendingUp, Calendar, Trash2, Edit } from 'lucide-react';
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
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg font-manrope">
              {(lead.fullName || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-manrope">{lead.fullName}</h2>
              <span className="text-xs text-blue-600 font-semibold">{lead.status || 'Active Lead'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
              <p className="font-semibold text-slate-800 break-all">{lead.email || 'N/A'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
              <p className="font-semibold text-slate-800">{lead.phone || 'N/A'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Industry</span>
              <p className="font-semibold text-slate-800">{lead.industry || 'General'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Outlay / Loan</span>
              <p className="font-semibold text-slate-800">₹{lead.projectCost} Cr / ₹{lead.proposedLoan} Cr</p>
            </div>
          </div>

          {lead.notes && (
            <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="text-slate-400">Notes &amp; Activity</span>
              <p className="text-slate-700 leading-relaxed">{lead.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            {!readOnly && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(lead)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
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
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
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

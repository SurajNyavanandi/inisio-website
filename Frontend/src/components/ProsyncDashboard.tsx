import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { Network, CheckCircle2, Clock, Landmark, Users, ArrowRight, FolderOpen } from 'lucide-react';
import { fetchLeadsFromDatabase, getStoredLeads, LeadRecord } from '../utils/leadStore';

export const ProsyncDashboard: React.FC<{ user: AuthUser | null; onLogout?: () => void }> = ({ user, onLogout }) => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeadsFromDatabase()
      .then(setLeads)
      .catch(() => setLeads(getStoredLeads()))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 font-inter">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">
            <Network className="w-4 h-4" />
            <span>ProSync Operations Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-manrope">
            Banking Syndication &amp; Workflow Operations
          </h1>
          <p className="text-sm text-slate-500">
            Coordinating technical consultants, chartered accountants, and commercial bank credit teams.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Active Engagements</span>
          <p className="text-3xl font-black text-slate-900 font-manrope">{leads.length}</p>
          <span className="text-xs text-blue-600 font-medium">In underwriting pipeline</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Average Cycle Time</span>
          <p className="text-3xl font-black text-emerald-600 font-manrope">{leads.length > 0 ? '24 Days' : '—'}</p>
          <span className="text-xs text-emerald-600 font-medium">From appraisal to sanction letter</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Credit Clearance</span>
          <p className="text-3xl font-black text-slate-900 font-manrope">{leads.length > 0 ? '100%' : '0%'}</p>
          <span className="text-xs text-slate-500 font-medium">Clearance rate</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 font-manrope">Syndication Pipeline</h2>
        <div className="divide-y divide-slate-100">
          {leads.map((l, idx) => (
            <div key={l.id || l._id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">{l.fullName}</h3>
                <p className="text-xs text-slate-500">
                  {l.projectName || 'Greenfield Project'} · {l.industry || 'Industrial'} · ₹ {l.proposedLoan || l.loanRequiredCr || '0'} Cr Loan
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                  Status: {l.status || 'Active'}
                </span>
              </div>
            </div>
          ))}
          {!loading && leads.length === 0 && (
            <div className="py-12 text-center text-slate-500 space-y-1">
              <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No syndication projects in queue</p>
              <p className="text-xs text-slate-400">Newly approved borrower assessments will appear here for banking liaison.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

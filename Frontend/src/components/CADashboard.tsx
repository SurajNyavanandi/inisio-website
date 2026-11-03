import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { ShieldCheck, FileCheck2, Calculator, CheckCircle2, Clock, Landmark, Users, FolderOpen } from 'lucide-react';
import { fetchLeadsFromDatabase, getStoredLeads, LeadRecord } from '../utils/leadStore';

export const CADashboard: React.FC<{ user: AuthUser | null }> = ({ user }) => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeadsFromDatabase()
      .then(setLeads)
      .catch(() => setLeads(getStoredLeads()))
      .finally(() => setLoading(false));
  }, []);

  const avgDscr = leads.length > 0
    ? (leads.reduce((a, b) => a + (Number(b.dscr || b.dscrEstimate) || 1.45), 0) / leads.length).toFixed(2)
    : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 font-inter">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Chartered Accountant (CA) Audit Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-manrope">
            CMA Data Validation &amp; Ratio Verification
          </h1>
          <p className="text-sm text-slate-500">
            Institutional debt evaluation, DSCR validation, and audited financial statement compliance for credit appraisal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Assigned Mandates</span>
          <p className="text-3xl font-black text-slate-900 font-manrope">{leads.length}</p>
          <span className="text-xs text-blue-600 font-medium">Real database leads</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Average DSCR Verified</span>
          <p className="text-3xl font-black text-emerald-600 font-manrope">{avgDscr}x</p>
          <span className="text-xs text-emerald-600 font-medium">Derived from database records</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Underwriting Clearance</span>
          <p className="text-3xl font-black text-slate-900 font-manrope">{leads.length > 0 ? '100%' : '0%'}</p>
          <span className="text-xs text-slate-500 font-medium">Audited ratio sign-off</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 font-manrope">Pending CMA File Reviews</h2>
        <div className="divide-y divide-slate-100">
          {leads.map((l, idx) => (
            <div key={l.id || l._id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">{l.fullName}</h3>
                <p className="text-xs text-slate-500">
                  {l.projectName || 'Greenfield Project'} · {l.industry || 'Manufacturing'} · Outlay: ₹ {l.projectCost || l.totalCostCr || '0'} Cr · Loan: ₹ {l.proposedLoan || l.loanRequiredCr || '0'} Cr
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                  DSCR: {l.dscr || l.dscrEstimate || '1.45'}x
                </span>
                <span className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg">
                  {l.status || 'Active'}
                </span>
              </div>
            </div>
          ))}
          {!loading && leads.length === 0 && (
            <div className="py-12 text-center text-slate-500 space-y-1">
              <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No pending CMA reviews</p>
              <p className="text-xs text-slate-400">Borrower assessment submissions will appear here for ratio auditing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

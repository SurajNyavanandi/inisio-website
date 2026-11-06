import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { FileCode, FileText, CheckCircle2, Clock, Landmark, Users, FolderOpen } from 'lucide-react';
import { fetchLeadsFromDatabase, getStoredLeads, LeadRecord } from '../utils/leadStore';

export const DPRConsultantDashboard: React.FC<{ user?: AuthUser | null }> = () => {
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
            <FileCode className="w-4 h-4" />
            <span>DPR Engineering &amp; Technical Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-manrope">
            Detailed Project Report Drafting Hub
          </h1>
          <p className="text-sm text-slate-500">
            Techno-economic viability (TEV) validation, plant machinery layout, and civil works cost estimation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Assigned DPRs</span>
          <p className="text-3xl font-black text-slate-900 font-manrope">{leads.length}</p>
          <span className="text-xs text-blue-600 font-medium">In engineering drafting pipeline</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">TEV Clearances</span>
          <p className="text-3xl font-black text-emerald-600 font-manrope">{leads.length > 0 ? '100%' : '0%'}</p>
          <span className="text-xs text-emerald-600 font-medium">Empaneled engineer approved</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Average Turnaround</span>
          <p className="text-3xl font-black text-slate-900 font-manrope">{leads.length > 0 ? '7 Days' : '—'}</p>
          <span className="text-xs text-slate-500 font-medium">Comprehensive report generation</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 font-manrope">Active Technical Clearances</h2>
        <div className="divide-y divide-slate-100">
          {leads.map((l, idx) => (
            <div key={l.id || l._id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">{l.projectName || 'Greenfield Plant'}</h3>
                <p className="text-xs text-slate-500">Promoter: {l.fullName} · {l.industry || 'Manufacturing'} · Outlay: ₹ {l.projectCost || l.totalCostCr || '0'} Cr</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                  {l.status || 'Active DPR'}
                </span>
              </div>
            </div>
          ))}
          {!loading && leads.length === 0 && (
            <div className="py-12 text-center text-slate-500 space-y-1">
              <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No active DPR drafting mandates</p>
              <p className="text-xs text-slate-400">Newly assigned projects requiring technical appraisal will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

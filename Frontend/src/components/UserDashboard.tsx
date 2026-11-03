import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  FileText,
  TrendingUp,
  Plus,
  Landmark,
  ShieldCheck,
  Download,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building,
  Calendar,
  FolderOpen,
  RefreshCw
} from 'lucide-react';
import { fetchLeadsFromDatabase, getStoredLeads, LeadRecord } from '../utils/leadStore';

interface UserDashboardProps {
  user: AuthUser | null;
  onOpenAssessment: (projectToEdit?: any) => void;
  onOpenConsultation: () => void;
  onOpenMembership: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  onOpenAssessment,
  onOpenConsultation,
  onOpenMembership
}) => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserProjects = async () => {
    setLoading(true);
    try {
      const allLeads = await fetchLeadsFromDatabase({ email: user?.email });
      const userLeads = allLeads.filter(l => {
        if (!user?.email) return true;
        return (l.email || '').toLowerCase() === user.email.toLowerCase();
      });
      setLeads(userLeads);
    } catch (err) {
      console.warn('Error loading user projects:', err);
      const local = getStoredLeads().filter(l => !l.email || (user?.email && l.email.toLowerCase() === user.email.toLowerCase()));
      setLeads(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProjects();
    const handleUpdate = () => loadUserProjects();
    window.addEventListener('inisio_lead_added', handleUpdate);
    return () => window.removeEventListener('inisio_lead_added', handleUpdate);
  }, [user]);

  const totalCostSum = leads.reduce((acc, curr) => acc + (Number(curr.projectCost || curr.totalCostCr) || 0), 0);
  const totalLoanSum = leads.reduce((acc, curr) => acc + (Number(curr.proposedLoan || curr.loanRequiredCr) || 0), 0);
  const avgFeasibility = leads.length > 0
    ? Math.round(leads.reduce((acc, curr) => acc + (Number(curr.feasibilityScore) || 85), 0) / leads.length)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 font-inter">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Promoter Executive Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-manrope">
            Welcome, {user?.name || user?.email?.split('@')[0] || 'Promoter'}
          </h1>
          <p className="text-sm text-slate-500">
            {user?.company ? `${user.company} · ` : ''}Real-time monitoring of your greenfield debt syndication pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenAssessment()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project Appraisal</span>
          </button>
          <button
            type="button"
            onClick={onOpenConsultation}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Book CA Advisory</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Projects</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-manrope">{leads.length}</p>
          <span className="text-xs text-emerald-600 font-medium">
            {leads.length > 0 ? 'Under active appraisal' : 'No projects registered'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Estimated Outlay</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-manrope">
            ₹ {totalCostSum.toFixed(1)} Cr
          </p>
          <span className="text-xs text-blue-600 font-medium">Total Project Capex</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Bank Feasibility Score</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-manrope">
            {avgFeasibility !== null ? `${avgFeasibility} / 100` : '—'}
          </p>
          <span className="text-xs text-emerald-600 font-medium">
            {avgFeasibility !== null ? (avgFeasibility >= 80 ? 'Grade A (High Bankability)' : 'Grade B') : 'Awaiting first assessment'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Target Term Loan</span>
            <Landmark className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-manrope">
            ₹ {totalLoanSum.toFixed(1)} Cr
          </p>
          <span className="text-xs text-slate-500 font-medium">
            {leads.length > 0 ? 'Syndication debt request' : 'Zero debt demand'}
          </span>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-manrope">My Greenfield Projects</h2>
            <p className="text-xs text-slate-500">Live appraisal tracking and credit readiness checklist.</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAssessment()}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Project Name &amp; Sector</th>
                <th className="py-3.5 px-6">Cost / Outlay</th>
                <th className="py-3.5 px-6">Term Loan</th>
                <th className="py-3.5 px-6">Underwriting Stage</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id || lead._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900">
                    {lead.projectName || 'Greenfield Project'}
                    <div className="text-xs text-slate-400 font-normal">
                      {lead.industry || 'Manufacturing'} {lead.location ? `• ${lead.location}` : ''}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">
                    ₹ {Number(lead.projectCost || lead.totalCostCr || 0).toFixed(2)} Cr
                  </td>
                  <td className="py-4 px-6 font-semibold text-blue-700">
                    ₹ {Number(lead.proposedLoan || lead.loanRequiredCr || 0).toFixed(2)} Cr
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Clock className="w-3 h-3" />
                      <span>{lead.status || 'Underwriting Review'}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => onOpenAssessment(lead)}
                      className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      View / Resume
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FolderOpen className="w-10 h-10 text-slate-300 stroke-1" />
                      <p className="text-sm font-semibold text-slate-700">No projects submitted yet</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        You have not initiated any project assessments yet. Start a new appraisal to evaluate bankability, calculate DSCR, and download bank teaser documents.
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenAssessment()}
                        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Start First Project Appraisal
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading your real projects from database...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

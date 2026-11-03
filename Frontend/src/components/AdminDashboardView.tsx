import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  ShieldAlert,
  Users,
  Building,
  TrendingUp,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  Landmark,
  Search,
  Filter,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { fetchLeadsFromDatabase, deleteLeadRecord, clearAllLeads, exportLeadsToCSV, LeadRecord } from '../utils/leadStore';

export const AdminDashboardView: React.FC<{
  currentUser?: AuthUser | null;
  onOpenLeadsModal?: () => void;
}> = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await fetchLeadsFromDatabase();
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
    const handleUpdate = () => loadLeads();
    window.addEventListener('inisio_lead_added', handleUpdate);
    return () => window.removeEventListener('inisio_lead_added', handleUpdate);
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lead record from the database?')) return;
    await deleteLeadRecord(id);
    setLeads(prev => prev.filter(l => l.id !== id && l._id !== id));
  };

  const filtered = leads.filter(l =>
    (l.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.industry || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.projectName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCostSum = leads.reduce((acc, curr) => acc + (Number(curr.projectCost || curr.totalCostCr) || 0), 0);
  const totalLoanSum = leads.reduce((acc, curr) => acc + (Number(curr.proposedLoan || curr.loanRequiredCr) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 font-inter">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4" />
            <span>Executive Control Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-manrope">
            Admin Lead Management &amp; Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Real-time pipeline monitoring, teaser downloads, and institutional syndication dispatch from live database records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadLeads}
            disabled={loading}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => exportLeadsToCSV(leads)}
            disabled={leads.length === 0}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Leads</span>
          <p className="text-2xl font-black text-slate-900 font-manrope">{leads.length}</p>
          <span className="text-xs text-blue-600 font-medium">Real database records</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Project Pipeline</span>
          <p className="text-2xl font-black text-slate-900 font-manrope">
            ₹ {totalCostSum.toFixed(1)} Cr
          </p>
          <span className="text-xs text-emerald-600 font-medium">Aggregate Capex</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Debt Demand</span>
          <p className="text-2xl font-black text-slate-900 font-manrope">
            ₹ {totalLoanSum.toFixed(1)} Cr
          </p>
          <span className="text-xs text-blue-600 font-medium">Requested term debt</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Underwriting Success</span>
          <p className="text-2xl font-black text-slate-900 font-manrope">
            {leads.length > 0 ? '100%' : '0%'}
          </p>
          <span className="text-xs text-emerald-600 font-medium">Pipeline clearance</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by promoter, email, sector, or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {loading ? 'Fetching from database...' : `Showing ${filtered.length} of ${leads.length} leads`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-inter">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Promoter / Email</th>
                <th className="py-3 px-6">Phone</th>
                <th className="py-3 px-6">Project / Sector</th>
                <th className="py-3 px-6">Cost (Cr)</th>
                <th className="py-3 px-6">Loan (Cr)</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => (
                <tr key={l.id || l._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    {l.fullName}
                    <div className="text-[11px] text-slate-400 font-normal">{l.email}</div>
                  </td>
                  <td className="py-3.5 px-6 text-slate-700">{l.phone || l.mobile || 'N/A'}</td>
                  <td className="py-3.5 px-6 text-slate-700">
                    <span className="font-medium text-slate-900">{l.projectName || 'Greenfield Project'}</span>
                    <div className="text-[11px] text-slate-400">{l.industry || 'General'}</div>
                  </td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">₹ {l.projectCost || l.totalCostCr || '0'}</td>
                  <td className="py-3.5 px-6 font-bold text-blue-700">₹ {l.proposedLoan || l.loanRequiredCr || '0'}</td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {l.status || 'Active Lead'}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(l.id || l._id || '')}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FolderOpen className="w-10 h-10 text-slate-300 stroke-1" />
                      <p className="text-sm font-semibold text-slate-700">No submissions found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        There are currently no leads in the database. New borrower project assessments and consultation requests will appear here in real time.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading real records from database...</span>
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

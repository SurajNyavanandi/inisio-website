import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  LayoutDashboard,
  FileCode,
  CheckCircle2,
  BookOpen,
  FolderOpen,
  Search,
  RefreshCw,
  Clock,
  Landmark,
  ArrowRight,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  Home,
  TrendingUp,
  Wrench,
  Layers
} from 'lucide-react';
import { fetchLeadsFromDatabase, getStoredLeads, LeadRecord } from '../utils/leadStore';

interface DPRConsultantDashboardProps {
  user?: AuthUser | null;
  onLogout?: () => void;
  onNavigateHome?: () => void;
}

type DPRTab = 'overview' | 'drafting' | 'tev' | 'guidelines';

export const DPRConsultantDashboard: React.FC<DPRConsultantDashboardProps> = ({ user, onLogout, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<DPRTab>('overview');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchLeadsFromDatabase().catch(() => getStoredLeads());
      setLeads(data);
    } catch (err) {
      console.warn('Error loading DPR data:', err);
      setLeads(getStoredLeads());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('inisio_lead_added', handleUpdate);
    return () => window.removeEventListener('inisio_lead_added', handleUpdate);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync with browser history popstate
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.dprTab) {
        setActiveTab(e.state.dprTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const filteredLeads = leads.filter(l =>
    (l.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.industry || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: 'overview' as DPRTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'drafting' as DPRTab, label: 'DPR Drafting', icon: FileCode, count: leads.length },
    { id: 'tev' as DPRTab, label: 'TEV Clearances', icon: CheckCircle2 },
    { id: 'guidelines' as DPRTab, label: 'Technical Guidelines', icon: BookOpen }
  ];

  const handleSelectTab = (tab: DPRTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
    try {
      window.history.pushState({ dprTab: tab }, '', window.location.href);
    } catch {
      // ignore
    }
  };

  const handleGoBack = () => {
    if (window.history.state?.dprTab && window.history.length > 1) {
      window.history.back();
    } else if (activeTab !== 'overview') {
      setActiveTab('overview');
    } else if (window.history.length > 1) {
      window.history.back();
    } else if (onNavigateHome) {
      onNavigateHome();
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-inter">
      {/* Mobile Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Fixed Left Sidebar (Drawer on mobile, fixed column on desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between p-5 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 shrink-0 ${
          isMobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Role Header */}
          <div className="space-y-2 pb-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs font-bold">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white font-manrope leading-tight">Inisio</div>
                  <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">DPR Desk</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Consultant Network
              </span>
              <span className="text-[11px] text-slate-400 font-medium truncate max-w-27.5">
                {user?.name || user?.email?.split('@')[0] || 'Technical Consultant'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Status Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>TEV Engineering Desk</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Website</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Right Content Area (Scrolls Independently) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-slate-900 font-manrope">DPR Engineering Desk</span>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </header>

        {/* Independently Scrolling Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Back Navigation Bar (Visible on inner pages, hidden on overview) */}
          {activeTab !== 'overview' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGoBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                <span>Go Back</span>
              </button>
              <span className="text-xs text-slate-400 font-medium">/</span>
              <span className="text-xs text-slate-500 font-bold capitalize">
                {navItems.find(i => i.id === activeTab)?.label || activeTab}
              </span>
            </div>
          )}

          {/* 1. Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header Banner */}
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
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Pipeline</span>
                </button>
              </div>

              {/* Metric Cards */}
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

              {/* Technical Clearances Highlight */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-900 font-manrope">Active Technical Clearances</h2>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('drafting')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {leads.slice(0, 4).map((l, idx) => (
                    <div key={l.id || l._id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
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
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No active DPR drafting mandates.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. DPR Drafting Hub Tab */}
          {activeTab === 'drafting' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleGoBack}
                      title="Go Back"
                      className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs transition-colors cursor-pointer group shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-900 font-manrope">Technical Drafting Pipeline</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Track and prepare comprehensive Detailed Project Reports (DPR) for greenfield projects.</p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredLeads.map((l, idx) => (
                  <div key={l.id || l._id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <h3 className="font-bold text-slate-900">{l.projectName || 'Greenfield Plant'}</h3>
                      <p className="text-xs text-slate-500">
                        Promoter: {l.fullName} · {l.industry || 'Manufacturing'} · Outlay: ₹ {l.projectCost || l.totalCostCr || '0'} Cr · Term Loan: ₹ {l.proposedLoan || l.loanRequiredCr || '0'} Cr
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                        {l.status || 'Active DPR'}
                      </span>
                    </div>
                  </div>
                ))}

                {!loading && filteredLeads.length === 0 && (
                  <div className="py-12 text-center text-slate-500 space-y-1">
                    <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No projects match your search</p>
                    <p className="text-xs text-slate-400">Newly assigned projects requiring technical appraisal will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. TEV Clearances Tab */}
          {activeTab === 'tev' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Techno-Economic Viability (TEV) Framework</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleGoBack}
                    title="Go Back"
                    className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs transition-colors cursor-pointer group shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <h2 className="text-2xl font-bold text-slate-900 font-manrope">
                    Engineering &amp; Technical Clearances
                  </h2>
                </div>
                <p className="text-sm text-slate-500">
                  Standard engineering milestones verified before commercial bank debt disbursement.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                    <Wrench className="w-4 h-4" />
                    <span>Civil Works &amp; Plant Layout</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Industrial Site &amp; Factory Specifications</h3>
                  <p className="text-xs text-slate-500">
                    Architectural layout, plinth area cost validation, shed erection schedules, and structural stability certifications.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                    <Layers className="w-4 h-4" />
                    <span>Plant &amp; Machinery Quotations</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Equipment Technology Assessment</h3>
                  <p className="text-xs text-slate-500">
                    OEM vendor quotations, imported vs indigenous machine splits, production capacity metrics, and balance of plant viability.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Environmental &amp; Utility Sanctions</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Statutory Infrastructure Feasibility</h3>
                  <p className="text-xs text-slate-500">
                    Pollution Control Board Consent to Establish (CTE), high-tension power load sanction, effluent treatment, and water supply.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                    <Clock className="w-4 h-4" />
                    <span>Commercial COD Schedule</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Project Implementation Milestone Tracking</h3>
                  <p className="text-xs text-slate-500">
                    Gantt chart timelines from financial closure and machine commissioning to commercial operations date (COD).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Technical Guidelines Tab */}
          {activeTab === 'guidelines' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">
                  <BookOpen className="w-4 h-4" />
                  <span>DPR Standardization Norms</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleGoBack}
                    title="Go Back"
                    className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs transition-colors cursor-pointer group shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <h2 className="text-2xl font-bold text-slate-900 font-manrope">
                    DPR Drafting Benchmarks &amp; Submission Norms
                  </h2>
                </div>
                <p className="text-sm text-slate-500">
                  Format standards required by commercial lenders and consortium syndication lead bankers.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                  <div>
                    <h4 className="font-bold text-slate-900">Executive Summary &amp; Promoters Profile</h4>
                    <p className="text-slate-500 mt-0.5">Includes promoter experience, previous execution track record, management hierarchy, and equity shareholding.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                  <div>
                    <h4 className="font-bold text-slate-900">Technical Details &amp; Manufacturing Process</h4>
                    <p className="text-slate-500 mt-0.5">Flow diagrams, raw material supply chain contracts, utility consumption factors per ton, and waste disposal systems.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
                  <div>
                    <h4 className="font-bold text-slate-900">Market Demand &amp; Offtake Contracts</h4>
                    <p className="text-slate-500 mt-0.5">Target market radius, competition analysis, MOUs or letters of intent (LOI) with primary buyers, and pricing dynamics.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

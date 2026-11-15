import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  LayoutDashboard,
  FolderOpen,
  Calculator,
  Calendar,
  Crown,
  ShieldCheck,
  Plus,
  TrendingUp,
  Building,
  CheckCircle2,
  Clock,
  Landmark,
  Search,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileText,
  Menu,
  X,
  LogOut,
  Home
} from 'lucide-react';
import { fetchLeadsFromDatabase, getStoredLeads, LeadRecord } from '../utils/leadStore';

interface UserDashboardProps {
  user: AuthUser | null;
  onOpenAssessment: (projectToEdit?: any) => void;
  onOpenConsultation: () => void;
  onOpenMembership: () => void;
  onLogout?: () => void;
  onNavigateHome?: () => void;
}

type UserTab = 'overview' | 'projects' | 'appraisal' | 'consultations' | 'membership';

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  onOpenAssessment,
  onOpenConsultation,
  onOpenMembership,
  onLogout,
  onNavigateHome
}) => {
  const [activeTab, setActiveTab] = useState<UserTab>('overview');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalCostSum = leads.reduce((acc, curr) => acc + (Number(curr.projectCost || curr.totalCostCr) || 0), 0);
  const totalLoanSum = leads.reduce((acc, curr) => acc + (Number(curr.proposedLoan || curr.loanRequiredCr) || 0), 0);
  const avgFeasibility = leads.length > 0
    ? Math.round(leads.reduce((acc, curr) => acc + (Number(curr.feasibilityScore) || 0), 0) / leads.length)
    : null;

  const filteredLeads = leads.filter(l =>
    (l.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.industry || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: 'overview' as UserTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'projects' as UserTab, label: 'My Projects', icon: FolderOpen, count: leads.length },
    { id: 'appraisal' as UserTab, label: 'New Appraisal', icon: Calculator },
    { id: 'consultations' as UserTab, label: 'CA Advisory', icon: Calendar },
    { id: 'membership' as UserTab, label: 'Membership Plan', icon: Crown }
  ];

  // Sync with browser history popstate
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.userTab) {
        setActiveTab(e.state.userTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectTab = (tab: UserTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
    try {
      window.history.pushState({ userTab: tab }, '', window.location.href);
    } catch {
      // ignore
    }
  };

  const handleGoBack = () => {
    if (window.history.state?.userTab && window.history.length > 1) {
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between p-5 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 shrink-0 ${
          isMobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Header & Role Badge */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900 font-manrope leading-tight">Inisio</div>
                  <span className="text-[10px] font-bold text-blue-700 tracking-wider uppercase">Promoter Portal</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="pt-2 flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Promoter Desk
              </span>
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-27.5">
                {user?.company || user?.name || user?.email?.split('@')[0]}
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
                      : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Action */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onOpenAssessment();
                setIsMobileDrawerOpen(false);
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Appraise Project</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Real-time Pipeline Sync</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Website</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
            <span className="font-bold text-sm text-slate-900 font-manrope">Inisio Promoter Desk</span>
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

          {/* 1. Overview Tab (Home Page) */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Executive Promoter Overview</span>
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

              {/* Recent Projects Preview */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-manrope">Recent Projects</h2>
                    <p className="text-xs text-slate-500">Fast access to your active appraisal files.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('projects')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>View All ({leads.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {leads.slice(0, 3).map((lead) => (
                    <div key={lead.id || lead._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{lead.projectName || 'Greenfield Project'}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lead.industry || 'Manufacturing'} {lead.location ? `· ${lead.location}` : ''} · Outlay: ₹ {Number(lead.projectCost || lead.totalCostCr || 0).toFixed(2)} Cr
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3" />
                          <span>{lead.status || 'Underwriting Review'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenAssessment(lead)}
                          className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          View / Resume
                        </button>
                      </div>
                    </div>
                  ))}

                  {leads.length === 0 && !loading && (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No greenfield projects initiated yet. Click "New Project Appraisal" to begin.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. My Projects Tab (Inner Page) */}
          {activeTab === 'projects' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-manrope">My Greenfield Projects</h2>
                  <p className="text-xs text-slate-500">Live appraisal tracking, DSCR evaluation, and credit readiness.</p>
                </div>
                <div className="flex items-center gap-3">
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
                  <button
                    type="button"
                    onClick={() => onOpenAssessment()}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Project</span>
                  </button>
                </div>
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
                    {filteredLeads.map((lead) => (
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

                    {!loading && filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <FolderOpen className="w-10 h-10 text-slate-300 stroke-1" />
                            <p className="text-sm font-semibold text-slate-700">No projects found</p>
                            <p className="text-xs text-slate-400 max-w-sm">
                              {searchTerm ? 'No projects match your search query.' : 'You have not initiated any project assessments yet.'}
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
                            <span>Loading projects from database...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. New Appraisal Tab (Inner Page) */}
          {activeTab === 'appraisal' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">
                  <Calculator className="w-4 h-4" />
                  <span>Credit Feasibility Engine</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 font-manrope">
                  Initiate Greenfield Project Appraisal
                </h2>
                <p className="text-sm text-slate-500">
                  Evaluate debt service coverage ratio (DSCR), loan eligibility, promoter equity structuring, and generate lender-ready teasers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-6 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-manrope">Comprehensive Underwriting Appraisal</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Detailed 5-stage feasibility assessment including capex breakdown, means of finance, promoter KYC, and comprehensive banker scorecard.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenAssessment()}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Launch Comprehensive Appraisal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-manrope">Instant Feasibility Scorecard</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Quickly test high-level sector benchmarks, benchmark DSCR ratios, and debt syndication viability across 30+ industrial sectors.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenAssessment()}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Open Quick Calculator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. CA Advisory Tab (Inner Page) */}
          {activeTab === 'consultations' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">
                  <Calendar className="w-4 h-4" />
                  <span>Empaneled CA &amp; Debt Syndication Advisory</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 font-manrope">
                  Chartered Accountant Advisory Desk
                </h2>
                <p className="text-sm text-slate-500">
                  Schedule direct one-on-one consultation with senior credit appraisers and chartered accountants to review your CMA data and debt structure.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">What We Cover During Advisory:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>CMA Data preparation and audited ratio sign-off</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Term loan structuring and repayment tenure optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Collateral security and promoter guarantee structuring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Commercial bank credit committee query resolution</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={onOpenConsultation}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Schedule 1-on-1 CA Session</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. Membership Plan Tab (Inner Page) */}
          {activeTab === 'membership' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">
                  <Crown className="w-4 h-4" />
                  <span>Bankability &amp; Syndication Membership</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 font-manrope">
                  Promoter Membership &amp; Advisory Tiers
                </h2>
                <p className="text-sm text-slate-500">
                  Unlock priority debt syndication, unlimited financial model evaluations, and direct lender consortium representation.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Active Tier</span>
                  <h3 className="text-xl font-extrabold text-slate-900 font-manrope">
                    {user?.membershipPlan || 'Inisio Greenfield Starter'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Full access to credit appraisal scorecards and automated bank teaser exports.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenMembership}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  Explore All Membership Plans
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

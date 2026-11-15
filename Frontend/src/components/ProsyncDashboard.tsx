import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  LayoutDashboard,
  Network,
  CalendarCheck,
  Building2,
  FolderOpen,
  Search,
  RefreshCw,
  Landmark,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  Home,
  ShieldCheck
} from 'lucide-react';
import { fetchLeadsFromDatabase, getStoredLeads, LeadRecord } from '../utils/leadStore';
import api from '../utils/apiClient';
import { UISelect } from './ui/Select';

interface ProsyncDashboardProps {
  user: AuthUser | null;
  onLogout?: () => void;
  onNavigateHome?: () => void;
}

type ProsyncTab = 'overview' | 'pipeline' | 'consultations' | 'lenders';

export const ProsyncDashboard: React.FC<ProsyncDashboardProps> = ({ user, onLogout, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<ProsyncTab>('overview');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const leadData = await fetchLeadsFromDatabase().catch(() => getStoredLeads());
      setLeads(leadData);

      // Load consultations assigned to ProSync
      const res = await api.consultations.getAll().catch(() => null);
      if (res && res.data) {
        setConsultations(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.warn('Error loading Prosync data:', err);
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
      if (e.state?.prosyncTab) {
        setActiveTab(e.state.prosyncTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleUpdateConsultationStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.consultations.updateStatus(id, newStatus).catch(() => {});
      setConsultations(prev =>
        prev.map(c => (c._id === id || c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error('Failed to update consultation status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredLeads = leads.filter(l =>
    (l.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.industry || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: 'overview' as ProsyncTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'pipeline' as ProsyncTab, label: 'Syndication Pipeline', icon: Network, count: leads.length },
    { id: 'consultations' as ProsyncTab, label: 'Consultations Desk', icon: CalendarCheck, count: consultations.length },
    { id: 'lenders' as ProsyncTab, label: 'Lender Consortium', icon: Building2 }
  ];

  const handleSelectTab = (tab: ProsyncTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
    try {
      window.history.pushState({ prosyncTab: tab }, '', window.location.href);
    } catch {
      // ignore
    }
  };

  const handleGoBack = () => {
    if (window.history.state?.prosyncTab && window.history.length > 1) {
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
          {/* Role Header */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs font-bold">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900 font-manrope leading-tight">Inisio</div>
                  <span className="text-[10px] font-bold text-blue-700 tracking-wider uppercase">ProSync Desk</span>
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
                ProSync Team
              </span>
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-27.5">
                {user?.name || user?.email?.split('@')[0] || 'Syndication Officer'}
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
        </div>

        {/* Sidebar Status Footer */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Syndication Active</span>
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
            <span className="font-bold text-sm text-slate-900 font-manrope">ProSync Operations Hub</span>
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
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Queue</span>
                </button>
              </div>

              {/* Metric Cards */}
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

              {/* Syndication Pipeline Highlight */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-900 font-manrope">Active Syndication Pipeline</h2>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('pipeline')}
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
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No syndication projects in queue.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Syndication Pipeline Tab */}
          {activeTab === 'pipeline' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-manrope">Greenfield Debt Syndication Queue</h2>
                  <p className="text-xs text-slate-500">Coordinate borrower mandates with commercial banking underwriting committees.</p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search proposals..."
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
                      <h3 className="font-bold text-slate-900">{l.fullName}</h3>
                      <p className="text-xs text-slate-500">
                        {l.projectName || 'Greenfield Project'} · {l.industry || 'Industrial'} · Total Capex: ₹ {l.projectCost || l.totalCostCr || '0'} Cr · Proposed Debt: ₹ {l.proposedLoan || l.loanRequiredCr || '0'} Cr
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                        Rating: {l.bankabilityRating || 'Grade A'}
                      </span>
                      <span className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-lg">
                        {l.status || 'Syndication Review'}
                      </span>
                    </div>
                  </div>
                ))}

                {!loading && filteredLeads.length === 0 && (
                  <div className="py-12 text-center text-slate-500 space-y-1">
                    <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No proposals match your search</p>
                    <p className="text-xs text-slate-400">Newly approved borrower assessments will appear here for banking liaison.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Consultations Desk Tab (With Status Switcher: In Progress, Customer Declined, Completed) */}
          {activeTab === 'consultations' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900 font-manrope">ProSync Consultation Management Desk</h2>
                <p className="text-xs text-slate-500">Track and manage advisory appointments assigned to ProSync syndication officers.</p>
              </div>

              <div className="divide-y divide-slate-100">
                {consultations.map((c, idx) => {
                  const currentStatus = c.status || 'In Progress';
                  const isUpdating = updatingId === (c._id || c.id);
                  return (
                    <div key={c._id || c.id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{c.fullName || c.name || 'Borrower Consultation'}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {c.phone || ''} · {c.email || ''} {c.preferredDate ? `· Date: ${c.preferredDate}` : ''}
                        </p>
                      </div>

                      {/* Status Dropdown */}
                      <div className="flex items-center gap-2 min-w-[170px]">
                        <span className="text-xs text-slate-400 font-semibold shrink-0">Status:</span>
                        <UISelect
                          value={currentStatus}
                          disabled={isUpdating}
                          onValueChange={(val) => handleUpdateConsultationStatus(c._id || c.id, val)}
                          options={[
                            { value: 'In Progress', label: 'In Progress' },
                            { value: 'Customer Declined', label: 'Customer Declined' },
                            { value: 'Completed', label: 'Completed' }
                          ]}
                          triggerClassName="h-8 text-xs font-bold px-3 py-1 bg-white border-slate-200"
                        />
                      </div>
                    </div>
                  );
                })}

                {consultations.length === 0 && (
                  <div className="py-12 text-center text-slate-500 space-y-1">
                    <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No active consultations assigned</p>
                    <p className="text-xs text-slate-400">Consultation bookings assigned to ProSync will automatically appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Lender Consortium Tab */}
          {activeTab === 'lenders' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">
                  <Building2 className="w-4 h-4" />
                  <span>Institutional Syndication Network</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 font-manrope">
                  Empaneled Commercial Bank Consortium
                </h2>
                <p className="text-sm text-slate-500">
                  Lender relationships and institutional debt underwriting partners active across greenfield syndications.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <span className="text-[11px] font-bold text-blue-700 uppercase">Public Sector Banks (PSUs)</span>
                  <h3 className="font-bold text-slate-900 text-sm">Large Capex Syndication</h3>
                  <p className="text-xs text-slate-500">
                    State Bank of India (SBI), Bank of Baroda, Punjab National Bank (PNB), Canara Bank, Union Bank of India.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <span className="text-[11px] font-bold text-blue-700 uppercase">Private Scheduled Banks</span>
                  <h3 className="font-bold text-slate-900 text-sm">Flexible Structured Facilities</h3>
                  <p className="text-xs text-slate-500">
                    HDFC Bank, ICICI Bank, Axis Bank, IndusInd Bank, Kotak Mahindra Bank.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase">Development Finance</span>
                  <h3 className="font-bold text-slate-900 text-sm">Subsidized &amp; Priority Sector</h3>
                  <p className="text-xs text-slate-500">
                    SIDBI (MSME manufacturing), IREDA (Renewable Energy), NABARD (Food processing &amp; Agri-infra).
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

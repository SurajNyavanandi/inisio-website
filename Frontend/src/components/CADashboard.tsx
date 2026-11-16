import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  LayoutDashboard,
  FolderOpen,
  FileCheck2,
  CheckCircle2,
  PlusCircle,
  Award,
  MapPin,
  Search,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  LogOut,
  Home,
  ShieldCheck,
  Mail,
  Phone,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { fetchLeadsFromDatabase, getStoredLeads, LeadRecord } from '../utils/leadStore';
import { MembershipPlansModal } from './MembershipPlansModal';
import { resolveApiUrl } from '../utils/apiClient';

interface CADashboardProps {
  user: AuthUser | null;
  onLogout?: () => void;
  onNavigateHome?: () => void;
}

type CATab =
  | 'overview'
  | 'own-leads'
  | 'inisio-leads'
  | 'projects-assessed'
  | 'new-leads'
  | 'nearest-consultant'
  | 'upgrade';

export const CADashboard: React.FC<CADashboardProps> = ({ user, onLogout, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<CATab>('overview');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Consultant Finder State
  const [consultantLocation, setConsultantLocation] = useState('Mumbai, Maharashtra');
  const [consultants, setConsultants] = useState<any[]>([]);
  const [consultantLoading, setConsultantLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const leadData = await fetchLeadsFromDatabase().catch(() => getStoredLeads());
      setLeads(leadData);
    } catch (err) {
      console.warn('Error loading CA dashboard data:', err);
      setLeads(getStoredLeads());
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultants = async (loc = consultantLocation) => {
    setConsultantLoading(true);
    try {
      const res = await fetch(resolveApiUrl(`/ca-admin/consultants/nearest?projectLocation=${encodeURIComponent(loc)}`));
      const json = await res.json();
      if (json && json.data && json.data.consultants) {
        setConsultants(json.data.consultants);
      } else {
        // Fallback regional network
        setConsultants([
          {
            name: 'Vikramaditya Singhania',
            firm: 'Singhania Engineering DPR Consultants',
            email: 'vikram.singhania@inisio-advisory.in',
            phone: '+91 98200 44556',
            location: 'Mumbai, Maharashtra',
            sectors: ['Infrastructure', 'Renewable Energy', 'Manufacturing'],
            projectsCompleted: 42
          },
          {
            name: 'Dr. C. R. Subramanian',
            firm: 'Deccan Techno-Economic Advisory',
            email: 'subramanian.cr@inisio-advisory.in',
            phone: '+91 94440 88990',
            location: 'Chennai / Hyderabad',
            sectors: ['Pharmaceuticals', 'Chemicals', 'Textiles'],
            projectsCompleted: 38
          },
          {
            name: 'Harvinder Sodhi',
            firm: 'North India Project Syndications',
            email: 'harvinder.sodhi@inisio-advisory.in',
            phone: '+91 98110 33445',
            location: 'New Delhi / NCR',
            sectors: ['Logistics', 'Steel & Metallurgy', 'Agro-Processing'],
            projectsCompleted: 29
          }
        ]);
      }
    } catch {
      setConsultants([]);
    } finally {
      setConsultantLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchConsultants();
    const handleUpdate = () => loadData();
    window.addEventListener('inisio_lead_added', handleUpdate);
    return () => window.removeEventListener('inisio_lead_added', handleUpdate);
  }, []);

  // Filtered Segments
  const userEmail = (user?.email || '').toLowerCase().trim();

  // 1. Own Leads: Leads created by this CA or with source containing 'own' or 'ca'
  const ownLeads = leads.filter((l) => {
    const src = (l.source || '').toLowerCase();
    const ca = (l.assignedCA || '').toLowerCase();
    return src.includes('own') || src.includes('practice') || src.includes('ca') || (userEmail && ca === userEmail);
  });

  // 2. Inisio Leads: Platform leads from Inisio
  const inisioLeads = leads.filter((l) => {
    const src = (l.source || '').toLowerCase();
    return !src.includes('own') && !src.includes('practice');
  });

  // 3. Projects Assessed: Assessed projects
  const assessedProjects = leads.filter((l) => {
    return l.assessmentCompleted === true || (l.status || '').toLowerCase().includes('assessed') || (l.status || '').toLowerCase().includes('approved');
  });

  // 4. New Leads: Most recent leads sorted descending
  const newLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const navItems = [
    { id: 'overview' as CATab, label: 'Overview', icon: LayoutDashboard },
    { id: 'own-leads' as CATab, label: 'Own Leads', icon: FolderOpen, count: ownLeads.length },
    { id: 'inisio-leads' as CATab, label: 'Inisio Leads', icon: FileCheck2, count: inisioLeads.length },
    { id: 'projects-assessed' as CATab, label: 'Projects Assessed', icon: CheckCircle2, count: assessedProjects.length },
    { id: 'new-leads' as CATab, label: 'New Leads', icon: PlusCircle, count: newLeads.length },
    { id: 'nearest-consultant' as CATab, label: 'Contact Consultant', icon: MapPin },
    { id: 'upgrade' as CATab, label: 'Membership Upgrade', icon: Award }
  ];

  const handleSelectTab = (tab: CATab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const handleGoBack = () => {
    if (activeTab !== 'overview') {
      setActiveTab('overview');
    } else if (onNavigateHome) {
      onNavigateHome();
    }
  };

  const matchesSearch = (item: LeadRecord) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.fullName || '').toLowerCase().includes(term) ||
      (item.projectName || '').toLowerCase().includes(term) ||
      (item.location || '').toLowerCase().includes(term) ||
      (item.status || '').toLowerCase().includes(term) ||
      (item.industry || '').toLowerCase().includes(term)
    );
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

      {/* Fixed Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between p-5 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 shrink-0 ${
          isMobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2 pb-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white font-manrope leading-tight">Inisio</div>
                  <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">CA Partner Desk</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                CA / CMA Partner
              </span>
              <span className="text-[11px] text-slate-400 font-medium truncate max-w-28">
                {user?.name || user?.email?.split('@')[0] || 'CA Partner'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
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

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade Tier</span>
          </button>

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

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200/90 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-slate-900 font-manrope">CA Audit Desk</span>
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

        {/* Scrolling Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Inner Navigation Bar */}
          {activeTab !== 'overview' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGoBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                <span>Overview</span>
              </button>
              <span className="text-xs text-slate-400 font-medium">/</span>
              <span className="text-xs text-slate-500 font-bold capitalize">
                {navItems.find((i) => i.id === activeTab)?.label || activeTab}
              </span>
            </div>
          )}

          {/* 1. Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Chartered Accountant (CA) Advisory Desk</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-manrope">
                    Partner Lead &amp; Project Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Track your own created client mandates, evaluate inbound Inisio debt syndication leads, monitor assessed projects, and coordinate with regional DPR consultants.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={loadData}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upgrade</span>
                  </button>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => handleSelectTab('own-leads')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1 hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-500 uppercase">Own Leads</span>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 font-manrope">{ownLeads.length}</p>
                  <span className="text-xs text-blue-600 font-medium">Practice &amp; referral leads</span>
                </div>

                <div
                  onClick={() => handleSelectTab('inisio-leads')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1 hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-500 uppercase">Inisio Leads</span>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 font-manrope">{inisioLeads.length}</p>
                  <span className="text-xs text-indigo-600 font-medium">Platform syndicated leads</span>
                </div>

                <div
                  onClick={() => handleSelectTab('projects-assessed')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1 hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-500 uppercase">Projects Assessed</span>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-manrope">{assessedProjects.length}</p>
                  <span className="text-xs text-emerald-600 font-medium">Assessed &amp; cleared</span>
                </div>

                <div
                  onClick={() => handleSelectTab('new-leads')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1 hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-500 uppercase">New Leads</span>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 font-manrope">{newLeads.length}</p>
                  <span className="text-xs text-amber-600 font-medium">Recent inbound additions</span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectTab('nearest-consultant')}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all text-left flex items-start gap-4 cursor-pointer"
                >
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">Contact Nearest Consultant</h3>
                    <p className="text-xs text-slate-500">
                      Locate accredited DPR consultants closest to your client's project site for techno-economic validation.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all text-left flex items-start gap-4 cursor-pointer"
                >
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">Upgrade Membership Tier</h3>
                    <p className="text-xs text-slate-500">
                      Unlock multi-user CA firm logins, priority banking desk access, and expanded lead syndication allowances.
                    </p>
                  </div>
                </button>
              </div>

              {/* Recent Leads Preview */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 font-manrope">Recent Inbound &amp; Practice Leads</h2>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('new-leads')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>View All New Leads</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {newLeads.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    No leads yet
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {newLeads.slice(0, 5).map((l, idx) => (
                      <div key={l.id || l._id || idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900">{l.fullName}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {l.status || 'Active'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {l.projectName || 'Greenfield Project'} · {l.industry || 'Industrial'} · Location: {l.location || 'India'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-slate-900">₹ {l.totalCostCr || l.projectCost || '0'} Cr</span>
                          <div className="text-[11px] text-slate-400">Loan: ₹ {l.loanRequiredCr || l.proposedLoan || '0'} Cr</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Own Leads Tab */}
          {activeTab === 'own-leads' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                    <h2 className="text-lg font-bold text-slate-900 font-manrope">Own Leads</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Client mandates created or owned directly by your CA practice.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search own leads..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-5">Client / Project</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5">Location</th>
                      <th className="py-3 px-5">Sector</th>
                      <th className="py-3 px-5 text-right">Capex / Loan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ownLeads.filter(matchesSearch).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-slate-500 font-medium">
                          No leads yet
                        </td>
                      </tr>
                    ) : (
                      ownLeads.filter(matchesSearch).map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-5 font-semibold text-slate-900">
                            <div>{lead.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{lead.projectName || 'Greenfield Project'}</div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {lead.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{lead.location || 'India'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-slate-600">{lead.industry || 'General Industry'}</td>
                          <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                            <div>₹ {lead.totalCostCr || lead.projectCost || '0'} Cr</div>
                            <div className="text-[11px] font-normal text-slate-400">Debt: ₹ {lead.loanRequiredCr || lead.proposedLoan || '0'} Cr</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Inisio Leads Tab */}
          {activeTab === 'inisio-leads' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                    <h2 className="text-lg font-bold text-slate-900 font-manrope">Inisio Leads</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Institutional borrower assessment leads originating from Inisio platform syndication.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Inisio leads..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-5">Client / Project</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5">Location</th>
                      <th className="py-3 px-5">Sector</th>
                      <th className="py-3 px-5 text-right">Capex / Loan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inisioLeads.filter(matchesSearch).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-slate-500 font-medium">
                          No leads yet
                        </td>
                      </tr>
                    ) : (
                      inisioLeads.filter(matchesSearch).map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-5 font-semibold text-slate-900">
                            <div>{lead.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{lead.projectName || 'Greenfield Project'}</div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {lead.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{lead.location || 'India'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-slate-600">{lead.industry || 'General Industry'}</td>
                          <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                            <div>₹ {lead.totalCostCr || lead.projectCost || '0'} Cr</div>
                            <div className="text-[11px] font-normal text-slate-400">Debt: ₹ {lead.loanRequiredCr || lead.proposedLoan || '0'} Cr</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Projects Assessed Tab */}
          {activeTab === 'projects-assessed' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                    <h2 className="text-lg font-bold text-slate-900 font-manrope">Projects Assessed</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Greenfield capital outlay projects evaluated and vetted through CMA underwriting.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search assessed projects..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-5">Project Name</th>
                      <th className="py-3 px-5">Promoter</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5">Location</th>
                      <th className="py-3 px-5">DSCR</th>
                      <th className="py-3 px-5 text-right">Capex</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assessedProjects.filter(matchesSearch).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-slate-500 font-medium">
                          No projects yet
                        </td>
                      </tr>
                    ) : (
                      assessedProjects.filter(matchesSearch).map((proj) => (
                        <tr key={proj.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-5 font-semibold text-slate-900">
                            <div>{proj.projectName || 'Greenfield Project'}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{proj.industry || 'Manufacturing'}</div>
                          </td>
                          <td className="py-3.5 px-5 text-slate-700">{proj.fullName}</td>
                          <td className="py-3.5 px-5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {proj.status || 'Assessed'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{proj.location || 'India'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 font-bold text-blue-600">{proj.dscr || proj.dscrEstimate || '1.45'}x</td>
                          <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                            ₹ {proj.totalCostCr || proj.projectCost || '0'} Cr
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. New Leads Tab */}
          {activeTab === 'new-leads' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                    <h2 className="text-lg font-bold text-slate-900 font-manrope">New Leads</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Chronological feed of newly received project assessment submissions.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search new leads..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-5">Client / Project</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5">Location</th>
                      <th className="py-3 px-5">Date Added</th>
                      <th className="py-3 px-5 text-right">Capex Outlay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {newLeads.filter(matchesSearch).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-slate-500 font-medium">
                          No leads yet
                        </td>
                      </tr>
                    ) : (
                      newLeads.filter(matchesSearch).map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-5 font-semibold text-slate-900">
                            <div>{lead.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{lead.projectName || 'Greenfield Project'}</div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              {lead.status || 'New'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{lead.location || 'India'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-slate-500">
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Recent'}
                          </td>
                          <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                            ₹ {lead.totalCostCr || lead.projectCost || '0'} Cr
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Contact Nearest Consultant Tab */}
          {activeTab === 'nearest-consultant' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">
                  <MapPin className="w-4 h-4" />
                  <span>Regional Consultant Network</span>
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
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-manrope">
                    Contact Nearest DPR Consultant
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                  Inisio connects your clients with accredited Detailed Project Report (DPR) engineering consultants nearest to their industrial location.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <div className="relative flex-1 w-full">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={consultantLocation}
                      onChange={(e) => setConsultantLocation(e.target.value)}
                      placeholder="Enter project location (e.g. Mumbai, Gujarat, Hyderabad)..."
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchConsultants(consultantLocation)}
                    disabled={consultantLoading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    {consultantLoading ? 'Locating...' : 'Find Consultants'}
                  </button>
                </div>
              </div>

              {/* Consultants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {consultants.map((c, idx) => (
                  <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold font-manrope">
                          {c.name?.slice(0, 2).toUpperCase() || 'DC'}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                          <div className="text-[11px] text-slate-400">{c.firm}</div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{c.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      </div>

                      {c.sectors && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {c.sectors.map((s: string, sIdx: number) => (
                            <span key={sIdx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <a
                      href={`mailto:${c.email}?subject=Project Consultation Inquiry via Inisio CA Desk`}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      <span>Contact Consultant</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Upgrade Tab */}
          {activeTab === 'upgrade' && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xs space-y-6 max-w-4xl mx-auto">
              <div className="text-center space-y-2 max-w-xl mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold font-inter border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CA Network Partnership Tiers</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-manrope">
                  Upgrade Your CA Audit Desk
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Expand your capacity to evaluate larger capex projects, syndicate with leading PSU &amp; private commercial banks, and onboard multiple partners under one firm account.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {/* Starter Tier */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Basic</span>
                    <h3 className="text-lg font-bold text-slate-900">Associate CA</h3>
                    <div className="text-2xl font-black text-slate-900 font-manrope">Free</div>
                    <ul className="space-y-2 text-xs text-slate-600 pt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Up to 3 active project assessments</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Standard CMA calculation engine</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Single login seat</span>
                      </li>
                    </ul>
                  </div>
                  <span className="text-center py-2 text-xs font-bold text-slate-400">Current Plan</span>
                </div>

                {/* Professional Tier */}
                <div className="p-6 rounded-2xl border-2 border-blue-600 bg-blue-50/20 space-y-4 flex flex-col justify-between relative shadow-sm">
                  <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
                    Recommended
                  </span>
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Pro</span>
                    <h3 className="text-lg font-bold text-slate-900">Chartered Partner</h3>
                    <div className="text-2xl font-black text-slate-900 font-manrope">₹ 14,999 <span className="text-xs text-slate-400 font-normal">/ yr</span></div>
                    <ul className="space-y-2 text-xs text-slate-600 pt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Unlimited project assessments</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Priority Inisio borrower lead routing</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Direct consultant coordination</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>3 CA firm team seats</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Upgrade to Partner
                  </button>
                </div>

                {/* Institutional Tier */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Enterprise</span>
                    <h3 className="text-lg font-bold text-slate-900">National Practice</h3>
                    <div className="text-2xl font-black text-slate-900 font-manrope">Custom</div>
                    <ul className="space-y-2 text-xs text-slate-600 pt-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Multi-branch national CA coverage</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Dedicated debt syndication director</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Custom white-label banking reports</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Contact Enterprise
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Membership Plans Modal */}
      {isUpgradeModalOpen && (
        <MembershipPlansModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          currentUser={user}
        />
      )}
    </div>
  );
};

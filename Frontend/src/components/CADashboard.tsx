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
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Mail,
  Phone,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { fetchLeadsFromDatabase, getStoredLeads, LeadRecord } from '../utils/leadStore';
import { MembershipPlansModal } from './MembershipPlansModal';
import { resolveApiUrl } from '../utils/apiClient';
import { DashboardLayout } from './dashboard/DashboardLayout';
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardEmptyState,
  DashboardKpiCard,
  DashboardLoadingState,
  DashboardSearchInput,
  DashboardSectionBanner,
  DashboardStatusBadge,
  DASHBOARD_TABLE,
} from './dashboard/DashboardPrimitives';

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

export const CADashboard: React.FC<CADashboardProps> = ({
  user,
  onLogout,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<CATab>('overview');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

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
      const res = await fetch(
        resolveApiUrl(`/ca-admin/consultants/nearest?projectLocation=${encodeURIComponent(loc)}`)
      );
      const json = await res.json();
      if (json && json.data && json.data.consultants) {
        setConsultants(json.data.consultants);
      } else {
        setConsultants([
          {
            name: 'Vikramaditya Singhania',
            firm: 'Singhania Engineering DPR Consultants',
            email: 'vikram.singhania@inisio-advisory.in',
            phone: '+91 98200 44556',
            location: 'Mumbai, Maharashtra',
            sectors: ['Infrastructure', 'Renewable Energy', 'Manufacturing'],
            projectsCompleted: 42,
          },
          {
            name: 'Dr. C. R. Subramanian',
            firm: 'Deccan Techno-Economic Advisory',
            email: 'subramanian.cr@inisio-advisory.in',
            phone: '+91 94440 88990',
            location: 'Chennai / Hyderabad',
            sectors: ['Pharmaceuticals', 'Chemicals', 'Textiles'],
            projectsCompleted: 38,
          },
          {
            name: 'Harvinder Sodhi',
            firm: 'North India Project Syndications',
            email: 'harvinder.sodhi@inisio-advisory.in',
            phone: '+91 98110 33445',
            location: 'New Delhi / NCR',
            sectors: ['Logistics', 'Steel & Metallurgy', 'Agro-Processing'],
            projectsCompleted: 29,
          },
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

  const userEmail = (user?.email || '').toLowerCase().trim();

  const ownLeads = leads.filter((l) => {
    const src = (l.source || '').toLowerCase();
    const ca = (l.assignedCA || '').toLowerCase();
    return src.includes('own') || src.includes('practice') || src.includes('ca') || (userEmail && ca === userEmail);
  });

  const inisioLeads = leads.filter((l) => {
    const src = (l.source || '').toLowerCase();
    return !src.includes('own') && !src.includes('practice');
  });

  const assessedProjects = leads.filter((l) => {
    return (
      l.assessmentCompleted === true ||
      (l.status || '').toLowerCase().includes('assessed') ||
      (l.status || '').toLowerCase().includes('approved')
    );
  });

  const newLeads = [...leads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const navItems = [
    { id: 'overview' as CATab, label: 'Overview', icon: LayoutDashboard },
    { id: 'own-leads' as CATab, label: 'Own Leads', icon: FolderOpen, count: ownLeads.length },
    { id: 'inisio-leads' as CATab, label: 'Inisio Leads', icon: FileCheck2, count: inisioLeads.length },
    { id: 'projects-assessed' as CATab, label: 'Projects Assessed', icon: CheckCircle2, count: assessedProjects.length },
    { id: 'new-leads' as CATab, label: 'New Leads', icon: PlusCircle, count: newLeads.length },
    { id: 'nearest-consultant' as CATab, label: 'Contact Consultant', icon: MapPin },
    { id: 'upgrade' as CATab, label: 'Membership Upgrade', icon: Award },
  ];

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab as CATab);
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

  const activeNav = navItems.find((i) => i.id === activeTab);

  return (
    <DashboardLayout
      portalName="Inisio"
      portalSubtitle="CA Partner Desk"
      portalIcon={ShieldCheck}
      roleLabel="CA / CMA Partner"
      userName={user?.name}
      userEmail={user?.email}
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      pageTitle={activeTab === 'overview' ? 'Partner Overview' : activeNav?.label || 'CA Partner Desk'}
      pageBreadcrumb={activeTab !== 'overview' ? 'Overview' : undefined}
      showBackButton={activeTab !== 'overview'}
      onGoBack={handleGoBack}
      onNavigateHome={onNavigateHome}
      onLogout={onLogout}
      sidebarAction={
        <button
          type="button"
          onClick={() => setIsUpgradeModalOpen(true)}
          className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Upgrade Tier</span>
        </button>
      }
      headerActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade</span>
          </button>
        </div>
      }
    >
      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <DashboardSectionBanner
            eyebrow="Chartered Accountant (CA) Advisory Desk"
            eyebrowIcon={ShieldCheck}
            title="Partner Lead & Project Dashboard"
            description="Track your own created client mandates, evaluate inbound Inisio debt syndication leads, monitor assessed projects, and coordinate with regional DPR consultants."
            actions={
              <>
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Upgrade</span>
                </button>
              </>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardKpiCard
              label="Own Leads"
              value={ownLeads.length}
              subtext="Practice & referral leads"
              icon={FolderOpen}
              tone="blue"
              onClick={() => handleSelectTab('own-leads')}
            />
            <DashboardKpiCard
              label="Inisio Leads"
              value={inisioLeads.length}
              subtext="Platform syndicated leads"
              icon={FileCheck2}
              tone="indigo"
              onClick={() => handleSelectTab('inisio-leads')}
            />
            <DashboardKpiCard
              label="Projects Assessed"
              value={assessedProjects.length}
              valueClassName="text-emerald-600"
              subtext="Assessed & cleared"
              icon={CheckCircle2}
              tone="emerald"
              onClick={() => handleSelectTab('projects-assessed')}
            />
            <DashboardKpiCard
              label="New Leads"
              value={newLeads.length}
              subtext="Recent inbound additions"
              icon={PlusCircle}
              tone="amber"
              onClick={() => handleSelectTab('new-leads')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleSelectTab('nearest-consultant')}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 transition-colors text-left flex items-start gap-4 cursor-pointer"
            >
              <div className="w-10 h-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 font-manrope">Contact Nearest Consultant</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Locate accredited DPR consultants closest to your client's project site for techno-economic validation.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 transition-colors text-left flex items-start gap-4 cursor-pointer"
            >
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 font-manrope">Upgrade Membership Tier</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unlock multi-user CA firm logins, priority banking desk access, and expanded lead syndication allowances.
                </p>
              </div>
            </button>
          </div>

          <DashboardCard>
            <DashboardCardHeader
              title="Recent Inbound & Practice Leads"
              description="Latest borrower files across practice and Inisio pipelines."
              actions={
                <button
                  type="button"
                  onClick={() => handleSelectTab('new-leads')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>View All New Leads</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            {loading && newLeads.length === 0 ? (
              <DashboardLoadingState label="Loading partner leads..." />
            ) : newLeads.length === 0 ? (
              <DashboardEmptyState
                icon={FolderOpen}
                title="No leads yet"
                description="Client mandates and syndicated borrower leads will appear here."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {newLeads.slice(0, 5).map((l, idx) => (
                  <div
                    key={l.id || l._id || idx}
                    className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-sm text-slate-900">{l.fullName}</h4>
                        <DashboardStatusBadge status={l.status || 'Active'} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {l.projectName || 'Greenfield Project'} · {l.industry || 'Industrial'} · Location:{' '}
                        {l.location || 'India'}
                      </p>
                    </div>
                    <div className="sm:text-right shrink-0 tabular-nums">
                      <div className="text-xs font-bold text-slate-900">
                        ₹ {l.totalCostCr || l.projectCost || '0'} Cr
                      </div>
                      <div className="text-xs text-slate-500">
                        Loan: ₹ {l.loanRequiredCr || l.proposedLoan || '0'} Cr
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        </div>
      )}

      {/* 2. Own Leads Tab */}
      {activeTab === 'own-leads' && (
        <DashboardCard>
          <DashboardCardHeader
            title="Own Leads"
            description="Client mandates created or owned directly by your CA practice."
            actions={
              <DashboardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search own leads..."
              />
            }
          />

          <div className={DASHBOARD_TABLE.wrapper}>
            <table className={DASHBOARD_TABLE.table}>
              <thead className={DASHBOARD_TABLE.thead}>
                <tr>
                  <th className={DASHBOARD_TABLE.th}>Client / Project</th>
                  <th className={DASHBOARD_TABLE.th}>Status</th>
                  <th className={DASHBOARD_TABLE.th}>Location</th>
                  <th className={DASHBOARD_TABLE.th}>Sector</th>
                  <th className={`${DASHBOARD_TABLE.th} text-right`}>Capex / Loan</th>
                </tr>
              </thead>
              <tbody className={DASHBOARD_TABLE.tbody}>
                {ownLeads.filter(matchesSearch).length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <DashboardEmptyState
                        icon={FolderOpen}
                        title="No leads yet"
                        description="Practice-created mandates matching your search will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  ownLeads.filter(matchesSearch).map((lead) => (
                    <tr key={lead.id || lead._id} className={DASHBOARD_TABLE.tr}>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900`}>
                        <div>{lead.fullName}</div>
                        <div className="text-xs text-slate-500 font-normal mt-0.5">
                          {lead.projectName || 'Greenfield Project'}
                        </div>
                      </td>
                      <td className={DASHBOARD_TABLE.td}>
                        <DashboardStatusBadge status={lead.status || 'Active'} />
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-slate-700`}>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lead.location || 'India'}</span>
                        </div>
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-slate-600`}>
                        {lead.industry || 'General Industry'}
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-right font-bold text-slate-900 tabular-nums whitespace-nowrap`}>
                        <div>₹ {lead.totalCostCr || lead.projectCost || '0'} Cr</div>
                        <div className="text-xs font-normal text-slate-500">
                          Debt: ₹ {lead.loanRequiredCr || lead.proposedLoan || '0'} Cr
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {/* 3. Inisio Leads Tab */}
      {activeTab === 'inisio-leads' && (
        <DashboardCard>
          <DashboardCardHeader
            title="Inisio Leads"
            description="Institutional borrower assessment leads originating from Inisio platform syndication."
            actions={
              <DashboardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search Inisio leads..."
              />
            }
          />

          <div className={DASHBOARD_TABLE.wrapper}>
            <table className={DASHBOARD_TABLE.table}>
              <thead className={DASHBOARD_TABLE.thead}>
                <tr>
                  <th className={DASHBOARD_TABLE.th}>Client / Project</th>
                  <th className={DASHBOARD_TABLE.th}>Status</th>
                  <th className={DASHBOARD_TABLE.th}>Location</th>
                  <th className={DASHBOARD_TABLE.th}>Sector</th>
                  <th className={`${DASHBOARD_TABLE.th} text-right`}>Capex / Loan</th>
                </tr>
              </thead>
              <tbody className={DASHBOARD_TABLE.tbody}>
                {inisioLeads.filter(matchesSearch).length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <DashboardEmptyState
                        icon={FileCheck2}
                        title="No leads yet"
                        description="Syndicated borrower leads from the Inisio platform will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  inisioLeads.filter(matchesSearch).map((lead) => (
                    <tr key={lead.id || lead._id} className={DASHBOARD_TABLE.tr}>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900`}>
                        <div>{lead.fullName}</div>
                        <div className="text-xs text-slate-500 font-normal mt-0.5">
                          {lead.projectName || 'Greenfield Project'}
                        </div>
                      </td>
                      <td className={DASHBOARD_TABLE.td}>
                        <DashboardStatusBadge status={lead.status || 'Active'} />
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-slate-700`}>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lead.location || 'India'}</span>
                        </div>
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-slate-600`}>
                        {lead.industry || 'General Industry'}
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-right font-bold text-slate-900 tabular-nums whitespace-nowrap`}>
                        <div>₹ {lead.totalCostCr || lead.projectCost || '0'} Cr</div>
                        <div className="text-xs font-normal text-slate-500">
                          Debt: ₹ {lead.loanRequiredCr || lead.proposedLoan || '0'} Cr
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {/* 4. Projects Assessed Tab */}
      {activeTab === 'projects-assessed' && (
        <DashboardCard>
          <DashboardCardHeader
            title="Projects Assessed"
            description="Greenfield capital outlay projects evaluated and vetted through CMA underwriting."
            actions={
              <DashboardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search assessed projects..."
              />
            }
          />

          <div className={DASHBOARD_TABLE.wrapper}>
            <table className={DASHBOARD_TABLE.table}>
              <thead className={DASHBOARD_TABLE.thead}>
                <tr>
                  <th className={DASHBOARD_TABLE.th}>Project Name</th>
                  <th className={DASHBOARD_TABLE.th}>Promoter</th>
                  <th className={DASHBOARD_TABLE.th}>Status</th>
                  <th className={DASHBOARD_TABLE.th}>Location</th>
                  <th className={DASHBOARD_TABLE.th}>DSCR</th>
                  <th className={`${DASHBOARD_TABLE.th} text-right`}>Capex</th>
                </tr>
              </thead>
              <tbody className={DASHBOARD_TABLE.tbody}>
                {assessedProjects.filter(matchesSearch).length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <DashboardEmptyState
                        icon={CheckCircle2}
                        title="No projects yet"
                        description="Completed CMA assessments will appear in this ledger."
                      />
                    </td>
                  </tr>
                ) : (
                  assessedProjects.filter(matchesSearch).map((proj) => (
                    <tr key={proj.id || proj._id} className={DASHBOARD_TABLE.tr}>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900`}>
                        <div>{proj.projectName || 'Greenfield Project'}</div>
                        <div className="text-xs text-slate-500 font-normal mt-0.5">
                          {proj.industry || 'Manufacturing'}
                        </div>
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-slate-700`}>{proj.fullName}</td>
                      <td className={DASHBOARD_TABLE.td}>
                        <DashboardStatusBadge status={proj.status || 'Assessed'} />
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-slate-700`}>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{proj.location || 'India'}</span>
                        </div>
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} font-bold text-blue-600 tabular-nums`}>
                        {proj.dscr || proj.dscrEstimate || '1.45'}x
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-right font-bold text-slate-900 tabular-nums whitespace-nowrap`}>
                        ₹ {proj.totalCostCr || proj.projectCost || '0'} Cr
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {/* 5. New Leads Tab */}
      {activeTab === 'new-leads' && (
        <DashboardCard>
          <DashboardCardHeader
            title="New Leads"
            description="Chronological feed of newly received project assessment submissions."
            actions={
              <DashboardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search new leads..."
              />
            }
          />

          <div className={DASHBOARD_TABLE.wrapper}>
            <table className={DASHBOARD_TABLE.table}>
              <thead className={DASHBOARD_TABLE.thead}>
                <tr>
                  <th className={DASHBOARD_TABLE.th}>Client / Project</th>
                  <th className={DASHBOARD_TABLE.th}>Status</th>
                  <th className={DASHBOARD_TABLE.th}>Location</th>
                  <th className={DASHBOARD_TABLE.th}>Date Added</th>
                  <th className={`${DASHBOARD_TABLE.th} text-right`}>Capex Outlay</th>
                </tr>
              </thead>
              <tbody className={DASHBOARD_TABLE.tbody}>
                {newLeads.filter(matchesSearch).length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <DashboardEmptyState
                        icon={PlusCircle}
                        title="No leads yet"
                        description="New borrower project submissions will appear here chronologically."
                      />
                    </td>
                  </tr>
                ) : (
                  newLeads.filter(matchesSearch).map((lead) => (
                    <tr key={lead.id || lead._id} className={DASHBOARD_TABLE.tr}>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900`}>
                        <div>{lead.fullName}</div>
                        <div className="text-xs text-slate-500 font-normal mt-0.5">
                          {lead.projectName || 'Greenfield Project'}
                        </div>
                      </td>
                      <td className={DASHBOARD_TABLE.td}>
                        <DashboardStatusBadge status={lead.status || 'New'} />
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-slate-700`}>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lead.location || 'India'}</span>
                        </div>
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-slate-500 tabular-nums whitespace-nowrap`}>
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-right font-bold text-slate-900 tabular-nums whitespace-nowrap`}>
                        ₹ {lead.totalCostCr || lead.projectCost || '0'} Cr
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {/* 6. Contact Nearest Consultant Tab */}
      {activeTab === 'nearest-consultant' && (
        <div className="space-y-6">
          <DashboardCard className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                <MapPin className="w-4 h-4" />
                <span>Regional Consultant Network</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-manrope">
                Contact Nearest DPR Consultant
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                Inisio connects your clients with accredited Detailed Project Report (DPR) engineering consultants nearest to their industrial location.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="relative flex-1 w-full">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={consultantLocation}
                  onChange={(e) => setConsultantLocation(e.target.value)}
                  placeholder="Enter project location (e.g. Mumbai, Gujarat, Hyderabad)..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchConsultants(consultantLocation)}
                disabled={consultantLoading}
                className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-50"
              >
                {consultantLoading ? 'Locating...' : 'Find Consultants'}
              </button>
            </div>
          </DashboardCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {consultants.map((c, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-5 border border-slate-200 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold font-manrope shrink-0">
                      {c.name?.slice(0, 2).toUpperCase() || 'DC'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{c.name}</h3>
                      <div className="text-xs text-slate-500 truncate">{c.firm}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="tabular-nums">{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  </div>

                  {c.sectors && (
                    <div className="text-xs text-slate-500 pt-1">
                      {c.sectors.join(' · ')}
                    </div>
                  )}
                </div>

                <a
                  href={`mailto:${c.email}?subject=Project Consultation Inquiry via Inisio CA Desk`}
                  className="w-full py-2 px-4 bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
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
        <DashboardCard className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="text-xs font-semibold text-blue-700 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CA Network Partnership Tiers</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 font-manrope">
              Upgrade Your CA Audit Desk
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Expand your capacity to evaluate larger capex projects, syndicate with leading PSU &amp; private commercial banks, and onboard multiple partners under one firm account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500">Basic</span>
                <h3 className="text-base font-bold text-slate-900 font-manrope">Associate CA</h3>
                <div className="text-2xl font-extrabold text-slate-900 font-manrope tabular-nums">Free</div>
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
              <span className="text-center py-2 text-xs font-semibold text-slate-400">Current Plan</span>
            </div>

            <div className="p-5 rounded-xl border-2 border-blue-600 bg-blue-50/20 space-y-4 flex flex-col justify-between relative">
              <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-600 text-white">
                Recommended
              </span>
              <div className="space-y-2">
                <span className="text-xs font-semibold text-blue-600">Pro</span>
                <h3 className="text-base font-bold text-slate-900 font-manrope">Chartered Partner</h3>
                <div className="text-2xl font-extrabold text-slate-900 font-manrope tabular-nums">
                  ₹ 14,999 <span className="text-xs text-slate-500 font-normal">/ yr</span>
                </div>
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
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Upgrade to Partner
              </button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500">Enterprise</span>
                <h3 className="text-base font-bold text-slate-900 font-manrope">National Practice</h3>
                <div className="text-2xl font-extrabold text-slate-900 font-manrope">Custom</div>
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
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Contact Enterprise
              </button>
            </div>
          </div>
        </DashboardCard>
      )}

      {isUpgradeModalOpen && (
        <MembershipPlansModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          currentUser={user}
        />
      )}
    </DashboardLayout>
  );
};

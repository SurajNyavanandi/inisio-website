import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  LayoutDashboard,
  FileCode,
  CheckCircle2,
  BookOpen,
  FolderOpen,
  RefreshCw,
  Clock,
  ArrowRight,
  Wrench,
  Layers,
} from 'lucide-react';
import { fetchLeadsFromDatabase, getStoredLeads, LeadRecord } from '../utils/leadStore';
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

interface DPRConsultantDashboardProps {
  user?: AuthUser | null;
  onLogout?: () => void;
  onNavigateHome?: () => void;
}

type DPRTab = 'overview' | 'drafting' | 'tev' | 'guidelines';

export const DPRConsultantDashboard: React.FC<DPRConsultantDashboardProps> = ({
  user,
  onLogout,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<DPRTab>('overview');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.dprTab) {
        setActiveTab(e.state.dprTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const filteredLeads = leads.filter(
    (l) =>
      (l.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.industry || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: 'overview' as DPRTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'drafting' as DPRTab, label: 'DPR Drafting', icon: FileCode, count: leads.length },
    { id: 'tev' as DPRTab, label: 'TEV Clearances', icon: CheckCircle2 },
    { id: 'guidelines' as DPRTab, label: 'Technical Guidelines', icon: BookOpen },
  ];

  const handleSelectTab = (tab: string) => {
    const nextTab = tab as DPRTab;
    setActiveTab(nextTab);
    try {
      window.history.pushState({ dprTab: nextTab }, '', window.location.href);
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

  const activeNav = navItems.find((i) => i.id === activeTab);

  return (
    <DashboardLayout
      portalName="Inisio"
      portalSubtitle="DPR Desk"
      portalIcon={FileCode}
      roleLabel="Consultant Network"
      userName={user?.name}
      userEmail={user?.email}
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      pageTitle={activeTab === 'overview' ? 'DPR Engineering Overview' : activeNav?.label || 'DPR Desk'}
      pageBreadcrumb={activeTab !== 'overview' ? 'Overview' : undefined}
      showBackButton={activeTab !== 'overview'}
      onGoBack={handleGoBack}
      onNavigateHome={onNavigateHome}
      onLogout={onLogout}
      headerActions={
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Pipeline</span>
        </button>
      }
    >
      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <DashboardSectionBanner
            eyebrow="DPR Engineering & Technical Desk"
            eyebrowIcon={FileCode}
            title="Detailed Project Report Drafting Hub"
            description="Techno-economic viability (TEV) validation, plant machinery layout, and civil works cost estimation."
            actions={
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Pipeline</span>
              </button>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DashboardKpiCard
              label="Assigned DPRs"
              value={leads.length}
              subtext="In engineering drafting pipeline"
              icon={FileCode}
              tone="blue"
              onClick={() => handleSelectTab('drafting')}
            />
            <DashboardKpiCard
              label="TEV Clearances"
              value={leads.length > 0 ? '100%' : '0%'}
              valueClassName="text-emerald-600"
              subtext="Empaneled engineer approved"
              icon={CheckCircle2}
              tone="emerald"
              onClick={() => handleSelectTab('tev')}
            />
            <DashboardKpiCard
              label="Average Turnaround"
              value={leads.length > 0 ? '7 Days' : '—'}
              subtext="Comprehensive report generation"
              icon={Clock}
              tone="slate"
            />
          </div>

          <DashboardCard>
            <DashboardCardHeader
              title="Active Technical Clearances"
              description="Recent greenfield projects queued for engineering appraisal."
              actions={
                <button
                  type="button"
                  onClick={() => handleSelectTab('drafting')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            {loading && leads.length === 0 ? (
              <DashboardLoadingState label="Loading DPR assignments..." />
            ) : leads.length === 0 ? (
              <DashboardEmptyState
                icon={FolderOpen}
                title="No active DPR drafting mandates"
                description="Newly assigned projects requiring technical appraisal will appear here."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {leads.slice(0, 4).map((l, idx) => (
                  <div
                    key={l.id || l._id || idx}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm truncate">
                        {l.projectName || 'Greenfield Plant'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        Promoter: {l.fullName} · {l.industry || 'Manufacturing'} · Outlay: ₹{' '}
                        {l.projectCost || l.totalCostCr || '0'} Cr
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <DashboardStatusBadge status={l.status || 'Active DPR'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        </div>
      )}

      {/* 2. DPR Drafting Hub Tab */}
      {activeTab === 'drafting' && (
        <DashboardCard>
          <DashboardCardHeader
            title="Technical Drafting Pipeline"
            description="Track and prepare comprehensive Detailed Project Reports (DPR) for greenfield projects."
            actions={
              <DashboardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search projects..."
              />
            }
          />

          <div className={DASHBOARD_TABLE.wrapper}>
            <table className={DASHBOARD_TABLE.table}>
              <thead className={DASHBOARD_TABLE.thead}>
                <tr>
                  <th className={DASHBOARD_TABLE.th}>Project Name</th>
                  <th className={DASHBOARD_TABLE.th}>Promoter</th>
                  <th className={DASHBOARD_TABLE.th}>Sector</th>
                  <th className={DASHBOARD_TABLE.th}>Outlay</th>
                  <th className={DASHBOARD_TABLE.th}>Term Loan</th>
                  <th className={`${DASHBOARD_TABLE.th} text-right`}>Stage</th>
                </tr>
              </thead>
              <tbody className={DASHBOARD_TABLE.tbody}>
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <DashboardLoadingState label="Loading drafting queue..." />
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <DashboardEmptyState
                        icon={FolderOpen}
                        title="No projects match your search"
                        description="Newly assigned projects requiring technical appraisal will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((l, idx) => (
                    <tr key={l.id || l._id || idx} className={DASHBOARD_TABLE.tr}>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900`}>
                        {l.projectName || 'Greenfield Plant'}
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-slate-700`}>{l.fullName || 'Promoter'}</td>
                      <td className={`${DASHBOARD_TABLE.td} text-slate-600`}>{l.industry || 'Manufacturing'}</td>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900 tabular-nums whitespace-nowrap`}>
                        ₹ {l.projectCost || l.totalCostCr || '0'} Cr
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-blue-700 tabular-nums whitespace-nowrap`}>
                        ₹ {l.proposedLoan || l.loanRequiredCr || '0'} Cr
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-right`}>
                        <DashboardStatusBadge status={l.status || 'Active DPR'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {/* 3. TEV Clearances Tab */}
      {activeTab === 'tev' && (
        <div className="space-y-6">
          <DashboardSectionBanner
            eyebrow="Techno-Economic Viability (TEV) Framework"
            eyebrowIcon={CheckCircle2}
            title="Engineering & Technical Clearances"
            description="Standard engineering milestones verified before commercial bank debt disbursement."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-xs">
                <Wrench className="w-4 h-4" />
                <span>Civil Works &amp; Plant Layout</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-manrope">
                Industrial Site &amp; Factory Specifications
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Architectural layout, plinth area cost validation, shed erection schedules, and structural stability certifications.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-xs">
                <Layers className="w-4 h-4" />
                <span>Plant &amp; Machinery Quotations</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-manrope">
                Equipment Technology Assessment
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                OEM vendor quotations, imported vs indigenous machine splits, production capacity metrics, and balance of plant viability.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Environmental &amp; Utility Sanctions</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-manrope">
                Statutory Infrastructure Feasibility
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pollution Control Board Consent to Establish (CTE), high-tension power load sanction, effluent treatment, and water supply.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-xs">
                <Clock className="w-4 h-4" />
                <span>Commercial COD Schedule</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-manrope">
                Project Implementation Milestone Tracking
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gantt chart timelines from financial closure and machine commissioning to commercial operations date (COD).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Technical Guidelines Tab */}
      {activeTab === 'guidelines' && (
        <div className="space-y-6">
          <DashboardSectionBanner
            eyebrow="DPR Standardization Norms"
            eyebrowIcon={BookOpen}
            title="DPR Drafting Benchmarks & Submission Norms"
            description="Format standards required by commercial lenders and consortium syndication lead bankers."
          />

          <DashboardCard className="p-5 sm:p-6 space-y-3 text-xs text-slate-700">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-xs tabular-nums">
                1
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Executive Summary &amp; Promoters Profile</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Includes promoter experience, previous execution track record, management hierarchy, and equity shareholding.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-xs tabular-nums">
                2
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Technical Details &amp; Manufacturing Process</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Flow diagrams, raw material supply chain contracts, utility consumption factors per ton, and waste disposal systems.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-xs tabular-nums">
                3
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Market Demand &amp; Offtake Contracts</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Target market radius, competition analysis, MOUs or letters of intent (LOI) with primary buyers, and pricing dynamics.
                </p>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}
    </DashboardLayout>
  );
};

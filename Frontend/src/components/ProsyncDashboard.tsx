import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  LayoutDashboard,
  Network,
  CalendarCheck,
  Building2,
  FolderOpen,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Landmark,
} from 'lucide-react';
import { fetchLeadsFromDatabase, getStoredLeads, LeadRecord } from '../utils/leadStore';
import api from '../utils/apiClient';
import { UISelect } from './ui/Select';
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

interface ProsyncDashboardProps {
  user: AuthUser | null;
  onLogout?: () => void;
  onNavigateHome?: () => void;
}

type ProsyncTab = 'overview' | 'pipeline' | 'consultations' | 'lenders';

export const ProsyncDashboard: React.FC<ProsyncDashboardProps> = ({
  user,
  onLogout,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<ProsyncTab>('overview');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const leadData = await fetchLeadsFromDatabase().catch(() => getStoredLeads());
      setLeads(leadData);

      const res: any = await api.consultations.getAll().catch(() => null);
      if (res) {
        const list = Array.isArray(res) ? res : res.data || [];
        setConsultations(Array.isArray(list) ? list : []);
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
      setConsultations((prev) =>
        prev.map((c) => (c._id === id || c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error('Failed to update consultation status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredLeads = leads.filter(
    (l) =>
      (l.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.industry || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: 'overview' as ProsyncTab, label: 'Overview', mobileLabel: 'Overview', icon: LayoutDashboard },
    { id: 'pipeline' as ProsyncTab, label: 'Syndication Pipeline', mobileLabel: 'Pipeline', icon: Network, count: leads.length },
    { id: 'consultations' as ProsyncTab, label: 'Consultations Desk', mobileLabel: 'Consults', icon: CalendarCheck, count: consultations.length },
    { id: 'lenders' as ProsyncTab, label: 'Lender Consortium', mobileLabel: 'Lenders', icon: Building2 },
  ];

  const handleSelectTab = (tab: string) => {
    const nextTab = tab as ProsyncTab;
    setActiveTab(nextTab);
    try {
      window.history.pushState({ prosyncTab: nextTab }, '', window.location.href);
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

  const activeNav = navItems.find((i) => i.id === activeTab);

  return (
    <DashboardLayout
      portalName="Inisio"
      portalSubtitle="ProSync Desk"
      portalIcon={Network}
      roleLabel="ProSync Team"
      userName={user?.name}
      userEmail={user?.email}
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      pageTitle={activeTab === 'overview' ? 'ProSync Operations Overview' : activeNav?.label || 'ProSync Desk'}
      pageBreadcrumb={activeTab !== 'overview' ? 'Overview' : undefined}
      showBackButton={activeTab !== 'overview'}
      onGoBack={handleGoBack}
      onNavigateHome={onNavigateHome}
      onLogout={onLogout}
      mobileStickyAction={
        activeTab === 'pipeline' || activeTab === 'consultations' ? (
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="w-full min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSelectTab('pipeline')}
            className="w-full min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Network className="w-4 h-4 shrink-0" />
            <span>Syndication Pipeline ({leads.length})</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        )
      }
      headerActions={
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          aria-label="Refresh Queue"
          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-[36px] px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh Queue</span>
        </button>
      }
    >
      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-5 sm:space-y-6">
          <DashboardSectionBanner
            eyebrow="ProSync Operations Hub"
            eyebrowIcon={Network}
            title="Banking Syndication & Workflow Operations"
            description="Coordinating technical consultants, chartered accountants, and commercial bank credit teams."
            actions={
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="hidden lg:flex px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Queue</span>
              </button>
            }
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <DashboardKpiCard
              label="Active Engagements"
              value={leads.length}
              subtext="In underwriting pipeline"
              icon={Landmark}
              tone="blue"
              onClick={() => handleSelectTab('pipeline')}
            />
            <DashboardKpiCard
              label="Average Cycle Time"
              value={leads.length > 0 ? '24 Days' : '—'}
              valueClassName="text-emerald-600"
              subtext="From appraisal to sanction letter"
              icon={Clock}
              tone="emerald"
            />
            <div className="col-span-2 sm:col-span-1">
              <DashboardKpiCard
                label="Credit Clearance"
                value={leads.length > 0 ? '100%' : '0%'}
                subtext="Clearance rate"
                icon={CheckCircle2}
                tone="slate"
              />
            </div>
          </div>

          <DashboardCard>
            <DashboardCardHeader
              title="Active Syndication Pipeline"
              description="Top mandates queued for institutional banking liaison."
              actions={
                <button
                  type="button"
                  onClick={() => handleSelectTab('pipeline')}
                  className="min-h-[44px] sm:min-h-0 px-2 sm:px-0 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            {loading && leads.length === 0 ? (
              <DashboardLoadingState label="Loading syndication queue..." />
            ) : leads.length === 0 ? (
              <DashboardEmptyState
                icon={FolderOpen}
                title="No syndication projects in queue"
                description="Newly approved borrower assessments will appear here for banking liaison."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {leads.slice(0, 4).map((l, idx) => (
                  <div
                    key={l.id || l._id || idx}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm truncate">{l.fullName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        {l.projectName || 'Greenfield Project'} · {l.industry || 'Industrial'} · ₹{' '}
                        {l.proposedLoan || l.loanRequiredCr || '0'} Cr Loan
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <DashboardStatusBadge status={l.status || 'Active'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        </div>
      )}

      {/* 2. Syndication Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <DashboardCard>
          <DashboardCardHeader
            title="Greenfield Debt Syndication Queue"
            description="Coordinate borrower mandates with commercial banking underwriting committees."
            actions={
              <DashboardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search proposals..."
              />
            }
          />

          {/* Mobile Stacked Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <DashboardLoadingState label="Loading syndication pipeline..." />
            ) : filteredLeads.length === 0 ? (
              <DashboardEmptyState
                icon={FolderOpen}
                title="No proposals match your search"
                description="Newly approved borrower assessments will appear here for banking liaison."
              />
            ) : (
              filteredLeads.map((l, idx) => (
                <div key={l.id || l._id || idx} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-sm">{l.fullName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {l.projectName || 'Greenfield Project'} · {l.industry || 'Industrial'}
                      </div>
                    </div>
                    <DashboardStatusBadge status={l.status || 'Syndication Review'} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                    <div>
                      <div className="text-[11px] text-slate-500">Total Capex</div>
                      <div className="font-semibold text-slate-900 tabular-nums mt-0.5">
                        ₹ {l.projectCost || l.totalCostCr || '0'} Cr
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">Proposed Debt</div>
                      <div className="font-semibold text-blue-700 tabular-nums mt-0.5">
                        ₹ {l.proposedLoan || l.loanRequiredCr || '0'} Cr
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">Rating</div>
                      <div className="font-semibold text-slate-800 mt-0.5">
                        {l.bankabilityRating || 'Grade A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={`hidden md:block ${DASHBOARD_TABLE.wrapper}`}>
            <table className={DASHBOARD_TABLE.table}>
              <thead className={DASHBOARD_TABLE.thead}>
                <tr>
                  <th className={DASHBOARD_TABLE.th}>Promoter / Project</th>
                  <th className={DASHBOARD_TABLE.th}>Sector</th>
                  <th className={DASHBOARD_TABLE.th}>Total Capex</th>
                  <th className={DASHBOARD_TABLE.th}>Proposed Debt</th>
                  <th className={DASHBOARD_TABLE.th}>Rating</th>
                  <th className={`${DASHBOARD_TABLE.th} text-right`}>Status</th>
                </tr>
              </thead>
              <tbody className={DASHBOARD_TABLE.tbody}>
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <DashboardLoadingState label="Loading syndication pipeline..." />
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <DashboardEmptyState
                        icon={FolderOpen}
                        title="No proposals match your search"
                        description="Newly approved borrower assessments will appear here for banking liaison."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((l, idx) => (
                    <tr key={l.id || l._id || idx} className={DASHBOARD_TABLE.tr}>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900`}>
                        {l.fullName}
                        <div className="text-xs text-slate-500 font-normal mt-0.5">
                          {l.projectName || 'Greenfield Project'}
                        </div>
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-slate-600`}>{l.industry || 'Industrial'}</td>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900 tabular-nums whitespace-nowrap`}>
                        ₹ {l.projectCost || l.totalCostCr || '0'} Cr
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-blue-700 tabular-nums whitespace-nowrap`}>
                        ₹ {l.proposedLoan || l.loanRequiredCr || '0'} Cr
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-700`}>
                        {l.bankabilityRating || 'Grade A'}
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-right`}>
                        <DashboardStatusBadge status={l.status || 'Syndication Review'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {/* 3. Consultations Desk Tab */}
      {activeTab === 'consultations' && (
        <DashboardCard>
          <DashboardCardHeader
            title="ProSync Consultation Management Desk"
            description="Track and manage advisory appointments assigned to ProSync syndication officers."
          />

          {consultations.length === 0 ? (
            <DashboardEmptyState
              icon={CalendarCheck}
              title="No active consultations assigned"
              description="Consultation bookings assigned to ProSync will automatically appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {consultations.map((c, idx) => {
                const currentStatus = c.status || 'In Progress';
                const isUpdating = updatingId === (c._id || c.id);
                return (
                  <div
                    key={c._id || c.id || idx}
                    className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {c.fullName || c.name || 'Borrower Consultation'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums break-words">
                        {c.phone || ''} · {c.email || ''}
                        {c.preferredDate ? ` · Date: ${c.preferredDate}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 w-full sm:w-auto sm:min-w-[200px] shrink-0">
                      <span className="text-xs text-slate-500 font-medium shrink-0">Status:</span>
                      <UISelect
                        value={currentStatus}
                        disabled={isUpdating}
                        onValueChange={(val) => handleUpdateConsultationStatus(c._id || c.id, val)}
                        options={[
                          { value: 'In Progress', label: 'In Progress' },
                          { value: 'Customer Declined', label: 'Customer Declined' },
                          { value: 'Completed', label: 'Completed' },
                        ]}
                        triggerClassName="min-h-[44px] sm:min-h-[36px] text-sm sm:text-xs font-semibold px-3 py-2 sm:py-1 bg-white border-slate-200 rounded-lg w-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashboardCard>
      )}

      {/* 4. Lender Consortium Tab */}
      {activeTab === 'lenders' && (
        <div className="space-y-6">
          <DashboardSectionBanner
            eyebrow="Institutional Syndication Network"
            eyebrowIcon={Building2}
            title="Empaneled Commercial Bank Consortium"
            description="Lender relationships and institutional debt underwriting partners active across greenfield syndications."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="text-xs font-semibold text-blue-700">Public Sector Banks (PSUs)</span>
              <h3 className="font-bold text-slate-900 text-sm font-manrope">Large Capex Syndication</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                State Bank of India (SBI), Bank of Baroda, Punjab National Bank (PNB), Canara Bank, Union Bank of India.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="text-xs font-semibold text-blue-700">Private Scheduled Banks</span>
              <h3 className="font-bold text-slate-900 text-sm font-manrope">Flexible Structured Facilities</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                HDFC Bank, ICICI Bank, Axis Bank, IndusInd Bank, Kotak Mahindra Bank.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="text-xs font-semibold text-emerald-700">Development Finance</span>
              <h3 className="font-bold text-slate-900 text-sm font-manrope">Subsidized &amp; Priority Sector</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                SIDBI (MSME manufacturing), IREDA (Renewable Energy), NABARD (Food processing &amp; Agri-infra).
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

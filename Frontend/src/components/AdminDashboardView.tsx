import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  LayoutDashboard,
  ShieldAlert,
  Download,
  Trash2,
  RefreshCw,
  FolderOpen,
  AlertCircle,
  Plus,
  Eye,
  Edit3,
  X,
  Loader2,
  TrendingUp,
  Landmark,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  fetchLeadsFromDatabaseStrict,
  deleteLeadRecord,
  exportLeadsToCSV,
  LeadRecord,
} from '../utils/leadStore';
import { api } from '../utils/apiClient';
import { ConfirmDialog } from './ui/Dialog';
import { UserProfileDetailModal } from './UserProfileDetailModal';
import { LeadEditModal } from './LeadEditModal';
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

type AdminDeskTab = 'overview' | 'under-review' | 'funded';

export const AdminDashboardView: React.FC<{
  currentUser?: AuthUser | null;
  onOpenLeadsModal?: () => void;
  onLogout?: () => void;
  onNavigateHome?: () => void;
}> = ({ currentUser, onLogout, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<AdminDeskTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<LeadRecord | null>(null);
  const [editTarget, setEditTarget] = useState<LeadRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newProject, setNewProject] = useState({
    promoterName: '',
    projectName: '',
    industry: 'Manufacturing',
    location: 'India',
    email: '',
    mobile: '',
    capexCr: '10',
    loanCr: '7',
  });

  const isReadOnly = currentUser?.role === 'superadmin';

  const loadLeads = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchLeadsFromDatabaseStrict();
      setLeads(data);
    } catch (err: any) {
      console.error('Failed to load leads from database:', err);
      setLoadError(err?.message || 'Unable to load projects and leads from the server.');
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

  const confirmDelete = async () => {
    if (!deleteTargetId || isReadOnly) return;
    setLoadError('');
    try {
      await deleteLeadRecord(deleteTargetId, { throwOnError: true });
      setLeads((prev) => prev.filter((l) => l.id !== deleteTargetId && l._id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to delete record from database.');
      setDeleteTargetId(null);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setCreating(true);
    setCreateError('');
    try {
      await api.projects.create({
        promoterName: newProject.promoterName.trim(),
        projectName: newProject.projectName.trim(),
        industry: newProject.industry.trim() || 'General Infrastructure',
        location: newProject.location.trim() || 'India',
        email: newProject.email.trim(),
        mobile: newProject.mobile.trim(),
        capexCr: Number(newProject.capexCr) || 0,
        loanCr: Number(newProject.loanCr) || 0,
      });
      setShowCreateModal(false);
      setNewProject({
        promoterName: '',
        projectName: '',
        industry: 'Manufacturing',
        location: 'India',
        email: '',
        mobile: '',
        capexCr: '10',
        loanCr: '7',
      });
      await loadLeads();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create project in database.');
    } finally {
      setCreating(false);
    }
  };

  const isFundedRecord = (l: LeadRecord) =>
    Boolean(
      l.isFunded ||
        (l.status || '').toLowerCase().includes('funded') ||
        (l.status || '').toLowerCase().includes('sanction') ||
        (l.status || '').toLowerCase().includes('approved')
    );

  const fundedLeads = leads.filter(isFundedRecord);
  const reviewLeads = leads.filter((l) => !isFundedRecord(l));

  const tabPool =
    activeTab === 'funded' ? fundedLeads : activeTab === 'under-review' ? reviewLeads : leads;

  const filtered = tabPool.filter(
    (l) =>
      (l.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.industry || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.projectName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCostSum = leads.reduce((acc, curr) => acc + (Number(curr.projectCost || curr.totalCostCr) || 0), 0);
  const totalLoanSum = leads.reduce((acc, curr) => acc + (Number(curr.proposedLoan || curr.loanRequiredCr) || 0), 0);

  const navItems = [
    { id: 'overview' as AdminDeskTab, label: 'All Projects & Leads', mobileLabel: 'All Leads', icon: LayoutDashboard, count: leads.length },
    { id: 'under-review' as AdminDeskTab, label: 'In Appraisal', mobileLabel: 'Appraisal', icon: Clock, count: reviewLeads.length },
    { id: 'funded' as AdminDeskTab, label: 'Funded & Sanctioned', mobileLabel: 'Funded', icon: CheckCircle2, count: fundedLeads.length },
  ];

  const activeNav = navItems.find((i) => i.id === activeTab);

  return (
    <DashboardLayout
      portalName="Inisio"
      portalSubtitle="Executive Desk"
      portalIcon={ShieldAlert}
      roleLabel={isReadOnly ? 'Super Admin' : 'Executive Admin'}
      roleModeLabel={isReadOnly ? 'View-Only' : 'Full CRUD'}
      userName={currentUser?.name}
      userEmail={currentUser?.email}
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={(tab) => setActiveTab(tab as AdminDeskTab)}
      pageTitle={
        activeTab === 'overview'
          ? 'Admin Project & Lead Management'
          : activeNav?.label || 'Admin Control Desk'
      }
      pageBreadcrumb={activeTab !== 'overview' ? 'All Projects' : undefined}
      showBackButton={activeTab !== 'overview'}
      onGoBack={() => setActiveTab('overview')}
      onNavigateHome={onNavigateHome}
      onLogout={onLogout}
      sidebarAction={
        !isReadOnly ? (
          <button
            type="button"
            onClick={() => {
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="w-full min-h-[44px] lg:min-h-0 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>New Project</span>
          </button>
        ) : undefined
      }
      mobileStickyAction={
        !isReadOnly ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateError('');
                setShowCreateModal(true);
              }}
              className="flex-1 min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Project</span>
            </button>
            <button
              type="button"
              onClick={() => exportLeadsToCSV(leads)}
              disabled={leads.length === 0}
              className="min-h-[44px] px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Export CSV</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => exportLeadsToCSV(leads)}
            disabled={leads.length === 0}
            className="w-full min-h-[44px] px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Export CSV</span>
          </button>
        )
      }
      headerActions={
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => {
                setCreateError('');
                setShowCreateModal(true);
              }}
              className="hidden lg:flex px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          )}
          <button
            type="button"
            onClick={loadLeads}
            disabled={loading}
            aria-label="Refresh database records"
            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-[36px] px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => exportLeadsToCSV(leads)}
            disabled={leads.length === 0}
            className="hidden lg:flex px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      }
    >
      <DashboardSectionBanner
        eyebrow="Executive Control Desk"
        eyebrowIcon={ShieldAlert}
        badge={
          isReadOnly ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
              View-Only (Super Admin)
            </span>
          ) : undefined
        }
        title={activeNav?.label || 'Admin Project & Lead Management'}
        description="Real-time pipeline monitoring, project tracking, and institutional syndication dispatch from live database records."
        actions={
          <div className="hidden lg:flex items-center gap-2.5">
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  setCreateError('');
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            )}
            <button
              type="button"
              onClick={loadLeads}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => exportLeadsToCSV(leads)}
              disabled={leads.length === 0}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {loadError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={loadLeads}
            className="min-h-[44px] sm:min-h-0 px-3.5 py-2 sm:py-1.5 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardKpiCard
          label="Total Records"
          value={leads.length}
          subtext="Real database records"
          icon={FolderOpen}
          tone="blue"
          onClick={() => setActiveTab('overview')}
        />
        <DashboardKpiCard
          label="Total Project Pipeline"
          value={`₹ ${totalCostSum.toFixed(1)} Cr`}
          subtext="Aggregate Capex"
          icon={TrendingUp}
          tone="emerald"
        />
        <DashboardKpiCard
          label="Debt Demand"
          value={`₹ ${totalLoanSum.toFixed(1)} Cr`}
          subtext="Requested term debt"
          icon={Landmark}
          tone="indigo"
        />
        <DashboardKpiCard
          label="Underwriting Success"
          value={leads.length > 0 ? '100%' : '0%'}
          subtext="Pipeline clearance"
          icon={CheckCircle2}
          tone="emerald"
          onClick={() => setActiveTab('funded')}
        />
      </div>

      <DashboardCard>
        <DashboardCardHeader
          title={activeNav?.label || 'Projects & Leads Directory'}
          description={loading ? 'Fetching from database...' : `Showing ${filtered.length} of ${tabPool.length} records`}
          actions={
            <DashboardSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search promoter, email, sector, or project..."
              className="sm:w-72"
            />
          }
        />

        {/* Mobile Stacked Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <DashboardLoadingState label="Loading real records from database..." />
          ) : !loadError && filtered.length === 0 ? (
            <DashboardEmptyState
              icon={FolderOpen}
              title="No submissions found"
              description="There are currently no matching projects or leads in this view. New borrower assessments and consultation requests will appear here in real time."
            />
          ) : (
            filtered.map((l) => (
              <div key={l.id || l._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">
                      {l.projectName || 'Greenfield Project'}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">{l.fullName || 'N/A'}</div>
                    <div className="text-xs text-slate-500 mt-0.5 break-all">
                      {l.email || 'No email'} · {l.phone || l.mobile || 'N/A'}
                    </div>
                  </div>
                  <DashboardStatusBadge status={l.status || 'Active Lead'} />
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-500">Sector</div>
                    <div className="font-medium text-slate-800 truncate mt-0.5">{l.industry || 'General'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Cost (Cr)</div>
                    <div className="font-bold text-slate-900 tabular-nums mt-0.5">
                      ₹ {l.projectCost || l.totalCostCr || '0'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Loan (Cr)</div>
                    <div className="font-bold text-blue-700 tabular-nums mt-0.5">
                      ₹ {l.proposedLoan || l.loanRequiredCr || '0'}
                    </div>
                  </div>
                </div>

                <div className={`grid gap-2 ${isReadOnly ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  <button
                    type="button"
                    onClick={() => setDetailTarget(l)}
                    className="min-h-[44px] px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>View</span>
                  </button>
                  {!isReadOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditTarget(l)}
                        className="min-h-[44px] px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 shrink-0" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(l.id || l._id || '')}
                        className="min-h-[44px] px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={`hidden md:block ${DASHBOARD_TABLE.wrapper}`}>
          <table className={DASHBOARD_TABLE.table}>
            <thead className={DASHBOARD_TABLE.thead}>
              <tr>
                <th className={DASHBOARD_TABLE.th}>Promoter / Email</th>
                <th className={DASHBOARD_TABLE.th}>Phone</th>
                <th className={DASHBOARD_TABLE.th}>Project / Sector</th>
                <th className={DASHBOARD_TABLE.th}>Cost (Cr)</th>
                <th className={DASHBOARD_TABLE.th}>Loan (Cr)</th>
                <th className={DASHBOARD_TABLE.th}>Status</th>
                <th className={`${DASHBOARD_TABLE.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className={DASHBOARD_TABLE.tbody}>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <DashboardLoadingState label="Loading real records from database..." />
                  </td>
                </tr>
              ) : !loadError && filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <DashboardEmptyState
                      icon={FolderOpen}
                      title="No submissions found"
                      description="There are currently no matching projects or leads in this view. New borrower assessments and consultation requests will appear here in real time."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id || l._id} className={DASHBOARD_TABLE.tr}>
                    <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900`}>
                      {l.fullName || 'N/A'}
                      <div className="text-xs text-slate-500 font-normal mt-0.5">{l.email || 'No email'}</div>
                    </td>
                    <td className={`${DASHBOARD_TABLE.td} text-slate-700 tabular-nums whitespace-nowrap`}>
                      {l.phone || l.mobile || 'N/A'}
                    </td>
                    <td className={`${DASHBOARD_TABLE.td} text-slate-700`}>
                      <span className="font-semibold text-slate-900">{l.projectName || 'Greenfield Project'}</span>
                      <div className="text-xs text-slate-500 mt-0.5">{l.industry || 'General'}</div>
                    </td>
                    <td className={`${DASHBOARD_TABLE.td} font-bold text-slate-900 tabular-nums whitespace-nowrap`}>
                      ₹ {l.projectCost || l.totalCostCr || '0'}
                    </td>
                    <td className={`${DASHBOARD_TABLE.td} font-bold text-blue-700 tabular-nums whitespace-nowrap`}>
                      ₹ {l.proposedLoan || l.loanRequiredCr || '0'}
                    </td>
                    <td className={DASHBOARD_TABLE.td}>
                      <DashboardStatusBadge status={l.status || 'Active Lead'} />
                    </td>
                    <td className={`${DASHBOARD_TABLE.td} text-right`}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailTarget(l)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {!isReadOnly && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditTarget(l)}
                              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTargetId(l.id || l._id || '')}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      <UserProfileDetailModal
        lead={detailTarget}
        onClose={() => setDetailTarget(null)}
        readOnly={isReadOnly}
        onEdit={(lead) => {
          setDetailTarget(null);
          setEditTarget(lead);
        }}
        onDelete={(id) => setDeleteTargetId(id)}
      />

      <LeadEditModal
        lead={editTarget}
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        onSaved={loadLeads}
        readOnly={isReadOnly}
      />

      {showCreateModal && !isReadOnly && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-xs font-inter">
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90dvh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              aria-label="Close create project modal"
              className="absolute top-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 font-manrope pr-10">Create Project Record</h2>
              {createError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {createError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={newProject.projectName}
                    onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    placeholder="e.g. Solar Park Alpha"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Promoter Name *</label>
                  <input
                    type="text"
                    required
                    value={newProject.promoterName}
                    onChange={(e) => setNewProject({ ...newProject, promoterName: e.target.value })}
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Industry *</label>
                  <input
                    type="text"
                    required
                    value={newProject.industry}
                    onChange={(e) => setNewProject({ ...newProject, industry: e.target.value })}
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Location</label>
                  <input
                    type="text"
                    value={newProject.location}
                    onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Email</label>
                  <input
                    type="email"
                    value={newProject.email}
                    onChange={(e) => setNewProject({ ...newProject, email: e.target.value })}
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Mobile</label>
                  <input
                    type="text"
                    value={newProject.mobile}
                    onChange={(e) => setNewProject({ ...newProject, mobile: e.target.value })}
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Capex (₹ Cr) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newProject.capexCr}
                    onChange={(e) => setNewProject({ ...newProject, capexCr: e.target.value })}
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Loan (₹ Cr) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newProject.loanCr}
                    onChange={(e) => setNewProject({ ...newProject, loanCr: e.target.value })}
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white tabular-nums"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full min-h-[44px] py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Project</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        title="Delete Record"
        description="Are you sure you want to delete this record from the database? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText="Delete Record"
        isDestructive={true}
      />
    </DashboardLayout>
  );
};

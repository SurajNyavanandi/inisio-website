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
  ArrowRight,
  Sparkles,
  FileText,
  RefreshCw,
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
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<UserTab>('overview');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUserProjects = async () => {
    setLoading(true);
    try {
      const allLeads = await fetchLeadsFromDatabase({ email: user?.email });
      const userLeads = allLeads.filter((l) => {
        if (!user?.email) return true;
        return (l.email || '').toLowerCase() === user.email.toLowerCase();
      });
      setLeads(userLeads);
    } catch (err) {
      console.warn('Error loading user projects:', err);
      const local = getStoredLeads().filter(
        (l) => !l.email || (user?.email && l.email.toLowerCase() === user.email.toLowerCase())
      );
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

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.userTab) {
        setActiveTab(e.state.userTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const totalCostSum = leads.reduce((acc, curr) => acc + (Number(curr.projectCost || curr.totalCostCr) || 0), 0);
  const totalLoanSum = leads.reduce((acc, curr) => acc + (Number(curr.proposedLoan || curr.loanRequiredCr) || 0), 0);
  const avgFeasibility =
    leads.length > 0
      ? Math.round(leads.reduce((acc, curr) => acc + (Number(curr.feasibilityScore) || 0), 0) / leads.length)
      : null;

  const filteredLeads = leads.filter(
    (l) =>
      (l.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.industry || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: 'overview' as UserTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'projects' as UserTab, label: 'My Projects', icon: FolderOpen, count: leads.length },
    { id: 'appraisal' as UserTab, label: 'New Appraisal', icon: Calculator },
    { id: 'consultations' as UserTab, label: 'CA Advisory', icon: Calendar },
    { id: 'membership' as UserTab, label: 'Membership Plan', icon: Crown },
  ];

  const handleSelectTab = (tab: string) => {
    const nextTab = tab as UserTab;
    setActiveTab(nextTab);
    try {
      window.history.pushState({ userTab: nextTab }, '', window.location.href);
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

  const activeNav = navItems.find((i) => i.id === activeTab);

  return (
    <DashboardLayout
      portalName="Inisio"
      portalSubtitle="Promoter Portal"
      portalIcon={ShieldCheck}
      roleLabel="Promoter Desk"
      userName={user?.company || user?.name}
      userEmail={user?.email}
      navItems={navItems}
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      pageTitle={activeTab === 'overview' ? 'Promoter Overview' : activeNav?.label || 'Promoter Portal'}
      pageBreadcrumb={activeTab !== 'overview' ? 'Overview' : undefined}
      showBackButton={activeTab !== 'overview'}
      onGoBack={handleGoBack}
      onNavigateHome={onNavigateHome}
      onLogout={onLogout}
      sidebarAction={
        <button
          type="button"
          onClick={() => onOpenAssessment()}
          className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Appraise Project</span>
        </button>
      }
      headerActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUserProjects}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAssessment()}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Appraisal</span>
          </button>
        </div>
      }
    >
      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <DashboardSectionBanner
            eyebrow="Executive Promoter Overview"
            eyebrowIcon={ShieldCheck}
            title={`Welcome, ${user?.name || user?.email?.split('@')[0] || 'Promoter'}`}
            description={`${user?.company ? `${user.company} · ` : ''}Real-time monitoring of your greenfield debt syndication pipeline.`}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => onOpenAssessment()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project Appraisal</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book CA Advisory</span>
                </button>
              </>
            }
          />

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardKpiCard
              label="Active Projects"
              value={leads.length}
              subtext={leads.length > 0 ? 'Under active appraisal' : 'No projects registered'}
              icon={Building}
              tone="emerald"
              onClick={() => handleSelectTab('projects')}
            />
            <DashboardKpiCard
              label="Estimated Outlay"
              value={`₹ ${totalCostSum.toFixed(1)} Cr`}
              subtext="Total Project Capex"
              icon={TrendingUp}
              tone="blue"
            />
            <DashboardKpiCard
              label="Bank Feasibility Score"
              value={avgFeasibility !== null ? `${avgFeasibility} / 100` : '—'}
              subtext={
                avgFeasibility !== null
                  ? avgFeasibility >= 80
                    ? 'Grade A (High Bankability)'
                    : 'Grade B'
                  : 'Awaiting first assessment'
              }
              icon={CheckCircle2}
              tone="emerald"
            />
            <DashboardKpiCard
              label="Target Term Loan"
              value={`₹ ${totalLoanSum.toFixed(1)} Cr`}
              subtext={leads.length > 0 ? 'Syndication debt request' : 'Zero debt demand'}
              icon={Landmark}
              tone="slate"
            />
          </div>

          {/* Recent Projects Preview */}
          <DashboardCard>
            <DashboardCardHeader
              title="Recent Projects"
              description="Fast access to your active appraisal files."
              actions={
                <button
                  type="button"
                  onClick={() => handleSelectTab('projects')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>View All ({leads.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            {loading && leads.length === 0 ? (
              <DashboardLoadingState label="Loading projects from database..." />
            ) : leads.length === 0 ? (
              <DashboardEmptyState
                icon={FolderOpen}
                title="No greenfield projects initiated yet"
                description='Click "New Project Appraisal" to calculate DSCR and generate your project file.'
                action={
                  <button
                    type="button"
                    onClick={() => onOpenAssessment()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Start First Project Appraisal
                  </button>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {leads.slice(0, 4).map((lead) => (
                  <div
                    key={lead.id || lead._id}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm truncate">
                        {lead.projectName || 'Greenfield Project'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        {lead.industry || 'Manufacturing'}
                        {lead.location ? ` · ${lead.location}` : ''} · Outlay: ₹{' '}
                        {Number(lead.projectCost || lead.totalCostCr || 0).toFixed(2)} Cr
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <DashboardStatusBadge status={lead.status || 'Underwriting Review'} icon={Clock} />
                      <button
                        type="button"
                        onClick={() => onOpenAssessment(lead)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        View / Resume
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        </div>
      )}

      {/* 2. My Projects Tab */}
      {activeTab === 'projects' && (
        <DashboardCard>
          <DashboardCardHeader
            title="My Greenfield Projects"
            description="Live appraisal tracking, DSCR evaluation, and credit readiness."
            actions={
              <>
                <DashboardSearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search projects..."
                />
                <button
                  type="button"
                  onClick={() => onOpenAssessment()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </button>
              </>
            }
          />

          <div className={DASHBOARD_TABLE.wrapper}>
            <table className={DASHBOARD_TABLE.table}>
              <thead className={DASHBOARD_TABLE.thead}>
                <tr>
                  <th className={DASHBOARD_TABLE.th}>Project Name &amp; Sector</th>
                  <th className={DASHBOARD_TABLE.th}>Cost / Outlay</th>
                  <th className={DASHBOARD_TABLE.th}>Term Loan</th>
                  <th className={DASHBOARD_TABLE.th}>Underwriting Stage</th>
                  <th className={`${DASHBOARD_TABLE.th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className={DASHBOARD_TABLE.tbody}>
                {loading ? (
                  <tr>
                    <td colSpan={5}>
                      <DashboardLoadingState label="Loading projects from database..." />
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <DashboardEmptyState
                        icon={FolderOpen}
                        title="No projects found"
                        description={
                          searchTerm
                            ? 'No projects match your search query.'
                            : 'You have not initiated any project assessments yet.'
                        }
                        action={
                          <button
                            type="button"
                            onClick={() => onOpenAssessment()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Start First Project Appraisal
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id || lead._id} className={DASHBOARD_TABLE.tr}>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900`}>
                        {lead.projectName || 'Greenfield Project'}
                        <div className="text-xs text-slate-500 font-normal mt-0.5">
                          {lead.industry || 'Manufacturing'}
                          {lead.location ? ` · ${lead.location}` : ''}
                        </div>
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-800 tabular-nums whitespace-nowrap`}>
                        ₹ {Number(lead.projectCost || lead.totalCostCr || 0).toFixed(2)} Cr
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} font-semibold text-blue-700 tabular-nums whitespace-nowrap`}>
                        ₹ {Number(lead.proposedLoan || lead.loanRequiredCr || 0).toFixed(2)} Cr
                      </td>
                      <td className={DASHBOARD_TABLE.td}>
                        <DashboardStatusBadge status={lead.status || 'Underwriting Review'} icon={Clock} />
                      </td>
                      <td className={`${DASHBOARD_TABLE.td} text-right`}>
                        <button
                          type="button"
                          onClick={() => onOpenAssessment(lead)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          View / Resume
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {/* 3. New Appraisal Tab */}
      {activeTab === 'appraisal' && (
        <div className="space-y-6">
          <DashboardSectionBanner
            eyebrow="Credit Feasibility Engine"
            eyebrowIcon={Calculator}
            title="Initiate Greenfield Project Appraisal"
            description="Evaluate debt service coverage ratio (DSCR), loan eligibility, promoter equity structuring, and generate lender-ready teasers."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-6 rounded-xl border border-blue-200 bg-white space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-manrope">
                  Comprehensive Underwriting Appraisal
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Detailed 5-stage feasibility assessment including capex breakdown, means of finance, promoter KYC, and comprehensive banker scorecard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenAssessment()}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>Launch Comprehensive Appraisal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-manrope">
                  Instant Feasibility Scorecard
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Quickly test high-level sector benchmarks, benchmark DSCR ratios, and debt syndication viability across 30+ industrial sectors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenAssessment()}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>Open Quick Calculator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CA Advisory Tab */}
      {activeTab === 'consultations' && (
        <div className="space-y-6">
          <DashboardSectionBanner
            eyebrow="Empaneled CA & Debt Syndication Advisory"
            eyebrowIcon={Calendar}
            title="Chartered Accountant Advisory Desk"
            description="Schedule direct one-on-one consultation with senior credit appraisers and chartered accountants to review your CMA data and debt structure."
            actions={
              <button
                type="button"
                onClick={onOpenConsultation}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule 1-on-1 CA Session</span>
              </button>
            }
          />

          <DashboardCard className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-manrope">What We Cover During Advisory</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>CMA Data preparation and audited ratio sign-off</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Term loan structuring and repayment tenure optimization</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Collateral security and promoter guarantee structuring</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Commercial bank credit committee query resolution</span>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}

      {/* 5. Membership Plan Tab */}
      {activeTab === 'membership' && (
        <div className="space-y-6">
          <DashboardSectionBanner
            eyebrow="Bankability & Syndication Membership"
            eyebrowIcon={Crown}
            title="Promoter Membership & Advisory Tiers"
            description="Unlock priority debt syndication, unlimited financial model evaluations, and direct lender consortium representation."
          />

          <div className="p-6 rounded-xl border border-blue-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-blue-700">Active Tier</span>
              <h3 className="text-lg font-extrabold text-slate-900 font-manrope">
                {user?.membershipPlan || 'Inisio Greenfield Starter'}
              </h3>
              <p className="text-xs text-slate-600">
                Full access to credit appraisal scorecards and automated bank teaser exports.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenMembership}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              Explore All Membership Plans
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

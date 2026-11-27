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
  FileCheck,
  Eye,
  RefreshCw,
  MapPin,
  Users,
  PhoneCall,
  AlertCircle,
  Receipt,
  Star,
} from 'lucide-react';
import { fetchLeadsFromDatabase, getStoredLeads, LeadRecord } from '../utils/leadStore';
import {
  fetchServerAssessmentQuota,
  AssessmentQuotaStatus,
  OFFICIAL_DISCLAIMERS,
} from '../utils/membershipStore';
import { api } from '../utils/apiClient';
import { NearbyConsultantModal, DirectoryConsultant } from './NearbyConsultantModal';
import { PdfPreviewModal, PdfPreviewState } from './PdfPreviewModal';
import { useToast } from './ui/Toast';
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
  onOpenMembership: (reason?: string, planId?: 'promoter_boost' | 'promoter_plus') => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  onLogout?: () => void;
  onNavigateHome?: () => void;
}

type UserTab = 'overview' | 'projects' | 'appraisal' | 'consultations' | 'membership';

const CONSULTANT_SERVICES = [
  'All',
  'CMA & Financial Analysis',
  'DPR Preparation',
  'TEV Studies',
  'Debt Syndication',
];

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  onOpenAssessment,
  onOpenMembership,
  onOpenAuth,
  onLogout,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<UserTab>('overview');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfPreview, setPdfPreview] = useState<PdfPreviewState | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<AssessmentQuotaStatus | null>(null);
  const [consultants, setConsultants] = useState<DirectoryConsultant[]>([]);
  const [prosyncPartner, setProsyncPartner] = useState<DirectoryConsultant | null>(null);
  const [areaAvailableCount, setAreaAvailableCount] = useState<number>(0);
  const [consultantsLoading, setConsultantsLoading] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [introductions, setIntroductions] = useState<any[]>([]);
  const [introductionsLoading, setIntroductionsLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [nearbyModalOpen, setNearbyModalOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<DirectoryConsultant | null>(null);
  const { toast: showToast } = useToast();

  const handleStartNewAssessment = () => {
    if (quotaStatus && !quotaStatus.allowed && !quotaStatus.hasPaidMembership) {
      showToast(
        'Your 1 free project assessment is already used. You can edit or re-download your existing project anytime, or upgrade to assess another project.',
        { type: 'info', title: 'Free Assessment Limit Reached' }
      );
      onOpenMembership('Your plan assessment limit has been reached. Upgrade to assess additional projects.', 'promoter_plus');
      return;
    }
    onOpenAssessment();
  };

  const handleDownloadProjectChecklist = async (lead: LeadRecord) => {
    try {
      const { mapLeadRecordToPdfData, generateProjectChecklistPDF } = await import('../utils/pdfGenerator');
      const payload = mapLeadRecordToPdfData(lead);
      const res = generateProjectChecklistPDF(payload);
      showToast(`Downloaded ${res.filename}`, { type: 'success' });
    } catch (err) {
      console.error('Failed to generate Checklist PDF:', err);
      showToast('Could not generate Project Checklist PDF. Please try again.', { type: 'error' });
    }
  };

  const handleDownloadProjectDocx = async (lead: LeadRecord) => {
    try {
      const [{ mapLeadRecordToPdfData }, { generateProjectTeaserDOCX }] = await Promise.all([
        import('../utils/pdfGenerator'),
        import('../utils/docxGenerator'),
      ]);
      const payload = mapLeadRecordToPdfData(lead);
      const filename = await generateProjectTeaserDOCX(payload);
      showToast(`Downloaded ${filename}`, { type: 'success' });
    } catch (err) {
      console.error('Failed to generate Teaser DOCX:', err);
      showToast('Could not download Project Teaser DOCX. Please try again.', { type: 'error' });
    }
  };

  const handleOpenProjectPdf = async (
    lead: LeadRecord,
    type: 'teaser' | 'dpr',
    action: 'preview' | 'download' = 'preview'
  ) => {
    try {
      const {
        mapLeadRecordToPdfData,
        generateProjectTeaserPDF,
        generateDprExecutiveSummaryPDF,
      } = await import('../utils/pdfGenerator');
      const payload = mapLeadRecordToPdfData(lead);
      const res =
        type === 'teaser'
          ? generateProjectTeaserPDF(payload, action)
          : generateDprExecutiveSummaryPDF(payload, action);
      if (action === 'preview' && res) {
        setPdfPreview({
          blobUrl: res.blobUrl,
          filename: res.filename,
          title:
            type === 'teaser'
              ? `${res.resolved.projectName} - Project Teaser`
              : `${res.resolved.projectName} - Detailed Project Report (DPR)`,
          subtitle: `${res.resolved.sector} · ${res.resolved.location}`,
          resolved: res.resolved,
          documentType: type,
          onDownloadDocx: type === 'teaser' ? () => handleDownloadProjectDocx(lead) : undefined,
        });
      } else if (res) {
        showToast(`Downloaded ${res.filename}`, { type: 'success' });
      }
    } catch (err) {
      console.error('Failed to generate project PDF:', err);
      showToast('Could not generate the document. Please try again.', { type: 'error' });
    }
  };

  const loadUserProjects = async () => {
    setLoading(true);
    try {
      const allLeads = await fetchLeadsFromDatabase({ email: user?.email });
      const userLeads = allLeads.filter((l) => {
        if (!user?.email) return true;
        return (l.email || '').toLowerCase() === user.email.toLowerCase();
      });
      setLeads(userLeads);
      const serverQuota = await fetchServerAssessmentQuota({
        user,
        email: user?.email,
        mobile: user?.phone,
        localCompletedCount: userLeads.filter((l) => l.assessmentCompleted || l.downloadedPDF).length,
      });
      setQuotaStatus(serverQuota);
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

  const loadConsultantDirectory = async () => {
    setConsultantsLoading(true);
    try {
      const res = await api.consultants.getDirectory({
        service: serviceFilter !== 'All' ? serviceFilter : undefined,
        city: cityFilter.trim() || undefined,
        state: stateFilter.trim() || undefined,
        sector: sectorFilter.trim() || undefined,
        projectLocation: leads[0]?.location || undefined,
        includeProsync: true,
      });
      const payload = (res as any)?.data || res;
      if (payload) {
        setConsultants(Array.isArray(payload.consultants) ? payload.consultants : []);
        setProsyncPartner(payload.featuredPartner || payload.prosyncPartner || null);
        setAreaAvailableCount(Number(payload.areaAvailableCount || 0));
      }
    } catch (err) {
      console.warn('Error loading consultant directory:', err);
    } finally {
      setConsultantsLoading(false);
    }
  };

  const loadIntroductionsAndPayments = async () => {
    if (!user?.token) return;
    setIntroductionsLoading(true);
    try {
      const [introRes, payRes] = await Promise.all([
        api.consultations.getIntroductions().catch(() => null),
        api.payments.getHistory().catch(() => null),
      ]);
      const introList = Array.isArray(introRes) ? introRes : (introRes as any)?.data;
      if (Array.isArray(introList)) {
        setIntroductions(introList);
      }
      const payList = Array.isArray(payRes) ? payRes : (payRes as any)?.data;
      if (Array.isArray(payList)) {
        setPaymentHistory(payList);
      }
    } finally {
      setIntroductionsLoading(false);
    }
  };

  useEffect(() => {
    loadUserProjects();
    loadIntroductionsAndPayments();
    const handleUpdate = () => {
      loadUserProjects();
      loadIntroductionsAndPayments();
    };
    window.addEventListener('inisio_lead_added', handleUpdate);
    return () => window.removeEventListener('inisio_lead_added', handleUpdate);
  }, [user]);

  useEffect(() => {
    if (activeTab === 'consultations') {
      loadConsultantDirectory();
    }
  }, [activeTab, serviceFilter, cityFilter, stateFilter, sectorFilter]);

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
    { id: 'overview' as UserTab, label: 'Overview', mobileLabel: 'Overview', icon: LayoutDashboard },
    { id: 'projects' as UserTab, label: 'My Projects', mobileLabel: 'Projects', icon: FolderOpen, count: leads.length },
    { id: 'appraisal' as UserTab, label: 'New Appraisal', mobileLabel: 'Appraisal', icon: Calculator },
    { id: 'consultations' as UserTab, label: 'Find a CA / Consultant', mobileLabel: 'Consultants', icon: Users },
    { id: 'membership' as UserTab, label: 'My Membership', mobileLabel: 'Membership', icon: Crown },
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
          onClick={handleStartNewAssessment}
          className="w-full min-h-[44px] lg:min-h-0 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>{quotaStatus && !quotaStatus.allowed ? 'Upgrade for New Project' : 'Appraise Project'}</span>
        </button>
      }
      mobileStickyAction={
        activeTab === 'consultations' ? (
          <button
            type="button"
            onClick={() => {
              setSelectedConsultant(null);
              setNearbyModalOpen(true);
            }}
            className="w-full min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Find a Consultant</span>
          </button>
        ) : activeTab === 'membership' ? (
          <button
            type="button"
            onClick={() => onOpenMembership('', 'promoter_plus')}
            className="w-full min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Crown className="w-4 h-4 shrink-0" />
            <span>Upgrade / Renew Plan</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartNewAssessment}
              className="flex-1 min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{quotaStatus && !quotaStatus.allowed ? 'Upgrade Plan' : 'New Project Appraisal'}</span>
            </button>
            {activeTab === 'overview' && (
              <button
                type="button"
                onClick={() => setActiveTab('consultations')}
                className="min-h-[44px] px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Find a Consultant</span>
              </button>
            )}
          </div>
        )
      }
      headerActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUserProjects}
            disabled={loading}
            aria-label="Refresh projects"
            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-[36px] px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleStartNewAssessment}
            className="hidden lg:flex px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{quotaStatus && !quotaStatus.allowed ? 'Upgrade Plan' : 'New Appraisal'}</span>
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
              <div className="hidden lg:flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleStartNewAssessment}
                  className="min-h-[44px] sm:min-h-[38px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{quotaStatus && !quotaStatus.allowed ? 'Upgrade for More Projects' : 'New Project Appraisal'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('consultations')}
                  className="min-h-[44px] sm:min-h-[38px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Find a Consultant</span>
                </button>
              </div>
            }
          />

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                  className="min-h-[44px] sm:min-h-0 px-2 sm:px-0 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
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
                    className="min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
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
                    className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">
                          {lead.projectName || 'Greenfield Project'}
                        </h4>
                        <div className="sm:hidden shrink-0">
                          <DashboardStatusBadge status={lead.status || 'Underwriting Review'} icon={Clock} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {lead.industry || 'Manufacturing'}
                        {lead.location ? ` · ${lead.location}` : ''} · Outlay: ₹{' '}
                        {Number(lead.projectCost || lead.totalCostCr || 0).toFixed(2)} Cr
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                      <div className="hidden sm:block">
                        <DashboardStatusBadge status={lead.status || 'Underwriting Review'} icon={Clock} />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenProjectPdf(lead, 'teaser')}
                        title="Preview Project Teaser PDF"
                        className="min-h-[44px] sm:min-h-[34px] px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>Teaser PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenProjectPdf(lead, 'dpr')}
                        title="Preview DPR Executive Summary PDF"
                        className="min-h-[44px] sm:min-h-[34px] px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                      >
                        <FileCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>DPR PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadProjectChecklist(lead)}
                        title="Download Project Document Checklist PDF"
                        className="min-h-[44px] sm:min-h-[34px] px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Checklist</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAssessment(lead)}
                        className="min-h-[44px] sm:min-h-[34px] px-3 py-2 sm:py-1.5 text-xs font-semibold text-blue-600 bg-blue-50/70 sm:bg-transparent hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap"
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
                  onClick={handleStartNewAssessment}
                  className="hidden lg:flex px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer items-center gap-1.5 shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{quotaStatus && !quotaStatus.allowed ? 'Upgrade Plan' : 'New Project'}</span>
                </button>
              </>
            }
          />

          {/* Mobile Stacked Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <DashboardLoadingState label="Loading projects from database..." />
            ) : filteredLeads.length === 0 ? (
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
                    className="min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Start First Project Appraisal
                  </button>
                }
              />
            ) : (
              filteredLeads.map((lead) => (
                <div key={lead.id || lead._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-sm leading-snug">
                        {lead.projectName || 'Greenfield Project'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {lead.industry || 'Manufacturing'}
                        {lead.location ? ` · ${lead.location}` : ''}
                      </div>
                    </div>
                    <DashboardStatusBadge status={lead.status || 'Underwriting Review'} icon={Clock} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                    <div>
                      <div className="text-[11px] text-slate-500">Cost / Outlay</div>
                      <div className="font-semibold text-slate-900 tabular-nums mt-0.5">
                        ₹ {Number(lead.projectCost || lead.totalCostCr || 0).toFixed(2)} Cr
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">Term Loan</div>
                      <div className="font-semibold text-blue-700 tabular-nums mt-0.5">
                        ₹ {Number(lead.proposedLoan || lead.loanRequiredCr || 0).toFixed(2)} Cr
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenProjectPdf(lead, 'teaser')}
                      className="min-h-[44px] px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>Teaser</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenProjectPdf(lead, 'dpr')}
                      className="min-h-[44px] px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <FileCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>DPR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadProjectChecklist(lead)}
                      className="min-h-[44px] px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>Checklist</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenAssessment(lead)}
                      className="min-h-[44px] px-2.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap"
                    >
                      Resume
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className={`hidden md:block ${DASHBOARD_TABLE.wrapper}`}>
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
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenProjectPdf(lead, 'teaser')}
                            title="Preview Project Teaser PDF"
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Teaser</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenProjectPdf(lead, 'dpr')}
                            title="Preview DPR Executive Summary PDF"
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>DPR</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadProjectChecklist(lead)}
                            title="Download Project Document Checklist PDF"
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Checklist</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenAssessment(lead)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Resume
                          </button>
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
                onClick={handleStartNewAssessment}
                className="w-full min-h-[44px] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>{quotaStatus && !quotaStatus.allowed ? 'Upgrade Plan to Start New Appraisal' : 'Launch Comprehensive Appraisal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 rounded-xl border border-slate-200 bg-white space-y-4 flex flex-col justify-between">
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
                onClick={handleStartNewAssessment}
                className="w-full min-h-[44px] py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>{quotaStatus && !quotaStatus.allowed ? 'Upgrade Membership Plan' : 'Open Quick Calculator'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Find a CA / Consultant Tab */}
      {activeTab === 'consultations' && (
        <div className="space-y-6">
          <DashboardSectionBanner
            eyebrow="Independent Professionals & Advisory Network"
            eyebrowIcon={Users}
            title="Find a CA / Consultant"
            description="Connect with independent CAs and specialised consultants for project finance services."
            actions={
              <button
                type="button"
                onClick={() => {
                  setSelectedConsultant(null);
                  setNearbyModalOpen(true);
                }}
                className="hidden lg:inline-flex min-h-[40px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer items-center gap-2 whitespace-nowrap"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Find a Consultant</span>
              </button>
            }
          />

          {/* Contextual Membership Upgrade Banner when on Free Plan or Exhausted */}
          {(!quotaStatus?.hasPaidMembership || ((quotaStatus?.consultantRemaining ?? 0) <= 0 && (quotaStatus?.prosyncRemaining ?? 0) <= 0)) && (
            <div className="p-4 sm:p-5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-amber-950">
                    {!quotaStatus?.hasPaidMembership
                      ? 'Consultant Introductions Require Promoter Boost or Promoter Plus'
                      : 'All Plan Consultant Introductions Utilised'}
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    {!quotaStatus?.hasPaidMembership
                      ? 'Upgrade to Promoter Boost (₹2,999 + GST · 2 consultant introductions + 1 Prosync consultation request) or Promoter Plus (₹9,999 + GST · up to 6 introductions including Prosync priority).'
                      : 'You have used your included consultant introductions for this validity window. Renew or upgrade your plan to unlock more introductions.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOpenMembership(
                    'Upgrade your membership to unlock consultant introductions and Prosync advisory requests.',
                    !quotaStatus?.hasPaidMembership ? 'promoter_boost' : 'promoter_plus'
                  )
                }
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer whitespace-nowrap"
              >
                Upgrade Plan
              </button>
            </div>
          )}

          {/* Service Category Filters + Location/Sector Search */}
          <DashboardCard className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {CONSULTANT_SERVICES.map((svc) => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => setServiceFilter(svc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    serviceFilter === svc
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {svc}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Filter by City (e.g. Hyderabad, Mumbai)"
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                placeholder="Filter by State (e.g. Telangana)"
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                placeholder="Filter by Sector Experience"
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Showing {areaAvailableCount || consultants.length} independent professional{((areaAvailableCount || consultants.length) === 1 ? '' : 's')} matching your filters.
            </div>
          </DashboardCard>

          {/* Featured Advisor - Prosync Consulting */}
          {prosyncPartner && (
            <div className="p-5 sm:p-6 rounded-xl bg-slate-900 text-white border border-blue-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold">
                    <Star className="w-3 h-3 text-amber-400" />
                    <span>Featured Advisory Partner (Separate Terms Apply)</span>
                  </div>
                  <h3 className="text-lg font-extrabold font-manrope text-white">{prosyncPartner.firm || prosyncPartner.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    {prosyncPartner.specialization} · Location: {prosyncPartner.city}, {prosyncPartner.state}. Access via membership represents an introduction/consultation request subject to project suitability and availability.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedConsultant(prosyncPartner);
                    setNearbyModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 whitespace-nowrap inline-flex items-center gap-1.5"
                >
                  <span>Request Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(prosyncPartner.servicesOffered || []).map((svc, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded-md text-[11px] font-medium border border-slate-700">
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Onboarded Independent Consultants Grid */}
          <DashboardCard className="p-4 sm:p-6 space-y-4">
            <DashboardCardHeader
              title="Independent CA & Specialist Directory"
              description="Professionals listed here operate independently and agree fees & scope directly with promoters."
            />
            {consultantsLoading ? (
              <DashboardLoadingState label="Loading consultant directory..." />
            ) : consultants.length === 0 ? (
              <DashboardEmptyState
                icon={Users}
                title="No consultants matched your current filters"
                description="Try clearing city/state/sector filters or request assistance via our consultation team so an appropriate professional can be identified."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setServiceFilter('All');
                      setCityFilter('');
                      setStateFilter('');
                      setSectorFilter('');
                    }}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Clear Filters
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consultants.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 font-manrope">{c.name}</h4>
                          <p className="text-xs font-medium text-slate-600">{c.firm}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          {c.city}, {c.state}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{c.specialization}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(c.servicesOffered || []).slice(0, 4).map((svc, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                            {svc}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {c.feeNote || 'Professional fees and engagement scope agreed independently with the consultant.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedConsultant(c);
                        setNearbyModalOpen(true);
                      }}
                      className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Request Consultation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Introduction Request Tracker */}
          <DashboardCard className="p-4 sm:p-6 space-y-4">
            <DashboardCardHeader
              title="Consultation & Introduction Requests"
              description="Track introductions from Submitted through Discussion and Engagement."
            />
            {introductionsLoading ? (
              <DashboardLoadingState label="Loading introduction requests..." />
            ) : introductions.length === 0 ? (
              <p className="text-xs text-slate-500">
                No consultant introduction requests submitted yet. Select a consultant above or click "Find a Consultant" to initiate an introduction.
              </p>
            ) : (
              <div className="space-y-3">
                {introductions.map((item) => (
                  <div key={item._id || item.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{item.consultantName || 'Consultant'}</span>
                        {item.isProsyncPartner && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">Prosync Partner</span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">{item.serviceRequired}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Project: {item.projectName || 'General Advisory'} · Requested on {new Date(item.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <DashboardStatusBadge status={item.status || 'Submitted'} icon={Clock} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Important Disclaimer */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600 leading-relaxed">
            <div className="font-bold text-slate-900">Important Disclaimer</div>
            <p>
              Inisio facilitates introductions between project promoters and independent professionals such as Chartered Accountants, DPR consultants, TEV specialists and financial advisors. These professionals operate independently and are solely responsible for their services, advice, deliverables, timelines and fees.
            </p>
            <p>
              Any professional fee, engagement terms or scope of work must be agreed directly between the promoter and the consultant.
            </p>
            <p>
              Prosync Consulting is featured on Inisio as an Advisory Partner. Requests for consultation with Prosync are subject to project suitability and availability.
            </p>
            <p>
              Neither Inisio nor any listed professional guarantees loan sanction, subsidy approval, institutional finance or funding outcomes.
            </p>
          </div>
        </div>
      )}

      {/* 5. My Membership Tab */}
      {activeTab === 'membership' && (
        <div className="space-y-6">
          <DashboardSectionBanner
            eyebrow="Promoter Plan & Validity"
            eyebrowIcon={Crown}
            title="My Membership"
            description="Review your current membership tier, validity window, remaining assessment & introduction allocations, and tax invoices."
            actions={
              <div className="hidden lg:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenMembership('', quotaStatus?.activePlanId === 'promoter_boost' ? 'promoter_plus' : 'promoter_boost')}
                  className="min-h-[40px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Upgrade Plan
                </button>
                {quotaStatus?.hasPaidMembership && (
                  <button
                    type="button"
                    onClick={() => onOpenMembership('', quotaStatus.activePlanId === 'promoter_plus' ? 'promoter_plus' : 'promoter_boost')}
                    className="min-h-[40px] px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Renew Plan
                  </button>
                )}
              </div>
            }
          />

          {quotaStatus?.isExpiringSoon && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Membership Expiring Soon: </span>
                Your paid membership expires in {quotaStatus.daysRemaining} day{quotaStatus.daysRemaining === 1 ? '' : 's'}. No automatic renewal applies; renew manually when ready.
              </div>
            </div>
          )}

          <DashboardCard className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-semibold text-slate-500">Current Membership Plan</div>
                <h3 className="text-lg font-extrabold text-slate-900 font-manrope mt-0.5">
                  {quotaStatus?.membershipTier || user?.membershipTier || 'Free – Project Assessment'}
                </h3>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                  quotaStatus?.statusLabel === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : quotaStatus?.statusLabel === 'Expiring Soon'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : quotaStatus?.statusLabel === 'Expired'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {quotaStatus?.statusLabel || 'Free Plan'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">Activation Date</div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {quotaStatus?.activatedAt ? new Date(quotaStatus.activatedAt).toLocaleDateString('en-IN') : '—'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">Expiry Date (No Auto-Renewal)</div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {quotaStatus?.expiresAt ? new Date(quotaStatus.expiresAt).toLocaleDateString('en-IN') : '—'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">Project Assessments</div>
                <div className="text-sm font-bold text-slate-900 mt-1 tabular-nums">
                  {quotaStatus?.usedCount ?? leads.length} used · {quotaStatus?.unlimited ? 'Unlimited' : `${quotaStatus?.remainingCount ?? Math.max(0, (quotaStatus?.limit ?? 1) - (quotaStatus?.usedCount ?? leads.length))} remaining`}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">Consultant Introductions</div>
                <div className="text-sm font-bold text-slate-900 mt-1 tabular-nums">
                  {quotaStatus?.consultantUsed ?? 0} of {quotaStatus?.consultantLimit ?? 0} used · {quotaStatus?.consultantRemaining ?? 0} remaining
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <div className="text-[11px] font-semibold text-slate-500">Featured Partner – Prosync Introduction Status</div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {quotaStatus?.prosyncStatus || ((quotaStatus?.prosyncLimit ?? 0) > 0 ? `${quotaStatus?.prosyncUsed ?? 0} of ${quotaStatus?.prosyncLimit ?? 0} used` : 'Not included in Free Plan')}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenMembership('', 'promoter_boost')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Upgrade Plan
              </button>
              <button
                type="button"
                onClick={() => onOpenMembership('', 'promoter_plus')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Renew / View Plan Benefits
              </button>
            </div>
          </DashboardCard>

          {paymentHistory.length > 0 && (
            <DashboardCard className="p-5 sm:p-6 space-y-3">
              <DashboardCardHeader title="Payment & GST Invoices" description="Verified membership payment records" />
              <div className="space-y-2.5">
                {paymentHistory.map((p) => (
                  <div key={p._id || p.orderId} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{p.planName}</div>
                        <div className="text-[11px] text-slate-500">
                          Base ₹{p.baseAmount || p.amount} + GST ₹{p.gstAmount || 0} = ₹{p.amount} INR · {new Date(p.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600 leading-relaxed">
            <div className="font-bold text-slate-900">{OFFICIAL_DISCLAIMERS.membership.title}</div>
            {OFFICIAL_DISCLAIMERS.membership.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </div>
      )}

      <NearbyConsultantModal
        isOpen={nearbyModalOpen}
        onClose={() => {
          setNearbyModalOpen(false);
          setSelectedConsultant(null);
        }}
        currentUser={user}
        project={
          leads[0]
            ? {
                id: leads[0].id || leads[0]._id,
                projectName: leads[0].projectName,
                location: leads[0].location,
                industry: leads[0].industry,
                totalCostCr: leads[0].totalCostCr || leads[0].projectCost,
              }
            : undefined
        }
        initialConsultant={selectedConsultant}
        initialService={serviceFilter !== 'All' ? serviceFilter : 'CMA & Financial Analysis'}
        onOpenAuth={onOpenAuth}
        onOpenMembership={(reason, planId) => {
          setNearbyModalOpen(false);
          onOpenMembership(reason, planId);
        }}
        onIntroductionCreated={() => {
          loadUserProjects();
          loadIntroductionsAndPayments();
        }}
      />

      <PdfPreviewModal preview={pdfPreview} onClose={() => setPdfPreview(null)} />
    </DashboardLayout>
  );
};

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Building2,
  FileText,
  PhoneCall,
  Globe,
  Plus,
  Trash2,
  X,
  Upload,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Edit3,
  Loader2,
  ShieldCheck,
  Users,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  RotateCw,
  ArrowRight,
  Download,
  FileCode
} from 'lucide-react';
import {
  AdminRole,
  isValidGmail,
  validateAdminEmail
} from '../config/adminAccess';
import {
  getVisitorRecords,
  VisitorSessionRecord
} from '../utils/visitorStore';
import { api, getAuthToken } from '../utils/apiClient';
import {
  fetchLeadsFromDatabaseStrict,
  LeadRecord
} from '../utils/leadStore';
import { UISelect } from './ui/Select';
import { useToast } from './ui/Toast';
import { maskEmail, maskEmailsInText } from '../utils/privacyMask';
import { PdfPreviewModal, PdfPreviewState } from './PdfPreviewModal';
import { DashboardLayout, DashboardNavItem } from './dashboard/DashboardLayout';
import {
  DASHBOARD_TABLE,
  DashboardBottomSheet,
  DashboardCard,
  DashboardCardHeader,
  DashboardEmptyState,
  DashboardFilterButton,
  DashboardKpiCard,
  DashboardLoadingState,
  DashboardStatusBadge,
} from './dashboard/DashboardPrimitives';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export type CurrencyUnit = 'Cr' | 'Lakhs' | 'Millions';

export interface PromoterItem {
  id: string;
  name: string;
  experience: string;
  qualification: string;
  shareholdingPct: number;
  role: string;
}

export interface CostComponent {
  id: string;
  category: string;
  amountCr: number;
}

export interface ProjectEntity {
  id: string;
  recordType?: 'lead' | 'project';
  name: string;
  promoterName?: string;
  email?: string;
  mobile?: string;
  industry: string;
  location: string;
  status?: string;
  promoterCount: number;
  promoters: PromoterItem[];
  costComponents: CostComponent[];
  meansOfFinance: {
    equityCr: number;
    debtCr: number;
    subsidyCr: number;
  };
  checklistUploaded: boolean;
  checklistFileName?: string;
  documents: {
    companyKyc?: string;
    promoterKyc?: string;
    dpr?: string;
    financialModel?: string;
    otherDocs?: string;
  };
  isFunded: boolean;
  dprAssignedTo?: string;
  consultationAssignedTo?: string;
}

export interface DprRequest {
  id: string;
  projectName: string;
  promoterName: string;
  email: string;
  phone: string;
  date: string;
  status?: string;
  assignedConsultant?: string;
}

export interface ConsultationItem {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  projectCategory: string;
  date: string;
  status?: string;
  assignedTo?: string;
}

const STORAGE_KEY_ADMIN_SESSION = 'inisio_active_admin_session';

function mapLeadRecordToProjectEntity(l: LeadRecord): ProjectEntity {
  const id = String(l.id || l._id);
  const rawPromoters = Array.isArray(l.promotersList) ? l.promotersList : [];
  const promoters: PromoterItem[] =
    rawPromoters.length > 0
      ? rawPromoters.map((p: any, idx: number) => ({
          id: String(p.id || `prom_${id}_${idx}`),
          name: p.name || l.fullName || 'Promoter',
          experience: p.experience || p.experienceYears || '5 Years',
          qualification: p.qualification || 'Executive Signatory',
          shareholdingPct: Number(p.shareholdingPct ?? 100),
          role: p.role || 'Promoter',
        }))
      : [
          {
            id: `prom_${id}_0`,
            name: l.fullName || 'Lead Promoter',
            experience: '10 Years',
            qualification: 'Executive Signatory',
            shareholdingPct: 100,
            role: 'Promoter',
          },
        ];

  const totalCost = Number(l.projectCost || l.totalCostCr) || 0;
  const rawCosts =
    Array.isArray(l.costComponents) && l.costComponents.length > 0
      ? l.costComponents
      : Array.isArray(l.customCostComponents) && l.customCostComponents.length > 0
      ? l.customCostComponents
      : [];

  const costComponents: CostComponent[] =
    rawCosts.length > 0
      ? rawCosts.map((c: any, idx: number) => ({
          id: String(c.id || `cost_${id}_${idx}`),
          category: c.category || c.name || 'Infrastructure & Site Development',
          amountCr: Number(c.amountCr ?? c.amount ?? 0),
        }))
      : [
          {
            id: `cost_${id}_0`,
            category: 'Total Project Outlay',
            amountCr: totalCost,
          },
        ];

  const mof = l.meansOfFinance && typeof l.meansOfFinance === 'object' ? l.meansOfFinance : {};
  const debtCr = Number(mof.debtCr ?? mof.termLoanCr ?? l.proposedLoan ?? l.loanRequiredCr ?? 0);
  const equityCr = Number(mof.equityCr ?? mof.promoterContribCr ?? l.promoterContribCr ?? Math.max(0, totalCost - debtCr));
  const subsidyCr = Number(mof.subsidyCr ?? 0);

  const docs: ProjectEntity['documents'] = {
    ...(l.documents && typeof l.documents === 'object' ? l.documents : {}),
  };
  if (l.dprFile && !docs.dpr) docs.dpr = l.dprFile;
  if (l.cmaFile && !docs.financialModel) docs.financialModel = l.cmaFile;

  const isFunded = Boolean(
    l.isFunded ||
      l.status === 'Funded' ||
      l.status === 'Bank Sanction Approved'
  );

  return {
    id,
    recordType: l.recordType,
    name: l.projectName || (l.fullName ? `${l.fullName} Project` : 'Greenfield Project'),
    promoterName: l.fullName || '',
    email: l.email || '',
    mobile: l.phone || l.mobile || '',
    industry: l.industry || 'General Infrastructure',
    location: l.location || 'India',
    status: l.status || 'Active Lead',
    promoterCount: promoters.length,
    promoters,
    costComponents,
    meansOfFinance: {
      equityCr,
      debtCr,
      subsidyCr,
    },
    checklistUploaded: Boolean(l.checklistUploaded),
    checklistFileName: l.checklistFileName || '',
    documents: docs,
    isFunded,
    dprAssignedTo: l.dprAssignedTo,
    consultationAssignedTo: l.consultationAssignedTo,
  };
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  // Session State (synced with backend JWT token & role)
  const [activeRole, setActiveRole] = useState<AdminRole | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const token = getAuthToken();
      if (!token) return null;

      const activeUserRaw = localStorage.getItem('inisio_active_user');
      if (activeUserRaw) {
        const parsedUser = JSON.parse(activeUserRaw);
        if (parsedUser?.role === 'admin' || parsedUser?.role === 'superadmin') {
          return parsedUser.role;
        }
      }

      const saved = localStorage.getItem(STORAGE_KEY_ADMIN_SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'admin' || parsed.role === 'superadmin') {
          return parsed.role;
        }
      }
    } catch {}
    return null;
  });

  // Backend RBAC: 'admin' has full CRUD; 'superadmin' is View-Only
  const canEdit = activeRole === 'admin';
  const isViewOnly = activeRole === 'superadmin';

  // Login & Password Reset State (Authorized Gmail + DB-verified Password)
  const [authView, setAuthView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Active Navigation: Overview, Projects, DPR Requests, Consultations, Visitors
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'dpr' | 'consultations' | 'visitors'>('overview');

  // Data Loading / Error State
  const [dataLoading, setDataLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dataError, setDataError] = useState('');

  // New Project Modal State (Admin CRUD)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjPromoter, setNewProjPromoter] = useState('');
  const [newProjIndustry, setNewProjIndustry] = useState('');
  const [newProjLocation, setNewProjLocation] = useState('');
  const [newProjEmail, setNewProjEmail] = useState('');
  const [newProjMobile, setNewProjMobile] = useState('');
  const [newProjCapex, setNewProjCapex] = useState('10');
  const [newProjLoan, setNewProjLoan] = useState('7');
  const [creatingProject, setCreatingProject] = useState(false);

  // Edit Project Metadata Modal State (Admin CRUD)
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editProjData, setEditProjData] = useState({
    name: '',
    promoterName: '',
    industry: '',
    location: '',
  });

  // Currency Display Unit
  const [currencyUnit, setCurrencyUnit] = useState<CurrencyUnit>('Cr');
  const [isProjectOptionsOpen, setIsProjectOptionsOpen] = useState(false);

  // Selected Project for details view
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Live Backend Collections State
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [rawLeadsById, setRawLeadsById] = useState<Record<string, LeadRecord>>({});
  const [dprRequests, setDprRequests] = useState<DprRequest[]>([]);
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [visitors, setVisitors] = useState<VisitorSessionRecord[]>([]);
  const [pdfPreview, setPdfPreview] = useState<PdfPreviewState | null>(null);
  const { toast: showToast } = useToast();

  const buildAdminPdfPayload = useCallback(
    async (projectId: string, overrideProject?: ProjectEntity) => {
      const { mapLeadRecordToPdfData } = await import('../utils/pdfGenerator');
      const rawLead = rawLeadsById[projectId];
      const entity = overrideProject || projects.find((p) => p.id === projectId);
      const base = rawLead ? mapLeadRecordToPdfData(rawLead) : {};
      if (!entity) return base;
      const totalCost = entity.costComponents.reduce((sum, c) => sum + Number(c.amountCr || 0), 0);
      return {
        ...base,
        projectName: entity.name || base.projectName,
        industry: entity.industry || base.industry,
        location: entity.location || base.location,
        fullName: entity.promoterName || base.fullName,
        email: entity.email || base.email,
        mobile: entity.mobile || base.mobile,
        status: entity.status || base.status,
        isFunded: entity.isFunded,
        dprAssignedTo: entity.dprAssignedTo || base.dprAssignedTo,
        checklistUploaded: entity.checklistUploaded,
        checklistFileName: entity.checklistFileName,
        documents: entity.documents,
        promotersList: entity.promoters.map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          experience: p.experience,
          qualification: p.qualification,
          shareholdingPct: p.shareholdingPct,
        })),
        costComponents: entity.costComponents,
        totalCostCr: totalCost > 0 ? totalCost : base.totalCostCr,
        meansOfFinance: entity.meansOfFinance,
        termLoanCr: entity.meansOfFinance.debtCr || base.termLoanCr,
        promoterContributionCr: entity.meansOfFinance.equityCr || base.promoterContributionCr,
        otherFinanceCr: entity.meansOfFinance.subsidyCr ?? base.otherFinanceCr,
      };
    },
    [projects, rawLeadsById]
  );

  const handleAdminDownloadDocx = useCallback(
    async (projectId: string, overrideProject?: ProjectEntity) => {
      try {
        const [payload, { generateProjectTeaserDOCX }] = await Promise.all([
          buildAdminPdfPayload(projectId, overrideProject),
          import('../utils/docxGenerator'),
        ]);
        const filename = await generateProjectTeaserDOCX(payload);
        showToast(`Downloaded ${filename}`, { type: 'success' });
      } catch (err) {
        console.error('Admin Teaser DOCX error:', err);
        showToast('Could not download Project Teaser DOCX. Please try again.', { type: 'error' });
      }
    },
    [buildAdminPdfPayload, showToast]
  );

  const handleAdminProjectDocument = useCallback(
    async (
      projectId: string,
      type: 'teaser' | 'dpr',
      action: 'preview' | 'download' = 'preview',
      overrideProject?: ProjectEntity
    ) => {
      try {
        const [payload, { generateProjectTeaserPDF, generateDprExecutiveSummaryPDF }] = await Promise.all([
          buildAdminPdfPayload(projectId, overrideProject),
          import('../utils/pdfGenerator'),
        ]);
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
            onDownloadDocx:
              type === 'teaser'
                ? () => {
                    handleAdminDownloadDocx(projectId, overrideProject);
                  }
                : undefined,
          });
        } else if (res) {
          showToast(`Downloaded ${res.filename}`, { type: 'success' });
        }
      } catch (err) {
        console.error('Admin PDF generation error:', err);
        showToast('Could not generate the document. Please try again.', { type: 'error' });
      }
    },
    [buildAdminPdfPayload, handleAdminDownloadDocx, showToast]
  );

  const loadAllAdminData = useCallback(async () => {
    if (!activeRole) return;
    setDataLoading(true);
    setDataError('');
    try {
      const [leadsList, consultationsRes, visitorsRes] = await Promise.all([
        fetchLeadsFromDatabaseStrict(),
        api.consultations.getAll().catch(() => []),
        api.get('/visitors').catch(() => []),
      ]);

      const leadsLookup: Record<string, LeadRecord> = {};
      leadsList.forEach((l) => {
        leadsLookup[String(l.id || l._id)] = l;
      });
      setRawLeadsById(leadsLookup);

      const mappedProjects = leadsList.map(mapLeadRecordToProjectEntity);
      setProjects(mappedProjects);
      setSelectedProjectId((prev) => {
        if (prev && mappedProjects.some((p) => p.id === prev)) return prev;
        return mappedProjects[0]?.id || '';
      });

      // Populate DPR Requests (prioritizing DPR Requested / assigned items, plus active pipeline projects)
      const sortedForDpr = [...leadsList].sort((a, b) => {
        const aDpr = a.status === 'DPR Requested' || Boolean(a.dprAssignedTo) || (a.notes || '').toLowerCase().includes('dpr') ? 1 : 0;
        const bDpr = b.status === 'DPR Requested' || Boolean(b.dprAssignedTo) || (b.notes || '').toLowerCase().includes('dpr') ? 1 : 0;
        return bDpr - aDpr;
      });
      setDprRequests(
        sortedForDpr.map((l) => ({
          id: String(l.id || l._id),
          projectName: l.projectName || 'Greenfield Project',
          promoterName: l.fullName || 'Lead Promoter',
          email: l.email || 'N/A',
          phone: l.phone || l.mobile || 'N/A',
          date: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Recent',
          status: l.status,
          assignedConsultant: l.dprAssignedTo || '',
        }))
      );

      // Populate Consultations
      const consArray = Array.isArray(consultationsRes) ? consultationsRes : (consultationsRes as any)?.data || [];
      setConsultations(
        consArray.map((c: any) => ({
          id: String(c._id || c.id),
          clientName: c.fullName || c.name || 'Client',
          email: c.email || 'N/A',
          phone: c.phone || 'N/A',
          projectCategory: c.industry || c.preferredSlot || 'Greenfield Debt Advisory',
          date: c.preferredDate || (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent'),
          status: c.status,
          assignedTo:
            c.assignedTo ||
            (typeof c.feedback === 'string' && c.feedback.toLowerCase().includes('prosync') ? 'Prosync' : undefined),
        }))
      );

      // Combine backend visitors with client visitor log
      const serverVisitors = Array.isArray(visitorsRes) ? visitorsRes : (visitorsRes as any)?.data || [];
      const localVisitors = getVisitorRecords();
      const mergedMap = new Map<string, VisitorSessionRecord>();
      for (const v of serverVisitors) {
        const vid = String(v.id || v._id || `${v.sessionId}_${v.timestamp}`);
        mergedMap.set(vid, {
          id: vid,
          sessionId: v.sessionId || 'sess_live',
          path: v.path || '/',
          userEmail: v.userEmail || undefined,
          timestamp: v.timestamp || new Date().toISOString(),
          device: v.device || (v.userAgent ? 'Web Client' : 'Desktop'),
          browser: v.browser || (v.userAgent ? 'Browser' : 'Browser'),
          location: v.location || v.ip || 'India',
          ip: v.ip,
        });
      }
      for (const lv of localVisitors) {
        if (!mergedMap.has(lv.id)) {
          mergedMap.set(lv.id, lv);
        }
      }
      const mergedVisitors = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setVisitors(mergedVisitors);
    } catch (err: any) {
      setDataError(err?.message || 'Unable to load records from database. Please verify your session.');
    } finally {
      setDataLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    if (isOpen) {
      if (activeRole) {
        loadAllAdminData();
      } else {
        setVisitors(getVisitorRecords());
      }
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
          onClose();
        }
      };
      const handleLeadAdded = () => {
        if (activeRole) loadAllAdminData();
      };
      window.addEventListener('keydown', handleEsc);
      window.addEventListener('inisio_lead_added', handleLeadAdded);
      return () => {
        window.removeEventListener('keydown', handleEsc);
        window.removeEventListener('inisio_lead_added', handleLeadAdded);
      };
    }
  }, [isOpen, onClose, activeRole, loadAllAdminData]);

  // Backend-Authenticated Gmail + Password Admin Login
  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!isValidGmail(cleanEmail)) {
      setAuthError('Please enter a valid @gmail.com address for admin access.');
      return;
    }
    if (!passwordInput.trim()) {
      setAuthError('Please enter your admin password.');
      return;
    }

    setAuthLoading(true);
    const detected = validateAdminEmail(cleanEmail);
    if (!detected.allowed) {
      setAuthError(detected.error || 'Access Denied: This Gmail address is not an authorized administrator account.');
      setAuthLoading(false);
      return;
    }

    try {
      if (detected.role === 'ca_admin') {
        const res = await api.post('/ca-admin/auth', { email: cleanEmail, password: passwordInput });
        if (res && res.token) {
          localStorage.setItem(
            'inisio_ca_admin_session',
            JSON.stringify({ email: res.email || cleanEmail, token: res.token })
          );
          localStorage.setItem('inisio_auth_token', res.token);
          onClose();
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/ca-admin');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
          return;
        }
      }

      const authData = await api.post('/auth/admin-login', {
        email: cleanEmail,
        password: passwordInput,
      });

      if (!authData || !authData.token) {
        setAuthError('Authentication failed: Server did not issue an access token.');
        return;
      }

      const backendRole = authData.role;
      if (backendRole === 'ca_admin') {
        localStorage.setItem(
          'inisio_ca_admin_session',
          JSON.stringify({ email: authData.email || cleanEmail, token: authData.token })
        );
        localStorage.setItem('inisio_auth_token', authData.token);
        onClose();
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/ca-admin');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        return;
      }

      if (backendRole !== 'admin' && backendRole !== 'superadmin') {
        setAuthError('Access Denied: Administrative privileges required.');
        return;
      }

      localStorage.setItem('inisio_auth_token', authData.token);
      localStorage.setItem(
        'inisio_active_user',
        JSON.stringify({
          id: authData._id || authData.id,
          email: authData.email,
          role: backendRole,
          name: authData.name,
          token: authData.token,
        })
      );
      localStorage.setItem(
        STORAGE_KEY_ADMIN_SESSION,
        JSON.stringify({ email: authData.email, role: backendRole })
      );

      setActiveRole(backendRole as AdminRole);
      setEmailInput('');
      setPasswordInput('');
    } catch (err: any) {
      setAuthError(err?.message || 'Access Denied');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRequestAdminReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!isValidGmail(cleanEmail)) {
      setAuthError('Please enter your authorized @gmail.com address.');
      return;
    }
    const detected = validateAdminEmail(cleanEmail);
    if (!detected.allowed) {
      setAuthError(detected.error || 'Access Denied: This Gmail address is not an authorized administrator account.');
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const resData = await response.json().catch(() => ({}));
      if (response.ok && resData.success) {
        setAuthSuccess(
          resData.message
            ? maskEmailsInText(resData.message)
            : `A 6-digit password reset code has been sent to ${maskEmail(cleanEmail)}.`
        );
        setResendCooldown(30);
        setAuthView('reset');
      } else {
        setAuthError(resData.message || 'Unable to send reset code. Please check your admin Gmail address.');
      }
    } catch {
      setAuthError('Network error while sending reset code. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConfirmAdminReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanOtp = resetOtp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setAuthError('Please enter the 6-digit code sent to your Gmail.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setAuthError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp, newPassword }),
      });
      const resData = await response.json().catch(() => ({}));
      if (response.ok && resData.success) {
        setAuthSuccess('Password updated successfully. You can now sign in with your new password.');
        setPasswordInput('');
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setAuthView('login');
      } else {
        setAuthError(resData.message || 'Invalid or expired 6-digit code.');
      }
    } catch {
      setAuthError('Network error while updating password. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Helper to persist edits to a project/lead back to backend API
  const persistProjectEntity = async (updatedProj: ProjectEntity) => {
    if (!canEdit) return;
    setSavingId(updatedProj.id);
    setDataError('');
    try {
      const capexSum = updatedProj.costComponents.reduce((acc, c) => acc + (Number(c.amountCr) || 0), 0);
      await api.leads.update(updatedProj.id, {
        projectName: updatedProj.name,
        fullName: updatedProj.promoterName,
        industry: updatedProj.industry,
        location: updatedProj.location,
        promotersList: updatedProj.promoters,
        costComponents: updatedProj.costComponents,
        meansOfFinance: updatedProj.meansOfFinance,
        totalCostCr: String(capexSum),
        loanRequiredCr: String(updatedProj.meansOfFinance.debtCr || 0),
        promoterContribCr: String(updatedProj.meansOfFinance.equityCr || 0),
        checklistUploaded: updatedProj.checklistUploaded,
        checklistFileName: updatedProj.checklistFileName || '',
        documents: updatedProj.documents,
        isFunded: updatedProj.isFunded,
        successProbability: updatedProj.isFunded ? 100 : 25,
        status: updatedProj.isFunded
          ? 'Funded'
          : updatedProj.status === 'Funded'
          ? 'Pending Audit'
          : updatedProj.status || 'Active Lead',
      });
      setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
      window.dispatchEvent(new CustomEvent('inisio_lead_added'));
    } catch (err: any) {
      setDataError(err?.message || 'Failed to save project changes to database.');
    } finally {
      setSavingId(null);
    }
  };

  // Admin CRUD: Project Creation (persisted to backend DB)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !newProjName.trim() || !newProjPromoter.trim()) return;

    setCreatingProject(true);
    setDataError('');
    try {
      const capexNum = Number(newProjCapex) || 10;
      const loanNum = Number(newProjLoan) || 7;
      const equityNum = Math.max(0, Number((capexNum - loanNum).toFixed(2)));
      const nowTs = Date.now();

      const created = await api.projects.create({
        promoterName: newProjPromoter.trim(),
        projectName: newProjName.trim(),
        industry: newProjIndustry.trim() || 'General Infrastructure',
        location: newProjLocation.trim() || 'India',
        email: newProjEmail.trim(),
        mobile: newProjMobile.trim(),
        capexCr: capexNum,
        loanCr: loanNum,
        equityCr: equityNum,
        promotersList: [
          {
            id: `prom_${nowTs}`,
            name: newProjPromoter.trim(),
            experience: '10 Years',
            qualification: 'Executive Signatory',
            shareholdingPct: 100,
            role: 'Promoter',
          },
        ],
        costComponents: [
          {
            id: `cost_${nowTs}`,
            category: 'Infrastructure & Site Development',
            amountCr: capexNum,
          },
        ],
        meansOfFinance: {
          equityCr: equityNum,
          debtCr: loanNum,
          subsidyCr: 0,
        },
      });

      const createdId = String(created?._id || created?.id || '');
      setNewProjName('');
      setNewProjPromoter('');
      setNewProjIndustry('');
      setNewProjLocation('');
      setNewProjEmail('');
      setNewProjMobile('');
      setNewProjCapex('10');
      setNewProjLoan('7');
      setShowNewProjectModal(false);

      await loadAllAdminData();
      if (createdId) {
        setSelectedProjectId(createdId);
      }
      window.dispatchEvent(new CustomEvent('inisio_lead_added'));
    } catch (err: any) {
      setDataError(err?.message || 'Failed to create project in database.');
    } finally {
      setCreatingProject(false);
    }
  };

  // Admin CRUD: Edit Project Details
  const handleOpenEditProject = () => {
    if (!canEdit || !currentProject) return;
    setEditProjData({
      name: currentProject.name,
      promoterName: currentProject.promoterName || '',
      industry: currentProject.industry,
      location: currentProject.location,
    });
    setShowEditProjectModal(true);
  };

  const handleSaveProjectDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !currentProject) return;
    const updated: ProjectEntity = {
      ...currentProject,
      name: editProjData.name.trim() || currentProject.name,
      promoterName: editProjData.promoterName.trim() || currentProject.promoterName,
      industry: editProjData.industry.trim() || currentProject.industry,
      location: editProjData.location.trim() || currentProject.location,
    };
    await persistProjectEntity(updated);
    setShowEditProjectModal(false);
  };

  // Admin CRUD: Project Deletion
  const handleDeleteProject = async (projId: string) => {
    if (!canEdit || !projId) return;
    setSavingId(projId);
    setDataError('');
    try {
      await api.leads.delete(projId);
      const remaining = projects.filter((p) => p.id !== projId);
      setProjects(remaining);
      setDprRequests((prev) => prev.filter((d) => d.id !== projId));
      setSelectedProjectId(remaining[0]?.id || '');
      window.dispatchEvent(new CustomEvent('inisio_lead_added'));
    } catch (err: any) {
      setDataError(err?.message || 'Failed to delete project from database.');
    } finally {
      setSavingId(null);
    }
  };

  const handleSignOut = () => {
    setActiveRole(null);
    setProjects([]);
    setDprRequests([]);
    setConsultations([]);
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      localStorage.removeItem('inisio_auth_token');
      localStorage.removeItem('inisio_active_user');
    } catch {}
  };

  // Currently viewed project
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Unit conversion helper
  const formatCurrency = (amountCr: number): string => {
    if (currencyUnit === 'Cr') {
      return `₹ ${amountCr.toFixed(2)} Cr`;
    }
    if (currencyUnit === 'Lakhs') {
      const lakhs = amountCr * 100;
      return `₹ ${lakhs.toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
    }
    if (currencyUnit === 'Millions') {
      const millions = amountCr * 10;
      return `₹ ${millions.toFixed(2)} M`;
    }
    return `₹ ${amountCr.toFixed(2)} Cr`;
  };

  const totalCostCr = useMemo(() => {
    if (!currentProject) return 0;
    return currentProject.costComponents.reduce((acc, c) => acc + (c.amountCr || 0), 0);
  }, [currentProject]);

  const totalMeansOfFinanceCr = useMemo(() => {
    if (!currentProject) return 0;
    return (
      (currentProject.meansOfFinance.equityCr || 0) +
      (currentProject.meansOfFinance.debtCr || 0) +
      (currentProject.meansOfFinance.subsidyCr || 0)
    );
  }, [currentProject]);

  // Feature 2: Promoters CRUD
  const [newPromoterName, setNewPromoterName] = useState('');
  const [newPromoterExp, setNewPromoterExp] = useState('');
  const [newPromoterQual, setNewPromoterQual] = useState('');
  const [newPromoterShare, setNewPromoterShare] = useState('20');
  const [newPromoterRole, setNewPromoterRole] = useState('Co-Promoter');
  const [showAddPromoterForm, setShowAddPromoterForm] = useState(false);

  const handleAddPromoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !currentProject || !newPromoterName.trim()) return;

    const newProm: PromoterItem = {
      id: `prom_${Date.now()}`,
      name: newPromoterName.trim(),
      experience: newPromoterExp || '5 Years',
      qualification: newPromoterQual || 'Graduate',
      shareholdingPct: Number(newPromoterShare) || 10,
      role: newPromoterRole || 'Partner'
    };

    const updatedList = [...currentProject.promoters, newProm];
    await persistProjectEntity({
      ...currentProject,
      promoters: updatedList,
      promoterCount: updatedList.length,
    });

    setNewPromoterName('');
    setNewPromoterExp('');
    setNewPromoterQual('');
    setShowAddPromoterForm(false);
  };

  const handleDeletePromoter = async (promoterId: string) => {
    if (!canEdit || !currentProject) return;
    const updatedList = currentProject.promoters.filter((p) => p.id !== promoterId);
    await persistProjectEntity({
      ...currentProject,
      promoters: updatedList,
      promoterCount: updatedList.length,
    });
  };

  // Feature 3: Project Cost and Means of finance CRUD
  const [newCostCat, setNewCostCat] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('5.0');
  const [showAddCostForm, setShowAddCostForm] = useState(false);

  const handleAddCostComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !currentProject || !newCostCat.trim()) return;

    const newComp: CostComponent = {
      id: `cost_${Date.now()}`,
      category: newCostCat.trim(),
      amountCr: Number(newCostAmount) || 1.0
    };

    await persistProjectEntity({
      ...currentProject,
      costComponents: [...currentProject.costComponents, newComp],
    });

    setNewCostCat('');
    setNewCostAmount('5.0');
    setShowAddCostForm(false);
  };

  const handleDeleteCostComponent = async (costId: string) => {
    if (!canEdit || !currentProject) return;
    await persistProjectEntity({
      ...currentProject,
      costComponents: currentProject.costComponents.filter((c) => c.id !== costId),
    });
  };

  const handleUpdateFinance = async (field: 'equityCr' | 'debtCr' | 'subsidyCr', val: number) => {
    if (!canEdit || !currentProject) return;
    await persistProjectEntity({
      ...currentProject,
      meansOfFinance: {
        ...currentProject.meansOfFinance,
        [field]: val
      }
    });
  };

  // Feature 4: Checklist Upload
  const handleUploadChecklist = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit || !currentProject) return;
    const file = e.target.files?.[0];
    if (!file) return;

    await persistProjectEntity({
      ...currentProject,
      checklistUploaded: true,
      checklistFileName: file.name,
    });
  };

  // Feature 5: Documents (Optional Uploads)
  const handleUploadDocument = async (
    key: 'companyKyc' | 'promoterKyc' | 'dpr' | 'financialModel' | 'otherDocs',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!canEdit || !currentProject) return;
    const file = e.target.files?.[0];
    if (!file) return;

    await persistProjectEntity({
      ...currentProject,
      documents: {
        ...currentProject.documents,
        [key]: file.name,
      },
    });
  };

  const handleRemoveDocument = async (
    key: 'companyKyc' | 'promoterKyc' | 'dpr' | 'financialModel' | 'otherDocs'
  ) => {
    if (!canEdit || !currentProject) return;
    const updatedDocs = { ...currentProject.documents };
    delete updatedDocs[key];
    await persistProjectEntity({
      ...currentProject,
      documents: updatedDocs,
    });
  };

  // Feature 6: Probability Meter
  const currentProbability = currentProject?.isFunded ? 100 : 25;

  const handleToggleFunded = async () => {
    if (!canEdit || !currentProject) return;
    const nextFunded = !currentProject.isFunded;
    await persistProjectEntity({
      ...currentProject,
      isFunded: nextFunded,
      status: nextFunded ? 'Funded' : 'Pending Audit',
    });
  };

  // Feature 7: DPR Requests Assignment
  const handleAssignDprConsultant = async (dprId: string, consultant: string) => {
    if (!canEdit) return;
    setDataError('');
    try {
      await api.leads.assign(dprId, { dprAssignedTo: consultant });
      setDprRequests((prev) =>
        prev.map((req) => (req.id === dprId ? { ...req, assignedConsultant: consultant } : req))
      );
    } catch (err: any) {
      setDataError(err?.message || 'Failed to assign DPR consultant.');
    }
  };

  // Feature 8: Consultations Assignment to Prosync
  const handleAssignConsultationToProsync = async (consId: string) => {
    if (!canEdit) return;
    setDataError('');
    try {
      await api.consultations.updateStatus(consId, 'scheduled', 'Assigned to Prosync');
      setConsultations((prev) =>
        prev.map((c) => (c.id === consId ? { ...c, status: 'scheduled', assignedTo: 'Prosync' } : c))
      );
    } catch (err: any) {
      setDataError(err?.message || 'Failed to assign consultation to Prosync.');
    }
  };

  if (!isOpen) return null;

  const adminNavItems: DashboardNavItem[] = [
    { id: 'overview', label: 'Overview', mobileLabel: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', mobileLabel: 'Projects', icon: Building2, count: projects.length },
    { id: 'dpr', label: 'DPR Requests', mobileLabel: 'DPR', icon: FileText, count: dprRequests.length },
    { id: 'consultations', label: 'Consultations', mobileLabel: 'Consults', icon: PhoneCall, count: consultations.length },
    { id: 'visitors', label: 'Visitors', mobileLabel: 'Visitors', icon: Globe, count: visitors.length },
  ];

  const pageTitleMap: Record<typeof activeTab, string> = {
    overview: 'Dashboard Overview',
    projects: 'Projects & Entity Management',
    dpr: 'DPR Requests',
    consultations: 'Consultations',
    visitors: 'Visitor Tracking',
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen supports-[height:100dvh]:h-[100dvh] bg-slate-50 flex flex-col font-inter overflow-hidden animate-in fade-in duration-150">
      {/* State 1: Admin Login Gate */}
      {!activeRole ? (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-sm bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-lg space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 font-manrope">
                    {authView === 'forgot'
                      ? 'Reset / Set Admin Password'
                      : authView === 'reset'
                        ? 'Create New Password'
                        : 'Admin Desk Access'}
                  </div>
                  <div className="text-[11px] text-slate-500">Executive Operations Panel</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer -mr-1.5"
                aria-label="Close admin login"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {authSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium space-y-1.5">
                <p>{authError}</p>
                {authView === 'login' && authError.toLowerCase().includes('no password') && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('forgot');
                      setAuthError('');
                    }}
                    className="text-blue-700 hover:text-blue-900 underline font-semibold cursor-pointer"
                  >
                    Set password via email code &rarr;
                  </button>
                )}
              </div>
            )}

            {authView === 'forgot' ? (
              <form onSubmit={handleRequestAdminReset} className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your authorized admin Gmail address. We will send a 6-digit code to set or reset your password.
                </p>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Authorized Gmail Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 placeholder:text-slate-400"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading || !emailInput.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {authLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send 6-Digit Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('reset');
                      setAuthError('');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Already have a code?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('login');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : authView === 'reset' ? (
              <form onSubmit={handleConfirmAdminReset} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Authorized Gmail Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    6-Digit Reset Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest text-center bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    disabled={authLoading || resendCooldown > 0}
                    onClick={() => handleRequestAdminReset()}
                    className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {authLoading && <RotateCw className="w-3 h-3 animate-spin" />}
                    <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('login');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={authLoading || resetOtp.length < 6 || newPassword.length < 6}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save New Password</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAccessSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Authorized Gmail Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 placeholder:text-slate-400"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthView('forgot');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Forgot / Set password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (authError) setAuthError('');
                      }}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full min-h-[44px] py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Enter Desk</span>}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* State 2: Unified Dashboard Layout */
        <DashboardLayout
          portalName="Inisio"
          portalSubtitle="Admin Panel"
          portalIcon={ShieldCheck}
          roleLabel={activeRole === 'superadmin' ? 'Super Admin' : 'Admin'}
          roleModeLabel={canEdit ? 'Full CRUD' : 'View-Only'}
          userName={activeRole === 'superadmin' ? 'Super Admin' : 'Executive Admin'}
          navItems={adminNavItems}
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId as typeof activeTab)}
          pageTitle={pageTitleMap[activeTab]}
          pageBreadcrumb={activeTab !== 'overview' ? 'Overview' : 'Admin Operations'}
          showBackButton={activeTab !== 'overview'}
          onGoBack={() => setActiveTab('overview')}
          onLogout={handleSignOut}
          onCloseOverlay={onClose}
          closeOverlayLabel="Close (Esc)"
          mobileStickyAction={
            (activeTab === 'overview' || activeTab === 'projects') && canEdit ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'projects') setActiveTab('projects');
                  setShowNewProjectModal(true);
                }}
                className="w-full min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>New Project</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={loadAllAdminData}
                disabled={dataLoading}
                className="w-full min-h-[44px] px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 shrink-0 ${dataLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )
          }
          headerActions={
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isViewOnly && (
                <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">
                  View-Only
                </span>
              )}
              {savingId && (
                <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Saving</span>
                </span>
              )}
              <button
                type="button"
                onClick={loadAllAdminData}
                disabled={dataLoading}
                aria-label="Refresh admin data"
                className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-[36px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1.5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shrink-0"
                aria-label="Close admin panel"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
          }
        >
          {dataError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{dataError}</span>
              </div>
              <button
                type="button"
                onClick={loadAllAdminData}
                className="min-h-[44px] sm:min-h-0 px-3.5 py-2 sm:py-1.5 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 cursor-pointer shrink-0 whitespace-nowrap"
              >
                Retry
              </button>
            </div>
          )}

          {/* 1. Dashboard Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-5 sm:space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <DashboardKpiCard
                  label="Total Projects"
                  value={projects.length}
                  subtext="Active appraisals & projects"
                  icon={Building2}
                  tone="slate"
                  onClick={() => setActiveTab('projects')}
                />
                <DashboardKpiCard
                  label="Promoters"
                  value={projects.reduce((acc, p) => acc + (p.promoters.length || 0), 0)}
                  subtext="Mapped entity signatories"
                  icon={Users}
                  tone="indigo"
                />
                <DashboardKpiCard
                  label="Consultations"
                  value={consultations.length}
                  subtext="Advisory requests"
                  icon={PhoneCall}
                  tone="blue"
                  valueClassName="text-blue-600"
                  onClick={() => setActiveTab('consultations')}
                />
                <DashboardKpiCard
                  label="DPR Requests"
                  value={dprRequests.length}
                  subtext="Pipeline assignments"
                  icon={FileText}
                  tone="emerald"
                  valueClassName="text-emerald-600"
                  onClick={() => setActiveTab('dpr')}
                />
              </div>

              <DashboardCard>
                <DashboardCardHeader
                  title="Active Project Pipelines"
                  description="Select any project to inspect promoters, capital outlay, documents, and probability score."
                  actions={
                    canEdit ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('projects');
                          setShowNewProjectModal(true);
                        }}
                        className="hidden lg:inline-flex px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Project</span>
                      </button>
                    ) : undefined
                  }
                />
                {dataLoading && projects.length === 0 ? (
                  <DashboardLoadingState label="Loading projects from database..." />
                ) : projects.length === 0 ? (
                  <DashboardEmptyState
                    icon={Building2}
                    title="No projects yet"
                    description={
                      canEdit
                        ? 'Create a project entity to start tracking promoters, cost structure, and funding readiness.'
                        : 'No projects have been registered in the system yet.'
                    }
                  />
                ) : (
                  <>
                    {/* Mobile Stacked Cards */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {projects.map((proj) => {
                        const capex = proj.costComponents.reduce((acc, c) => acc + (c.amountCr || 0), 0);
                        return (
                          <button
                            key={proj.id}
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(proj.id);
                              setActiveTab('projects');
                            }}
                            className="w-full text-left p-4 space-y-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 text-sm">{proj.name}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{proj.industry}</div>
                              </div>
                              <DashboardStatusBadge status={proj.isFunded ? 'Funded' : proj.status || 'In Appraisal'} />
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                              <div>
                                <div className="text-[11px] text-slate-500">Promoters</div>
                                <div className="font-semibold text-slate-800 tabular-nums mt-0.5">
                                  {proj.promoters.length}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] text-slate-500">Capex</div>
                                <div className="font-bold text-slate-900 tabular-nums mt-0.5">
                                  ₹ {capex.toFixed(1)} Cr
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] text-slate-500">Probability</div>
                                <div className="font-bold text-blue-600 tabular-nums mt-0.5">
                                  {proj.isFunded ? '100%' : '25%'}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className={`hidden md:block ${DASHBOARD_TABLE.wrapper}`}>
                      <table className={DASHBOARD_TABLE.table}>
                        <thead className={DASHBOARD_TABLE.thead}>
                          <tr>
                            <th className={DASHBOARD_TABLE.th}>Project</th>
                            <th className={DASHBOARD_TABLE.th}>Promoters</th>
                            <th className={DASHBOARD_TABLE.th}>Capex</th>
                            <th className={DASHBOARD_TABLE.th}>Probability</th>
                            <th className={`${DASHBOARD_TABLE.th} text-right`}>Status</th>
                          </tr>
                        </thead>
                        <tbody className={DASHBOARD_TABLE.tbody}>
                          {projects.map((proj) => {
                            const capex = proj.costComponents.reduce((acc, c) => acc + (c.amountCr || 0), 0);
                            return (
                              <tr
                                key={proj.id}
                                onClick={() => {
                                  setSelectedProjectId(proj.id);
                                  setActiveTab('projects');
                                }}
                                className={`${DASHBOARD_TABLE.tr} cursor-pointer`}
                              >
                                <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900`}>
                                  {proj.name}
                                  <div className="text-[11px] font-normal text-slate-500 mt-0.5">{proj.industry}</div>
                                </td>
                                <td className={`${DASHBOARD_TABLE.td} text-slate-700 tabular-nums`}>
                                  {proj.promoters.length} {proj.promoters.length === 1 ? 'Promoter' : 'Promoters'}
                                </td>
                                <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900 tabular-nums`}>
                                  ₹ {capex.toFixed(1)} Cr
                                </td>
                                <td className={`${DASHBOARD_TABLE.td} font-semibold text-blue-600 tabular-nums`}>
                                  {proj.isFunded ? '100%' : '25%'}
                                </td>
                                <td className={`${DASHBOARD_TABLE.td} text-right`}>
                                  <DashboardStatusBadge status={proj.isFunded ? 'Funded' : proj.status || 'In Appraisal'} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </DashboardCard>
            </div>
          )}

          {/* 2. Projects */}
          {activeTab === 'projects' && (
            <div className="space-y-5 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 sm:flex-wrap sm:gap-2.5 min-w-0 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none min-w-0">
                    <UISelect
                      value={currentProject?.id || selectedProjectId}
                      onValueChange={setSelectedProjectId}
                      options={projects.map((p) => ({ value: p.id, label: p.name }))}
                      placeholder={projects.length === 0 ? 'No projects' : 'Select project'}
                      triggerClassName="min-h-[44px] sm:min-h-0 sm:h-9 px-3 py-1.5 text-sm sm:text-xs font-semibold bg-slate-50 border-slate-200 w-full sm:min-w-[210px]"
                    />
                  </div>
                  <div className="sm:hidden shrink-0">
                    <DashboardFilterButton
                      label="Options"
                      activeCount={currencyUnit !== 'Cr' ? 1 : 0}
                      onClick={() => setIsProjectOptionsOpen(true)}
                    />
                  </div>
                  {currentProject?.location && (
                    <span className="hidden sm:inline text-xs text-slate-500 font-medium shrink-0">{currentProject.location}</span>
                  )}

                  {canEdit && currentProject && (
                    <div className="hidden sm:flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleOpenEditProject}
                        title="Edit project details"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(currentProject.id)}
                        title="Delete this project"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setShowNewProjectModal(true)}
                      className="hidden lg:inline-flex px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Project</span>
                    </button>
                  )}
                </div>

                {currentProject?.location && (
                  <div className="sm:hidden flex items-center justify-between text-xs text-slate-500 px-0.5">
                    <span>{currentProject.location}</span>
                    <span className="font-semibold text-slate-700">Unit: INR {currencyUnit}</span>
                  </div>
                )}

                <div className="hidden sm:inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrencyUnit('Cr')}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      currencyUnit === 'Cr'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    INR Crores
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrencyUnit('Lakhs')}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      currencyUnit === 'Lakhs'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    INR Lakhs
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrencyUnit('Millions')}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      currencyUnit === 'Millions'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    INR Millions
                  </button>
                </div>
              </div>

              {projects.length === 0 || !currentProject ? (
                <DashboardCard>
                  <DashboardEmptyState
                    icon={Building2}
                    title={dataLoading ? 'Loading projects...' : 'No projects yet'}
                    description={
                      canEdit
                        ? 'Click "New Project" above to create a project entity.'
                        : 'No projects have been registered yet.'
                    }
                  />
                </DashboardCard>
              ) : (
                <>
                  {/* Probability Meter */}
                  <DashboardCard className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Probability of Success
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-blue-600 tabular-nums">
                          {currentProbability}%
                        </span>

                        {canEdit ? (
                          <button
                            type="button"
                            onClick={handleToggleFunded}
                            className={`min-h-[44px] sm:min-h-0 px-3.5 sm:px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                              currentProject?.isFunded
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {currentProject?.isFunded ? 'Funded (100%)' : 'Mark as Funded'}
                          </button>
                        ) : (
                          <DashboardStatusBadge
                            status={currentProject?.isFunded ? 'Funded' : currentProject?.status || 'In Appraisal'}
                          />
                        )}
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          currentProbability === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${currentProbability}%` }}
                      />
                    </div>

                    {/* Quick Document Preview & Offline Download Actions */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Project Teaser &amp; DPR Documents
                      </span>
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAdminProjectDocument(currentProject.id, 'teaser', 'preview', currentProject)}
                          className="min-h-[44px] sm:min-h-0 px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>Preview Teaser</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminProjectDocument(currentProject.id, 'teaser', 'download', currentProject)}
                          className="min-h-[44px] sm:min-h-0 px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white border border-slate-200 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span>Teaser PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminDownloadDocx(currentProject.id, currentProject)}
                          className="min-h-[44px] sm:min-h-0 px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white border border-slate-200 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                        >
                          <FileCode className="w-3.5 h-3.5 shrink-0" />
                          <span>Teaser DOCX</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminProjectDocument(currentProject.id, 'dpr', 'preview', currentProject)}
                          className="min-h-[44px] sm:min-h-0 px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>Preview DPR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminProjectDocument(currentProject.id, 'dpr', 'download', currentProject)}
                          className="col-span-2 sm:col-span-1 min-h-[44px] sm:min-h-0 px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span>DPR PDF</span>
                        </button>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Promoters */}
                  <DashboardCard>
                    <DashboardCardHeader
                      title={`Promoters (${currentProject?.promoters.length || 0})`}
                      actions={
                        canEdit ? (
                          <button
                            type="button"
                            onClick={() => setShowAddPromoterForm(!showAddPromoterForm)}
                            className="min-h-[44px] sm:min-h-0 px-3.5 sm:px-3 py-2 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Promoter</span>
                          </button>
                        ) : undefined
                      }
                    />

                    {showAddPromoterForm && canEdit && (
                      <form
                        onSubmit={handleAddPromoter}
                        className="m-4 sm:m-5 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs"
                      >
                        <input
                          type="text"
                          placeholder="Name"
                          required
                          value={newPromoterName}
                          onChange={(e) => setNewPromoterName(e.target.value)}
                          className="min-h-[44px] sm:min-h-0 px-3 py-2 text-sm sm:text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <input
                          type="text"
                          placeholder="Experience"
                          value={newPromoterExp}
                          onChange={(e) => setNewPromoterExp(e.target.value)}
                          className="min-h-[44px] sm:min-h-0 px-3 py-2 text-sm sm:text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <input
                          type="text"
                          placeholder="Qualification"
                          value={newPromoterQual}
                          onChange={(e) => setNewPromoterQual(e.target.value)}
                          className="min-h-[44px] sm:min-h-0 px-3 py-2 text-sm sm:text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <input
                          type="number"
                          placeholder="Share %"
                          value={newPromoterShare}
                          onChange={(e) => setNewPromoterShare(e.target.value)}
                          className="min-h-[44px] sm:min-h-0 px-3 py-2 text-sm sm:text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 tabular-nums"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Role"
                            value={newPromoterRole}
                            onChange={(e) => setNewPromoterRole(e.target.value)}
                            className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 text-sm sm:text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <button
                            type="submit"
                            className="min-h-[44px] sm:min-h-0 px-4 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Mobile Stacked Cards */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {currentProject?.promoters.map((p) => (
                        <div key={p.id} className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                              <div className="text-xs text-slate-600 mt-0.5">{p.role}</div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold tabular-nums">
                                {p.shareholdingPct}%
                              </span>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePromoter(p.id)}
                                  aria-label={`Delete promoter ${p.name}`}
                                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors -mr-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-200/70">
                            <div>
                              <span className="text-[11px] text-slate-500 block">Experience</span>
                              <span className="font-medium text-slate-800">{p.experience}</span>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 block">Qualification</span>
                              <span className="font-medium text-slate-800">{p.qualification}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`hidden md:block ${DASHBOARD_TABLE.wrapper}`}>
                      <table className={DASHBOARD_TABLE.table}>
                        <thead className={DASHBOARD_TABLE.thead}>
                          <tr>
                            <th className={DASHBOARD_TABLE.th}>Name</th>
                            <th className={DASHBOARD_TABLE.th}>Experience</th>
                            <th className={DASHBOARD_TABLE.th}>Qualification</th>
                            <th className={DASHBOARD_TABLE.th}>Role</th>
                            <th className={DASHBOARD_TABLE.th}>Share %</th>
                            {canEdit && <th className={`${DASHBOARD_TABLE.th} text-right`}>Actions</th>}
                          </tr>
                        </thead>
                        <tbody className={DASHBOARD_TABLE.tbody}>
                          {currentProject?.promoters.map((p) => (
                            <tr key={p.id} className={DASHBOARD_TABLE.tr}>
                              <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900`}>{p.name}</td>
                              <td className={`${DASHBOARD_TABLE.td} text-slate-600`}>{p.experience}</td>
                              <td className={`${DASHBOARD_TABLE.td} text-slate-600`}>{p.qualification}</td>
                              <td className={`${DASHBOARD_TABLE.td} text-slate-700 font-medium`}>{p.role}</td>
                              <td className={`${DASHBOARD_TABLE.td} font-semibold text-blue-600 tabular-nums`}>
                                {p.shareholdingPct}%
                              </td>
                              {canEdit && (
                                <td className={`${DASHBOARD_TABLE.td} text-right`}>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePromoter(p.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </DashboardCard>

                  {/* Project Cost and Means of Finance */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                    {/* Project Cost Components */}
                    <DashboardCard className="p-4 sm:p-5 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider tabular-nums">
                          Project Cost ({formatCurrency(totalCostCr)})
                        </h3>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setShowAddCostForm(!showAddCostForm)}
                            className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Component</span>
                          </button>
                        )}
                      </div>

                      {showAddCostForm && canEdit && (
                        <form
                          onSubmit={handleAddCostComponent}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-2 text-xs"
                        >
                          <input
                            type="text"
                            placeholder="Component Name"
                            required
                            value={newCostCat}
                            onChange={(e) => setNewCostCat(e.target.value)}
                            className="flex-1 min-w-0 min-h-[44px] sm:min-h-0 px-3 py-2 text-sm sm:text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="Amount (₹ Cr)"
                              required
                              value={newCostAmount}
                              onChange={(e) => setNewCostAmount(e.target.value)}
                              className="flex-1 sm:w-28 min-h-[44px] sm:min-h-0 px-3 py-2 text-sm sm:text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 tabular-nums"
                            />
                            <button
                              type="submit"
                              className="min-h-[44px] sm:min-h-0 px-4 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="space-y-2">
                        {currentProject?.costComponents.map((comp) => (
                          <div
                            key={comp.id}
                            className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/70 rounded-lg text-xs"
                          >
                            <span className="font-medium text-slate-800">{comp.category}</span>
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                              <span className="font-semibold text-slate-900 tabular-nums">
                                {formatCurrency(comp.amountCr)}
                              </span>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCostComponent(comp.id)}
                                  aria-label={`Remove ${comp.category}`}
                                  className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-slate-400 hover:text-rose-600 cursor-pointer -mr-2 sm:mr-0"
                                >
                                  <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </DashboardCard>

                    {/* Means of Finance */}
                    <DashboardCard className="p-4 sm:p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider tabular-nums">
                          Means of Finance ({formatCurrency(totalMeansOfFinanceCr)})
                        </h3>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between gap-3">
                          <span className="font-medium text-slate-700">Promoter Equity</span>
                          {canEdit ? (
                            <input
                              type="number"
                              step="0.1"
                              value={currentProject?.meansOfFinance.equityCr}
                              onChange={(e) => handleUpdateFinance('equityCr', parseFloat(e.target.value) || 0)}
                              className="w-28 min-h-[44px] sm:min-h-0 px-2.5 py-2 sm:py-1.5 text-sm sm:text-xs bg-white border border-slate-200 rounded-lg text-right font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          ) : (
                            <span className="font-semibold text-slate-900 tabular-nums">
                              {formatCurrency(currentProject?.meansOfFinance.equityCr || 0)}
                            </span>
                          )}
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between gap-3">
                          <span className="font-medium text-slate-700">Term Debt / Bank Loan</span>
                          {canEdit ? (
                            <input
                              type="number"
                              step="0.1"
                              value={currentProject?.meansOfFinance.debtCr}
                              onChange={(e) => handleUpdateFinance('debtCr', parseFloat(e.target.value) || 0)}
                              className="w-28 min-h-[44px] sm:min-h-0 px-2.5 py-2 sm:py-1.5 text-sm sm:text-xs bg-white border border-slate-200 rounded-lg text-right font-semibold text-blue-600 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          ) : (
                            <span className="font-semibold text-blue-600 tabular-nums">
                              {formatCurrency(currentProject?.meansOfFinance.debtCr || 0)}
                            </span>
                          )}
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between gap-3">
                          <span className="font-medium text-slate-700">Subsidies / Grants</span>
                          {canEdit ? (
                            <input
                              type="number"
                              step="0.1"
                              value={currentProject?.meansOfFinance.subsidyCr}
                              onChange={(e) => handleUpdateFinance('subsidyCr', parseFloat(e.target.value) || 0)}
                              className="w-28 min-h-[44px] sm:min-h-0 px-2.5 py-2 sm:py-1.5 text-sm sm:text-xs bg-white border border-slate-200 rounded-lg text-right font-semibold text-emerald-600 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                          ) : (
                            <span className="font-semibold text-emerald-600 tabular-nums">
                              {formatCurrency(currentProject?.meansOfFinance.subsidyCr || 0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </DashboardCard>
                  </div>

                  {/* Checklist */}
                  <DashboardCard className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Checklist
                      </h3>
                      {canEdit && (
                        <label className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Checklist</span>
                          <input
                            type="file"
                            onChange={handleUploadChecklist}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            currentProject?.checklistUploaded ? 'text-emerald-600' : 'text-slate-300'
                          }`}
                        />
                        <span className="font-medium text-slate-800 truncate">
                          {currentProject?.checklistUploaded
                            ? currentProject.checklistFileName || 'Generic Checklist Document'
                            : 'No checklist uploaded'}
                        </span>
                      </div>
                      {currentProject?.checklistUploaded && (
                        <DashboardStatusBadge status="Uploaded" />
                      )}
                    </div>

                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/70 px-3 py-2 rounded-lg">
                      This checklist is indicative, not exhaustive, and may differ from bank to bank.
                    </p>
                  </DashboardCard>

                  {/* Documents */}
                  <DashboardCard className="p-4 sm:p-5 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Documents (Optional Uploads)
                      </h3>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {(
                        [
                          { key: 'companyKyc', label: 'Company KYC' },
                          { key: 'promoterKyc', label: 'Promoter KYC' },
                          { key: 'dpr', label: 'DPR' },
                          { key: 'financialModel', label: 'Financial model' },
                          { key: 'otherDocs', label: 'Other documents' },
                        ] as const
                      ).map((doc) => {
                        const uploadedFile = currentProject?.documents[doc.key];
                        return (
                          <div
                            key={doc.key}
                            className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <span className="font-medium text-slate-800">{doc.label}</span>
                              {uploadedFile && (
                                <div className="text-[11px] text-slate-500 truncate mt-0.5">{uploadedFile}</div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {uploadedFile ? (
                                <>
                                  <DashboardStatusBadge status="Approved" />
                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDocument(doc.key)}
                                      aria-label={`Remove ${doc.label}`}
                                      className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1 flex items-center justify-center text-slate-400 hover:text-rose-600 cursor-pointer -mr-2 sm:mr-0"
                                    >
                                      <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                  )}
                                </>
                              ) : (
                                canEdit && (
                                  <label className="min-h-[44px] sm:min-h-0 px-3 sm:px-2.5 py-2 sm:py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer text-xs sm:text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                                    <Upload className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                    <span>Upload</span>
                                    <input
                                      type="file"
                                      onChange={(e) => handleUploadDocument(doc.key, e)}
                                      className="hidden"
                                    />
                                  </label>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </DashboardCard>
                </>
              )}
            </div>
          )}

          {/* 3. DPR Requests */}
          {activeTab === 'dpr' && (
            <DashboardCard>
              <DashboardCardHeader
                title={`DPR & Pipeline Assignments (${dprRequests.length})`}
                description="Assign project appraisals to DPR engineering consultants."
              />
              {dprRequests.length === 0 ? (
                <DashboardEmptyState
                  icon={FileText}
                  title="No DPR requests yet"
                  description="DPR preparation requests submitted by promoters will appear here."
                />
              ) : (
                <>
                  {/* Mobile Stacked Cards */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {dprRequests.map((req) => (
                      <div key={req.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-sm">{req.projectName}</div>
                            <div className="text-xs text-slate-600 mt-0.5">{req.promoterName}</div>
                            <div className="text-xs text-slate-500 mt-0.5 break-all">
                              {req.email} · {req.phone}
                            </div>
                          </div>
                          <DashboardStatusBadge status={req.status || 'Active Lead'} />
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Date</span>
                          <span className="font-medium text-slate-700 tabular-nums">{req.date}</span>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 block">Assigned Consultant</span>
                          {canEdit ? (
                            <UISelect
                              value={req.assignedConsultant || ''}
                              onValueChange={(val) => handleAssignDprConsultant(req.id, val)}
                              placeholder="Unassigned"
                              options={[
                                { value: '', label: 'Unassigned' },
                                { value: 'DPR Consultant 1', label: 'DPR Consultant 1' },
                                { value: 'DPR Consultant 2', label: 'DPR Consultant 2' },
                                { value: 'DPR Consultant 3', label: 'DPR Consultant 3' },
                                { value: 'DPR Consultant 4', label: 'DPR Consultant 4' },
                              ]}
                              triggerClassName="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border-slate-200"
                            />
                          ) : (
                            <div className="text-xs font-semibold text-slate-800 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
                              {req.assignedConsultant || 'Unassigned'}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleAdminProjectDocument(req.id, 'dpr', 'preview')}
                            className="min-h-[44px] px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-4 h-4 shrink-0" />
                            <span>DPR</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdminProjectDocument(req.id, 'dpr', 'download')}
                            className="min-h-[44px] px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-4 h-4 shrink-0" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`hidden md:block ${DASHBOARD_TABLE.wrapper}`}>
                    <table className={DASHBOARD_TABLE.table}>
                      <thead className={DASHBOARD_TABLE.thead}>
                        <tr>
                          <th className={DASHBOARD_TABLE.th}>Project / Promoter</th>
                          <th className={DASHBOARD_TABLE.th}>Contact</th>
                          <th className={DASHBOARD_TABLE.th}>Status</th>
                          <th className={DASHBOARD_TABLE.th}>Date</th>
                          <th className={DASHBOARD_TABLE.th}>Assigned Consultant</th>
                          <th className={`${DASHBOARD_TABLE.th} text-right`}>Documents</th>
                        </tr>
                      </thead>
                      <tbody className={DASHBOARD_TABLE.tbody}>
                        {dprRequests.map((req) => (
                          <tr key={req.id} className={DASHBOARD_TABLE.tr}>
                            <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900`}>
                              {req.projectName}
                              <div className="text-[11px] text-slate-500 font-normal mt-0.5">{req.promoterName}</div>
                            </td>
                            <td className={`${DASHBOARD_TABLE.td} text-slate-600`}>
                              <div>{req.email}</div>
                              <div className="text-[11px] text-slate-400 tabular-nums">{req.phone}</div>
                            </td>
                            <td className={DASHBOARD_TABLE.td}>
                              <DashboardStatusBadge status={req.status || 'Active Lead'} />
                            </td>
                            <td className={`${DASHBOARD_TABLE.td} text-slate-500 whitespace-nowrap tabular-nums`}>
                              {req.date}
                            </td>
                            <td className={DASHBOARD_TABLE.td}>
                              {canEdit ? (
                                <UISelect
                                  value={req.assignedConsultant || ''}
                                  onValueChange={(val) => handleAssignDprConsultant(req.id, val)}
                                  placeholder="Unassigned"
                                  options={[
                                    { value: '', label: 'Unassigned' },
                                    { value: 'DPR Consultant 1', label: 'DPR Consultant 1' },
                                    { value: 'DPR Consultant 2', label: 'DPR Consultant 2' },
                                    { value: 'DPR Consultant 3', label: 'DPR Consultant 3' },
                                    { value: 'DPR Consultant 4', label: 'DPR Consultant 4' },
                                  ]}
                                  triggerClassName="h-8 px-2.5 py-1 text-xs bg-slate-50 border-slate-200"
                                />
                              ) : (
                                <span className="font-semibold text-slate-800">
                                  {req.assignedConsultant || 'Unassigned'}
                                </span>
                              )}
                            </td>
                            <td className={`${DASHBOARD_TABLE.td} text-right`}>
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAdminProjectDocument(req.id, 'dpr', 'preview')}
                                  title="Preview DPR PDF"
                                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>DPR</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdminProjectDocument(req.id, 'dpr', 'download')}
                                  title="Download DPR PDF"
                                  className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </DashboardCard>
          )}

          {/* 4. Consultations */}
          {activeTab === 'consultations' && (
            <DashboardCard>
              <DashboardCardHeader
                title={`Consultations (${consultations.length})`}
                description="Review advisory consultations and route requests to Prosync Desk."
              />
              {consultations.length === 0 ? (
                <DashboardEmptyState
                  icon={PhoneCall}
                  title="No consultations yet"
                  description="Scheduled promoter consultations will appear here."
                />
              ) : (
                <>
                  {/* Mobile Stacked Cards */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {consultations.map((c) => (
                      <div key={c.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-sm">{c.clientName}</div>
                            <div className="text-xs font-medium text-slate-700 mt-0.5">{c.projectCategory}</div>
                            <div className="text-xs text-slate-500 mt-0.5 break-all">
                              {c.email} · {c.phone}
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-500 whitespace-nowrap tabular-nums shrink-0">
                            {c.date}
                          </span>
                        </div>
                        <div>
                          {c.assignedTo === 'Prosync' ? (
                            <DashboardStatusBadge status="Assigned to Prosync" />
                          ) : canEdit ? (
                            <button
                              type="button"
                              onClick={() => handleAssignConsultationToProsync(c.id)}
                              className="w-full min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
                            >
                              Assign to Prosync
                            </button>
                          ) : (
                            <span className="text-slate-500 font-medium text-xs">{c.status || 'Unassigned'}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`hidden md:block ${DASHBOARD_TABLE.wrapper}`}>
                    <table className={DASHBOARD_TABLE.table}>
                      <thead className={DASHBOARD_TABLE.thead}>
                        <tr>
                          <th className={DASHBOARD_TABLE.th}>Client Name</th>
                          <th className={DASHBOARD_TABLE.th}>Contact</th>
                          <th className={DASHBOARD_TABLE.th}>Category / Slot</th>
                          <th className={DASHBOARD_TABLE.th}>Date</th>
                          <th className={`${DASHBOARD_TABLE.th} text-right`}>Assignment</th>
                        </tr>
                      </thead>
                      <tbody className={DASHBOARD_TABLE.tbody}>
                        {consultations.map((c) => (
                          <tr key={c.id} className={DASHBOARD_TABLE.tr}>
                            <td className={`${DASHBOARD_TABLE.td} font-semibold text-slate-900`}>{c.clientName}</td>
                            <td className={`${DASHBOARD_TABLE.td} text-slate-600`}>
                              <div>{c.email}</div>
                              <div className="text-[11px] text-slate-400 tabular-nums">{c.phone}</div>
                            </td>
                            <td className={`${DASHBOARD_TABLE.td} font-medium text-slate-800`}>{c.projectCategory}</td>
                            <td className={`${DASHBOARD_TABLE.td} text-slate-500 whitespace-nowrap tabular-nums`}>
                              {c.date}
                            </td>
                            <td className={`${DASHBOARD_TABLE.td} text-right`}>
                              {c.assignedTo === 'Prosync' ? (
                                <DashboardStatusBadge status="Assigned to Prosync" />
                              ) : canEdit ? (
                                <button
                                  type="button"
                                  onClick={() => handleAssignConsultationToProsync(c.id)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg cursor-pointer whitespace-nowrap"
                                >
                                  Assign to Prosync
                                </button>
                              ) : (
                                <span className="text-slate-500 font-medium text-xs">{c.status || 'Unassigned'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </DashboardCard>
          )}

          {/* 5. Visitors */}
          {activeTab === 'visitors' && (
            <DashboardCard>
              <DashboardCardHeader
                title={`Visitor Sessions (${visitors.length})`}
                description="Recent web client telemetry recorded across application routes."
                actions={
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                    Read-Only
                  </span>
                }
              />
              {visitors.length === 0 ? (
                <DashboardEmptyState
                  icon={Globe}
                  title="No visitor sessions recorded"
                  description="Client session visits will appear here once traffic is logged."
                />
              ) : (
                <>
                  {/* Mobile Stacked Cards */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {visitors.map((v) => (
                      <div key={v.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-sm break-all">{v.path}</div>
                            <div className="font-mono text-[11px] text-slate-500 mt-0.5 truncate">{v.sessionId}</div>
                          </div>
                          <span className="text-[11px] text-slate-500 whitespace-nowrap tabular-nums shrink-0">
                            {new Date(v.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                          <div>
                            <div className="text-[11px] text-slate-500">Device</div>
                            <div className="font-medium text-slate-800 truncate mt-0.5">{v.device}</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-slate-500">Browser</div>
                            <div className="font-medium text-slate-800 truncate mt-0.5">{v.browser}</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-slate-500">Location</div>
                            <div className="font-medium text-slate-800 truncate mt-0.5">{v.location || 'Local'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`hidden md:block ${DASHBOARD_TABLE.wrapper}`}>
                    <table className={DASHBOARD_TABLE.table}>
                      <thead className={DASHBOARD_TABLE.thead}>
                        <tr>
                          <th className={DASHBOARD_TABLE.th}>Session ID</th>
                          <th className={DASHBOARD_TABLE.th}>Page Visited</th>
                          <th className={DASHBOARD_TABLE.th}>Timestamp</th>
                          <th className={DASHBOARD_TABLE.th}>Device / OS</th>
                          <th className={DASHBOARD_TABLE.th}>Browser</th>
                          <th className={DASHBOARD_TABLE.th}>Location</th>
                        </tr>
                      </thead>
                      <tbody className={DASHBOARD_TABLE.tbody}>
                        {visitors.map((v) => (
                          <tr key={v.id} className={DASHBOARD_TABLE.tr}>
                            <td className={`${DASHBOARD_TABLE.td} font-mono text-[11px] text-slate-600`}>
                              {v.sessionId}
                            </td>
                            <td className={`${DASHBOARD_TABLE.td} font-medium text-slate-900`}>{v.path}</td>
                            <td className={`${DASHBOARD_TABLE.td} text-slate-500 whitespace-nowrap tabular-nums`}>
                              {new Date(v.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </td>
                            <td className={`${DASHBOARD_TABLE.td} text-slate-700`}>{v.device}</td>
                            <td className={`${DASHBOARD_TABLE.td} text-slate-700`}>{v.browser}</td>
                            <td className={`${DASHBOARD_TABLE.td} text-slate-700`}>
                              {v.location || 'Local / Inferred'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </DashboardCard>
          )}
        </DashboardLayout>
      )}

      {/* Mobile Bottom Sheet: Project Options & Currency Unit */}
      <DashboardBottomSheet
        open={isProjectOptionsOpen}
        onClose={() => setIsProjectOptionsOpen(false)}
        title="Project Options"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">Currency Display Unit</div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'Cr' as CurrencyUnit, label: 'INR Crores' },
                { value: 'Lakhs' as CurrencyUnit, label: 'INR Lakhs' },
                { value: 'Millions' as CurrencyUnit, label: 'INR Millions' },
              ]).map((unit) => (
                <button
                  key={unit.value}
                  type="button"
                  onClick={() => setCurrencyUnit(unit.value)}
                  className={`min-h-[44px] px-2.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    currencyUnit === unit.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>

          {canEdit && currentProject && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsProjectOptionsOpen(false);
                  handleOpenEditProject();
                }}
                className="w-full min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 shrink-0" />
                <span>Edit Project Details</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsProjectOptionsOpen(false);
                  handleDeleteProject(currentProject.id);
                }}
                className="w-full min-h-[44px] px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>Delete Project</span>
              </button>
            </div>
          )}
        </div>
      </DashboardBottomSheet>

      {/* Modal: Admin New Project Creation */}
      {showNewProjectModal && canEdit && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-[90dvh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-slate-900 font-manrope">Create New Project</h3>
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                aria-label="Close create project modal"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer -mr-2"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. Solar Park Alpha"
                  className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Promoter Name *</label>
                <input
                  type="text"
                  required
                  value={newProjPromoter}
                  onChange={(e) => setNewProjPromoter(e.target.value)}
                  placeholder="e.g. Rajesh Verma"
                  className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Industry *</label>
                  <input
                    type="text"
                    required
                    value={newProjIndustry}
                    onChange={(e) => setNewProjIndustry(e.target.value)}
                    placeholder="e.g. Renewable Energy"
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    value={newProjLocation}
                    onChange={(e) => setNewProjLocation(e.target.value)}
                    placeholder="e.g. Gujarat, India"
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={newProjEmail}
                    onChange={(e) => setNewProjEmail(e.target.value)}
                    placeholder="promoter@company.in"
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile</label>
                  <input
                    type="text"
                    value={newProjMobile}
                    onChange={(e) => setNewProjMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Capex (₹ Cr) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newProjCapex}
                    onChange={(e) => setNewProjCapex(e.target.value)}
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Term Loan (₹ Cr) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newProjLoan}
                    onChange={(e) => setNewProjLoan(e.target.value)}
                    className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 tabular-nums"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="min-h-[44px] sm:min-h-0 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="min-h-[44px] sm:min-h-0 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {creatingProject ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Admin Edit Project Details */}
      {showEditProjectModal && canEdit && currentProject && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-[90dvh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-slate-900 font-manrope">Edit Project Details</h3>
              <button
                type="button"
                onClick={() => setShowEditProjectModal(false)}
                aria-label="Close edit project modal"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer -mr-2"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProjectDetails} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={editProjData.name}
                  onChange={(e) => setEditProjData({ ...editProjData, name: e.target.value })}
                  className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lead Promoter</label>
                <input
                  type="text"
                  value={editProjData.promoterName}
                  onChange={(e) => setEditProjData({ ...editProjData, promoterName: e.target.value })}
                  className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Industry</label>
                <input
                  type="text"
                  value={editProjData.industry}
                  onChange={(e) => setEditProjData({ ...editProjData, industry: e.target.value })}
                  className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Location</label>
                <input
                  type="text"
                  value={editProjData.location}
                  onChange={(e) => setEditProjData({ ...editProjData, location: e.target.value })}
                  className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProjectModal(false)}
                  className="min-h-[44px] sm:min-h-0 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] sm:min-h-0 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 cursor-pointer whitespace-nowrap"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Document Preview Modal (Teaser PDF & DPR PDF) */}
      <PdfPreviewModal preview={pdfPreview} onClose={() => setPdfPreview(null)} />
    </div>
  );
};

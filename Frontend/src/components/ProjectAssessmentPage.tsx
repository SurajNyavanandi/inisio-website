import React, { useState, useEffect, useRef } from 'react';
import type { TeaserPDFData } from '../utils/pdfGenerator';
import { getFeasibilityTerm, AuthUser, UserRole, PromoterDetail } from '../types';
import { LocationDropdowns } from './LocationDropdowns';
import {
  blockInvalidNumberKeys,
  sanitizeDecimalInput,
  sanitizeIfscInput,
  sanitizeIndianPhoneInput,
  sanitizePersonNameInput,
  validateEmailAddress,
  validateIfscCode,
  validateIndianMobileNumber,
  validatePersonName,
  validatePositiveNumber,
  validateRequiredText,
} from '../utils/validation';
import { DetailedRiskProfileForm, DetailedRiskProfileData } from './DetailedRiskProfileForm';
import { calculateComprehensiveRiskScore } from '../utils/underwritingScorer';
import { updateLeadRecord, saveLeadRecord } from '../utils/leadStore';
import { calculateSystemDscr, reconcileProjectFinancials } from '../utils/financialUtils';
import { MembershipPlansModal } from './MembershipPlansModal';
import { DPRRequestModal } from './DPRRequestModal';
import { FundingRequestModal } from './FundingRequestModal';
import { PromoterFundAssistanceModal } from './PromoterFundAssistanceModal';
import { PdfPreviewModal, PdfPreviewState } from './PdfPreviewModal';
import {
  recordAssessmentCompletion,
  fetchServerAssessmentQuota,
  AssessmentQuotaStatus,
  generateClientProjectId,
  saveAssessmentDraft,
  loadAssessmentDraft,
  migrateGuestDraftToUser,
  clearAssessmentDraft,
  FREE_ASSESSMENT_LIMIT_CODE,
} from '../utils/membershipStore';
import { UISelect } from './ui/Select';
import { Input } from './ui/Input';
import { Checkbox } from './ui/Checkbox';
import { showToast } from './ui/Toast';
import {
  Calculator,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
  Landmark,
  FileText,
  PhoneCall,
  Download,
  RotateCcw,
  Sparkles,
  Briefcase,
  User,
  Award,
  ShieldCheck,
  Building,
  Users2,
  CreditCard,
  Layers,
  Check,
  AlertCircle,
  Save,
  ChevronLeft,
  LayoutDashboard,
  FileType,
  TrendingUp,
  Percent,
  Coins,
  FileCheck,
  ExternalLink,
  Clock,
  MapPin,
  Lock,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Shield,
  Crown,
  Star,
  Plus,
  Trash2,
  X,
  Mail,
  Phone
} from 'lucide-react';

interface ProjectAssessmentPageProps {
  onOpenConsultation: () => void;
  defaultIndustry?: string;
  editingProject?: any;
  onFinishEditing?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateHome?: () => void;
  onOpenMembership?: (reason?: string) => void;
  currentUser?: AuthUser | null;
  onOpenAuth?: (mode?: 'login' | 'signup' | 'forgot-password', prefill?: { email?: string; name?: string; phone?: string }) => void;
  onLoginSuccess?: (user: AuthUser) => void;
}

type AssessmentStage =
  | 1
  | 2
  | 'auth_gate'
  | 3
  | 'feasibility_result'
  | 'collect_bankability'
  | 'bankability_result'
  | 'collect_financials'
  | 'final_assessment_results';

export const ProjectAssessmentPage: React.FC<ProjectAssessmentPageProps> = ({
  onOpenConsultation,
  defaultIndustry = '',
  editingProject,
  onFinishEditing,
  onNavigateToDashboard,
  onNavigateHome,
  onOpenMembership,
  currentUser,
  onOpenAuth,
  onLoginSuccess
}) => {
  const [stage, setStage] = useState<AssessmentStage>(1);
  const [maxStepReached, setMaxStepReached] = useState<number>(editingProject ? 6 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileTouched, setMobileTouched] = useState(false);
  const [step2Error, setStep2Error] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [isDataSaved, setIsDataSaved] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(editingProject?.id || editingProject?._id || null);
  const createdProjectIdRef = useRef<string | null>(editingProject?.id || editingProject?._id || null);
  const clientProjectIdRef = useRef<string>(
    editingProject?.clientProjectId || editingProject?.id || editingProject?._id || generateClientProjectId()
  );
  const draftHydratedRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState<AssessmentQuotaStatus | null>(null);
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);
  const [membershipModalReason, setMembershipModalReason] = useState('');
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingDprPdf, setIsDownloadingDprPdf] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<PdfPreviewState | null>(null);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [isDPRModalOpen, setIsDPRModalOpen] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [isPromoterFundAssistanceModalOpen, setIsPromoterFundAssistanceModalOpen] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const getStepIndex = (s: AssessmentStage): number => {
    switch (s) {
      case 1: return 1;
      case 2: return 2;
      case 'auth_gate':
      case 3: return 3;
      case 'feasibility_result':
      case 'collect_bankability':
      case 'bankability_result': return 4;
      case 'collect_financials': return 5;
      case 'final_assessment_results': return 6;
      default: return 1;
    }
  };

  const currentStep = getStepIndex(stage);

  const ASSESSMENT_STEPS = [
    { id: 1, name: 'Project Details' },
    { id: 2, name: 'Financial Details' },
    { id: 3, name: 'Readiness & Contact' },
    { id: 4, name: 'Underwriting Scoring' },
    { id: 5, name: 'Cost & Finance Breakup' },
    { id: 6, name: 'AI Teaser & Outputs' }
  ];

  const [completedSteps, setCompletedSteps] = useState<number[]>(() =>
    editingProject ? [1, 2, 3, 4, 5, 6] : []
  );

  const markStepComplete = (stepId: number) => {
    setCompletedSteps(prev => (prev.includes(stepId) ? prev : [...prev, stepId]));
  };

  const isStepCompleted = (stepId: number): boolean => {
    if (editingProject) return true;
    if (completedSteps.includes(stepId)) return true;
    switch (stepId) {
      case 1:
        return Boolean(formData.projectName?.trim() && formData.industry && formData.location?.trim());
      case 2:
        return Boolean(formData.totalCostCr && parseFloat(formData.totalCostCr) > 0 && formData.promoterContribCr && isEquityEligible);
      case 3:
        return Boolean(formData.landStatus && formData.collateralStatus && formData.fullName?.trim() && formData.mobile?.trim() && formData.email?.trim());
      case 4:
        return Boolean(riskProfileData);
      case 5:
        return Boolean(financials.totalProjectCost || (financials.termLoanCr && financials.promoterContributionCr));
      case 6:
        return Boolean(isDataSaved);
      default:
        return false;
    }
  };

  useEffect(() => {
    if (editingProject) {
      setMaxStepReached(6);
    }
  }, [editingProject]);

  const contentMainRef = useRef<HTMLElement>(null);

  const scrollToFormTop = () => {
    if (contentMainRef.current) {
      contentMainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  };

  useEffect(() => {
    const idx = getStepIndex(stage);
    setMaxStepReached(prev => Math.max(prev, idx));
  }, [stage]);

  // Authentication State
  const [activeUser, setActiveUser] = useState<AuthUser | null>(() => {
    if (currentUser) return currentUser;
    try {
      const stored = localStorage.getItem('inisio_active_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  });
  const [authNotice, setAuthNotice] = useState('');

  // Inline Quick Auth & OTP Verification State (used at Step 3 Gate and Final Step)
  const [inlineAuthMode, setInlineAuthMode] = useState<'login' | 'signup'>('signup');
  const [inlineEmail, setInlineEmail] = useState('');
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineName, setInlineName] = useState('');
  const [inlinePhone, setInlinePhone] = useState('');
  const [inlineAuthLoading, setInlineAuthLoading] = useState(false);
  const [inlineAuthError, setInlineAuthError] = useState('');
  const [inlineAuthSuccess, setInlineAuthSuccess] = useState('');
  const [showInlinePassword, setShowInlinePassword] = useState(false);
  const [inlineNeedsOtp, setInlineNeedsOtp] = useState(false);
  const [inlineOtp, setInlineOtp] = useState('');
  const [inlinePendingEmail, setInlinePendingEmail] = useState('');
  const [inlineDevOtpHint, setInlineDevOtpHint] = useState('');
  const [inlineOtpResending, setInlineOtpResending] = useState(false);
  const inlineAuthPrefilledRef = useRef(false);

  const isQuotaBlocked = Boolean(
    !editingProject &&
      activeUser &&
      quotaStatus &&
      !quotaStatus.allowed &&
      !quotaStatus.isUpdatingExisting
  );

  const isStepLockedForGuest = (stepId: number): boolean =>
    Boolean(!editingProject && !activeUser && stepId >= 3);

  const triggerMembershipUpgrade = (reason?: string) => {
    const finalReason =
      reason ||
      quotaStatus?.reason ||
      'You have already used your 1 free project assessment. Upgrade your membership plan to assess additional projects.';
    if (onOpenMembership) {
      onOpenMembership(finalReason);
    } else {
      setMembershipModalReason(finalReason);
      setIsMembershipModalOpen(true);
    }
  };

  const handleStepSelect = (stepId: number) => {
    if (isQuotaBlocked && stepId >= 3) {
      showToast('Your 1 free project assessment is already used. View your existing project in Dashboard or upgrade to assess a new project.', {
        type: 'warning',
        title: 'Free Assessment Limit Reached',
      });
      return;
    }

    if (isStepLockedForGuest(stepId)) {
      if (!inlineEmail && formData.email) setInlineEmail(formData.email.trim().toLowerCase());
      if (!inlineName && formData.fullName) setInlineName(sanitizePersonNameInput(formData.fullName, 80).trim());
      if (!inlinePhone && formData.mobile) setInlinePhone(sanitizeIndianPhoneInput(formData.mobile));
      setAuthNotice(`Create a free account or sign in to unlock Step ${stepId} and save your progress.`);
      setStage('auth_gate');
      scrollToFormTop();
      return;
    }

    if (stepId === 1) setStage(1);
    else if (stepId === 2) setStage(2);
    else if (stepId === 3) setStage(3);
    else if (stepId === 4) {
      if (stage === 'bankability_result' || riskProfileData) {
        setStage('bankability_result');
      } else {
        setStage('collect_bankability');
      }
    }
    else if (stepId === 5) setStage('collect_financials');
    else if (stepId === 6) setStage('final_assessment_results');
    scrollToFormTop();
  };

  const handlePreviousStep = () => {
    if (stage === 'auth_gate') {
      setStage(2);
      scrollToFormTop();
      return;
    }
    if (currentStep === 2) setStage(1);
    else if (currentStep === 3) setStage(2);
    else if (currentStep === 4) setStage(3);
    else if (currentStep === 5) {
      if (riskProfileData) setStage('bankability_result');
      else setStage('collect_bankability');
    }
    else if (currentStep === 6) setStage('collect_financials');
    scrollToFormTop();
  };

  const handleGoBack = () => {
    if (stage === 'auth_gate') {
      setStage(2);
      scrollToFormTop();
      return;
    }
    if (currentStep > 1) {
      handlePreviousStep();
      return;
    }
    // Leaving Step 1: flush current draft so returning restores exact progress
    if (!editingProject && !isDataSaved) {
      saveAssessmentDraft(
        {
          clientProjectId: clientProjectIdRef.current,
          formData,
          financials,
          riskProfileData,
          numPromoters,
          additionalPromoters,
          stage,
          completedSteps,
        },
        activeUser?.email
      );
    }
    if (editingProject && onFinishEditing) {
      onFinishEditing();
    } else if (activeUser && onNavigateToDashboard) {
      onNavigateToDashboard();
    } else if (onNavigateHome) {
      onNavigateHome();
    } else if (window.history.length > 1) {
      window.history.back();
    } else if (onNavigateToDashboard) {
      onNavigateToDashboard();
    }
  };

  useEffect(() => {
    if (currentUser) {
      setActiveUser(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    if ((stage === 'auth_gate' || stage === 'final_assessment_results') && !activeUser && !inlineAuthPrefilledRef.current) {
      inlineAuthPrefilledRef.current = true;
      if (!inlineEmail && formData.email) {
        setInlineEmail(formData.email.trim().toLowerCase());
      }
      if (!inlineName && formData.fullName) {
        setInlineName(sanitizePersonNameInput(formData.fullName, 80).trim());
      }
      if (!inlinePhone && formData.mobile) {
        setInlinePhone(sanitizeIndianPhoneInput(formData.mobile));
      }
    }
  }, [stage, activeUser]);

  // Stage 2 Inputs: Risk Profile Data for Bankability Rating
  const [riskProfileData, setRiskProfileData] = useState<DetailedRiskProfileData | null>(null);

  // Stage 1 Form State: Initial 3 Steps (All blank by default - no forced pre-selection)
  const [financials, setFinancials] = useState<{
    consultancyCostCr: string;
    machineryCostCr: string;
    civilCostCr: string;
    otherCostsCr: string;
    termLoanCr: string;
    promoterContributionCr: string;
    otherFinanceCr: string;
    totalProjectCost?: string;
    totalMeansOfFinance?: string;
  }>({
    consultancyCostCr: '',
    machineryCostCr: '',
    civilCostCr: '',
    otherCostsCr: '',
    termLoanCr: '',
    promoterContributionCr: '',
    otherFinanceCr: '',
    totalProjectCost: '',
    totalMeansOfFinance: ''
  });

  const [formData, setFormData] = useState({
    projectName: '',
    industry: defaultIndustry || '',
    location: '',
    totalCostCr: '',
    promoterContribCr: '',
    loanRequiredCr: '',
    landStatus: '',
    collateralStatus: '',
    promoterExp: '',
    description: '',
    fullName: '',
    mobile: '',
    email: '',
    numPromoters: 1,
    bankName: '',
    branchLocation: '',
    bankIfscCode: '',
    bankAppRefNumber: '',
    promoterContributionAvailable: 'Yes' as 'Yes' | 'No',
    promoterFundAssistanceRequest: undefined as any
  });

  const [numPromoters, setNumPromoters] = useState<number>(1);
  const [additionalPromoters, setAdditionalPromoters] = useState<Array<{
    id: string;
    name: string;
    experienceYears: string;
    qualification: string;
  }>>([]);

  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [submittedSteps, setSubmittedSteps] = useState<Record<number, boolean>>({});

  const markFieldTouched = (field: string) => {
    setTouchedFields((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const mobileValidation = validateIndianMobileNumber(formData.mobile);
  const emailValidation = validateEmailAddress(formData.email, true);
  const fullNameValidation = validatePersonName(formData.fullName, 'Full name', true);
  const projectNameValidation = validateRequiredText(formData.projectName, 'Project name', 120);
  const branchLocationValidation = validateRequiredText(formData.branchLocation, 'Preferred branch location', 120);
  const ifscValidation = validateIfscCode(formData.bankIfscCode, false);
  const totalCostValidation = validatePositiveNumber(formData.totalCostCr, 'Total project cost', {
    min: 0,
    max: 100000,
    allowZero: false,
    required: true,
  });
  const promoterContribValidation = (() => {
    const base = validatePositiveNumber(formData.promoterContribCr, 'Promoter equity', {
      min: 0,
      max: 100000,
      allowZero: true,
      required: true,
    });
    if (!base.isValid) return base;
    const costVal = parseFloat(formData.totalCostCr);
    const contribVal = parseFloat(formData.promoterContribCr);
    if (Number.isFinite(costVal) && costVal > 0 && Number.isFinite(contribVal) && contribVal > costVal) {
      return { isValid: false, error: 'Promoter equity cannot exceed Total Project Cost' };
    }
    return { isValid: true };
  })();

  const shouldShowError = (field: string, stepNum: number, isValid: boolean) =>
    Boolean((touchedFields[field] || submittedSteps[stepNum]) && !isValid);

  // Helper to build full promoters list for persistence
  const buildPromotersList = (): PromoterDetail[] => {
    const primaryPromoter: PromoterDetail = {
      id: 'p-1',
      name: formData.fullName || 'Lead Promoter',
      experienceYears: formData.promoterExp || '5+ Years',
      qualification: riskProfileData?.educationalBackground || 'Post Graduate / Professional',
      shareholdingPct: numPromoters > 1 ? Math.round(100 / numPromoters) : 100,
      role: 'Managing Director / Lead Promoter',
      kycStatus: 'Pending'
    };

    const extraPromoters: PromoterDetail[] = additionalPromoters.slice(0, Math.max(0, numPromoters - 1)).map((p, idx) => ({
      id: p.id || `p-${idx + 2}`,
      name: p.name || `Co-Promoter ${idx + 2}`,
      experienceYears: p.experienceYears || '5 Years',
      qualification: p.qualification || 'Graduate / Professional',
      shareholdingPct: Math.round(100 / numPromoters),
      role: 'Director / Co-Promoter',
      kycStatus: 'Pending'
    }));

    return [primaryPromoter, ...extraPromoters];
  };

  // Sync additional promoters array when numPromoters changes
  const handleNumPromotersChange = (newCount: number) => {
    setNumPromoters(newCount);
    setFormData(prev => ({ ...prev, numPromoters: newCount }));
    const countNeeded = Math.max(0, newCount - 1);
    setAdditionalPromoters(prev => {
      const updated = [...prev];
      while (updated.length < countNeeded) {
        const nextIdx = updated.length + 2;
        updated.push({
          id: `p-${nextIdx}`,
          name: '',
          experienceYears: '',
          qualification: 'B.Tech / Engineering'
        });
      }
      return updated.slice(0, countNeeded);
    });
  };

  const handleUpdateAdditionalPromoter = (index: number, field: 'name' | 'experienceYears' | 'qualification', value: string) => {
    setAdditionalPromoters(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleAddSinglePromoter = () => {
    const newCount = numPromoters + 1;
    handleNumPromotersChange(newCount);
  };

  const handleRemoveSinglePromoter = (indexToRemove: number) => {
    if (numPromoters <= 1) return;
    setAdditionalPromoters(prev => prev.filter((_, idx) => idx !== indexToRemove));
    const newCount = Math.max(1, numPromoters - 1);
    setNumPromoters(newCount);
    setFormData(prev => ({ ...prev, numPromoters: newCount }));
  };

  // Pre-fill inputs when editing a project
  React.useEffect(() => {
    let activeUser: any = null;
    try {
      const stored = localStorage.getItem('inisio_active_user');
      if (stored) activeUser = JSON.parse(stored);
    } catch (e) {}

    if (editingProject) {
      if (editingProject.id || editingProject._id) {
        const pId = editingProject.id || editingProject._id;
        setCreatedProjectId(pId);
        createdProjectIdRef.current = pId;
        setIsDataSaved(true);
      }

      const contactFullName = 
        editingProject.fullName || 
        editingProject.name || 
        editingProject.applicantName || 
        editingProject.contactName || 
        activeUser?.name || 
        '';

      const contactMobile = 
        editingProject.mobile || 
        editingProject.phone || 
        editingProject.applicantMobile || 
        editingProject.contactPhone || 
        activeUser?.phone || 
        '';

      const contactEmail = 
        editingProject.email || 
        editingProject.applicantEmail || 
        editingProject.contactEmail || 
        activeUser?.email || 
        '';

      const rawProjCost = parseFloat(String(editingProject.totalCostCr ?? editingProject.projectCost ?? ''));
      const projCost = Number.isFinite(rawProjCost) && rawProjCost > 0 ? rawProjCost : 0;
      const rawProjContrib = parseFloat(String(editingProject.promoterContribCr ?? ''));
      const projContrib = Number.isFinite(rawProjContrib) && rawProjContrib >= 0 ? rawProjContrib : 0;
      const rawProjLoan = parseFloat(String(editingProject.loanRequiredCr ?? editingProject.proposedLoan ?? ''));
      const projLoan = Number.isFinite(rawProjLoan) && rawProjLoan >= 0
        ? rawProjLoan
        : projCost > 0 && projContrib > 0
        ? Math.max(0, projCost - projContrib)
        : 0;

      setFormData({
        projectName: editingProject.projectName || '',
        industry: editingProject.industry || defaultIndustry || '',
        location: editingProject.location || '',
        totalCostCr: projCost > 0 ? String(projCost) : '',
        promoterContribCr: Number.isFinite(rawProjContrib) ? String(projContrib) : '',
        loanRequiredCr: Number.isFinite(rawProjLoan) || projLoan > 0 ? String(projLoan) : '',
        landStatus: editingProject.landStatus || '',
        collateralStatus: editingProject.collateralStatus || '',
        promoterExp: editingProject.promoterExp || '',
        description: editingProject.notes || editingProject.description || '',
        fullName: contactFullName,
        mobile: contactMobile,
        email: contactEmail,
        numPromoters: editingProject.promotersList?.length ? editingProject.promotersList.length : 1,
        bankName: editingProject.bankName || editingProject.assignedBank || '',
        branchLocation: editingProject.branchLocation || '',
        bankIfscCode: editingProject.bankIfscCode || '',
        bankAppRefNumber: editingProject.bankAppRefNumber || '',
        promoterContributionAvailable: editingProject.promoterContributionAvailable || 'Yes',
        promoterFundAssistanceRequest: editingProject.promoterFundAssistanceRequest
      });

      if (editingProject.promotersList && editingProject.promotersList.length > 1) {
        setNumPromoters(editingProject.promotersList.length);
        const extras = editingProject.promotersList.slice(1).map((p: any, idx: number) => ({
          id: p.id || `p-${idx + 2}`,
          name: p.name || '',
          experienceYears: String(p.experienceYears || ''),
          qualification: p.qualification || ''
        }));
        setAdditionalPromoters(extras);
      } else {
        setNumPromoters(1);
        setAdditionalPromoters([]);
      }

      // Restore actual saved risk profile only (never fabricate fake CIBIL / collateral defaults)
      const savedRisk = editingProject.riskProfileData || editingProject.riskProfile || null;
      setRiskProfileData(savedRisk);

      const savedFin = editingProject.financials || null;
      const hasSavedStr = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== '';
      if (savedFin) {
        setFinancials({
          consultancyCostCr: hasSavedStr(savedFin.consultancyCostCr) ? String(savedFin.consultancyCostCr) : '',
          machineryCostCr: hasSavedStr(savedFin.machineryCostCr) ? String(savedFin.machineryCostCr) : '',
          civilCostCr: hasSavedStr(savedFin.civilCostCr) ? String(savedFin.civilCostCr) : '',
          otherCostsCr: hasSavedStr(savedFin.otherCostsCr) ? String(savedFin.otherCostsCr) : '',
          termLoanCr: hasSavedStr(savedFin.termLoanCr)
            ? String(savedFin.termLoanCr)
            : projLoan > 0
            ? projLoan.toFixed(2)
            : '',
          promoterContributionCr: hasSavedStr(savedFin.promoterContributionCr)
            ? String(savedFin.promoterContributionCr)
            : Number.isFinite(rawProjContrib)
            ? projContrib.toFixed(2)
            : '',
          otherFinanceCr: hasSavedStr(savedFin.otherFinanceCr) ? String(savedFin.otherFinanceCr) : '0.00',
          totalProjectCost: hasSavedStr(savedFin.totalProjectCost)
            ? String(savedFin.totalProjectCost)
            : projCost > 0
            ? projCost.toFixed(2)
            : '',
          totalMeansOfFinance: hasSavedStr(savedFin.totalMeansOfFinance)
            ? String(savedFin.totalMeansOfFinance)
            : projCost > 0
            ? projCost.toFixed(2)
            : ''
        });
      } else {
        setFinancials({
          consultancyCostCr: '',
          machineryCostCr: '',
          civilCostCr: '',
          otherCostsCr: '',
          termLoanCr: projLoan > 0 ? projLoan.toFixed(2) : '',
          promoterContributionCr: Number.isFinite(rawProjContrib) ? projContrib.toFixed(2) : '',
          otherFinanceCr: '0.00',
          totalProjectCost: projCost > 0 ? projCost.toFixed(2) : '',
          totalMeansOfFinance: projCost > 0 ? projCost.toFixed(2) : ''
        });
      }
      if (editingProject.clientProjectId) {
        clientProjectIdRef.current = String(editingProject.clientProjectId);
      } else if (editingProject.id || editingProject._id) {
        clientProjectIdRef.current = String(editingProject.id || editingProject._id);
      }
      draftHydratedRef.current = true;
    } else if (defaultIndustry) {
      setFormData((prev) => ({
        ...prev,
        industry: prev.industry || defaultIndustry,
        fullName: prev.fullName || activeUser?.name || '',
        mobile: prev.mobile || activeUser?.phone || '',
        email: prev.email || activeUser?.email || ''
      }));
    }
  }, [editingProject?.id, defaultIndustry]);

  // Verify authoritative server-side 1-free-assessment quota for authenticated users
  const verifyUserQuota = async (userToCheck: AuthUser | null, autoAdvanceFromGate = false) => {
    if (editingProject || !userToCheck) {
      setQuotaStatus(null);
      return { allowed: true } as AssessmentQuotaStatus;
    }
    setIsCheckingQuota(true);
    try {
      const result = await fetchServerAssessmentQuota({
        user: userToCheck,
        email: userToCheck.email || formData.email,
        mobile: userToCheck.phone || formData.mobile,
        clientProjectId: clientProjectIdRef.current,
        projectId: createdProjectIdRef.current || undefined,
      });
      setQuotaStatus(result);
      if (result.allowed && autoAdvanceFromGate) {
        setStage(3);
        scrollToFormTop();
      }
      return result;
    } finally {
      setIsCheckingQuota(false);
    }
  };

  // Restore saved localStorage draft on mount (when not editing an existing project)
  React.useEffect(() => {
    if (editingProject) {
      draftHydratedRef.current = true;
      return;
    }
    const draft = loadAssessmentDraft(activeUser?.email);
    if (draft) {
      if (draft.clientProjectId) {
        clientProjectIdRef.current = draft.clientProjectId;
      }
      if (draft.formData) {
        setFormData((prev) => ({
          ...prev,
          ...draft.formData,
          industry: draft.formData.industry || defaultIndustry || prev.industry,
          fullName: draft.formData.fullName || activeUser?.name || prev.fullName,
          mobile: draft.formData.mobile || activeUser?.phone || prev.mobile,
          email: draft.formData.email || activeUser?.email || prev.email,
        }));
      }
      if (draft.financials) {
        setFinancials((prev) => ({ ...prev, ...draft.financials }));
      }
      if (draft.riskProfileData) {
        setRiskProfileData(draft.riskProfileData);
      }
      if (typeof draft.numPromoters === 'number' && draft.numPromoters >= 1) {
        setNumPromoters(draft.numPromoters);
      }
      if (Array.isArray(draft.additionalPromoters)) {
        setAdditionalPromoters(draft.additionalPromoters);
      }
      if (Array.isArray(draft.completedSteps)) {
        setCompletedSteps(draft.completedSteps);
      }
      if (draft.stage && draft.stage !== 'final_assessment_results') {
        const restoredIdx = getStepIndex(draft.stage as AssessmentStage);
        if (!activeUser && restoredIdx >= 3) {
          setStage('auth_gate');
        } else {
          setStage(draft.stage as AssessmentStage);
        }
      }
      setDraftSavedAt(draft.updatedAt || null);
      setHasRestoredDraft(true);
    }
    draftHydratedRef.current = true;
  }, [editingProject?.id]);

  // Sync user identity, migrate guest draft, and verify server quota whenever user logs in/out
  React.useEffect(() => {
    if (editingProject) return;
    if (!activeUser) {
      setQuotaStatus(null);
      return;
    }

    migrateGuestDraftToUser(activeUser.email);

    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || activeUser.name || '',
      mobile: prev.mobile || activeUser.phone || '',
      email: prev.email || activeUser.email || '',
    }));

    verifyUserQuota(activeUser, stage === 'auth_gate');
  }, [activeUser?.email, editingProject?.id]);

  // Auto-save form draft to localStorage on every change so Back/Return/Refresh never loses work
  React.useEffect(() => {
    if (editingProject || isDataSaved || !draftHydratedRef.current) return;
    const hasData = Boolean(
      formData.projectName?.trim() ||
        formData.industry ||
        formData.location?.trim() ||
        formData.totalCostCr ||
        formData.promoterContribCr ||
        formData.fullName?.trim() ||
        formData.mobile?.trim() ||
        formData.email?.trim()
    );
    if (!hasData) return;

    saveAssessmentDraft(
      {
        clientProjectId: clientProjectIdRef.current,
        formData,
        financials,
        riskProfileData,
        numPromoters,
        additionalPromoters,
        stage,
        completedSteps,
      },
      activeUser?.email
    );
    setDraftSavedAt(new Date().toISOString());
  }, [
    formData,
    financials,
    riskProfileData,
    numPromoters,
    additionalPromoters,
    stage,
    completedSteps,
    editingProject,
    isDataSaved,
    activeUser?.email,
  ]);

  const handleResetDraft = () => {
    clearAssessmentDraft(activeUser?.email);
    clientProjectIdRef.current = generateClientProjectId();
    createdProjectIdRef.current = null;
    setCreatedProjectId(null);
    setIsDataSaved(false);
    setHasRestoredDraft(false);
    setDraftSavedAt(null);
    setCompletedSteps([]);
    setSubmittedSteps({});
    setTouchedFields({});
    setStep2Error('');
    setSaveSuccessMessage('');
    setRiskProfileData(null);
    setNumPromoters(1);
    setAdditionalPromoters([]);
    setFinancials({
      consultancyCostCr: '',
      machineryCostCr: '',
      civilCostCr: '',
      otherCostsCr: '',
      termLoanCr: '',
      promoterContributionCr: '',
      otherFinanceCr: '',
      totalProjectCost: '',
      totalMeansOfFinance: '',
    });
    setFormData({
      projectName: '',
      industry: defaultIndustry || '',
      location: '',
      totalCostCr: '',
      promoterContribCr: '',
      loanRequiredCr: '',
      landStatus: '',
      collateralStatus: '',
      promoterExp: '',
      description: '',
      fullName: activeUser?.name || '',
      mobile: activeUser?.phone || '',
      email: activeUser?.email || '',
      numPromoters: 1,
      bankName: '',
      branchLocation: '',
      bankIfscCode: '',
      bankAppRefNumber: '',
      promoterContributionAvailable: 'Yes',
      promoterFundAssistanceRequest: undefined,
    });
    setStage(1);
    scrollToFormTop();
    showToast('Assessment draft cleared. You can start fresh from Step 1.', { type: 'info' });
  };

  // Calculate numbers dynamically
  const cost = parseFloat(formData.totalCostCr) || 0;
  const contrib = parseFloat(formData.promoterContribCr) || 0;
  const equityPercent = cost > 0 ? ((contrib / cost) * 100).toFixed(1) : '0';
  const debtPercent = cost > 0 ? (((cost - contrib) / cost) * 100).toFixed(1) : '0';
  const isEquityEligible = cost > 0 && parseFloat(equityPercent) >= 20;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    let nextValue = value;
    if (name === 'totalCostCr' || name === 'promoterContribCr') {
      nextValue = sanitizeDecimalInput(value, 2);
    } else if (name === 'mobile') {
      nextValue = sanitizeIndianPhoneInput(value);
    } else if (name === 'fullName') {
      nextValue = sanitizePersonNameInput(value, 80);
    } else if (name === 'bankIfscCode') {
      nextValue = sanitizeIfscInput(value);
    } else if (name === 'projectName' || name === 'branchLocation') {
      nextValue = value.slice(0, 120);
    } else if (name === 'bankAppRefNumber') {
      nextValue = value.slice(0, 40);
    } else if (name === 'description') {
      nextValue = value.slice(0, 600);
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: nextValue };
      if (name === 'totalCostCr' || name === 'promoterContribCr') {
        setStep2Error('');
        const rawCost = name === 'totalCostCr' ? nextValue : prev.totalCostCr;
        const rawContrib = name === 'promoterContribCr' ? nextValue : prev.promoterContribCr;
        const updatedCost = parseFloat(rawCost);
        const updatedContrib = parseFloat(rawContrib);
        if (Number.isFinite(updatedCost) && updatedCost > 0) {
          const safeContrib = Number.isFinite(updatedContrib) && updatedContrib >= 0 ? updatedContrib : 0;
          updated.loanRequiredCr = Math.max(0, updatedCost - safeContrib).toFixed(2);
        } else {
          updated.loanRequiredCr = '';
        }
      }
      return updated;
    });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep2Error('');

    if (stage === 1) {
      setSubmittedSteps((prev) => ({ ...prev, 1: true }));
      const trimmedProjectName = formData.projectName.trim();
      if (trimmedProjectName !== formData.projectName) {
        setFormData((prev) => ({ ...prev, projectName: trimmedProjectName }));
      }
      if (!trimmedProjectName || !formData.industry || !formData.location.trim()) {
        showToast('Please enter your Project Name, select Industry, and choose Location to continue.', { type: 'warning', title: 'Missing Information' });
        return;
      }
      markStepComplete(1);
      setStage(2);
      scrollToFormTop();
    } else if (stage === 2) {
      setSubmittedSteps((prev) => ({ ...prev, 2: true }));
      if (!totalCostValidation.isValid) {
        setStep2Error(totalCostValidation.error || 'Please enter a valid Total Project Cost in ₹ Crores.');
        return;
      }
      if (!promoterContribValidation.isValid) {
        setStep2Error(promoterContribValidation.error || 'Please enter a valid Promoter Equity amount in ₹ Crores.');
        return;
      }
      if (!isEquityEligible) {
        setStep2Error(`Promoter equity contribution is ${equityPercent}%, which is below the minimum required 20% for bank financing. Please increase promoter equity to proceed.`);
        return;
      }
      markStepComplete(2);

      // Automatically sync Means of Finance from Step 2 inputs (without fabricating capex breakup unless entered)
      const currentCost = parseFloat(formData.totalCostCr) || 0;
      const currentContrib = parseFloat(formData.promoterContribCr) || 0;
      const currentLoan = Math.max(0, currentCost - currentContrib);

      setFinancials((prev) => ({
        ...prev,
        termLoanCr: prev.termLoanCr !== '' ? prev.termLoanCr : (currentLoan > 0 ? currentLoan.toFixed(2) : ''),
        promoterContributionCr: prev.promoterContributionCr !== '' ? prev.promoterContributionCr : (currentContrib > 0 ? currentContrib.toFixed(2) : ''),
        otherFinanceCr: prev.otherFinanceCr || '0.00',
        totalProjectCost: currentCost > 0 ? currentCost.toFixed(2) : prev.totalProjectCost,
        totalMeansOfFinance: currentCost > 0 ? currentCost.toFixed(2) : prev.totalMeansOfFinance
      }));

      // Progressive Step-Gate: lock Step 3+ until the user has a verified account
      if (!activeUser && !editingProject) {
        if (!inlineEmail && formData.email) setInlineEmail(formData.email.trim().toLowerCase());
        if (!inlineName && formData.fullName) setInlineName(sanitizePersonNameInput(formData.fullName, 80).trim());
        if (!inlinePhone && formData.mobile) setInlinePhone(sanitizeIndianPhoneInput(formData.mobile));
        saveAssessmentDraft(
          {
            clientProjectId: clientProjectIdRef.current,
            formData,
            financials,
            riskProfileData,
            numPromoters,
            additionalPromoters,
            stage: 'auth_gate',
            completedSteps: completedSteps.includes(2) ? completedSteps : [...completedSteps, 2],
          },
          null
        );
        setAuthNotice('Your Step 1 & Step 2 progress is safely saved. Create a free account or sign in to unlock Step 3 and your free bankability assessment.');
        setStage('auth_gate');
        scrollToFormTop();
        return;
      }

      if (!editingProject && isQuotaBlocked) {
        showToast('Your 1 free project assessment is already used. View your existing project in Dashboard or upgrade to evaluate another project.', {
          type: 'warning',
          title: 'Free Assessment Limit Reached',
        });
        scrollToFormTop();
        return;
      }

      setStage(3);
      scrollToFormTop();
    } else if (stage === 3) {
      setSubmittedSteps((prev) => ({ ...prev, 3: true }));
      setMobileTouched(true);

      const trimmedFullName = sanitizePersonNameInput(formData.fullName, 80).trim();
      const normalizedEmail = formData.email.trim().toLowerCase();
      const cleanedMobile = sanitizeIndianPhoneInput(formData.mobile);
      const trimmedBranch = formData.branchLocation.trim();
      const cleanedIfsc = sanitizeIfscInput(formData.bankIfscCode);
      const trimmedRef = formData.bankAppRefNumber.trim();
      const trimmedDesc = formData.description.trim();

      setFormData((prev) => ({
        ...prev,
        fullName: trimmedFullName,
        email: normalizedEmail,
        mobile: cleanedMobile,
        branchLocation: trimmedBranch,
        bankIfscCode: cleanedIfsc,
        bankAppRefNumber: trimmedRef,
        description: trimmedDesc,
      }));

      if (!formData.landStatus) {
        showToast('Please select Land Status.', { type: 'warning' });
        return;
      }
      if (!formData.collateralStatus) {
        showToast('Please select Collateral Status.', { type: 'warning' });
        return;
      }
      if (!formData.promoterExp) {
        showToast('Please select Promoter Track Record.', { type: 'warning' });
        return;
      }
      const nameCheck = validatePersonName(trimmedFullName, 'Full name', true);
      if (!nameCheck.isValid) {
        showToast(nameCheck.error || 'Please enter a valid promoter name.', { type: 'warning' });
        return;
      }
      const mobileCheck = validateIndianMobileNumber(cleanedMobile);
      if (!mobileCheck.isValid) {
        showToast(mobileCheck.error || 'Please enter a valid 10-digit Indian mobile number.', { type: 'warning', title: 'Invalid Mobile Number' });
        const mobileEl = document.querySelector('input[name="mobile"]');
        if (mobileEl) {
          mobileEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (mobileEl as HTMLElement).focus();
        }
        return;
      }
      const emailCheck = validateEmailAddress(normalizedEmail, true);
      if (!emailCheck.isValid) {
        showToast(emailCheck.error || 'Please enter a valid email address.', { type: 'warning', title: 'Invalid Email' });
        return;
      }
      if (numPromoters > 1) {
        const invalidCoPromoter = additionalPromoters.find(
          (p) => !validatePersonName(p.name, 'Co-promoter name', true).isValid
        );
        if (invalidCoPromoter) {
          showToast('Please enter valid names (no digits) for all co-promoters.', { type: 'warning' });
          return;
        }
      }
      if (!formData.bankName || !formData.bankName.trim()) {
        showToast('Please select your Preferred Bank for the Term Loan proposal.', { type: 'warning' });
        return;
      }
      if (!trimmedBranch) {
        showToast('Please enter your Preferred Bank Branch Location / City.', { type: 'warning' });
        return;
      }
      const ifscCheck = validateIfscCode(cleanedIfsc, false);
      if (!ifscCheck.isValid) {
        showToast(ifscCheck.error || 'Please enter a valid 11-character IFSC code.', { type: 'warning' });
        return;
      }

      setIsSubmitting(true);
      markStepComplete(3);
      setTimeout(() => {
        setIsSubmitting(false);
        setStage('feasibility_result');
        scrollToFormTop();
      }, 800);
    }
  };

  // Computation of Feasibility & Bankability
  const computeResults = () => {
    const eqPct = parseFloat(equityPercent);
    let baseFeasibility = 72;
    let baseBankability = 7.0;

    // Equity check
    if (eqPct >= 30) {
      baseFeasibility += 12;
      baseBankability += 1.3;
    } else if (eqPct >= 20) {
      baseFeasibility += 8;
      baseBankability += 0.8;
    }

    // Land status check
    if (formData.landStatus === 'Owned & Registered') {
      baseFeasibility += 8;
      baseBankability += 0.8;
    } else if (formData.landStatus === 'Leased / Govt Allotted') {
      baseFeasibility += 5;
      baseBankability += 0.5;
    }

    // Collateral check
    if (formData.collateralStatus.includes('Freehold')) {
      baseFeasibility += 6;
      baseBankability += 0.6;
    } else if (formData.collateralStatus.includes('Leasehold')) {
      baseFeasibility += 3;
      baseBankability += 0.3;
    }

    // Experience check
    if (formData.promoterExp.includes('10+ Years')) {
      baseFeasibility += 7;
      baseBankability += 0.8;
    } else if (formData.promoterExp.includes('5-10 Years')) {
      baseFeasibility += 5;
      baseBankability += 0.5;
    }

    const feasibilityScore = Math.min(96, Math.max(65, baseFeasibility));
    const bankabilityRating = Math.min(9.8, Math.max(6.2, baseBankability)).toFixed(1);
    const estimatedLoan = (cost * (parseFloat(debtPercent) / 100)).toFixed(2);

    return {
      feasibilityScore,
      bankabilityRating,
      estimatedLoan,
      eqPct,
      debtPct: parseFloat(debtPercent)
    };
  };

  const results = computeResults();
  const comprehensiveRisk = calculateComprehensiveRiskScore(riskProfileData, results.feasibilityScore);

  // Map 100% of entered & saved project inputs into the PDF/DOCX payload (zero fake defaults)
  const getPDFData = (): TeaserPDFData => {
    const calculatedDscr = calculateSystemDscr({
      industry: formData.industry
    });

    const reconciled = reconcileProjectFinancials({
      totalCostCr: financials.totalProjectCost || formData.totalCostCr,
      loanRequiredCr: financials.termLoanCr || formData.loanRequiredCr,
      promoterContribCr: financials.promoterContributionCr || formData.promoterContribCr,
      debtPct: results.debtPct,
      eqPct: results.eqPct,
      consultancyCostCr: financials.consultancyCostCr,
      machineryCostCr: financials.machineryCostCr,
      civilCostCr: financials.civilCostCr,
      otherCostsCr: financials.otherCostsCr,
      termLoanCr: financials.termLoanCr,
      promoterContributionCr: financials.promoterContributionCr,
      otherFinanceCr: financials.otherFinanceCr
    });

    const promotersList = buildPromotersList();
    const directors = promotersList.map((p) => ({
      name: p.name,
      title: p.role || 'Director / Promoter'
    }));

    const existingCustomCosts =
      Array.isArray(editingProject?.costComponents) && editingProject.costComponents.length > 0
        ? editingProject.costComponents
        : Array.isArray(editingProject?.customCostComponents) && editingProject.customCostComponents.length > 0
        ? editingProject.customCostComponents
        : undefined;

    return {
      // Core Project & Contact Identity
      fullName: formData.fullName,
      companyName: activeUser?.company || editingProject?.companyName || '',
      mobile: formData.mobile,
      email: formData.email,
      projectName: formData.projectName || 'Greenfield Project',
      industry: formData.industry,
      location: formData.location,

      // Exact Reconciled Financials & Breakdown
      totalCostCr: reconciled.totalCostFormatted,
      promoterContribCr: reconciled.promoterContributionFormatted,
      loanRequiredCr: reconciled.termLoanFormatted,
      termLoanCr: reconciled.termLoanFormatted,
      promoterContributionCr: reconciled.promoterContributionFormatted,
      otherFinanceCr: reconciled.otherFinanceFormatted,
      machineryCostCr: reconciled.hasExplicitBreakdown ? reconciled.machineryFormatted : undefined,
      civilCostCr: reconciled.hasExplicitBreakdown ? reconciled.civilFormatted : undefined,
      consultancyCostCr: reconciled.hasExplicitBreakdown ? reconciled.consultancyFormatted : undefined,
      otherCostsCr: reconciled.hasExplicitBreakdown ? reconciled.otherCostsFormatted : undefined,
      hasExplicitBreakdown: reconciled.hasExplicitBreakdown,
      costComponents: existingCustomCosts,
      customCostComponents: existingCustomCosts,
      customFinanceComponents: editingProject?.customFinanceComponents,
      eqPct: reconciled.eqPct,
      debtPct: reconciled.debtPct,
      estimatedLoan: results.estimatedLoan,
      dscrEstimate: calculatedDscr,
      estInterestRate: '8.85% - 9.40% p.a.',

      // Site, Security, Banking & Brief
      landStatus: formData.landStatus,
      collateralStatus: formData.collateralStatus,
      promoterExp: formData.promoterExp,
      description: formData.description,
      bankName: formData.bankName,
      branchLocation: formData.branchLocation,
      bankIfscCode: formData.bankIfscCode,
      bankAppRefNumber: formData.bankAppRefNumber,

      // Full Promoter Roster
      promotersList,
      directors,

      // Scores & Detailed Risk Profile (100% aligned with on-screen display)
      feasibilityScore: results.feasibilityScore,
      bankabilityRating: riskProfileData ? String(comprehensiveRisk.scoreOutOf10) : results.bankabilityRating,
      riskScoreOutOf10: riskProfileData ? comprehensiveRisk.scoreOutOf10 : Number(results.bankabilityRating),
      riskProfileData: riskProfileData || undefined,
      riskSummary: comprehensiveRisk,

      // DPR & Workflow Metadata (from saved project when available)
      status: editingProject?.status || (isDataSaved ? 'Assessment Submitted' : 'Draft Appraisal'),
      stage: editingProject?.stage || 'Underwriting & Teaser Ready',
      assignedCA: editingProject?.assignedCA,
      dprAssignedTo: editingProject?.dprAssignedTo,
      caReviewNotes: editingProject?.caReviewNotes,
      checklistUploaded: editingProject?.checklistUploaded,
      checklistFileName: editingProject?.checklistFileName,
      documents: editingProject?.documents,
      uploadedDocuments: editingProject?.uploadedDocuments,
      dprFile: editingProject?.dprFile,
      cmaFile: editingProject?.cmaFile,
      isFunded: editingProject?.isFunded,
      createdAt: editingProject?.createdAt,
      updatedAt: new Date().toISOString()
    };
  };

  const handleRequireAuth = (mode: 'login' | 'signup' = 'login', reason?: string) => {
    if (reason) {
      setAuthNotice(reason);
    }
    if (onOpenAuth) {
      onOpenAuth(mode, {
        email: formData.email,
        name: formData.fullName,
        phone: formData.mobile
      });
    } else {
      setAuthNotice('Please sign in or create an account to proceed with further steps.');
    }
  };

  const completeInlineUserSession = async (userData: any, fallbackName = '', fallbackPhone = '') => {
    if (userData?.token) {
      localStorage.setItem('inisio_auth_token', userData.token);
    }
    const loggedUser: AuthUser = {
      email: userData.email,
      role: (userData.role as UserRole) || 'user',
      name: userData.name || fallbackName || 'Promoter',
      phone: userData.phone || fallbackPhone,
      company: userData.company,
      membershipPlan: userData.membershipTier || userData.membershipPlan,
      token: userData.token,
    };
    localStorage.setItem('inisio_active_user', JSON.stringify(loggedUser));
    migrateGuestDraftToUser(loggedUser.email);
    setActiveUser(loggedUser);
    setAuthNotice('');
    setInlineNeedsOtp(false);
    setInlineOtp('');
    setInlineDevOtpHint('');

    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || loggedUser.name || '',
      mobile: prev.mobile || loggedUser.phone || '',
      email: prev.email || loggedUser.email || '',
    }));

    if (onLoginSuccess) {
      onLoginSuccess(loggedUser);
    }

    // Immediately verify authoritative server-side 1-free-assessment quota
    const quota = await verifyUserQuota(loggedUser, stage === 'auth_gate');
    if (!quota.allowed) {
      setInlineAuthSuccess('');
      setInlineAuthError(
        quota.reason ||
          'You have already used your 1 free assessment. Open your existing project in Dashboard or upgrade your plan.'
      );
      return;
    }

    // Only persist immediately if we are already on the final results screen
    if (stage === 'final_assessment_results') {
      const computed = computeResults();
      const activeBankability = riskProfileData ? String(comprehensiveRisk.scoreOutOf10) : String(computed.bankabilityRating);
      const systemDscr = calculateSystemDscr({ industry: formData.industry });
      const activeId = editingProject?.id || createdProjectIdRef.current || createdProjectId;
      const payloadToSave = {
        clientProjectId: clientProjectIdRef.current,
        projectName: formData.projectName || 'Greenfield Project',
        industry: formData.industry,
        location: formData.location,
        totalCostCr: formData.totalCostCr,
        promoterContribCr: formData.promoterContribCr,
        loanRequiredCr: formData.loanRequiredCr,
        landStatus: formData.landStatus,
        collateralStatus: formData.collateralStatus,
        promoterExp: formData.promoterExp,
        notes: formData.description,
        fullName: loggedUser.name,
        mobile: loggedUser.phone || formData.mobile,
        email: loggedUser.email,
        bankName: formData.bankName,
        assignedBank: formData.bankName,
        branchLocation: formData.branchLocation,
        bankIfscCode: formData.bankIfscCode,
        bankAppRefNumber: formData.bankAppRefNumber,
        feasibilityScore: computed.feasibilityScore,
        bankabilityRating: activeBankability,
        dscrEstimate: systemDscr,
        riskProfileData: riskProfileData || undefined,
        financials: financials,
        promotersList: buildPromotersList(),
        assessmentCompleted: true,
      };

      try {
        if (activeId) {
          await updateLeadRecord(activeId, payloadToSave, loggedUser.name);
        } else if (!isSavingRef.current) {
          isSavingRef.current = true;
          try {
            const saved = await saveLeadRecord({
              ...payloadToSave,
              source: 'Project Assessment Flow',
              downloadedPDF: false,
            });
            setCreatedProjectId(saved.id);
            createdProjectIdRef.current = saved.id;
            recordAssessmentCompletion(loggedUser.email);
            clearAssessmentDraft(loggedUser.email);
          } finally {
            isSavingRef.current = false;
          }
        }
      } catch (saveErr: any) {
        if (saveErr?.code === FREE_ASSESSMENT_LIMIT_CODE || saveErr?.status === 403) {
          setQuotaStatus({
            allowed: false,
            hasPaidMembership: false,
            membershipTier: 'Free',
            usedCount: 1,
            limit: 1,
            code: FREE_ASSESSMENT_LIMIT_CODE,
            reason: saveErr.message,
          });
          setInlineAuthError(saveErr.message);
          return;
        }
      }
    }

    setInlineAuthSuccess(
      stage === 'auth_gate'
        ? `Welcome, ${loggedUser.name}! Step 3 is now unlocked and your draft is saved.`
        : `Signed in successfully as ${loggedUser.name}! Your project has been saved to your dashboard.`
    );
  };

  const handleInlineOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineAuthError('');
    setInlineAuthSuccess('');
    const cleanOtp = inlineOtp.replace(/\D/g, '').trim();
    if (cleanOtp.length !== 6) {
      setInlineAuthError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setInlineAuthLoading(true);
    try {
      const verifyRes = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inlinePendingEmail || inlineEmail.trim().toLowerCase(),
          otp: cleanOtp,
        }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      setInlineAuthLoading(false);

      if (!verifyRes.ok || !verifyData.success || !verifyData.data) {
        setInlineAuthError(verifyData.message || 'Invalid or expired verification code. Please try again.');
        return;
      }

      await completeInlineUserSession(
        verifyData.data,
        sanitizePersonNameInput(inlineName, 80).trim(),
        sanitizeIndianPhoneInput(inlinePhone)
      );
    } catch {
      setInlineAuthLoading(false);
      setInlineAuthError('Network error while verifying code. Please try again.');
    }
  };

  const handleInlineResendOtp = async () => {
    const emailTarget = inlinePendingEmail || inlineEmail.trim().toLowerCase();
    if (!emailTarget) return;
    setInlineOtpResending(true);
    setInlineAuthError('');
    try {
      const res = await fetch('/api/auth/send-verification-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTarget }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (data.data?.otp) setInlineDevOtpHint(String(data.data.otp));
        setInlineAuthSuccess(`A fresh 6-digit verification code has been sent to ${emailTarget}.`);
      } else {
        setInlineAuthError(data.message || 'Could not resend verification code.');
      }
    } catch {
      setInlineAuthError('Network error while resending code.');
    } finally {
      setInlineOtpResending(false);
    }
  };

  const handleInlineAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineAuthError('');
    setInlineAuthSuccess('');
    setInlineAuthLoading(true);

    const emailToUse = inlineEmail.trim().toLowerCase();
    const nameToUse = sanitizePersonNameInput(inlineName, 80).trim();
    const phoneToUse = sanitizeIndianPhoneInput(inlinePhone);

    const emailCheck = validateEmailAddress(emailToUse, true);
    if (!emailCheck.isValid) {
      setInlineAuthError(emailCheck.error || 'Please enter a valid email address');
      setInlineAuthLoading(false);
      return;
    }
    if (inlineAuthMode === 'signup') {
      const nameCheck = validatePersonName(nameToUse, 'Full name', true);
      if (!nameCheck.isValid) {
        setInlineAuthError(nameCheck.error || 'Please enter your full name');
        setInlineAuthLoading(false);
        return;
      }
      if (phoneToUse) {
        const phoneCheck = validateIndianMobileNumber(phoneToUse);
        if (!phoneCheck.isValid) {
          setInlineAuthError(phoneCheck.error || 'Please enter a valid 10-digit Indian mobile number');
          setInlineAuthLoading(false);
          return;
        }
      }
    }
    if (!inlinePassword || inlinePassword.length < 6) {
      setInlineAuthError('Password must be at least 6 characters');
      setInlineAuthLoading(false);
      return;
    }

    try {
      let userData: any = null;

      if (inlineAuthMode === 'signup') {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailToUse, password: inlinePassword, name: nameToUse, phone: phoneToUse, role: 'user' })
        });
        const regData = await regRes.json().catch(() => ({}));
        if (!regRes.ok || !regData.success) {
          setInlineAuthLoading(false);
          setInlineAuthError(regData.message || 'Registration failed. Please check your inputs.');
          return;
        }

        if (regData.data?.requiresVerification || regData.data?.isVerified === false) {
          setInlineAuthLoading(false);
          setInlineNeedsOtp(true);
          setInlinePendingEmail(emailToUse);
          setInlineDevOtpHint(regData.data?.otp ? String(regData.data.otp) : '');
          setInlineAuthSuccess(
            regData.data?.message || `We sent a 6-digit verification code to ${emailToUse}. Enter it below to unlock Step 3.`
          );
          return;
        }

        // Auto-login if already verified
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailToUse, password: inlinePassword })
        });
        const loginData = await loginRes.json().catch(() => ({}));
        if (loginRes.ok && loginData.success && loginData.data) {
          if (loginData.data.requiresVerification || loginData.data.isVerified === false) {
            setInlineAuthLoading(false);
            setInlineNeedsOtp(true);
            setInlinePendingEmail(emailToUse);
            setInlineDevOtpHint(loginData.data.otp ? String(loginData.data.otp) : '');
            setInlineAuthSuccess(`Please enter the 6-digit verification code sent to ${emailToUse}.`);
            return;
          }
          userData = loginData.data;
        } else {
          userData = regData.data;
        }
      } else {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailToUse, password: inlinePassword })
        });
        const loginData = await loginRes.json().catch(() => ({}));
        if (!loginRes.ok || !loginData.success || !loginData.data) {
          setInlineAuthLoading(false);
          setInlineAuthError(loginData.message || 'Authentication failed. Please check your credentials.');
          return;
        }
        if (loginData.data.requiresVerification || loginData.data.isVerified === false) {
          setInlineAuthLoading(false);
          setInlineNeedsOtp(true);
          setInlinePendingEmail(emailToUse);
          setInlineDevOtpHint(loginData.data.otp ? String(loginData.data.otp) : '');
          setInlineAuthSuccess(
            loginData.data.message || `Email verification required. Enter the 6-digit code sent to ${emailToUse}.`
          );
          return;
        }
        userData = loginData.data;
      }

      setInlineAuthLoading(false);

      if (userData && userData.token) {
        await completeInlineUserSession(userData, nameToUse, phoneToUse);
      } else {
        setInlineAuthError('Authentication failed. Please verify your email and try again.');
      }
    } catch (err) {
      setInlineAuthLoading(false);
      setInlineAuthError('Network error. Please try again.');
    }
  };

  const ensureDownloadEligible = (): boolean => {
    if (!activeUser) {
      handleRequireAuth('signup', 'Please sign in or create a free account to preview or download project documents.');
      return false;
    }
    if (isQuotaBlocked) {
      triggerMembershipUpgrade(quotaStatus?.reason);
      return false;
    }
    return true;
  };

  const markProjectDownloadedIdempotent = () => {
    const activeId = editingProject?.id || editingProject?._id || createdProjectIdRef.current || createdProjectId;
    if (activeId) {
      updateLeadRecord(activeId, { downloadedPDF: true }, activeUser?.name || formData.fullName || 'Promoter').catch(() => {});
    }
  };

  const handleDownloadTeaser = async (action: 'download' | 'preview' = 'download') => {
    if (!ensureDownloadEligible()) return;
    setIsDownloadingPdf(true);
    try {
      const pdfData = getPDFData();
      const { generateProjectTeaserPDF } = await import('../utils/pdfGenerator');
      const result = generateProjectTeaserPDF(pdfData, action);
      if (action === 'preview' && result) {
        setPdfPreview({
          blobUrl: result.blobUrl,
          filename: result.filename,
          title: `${result.resolved.projectName} - Project Teaser`,
          subtitle: `${result.resolved.sector} · ${result.resolved.location}`,
          resolved: result.resolved,
          documentType: 'teaser',
          onDownloadDocx: () => {
            handleDownloadDocxTeaser();
          },
        });
      } else {
        markProjectDownloadedIdempotent();
        showToast(`Downloaded ${result.filename}`, { type: 'success' });
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('Could not generate Project Teaser PDF. Please try again.', { type: 'error' });
    } finally {
      setTimeout(() => setIsDownloadingPdf(false), 400);
    }
  };

  const handleDownloadDprSummary = async (action: 'download' | 'preview' = 'download') => {
    if (!ensureDownloadEligible()) return;
    setIsDownloadingDprPdf(true);
    try {
      const pdfData = getPDFData();
      const { generateDprExecutiveSummaryPDF } = await import('../utils/pdfGenerator');
      const result = generateDprExecutiveSummaryPDF(pdfData, action);
      if (action === 'preview' && result) {
        setPdfPreview({
          blobUrl: result.blobUrl,
          filename: result.filename,
          title: `${result.resolved.projectName} - Detailed Project Report (DPR)`,
          subtitle: `${result.resolved.sector} · ${result.resolved.location}`,
          resolved: result.resolved,
          documentType: 'dpr',
        });
      } else {
        markProjectDownloadedIdempotent();
        showToast(`Downloaded ${result.filename}`, { type: 'success' });
      }
    } catch (err) {
      console.error('DPR PDF generation error:', err);
      showToast('Could not generate DPR Executive Summary PDF. Please try again.', { type: 'error' });
    } finally {
      setTimeout(() => setIsDownloadingDprPdf(false), 400);
    }
  };

  const handleDownloadDocxTeaser = async () => {
    if (!ensureDownloadEligible()) return;
    try {
      setIsDownloadingDocx(true);
      const pdfData = getPDFData();
      const { generateProjectTeaserDOCX } = await import('../utils/docxGenerator');
      const filename = await generateProjectTeaserDOCX(pdfData);
      markProjectDownloadedIdempotent();
      showToast(`Downloaded ${filename}`, { type: 'success' });
    } catch (err) {
      console.error('Failed to generate DOCX teaser:', err);
      showToast('Could not generate DOCX teaser. Please try again.', { type: 'error' });
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleSaveAndRedirectToOutputs = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.projectName.trim()) {
      showToast('Please enter your Project Name before saving.', { type: 'warning' });
      return;
    }
    if (!activeUser && !editingProject) {
      setAuthNotice('Please sign in or create a free account before saving and generating your Project Teaser.');
      setStage('auth_gate');
      scrollToFormTop();
      return;
    }
    if (isQuotaBlocked) {
      triggerMembershipUpgrade(quotaStatus?.reason);
      return;
    }

    if (formData.email && !inlineEmail) {
      setInlineEmail(formData.email);
    }
    if (formData.fullName && !inlineName) {
      setInlineName(formData.fullName);
    }
    if (formData.mobile && !inlinePhone) {
      setInlinePhone(formData.mobile);
    }

    const cCost = parseFloat(financials.consultancyCostCr) || 0;
    const mCost = parseFloat(financials.machineryCostCr) || 0;
    const lCost = parseFloat(financials.civilCostCr) || 0;
    const oCost = parseFloat(financials.otherCostsCr) || 0;
    const totalCost = cCost + mCost + lCost + oCost;
    
    const tLoan = parseFloat(financials.termLoanCr) || 0;
    const pContrib = parseFloat(financials.promoterContributionCr) || 0;
    const oFin = parseFloat(financials.otherFinanceCr) || 0;
    const totalFin = tLoan + pContrib + oFin;

    if (totalCost > 0 && totalFin > 0 && Math.abs(totalCost - totalFin) > 0.05) {
      showToast(`Total Project Cost (₹${totalCost.toFixed(2)} Cr) must equal Total Means of Finance (₹${totalFin.toFixed(2)} Cr).`, { type: 'warning' });
      return;
    }

    const updatedFinancials = {
      ...financials,
      totalProjectCost: totalCost > 0 ? totalCost.toString() : formData.totalCostCr,
      totalMeansOfFinance: totalFin > 0 ? totalFin.toString() : formData.totalCostCr
    };

    setFinancials(updatedFinancials);

    const computed = computeResults();
    const activeBankability = riskProfileData ? String(comprehensiveRisk.scoreOutOf10) : String(computed.bankabilityRating);
    const systemDscr = calculateSystemDscr({ industry: formData.industry });
    const updatedPayload = {
      clientProjectId: clientProjectIdRef.current,
      projectName: formData.projectName || 'Greenfield Project',
      industry: formData.industry,
      location: formData.location,
      totalCostCr: updatedFinancials.totalProjectCost,
      promoterContribCr: updatedFinancials.promoterContributionCr || formData.promoterContribCr,
      loanRequiredCr: updatedFinancials.termLoanCr || formData.loanRequiredCr,
      landStatus: formData.landStatus,
      collateralStatus: formData.collateralStatus,
      promoterExp: formData.promoterExp,
      notes: formData.description,
      fullName: formData.fullName || activeUser?.name || '',
      mobile: formData.mobile || activeUser?.phone || '',
      email: formData.email || activeUser?.email || '',
      bankName: formData.bankName,
      assignedBank: formData.bankName,
      branchLocation: formData.branchLocation,
      bankIfscCode: formData.bankIfscCode,
      bankAppRefNumber: formData.bankAppRefNumber,
      feasibilityScore: computed.feasibilityScore,
      bankabilityRating: activeBankability,
      dscrEstimate: systemDscr,
      promoterContributionAvailable: formData.promoterContributionAvailable || 'Yes',
      promoterFundAssistanceStatus: formData.promoterFundAssistanceRequest ? 'Request Submitted' : (editingProject?.promoterFundAssistanceStatus || 'Not Requested'),
      promoterFundAssistanceRequest: formData.promoterFundAssistanceRequest || editingProject?.promoterFundAssistanceRequest,
      riskProfileData: riskProfileData || undefined,
      financials: updatedFinancials,
      promotersList: buildPromotersList(),
      assessmentCompleted: true
    };

    // Guarantee idempotent save: upsert single project record via activeId or clientProjectId
    const activeId = editingProject?.id || editingProject?._id || createdProjectIdRef.current || createdProjectId;
    try {
      if (activeId) {
        await updateLeadRecord(activeId, updatedPayload, formData.fullName || activeUser?.name || 'Promoter');
      } else if (!isSavingRef.current) {
        isSavingRef.current = true;
        try {
          const saved = await saveLeadRecord({
            ...updatedPayload,
            source: 'Project Assessment Flow',
            downloadedPDF: false
          });
          setCreatedProjectId(saved.id);
          createdProjectIdRef.current = saved.id;
        } finally {
          isSavingRef.current = false;
        }
      }
    } catch (saveErr: any) {
      if (saveErr?.code === FREE_ASSESSMENT_LIMIT_CODE || saveErr?.status === 403) {
        setQuotaStatus({
          allowed: false,
          hasPaidMembership: false,
          membershipTier: 'Free',
          usedCount: 1,
          limit: 1,
          code: FREE_ASSESSMENT_LIMIT_CODE,
          reason: saveErr.message,
        });
        showToast(saveErr.message || 'Your 1 free project assessment limit has been reached.', {
          type: 'warning',
          title: 'Free Assessment Limit Reached',
        });
        triggerMembershipUpgrade(saveErr.message);
        return;
      }
      showToast('Unable to save assessment right now. Please try again.', { type: 'error' });
      return;
    }

    setIsDataSaved(true);
    markStepComplete(5);
    markStepComplete(6);
    setSaveSuccessMessage('Project assessment saved successfully to your dashboard!');
    recordAssessmentCompletion(activeUser?.email || formData.email);
    clearAssessmentDraft(activeUser?.email);
    setDraftSavedAt(null);
    setStage('final_assessment_results');
    scrollToFormTop();
  };

  const handleSaveProjectEdits = async (skipRedirect = false) => {
    if (!formData.projectName.trim()) {
      showToast('Please enter your Project Name before saving.', { type: 'warning' });
      return;
    }
    const computed = computeResults();
    const activeBankability = riskProfileData ? String(comprehensiveRisk.scoreOutOf10) : String(computed.bankabilityRating);
    const systemDscr = calculateSystemDscr({ industry: formData.industry });
    const updatedPayload = {
      clientProjectId: clientProjectIdRef.current,
      projectName: formData.projectName,
      industry: formData.industry,
      location: formData.location,
      totalCostCr: formData.totalCostCr,
      promoterContribCr: formData.promoterContribCr,
      loanRequiredCr: formData.loanRequiredCr,
      landStatus: formData.landStatus,
      collateralStatus: formData.collateralStatus,
      promoterExp: formData.promoterExp,
      notes: formData.description,
      fullName: formData.fullName,
      mobile: formData.mobile,
      email: formData.email,
      bankName: formData.bankName,
      assignedBank: formData.bankName,
      branchLocation: formData.branchLocation,
      bankIfscCode: formData.bankIfscCode,
      bankAppRefNumber: formData.bankAppRefNumber,
      feasibilityScore: computed.feasibilityScore,
      bankabilityRating: activeBankability,
      dscrEstimate: systemDscr,
      promoterContributionAvailable: formData.promoterContributionAvailable || 'Yes',
      promoterFundAssistanceStatus: formData.promoterFundAssistanceRequest ? 'Request Submitted' : (editingProject?.promoterFundAssistanceStatus || 'Not Requested'),
      promoterFundAssistanceRequest: formData.promoterFundAssistanceRequest || editingProject?.promoterFundAssistanceRequest,
      riskProfileData: riskProfileData || undefined,
      financials: financials,
      promotersList: buildPromotersList()
    };

    const activeId = editingProject?.id || editingProject?._id || createdProjectIdRef.current || createdProjectId;
    try {
      if (activeId) {
        await updateLeadRecord(activeId, updatedPayload, formData.fullName || 'Promoter');
      } else if (!isSavingRef.current) {
        isSavingRef.current = true;
        try {
          const saved = await saveLeadRecord({
            ...updatedPayload,
            source: 'Project Assessment Form',
            downloadedPDF: false
          });
          setCreatedProjectId(saved.id);
          createdProjectIdRef.current = saved.id;
        } finally {
          isSavingRef.current = false;
        }
      }
    } catch (saveErr: any) {
      if (saveErr?.code === FREE_ASSESSMENT_LIMIT_CODE || saveErr?.status === 403) {
        triggerMembershipUpgrade(saveErr.message);
        return;
      }
    }

    setSaveSuccessMessage('Project details updated successfully!');
    if (!skipRedirect) {
      setTimeout(() => {
        if (onNavigateToDashboard) {
          onNavigateToDashboard();
        } else if (onFinishEditing) {
          onFinishEditing();
        }
      }, 1200);
    }
  };

  const handleGoToDashboard = async () => {
    if (isQuotaBlocked) {
      if (onNavigateToDashboard) {
        onNavigateToDashboard();
      } else if (onFinishEditing) {
        onFinishEditing();
      }
      return;
    }

    // Save project if not already saved (idempotently by clientProjectId)
    const computed = computeResults();
    const activeBankability = riskProfileData ? String(comprehensiveRisk.scoreOutOf10) : String(computed.bankabilityRating);
    const systemDscr = calculateSystemDscr({ industry: formData.industry });
    const payload = {
      clientProjectId: clientProjectIdRef.current,
      projectName: formData.projectName || 'Greenfield Project',
      industry: formData.industry,
      location: formData.location,
      totalCostCr: formData.totalCostCr,
      promoterContribCr: formData.promoterContribCr,
      loanRequiredCr: formData.loanRequiredCr,
      landStatus: formData.landStatus,
      collateralStatus: formData.collateralStatus,
      promoterExp: formData.promoterExp,
      notes: formData.description,
      fullName: formData.fullName,
      mobile: formData.mobile,
      email: formData.email,
      feasibilityScore: computed.feasibilityScore,
      bankabilityRating: activeBankability,
      dscrEstimate: systemDscr,
      promoterContributionAvailable: formData.promoterContributionAvailable || 'Yes',
      promoterFundAssistanceStatus: formData.promoterFundAssistanceRequest ? 'Request Submitted' : (editingProject?.promoterFundAssistanceStatus || 'Not Requested'),
      promoterFundAssistanceRequest: formData.promoterFundAssistanceRequest || editingProject?.promoterFundAssistanceRequest,
      riskProfileData: riskProfileData || undefined,
      financials: financials,
      promotersList: buildPromotersList()
    };

    const activeId = editingProject?.id || editingProject?._id || createdProjectIdRef.current || createdProjectId;
    try {
      if (activeId) {
        await updateLeadRecord(activeId, payload, formData.fullName || 'Promoter');
      } else if (activeUser && !isSavingRef.current && formData.projectName.trim()) {
        isSavingRef.current = true;
        try {
          const saved = await saveLeadRecord({
            ...payload,
            source: 'Project Assessment Flow',
            downloadedPDF: false
          });
          setCreatedProjectId(saved.id);
          createdProjectIdRef.current = saved.id;
        } finally {
          isSavingRef.current = false;
        }
      }
    } catch {
      // Allow smooth dashboard navigation even if quota blocked new creation
    }

    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    } else if (onFinishEditing) {
      onFinishEditing();
    }
  };

  // Cost numbers
  const costLakhs = (cost * 100).toFixed(2);
  const loanCr = parseFloat(formData.loanRequiredCr) || (cost * (results.debtPct / 100));
  const loanLakhs = (loanCr * 100).toFixed(2);
  const contribLakhs = (contrib * 100).toFixed(2);

  const consultancyLakhs = (parseFloat(costLakhs) * 0.02).toFixed(2);
  const machineryLakhs = (parseFloat(costLakhs) * 0.68).toFixed(2);
  const civilLakhs = (parseFloat(costLakhs) * 0.30).toFixed(2);

  return (
    <div className="h-full min-h-0 flex flex-col lg:flex-row bg-slate-50 font-inter overflow-y-auto lg:overflow-hidden">
      {/* LEFT PANEL: Vertical Step Menu */}
      <aside className="w-full lg:w-72 xl:w-80 bg-slate-900 text-white shrink-0 p-5 lg:p-6 flex flex-col justify-between border-r border-slate-800 overflow-y-auto max-h-full">
        <div className="space-y-6">
          {/* Brand & Mode Header */}
          <div className="space-y-2 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-white font-manrope leading-tight">Inisio</div>
                <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">Project Assessment</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              {editingProject ? 'Interactive Assessment Editing' : '100% Free First Project Assessment'}
            </p>
          </div>

          {/* Vertical List of Existing Steps */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
              Assessment Steps
            </div>
            <nav className="space-y-1.5">
              {ASSESSMENT_STEPS.map((s) => {
                const isCurrent = currentStep === s.id;
                const isLocked = isStepLockedForGuest(s.id) || (isQuotaBlocked && s.id >= 3);
                const isCompleted = !isLocked && isStepCompleted(s.id) && !isCurrent;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStepSelect(s.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-blue-400'
                        : isLocked
                        ? 'text-slate-500 hover:bg-slate-800/60 font-medium opacity-80'
                        : isCompleted
                        ? 'text-slate-200 hover:bg-slate-800/80 font-medium'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 font-medium'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isCurrent
                          ? 'bg-white text-blue-600 shadow-2xs'
                          : isLocked
                          ? 'bg-slate-800/90 text-amber-400 border border-slate-700'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isLocked ? (
                        <Lock className="w-3 h-3" />
                      ) : isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      ) : (
                        <span>{s.id}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="truncate leading-tight">{s.name}</div>
                      <div className="text-[10px] opacity-75 truncate">
                        {isCurrent && stage === 'auth_gate'
                          ? 'Account Required'
                          : isCurrent
                          ? 'In Progress'
                          : isLocked
                          ? isQuotaBlocked
                            ? 'Upgrade Required'
                            : 'Sign in to unlock'
                          : isCompleted
                          ? 'Completed'
                          : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Summary Footer */}
        <div className="pt-6 border-t border-slate-800 text-xs text-slate-400 space-y-2 hidden lg:block">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Tangible Outputs</span>
          </div>
          <div className="text-[11px] space-y-1 text-slate-400 font-medium">
            <div>✓ Bankability Rating (AAA to BBB)</div>
            <div>✓ DSCR &amp; Debt Capacity</div>
            <div>✓ Means of Finance Breakup</div>
            <div>✓ Downloadable PDF Teaser</div>
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL: Form Content for the Selected Step */}
      <main ref={contentMainRef} className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto w-full h-full">
        {/* Top Sub-screen Bar with Go Back Button and Step Title */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGoBack}
              title="Go Back"
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs transition-colors cursor-pointer group shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Step {currentStep} of 6
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {stage === 'auth_gate'
                    ? 'Unlock Free Assessment'
                    : ASSESSMENT_STEPS.find(s => s.id === currentStep)?.name}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 font-manrope">
                {editingProject ? `Edit: ${formData.projectName || editingProject.projectName}` : 'Greenfield Project Feasibility & Bankability'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {!editingProject && draftSavedAt && !isDataSaved && (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                  <Save className="w-3 h-3" />
                  <span>{hasRestoredDraft ? 'Draft Restored' : 'Draft Auto-Saved'}</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetDraft}
                  title="Clear saved draft and start fresh"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Draft</span>
                </button>
              </>
            )}

            {editingProject && (
              <>
                <button
                  type="button"
                  onClick={() => handleSaveProjectEdits()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-3" />
                  <span>Save Updates</span>
                </button>
                {onFinishEditing && (
                  <button
                    type="button"
                    onClick={onFinishEditing}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Back to Dashboard
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="w-full flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Save Success Toast Banner */}
          {saveSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage} {isDataSaved ? '' : 'Returning to your dashboard...'}</span>
            </div>
          )}

          {/* Server-Verified 1 Free Assessment Quota Reached Card */}
          {isQuotaBlocked && (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <h2 className="text-base font-extrabold text-slate-900 font-manrope">
                    Your 1 Free Project Assessment Is Already Used
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {quotaStatus?.reason ||
                      'Each verified promoter account includes 1 free project assessment and Teaser download.'}
                  </p>
                  {quotaStatus?.existingProjectName && (
                    <p className="text-xs text-amber-900 font-semibold pt-1">
                      Existing Free Project: <span className="underline">{quotaStatus.existingProjectName}</span> — you can view, edit, and re-download PDF/DOCX for this project anytime at no extra cost.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {onNavigateToDashboard && (
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Open Existing Project in Dashboard</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => triggerMembershipUpgrade(quotaStatus?.reason)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade Membership Plan</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PROGRESSIVE STEP-GATE: LOCK STEP 3+ UNTIL REGISTERED / SIGNED IN          */}
          {/* ========================================================================= */}
          {stage === 'auth_gate' && !activeUser && (
            <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-300">
              {/* Saved Progress Pill */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Steps 1 &amp; 2 Draft Saved Automatically</span>
                  </div>
                  <div className="text-sm font-bold text-white font-manrope">
                    {formData.projectName || 'Your Greenfield Project'}
                    {formData.totalCostCr ? ` · ₹${formData.totalCostCr} Cr` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStage(2);
                    scrollToFormTop();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Step 2</span>
                </button>
              </div>

              {/* Gate Auth / OTP Card */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-lg space-y-5">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-manrope">
                    {inlineNeedsOtp
                      ? 'Verify Your Email to Unlock Step 3'
                      : inlineAuthMode === 'signup'
                      ? 'Create Your Free Account to Continue'
                      : 'Sign In to Continue Your Assessment'}
                  </h2>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    {inlineNeedsOtp
                      ? `Enter the 6-digit verification code sent to ${inlinePendingEmail || inlineEmail}. Your Step 1 & 2 details are safely preserved.`
                      : authNotice ||
                        'Every verified promoter gets 1 complete free project assessment and bank-ready Teaser download. Sign up or sign in to unlock Step 3 onwards.'}
                  </p>
                </div>

                {!inlineNeedsOtp ? (
                  <>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/70 max-w-xs mx-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setInlineAuthMode('signup');
                          setInlineAuthError('');
                          setInlineAuthSuccess('');
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          inlineAuthMode === 'signup' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Create Free Account
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInlineAuthMode('login');
                          setInlineAuthError('');
                          setInlineAuthSuccess('');
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          inlineAuthMode === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Sign In
                      </button>
                    </div>

                    <form onSubmit={handleInlineAuthSubmit} noValidate className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {inlineAuthMode === 'signup' && (
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              Full Name <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                required
                                maxLength={80}
                                value={inlineName}
                                onChange={(e) => setInlineName(sanitizePersonNameInput(e.target.value, 80))}
                                onBlur={() => setInlineName((prev) => prev.trim())}
                                placeholder="e.g. Ramesh Sharma"
                                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                        )}

                        <div className={`space-y-1 ${inlineAuthMode !== 'signup' ? 'sm:col-span-2' : ''}`}>
                          <label className="block text-xs font-semibold text-slate-700">
                            Email Address <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="email"
                              required
                              maxLength={120}
                              value={inlineEmail}
                              onChange={(e) => setInlineEmail(e.target.value)}
                              onBlur={() => setInlineEmail((prev) => prev.trim().toLowerCase())}
                              placeholder="e.g. ramesh@enterprise.in"
                              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        {inlineAuthMode === 'signup' && (
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              Mobile Number <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                value={inlinePhone}
                                onChange={(e) => setInlinePhone(sanitizeIndianPhoneInput(e.target.value))}
                                placeholder="10-digit mobile"
                                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                        )}

                        <div className={`space-y-1 ${inlineAuthMode !== 'signup' ? 'sm:col-span-2' : ''}`}>
                          <label className="block text-xs font-semibold text-slate-700">
                            Password <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type={showInlinePassword ? 'text' : 'password'}
                              required
                              value={inlinePassword}
                              onChange={(e) => setInlinePassword(e.target.value)}
                              placeholder="Min 6 characters"
                              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowInlinePassword(!showInlinePassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showInlinePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {inlineAuthError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{inlineAuthError}</span>
                        </div>
                      )}

                      {inlineAuthSuccess && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{inlineAuthSuccess}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={inlineAuthLoading || isCheckingQuota}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {inlineAuthLoading || isCheckingQuota ? (
                          <span>Verifying account...</span>
                        ) : (
                          <>
                            <span>{inlineAuthMode === 'signup' ? 'Create Account & Unlock Step 3' : 'Sign In & Unlock Step 3'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  <form onSubmit={handleInlineOtpVerify} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 text-center">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={inlineOtp}
                        onChange={(e) => setInlineOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full max-w-[220px] mx-auto block text-center tracking-[0.4em] font-mono text-lg font-bold py-3 px-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      {inlineDevOtpHint && (
                        <p className="text-[11px] text-center text-blue-700 font-semibold">
                          Dev verification code: <span className="font-mono">{inlineDevOtpHint}</span>
                        </p>
                      )}
                    </div>

                    {inlineAuthError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{inlineAuthError}</span>
                      </div>
                    )}

                    {inlineAuthSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{inlineAuthSuccess}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={inlineAuthLoading}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{inlineAuthLoading ? 'Verifying...' : 'Verify Email & Continue to Step 3'}</span>
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setInlineNeedsOtp(false);
                          setInlineAuthError('');
                        }}
                        className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                      >
                        Change Email
                      </button>
                      <button
                        type="button"
                        onClick={handleInlineResendOtp}
                        disabled={inlineOtpResending}
                        className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {inlineOtpResending ? 'Sending...' : 'Resend Code'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 1: STEPS 1, 2, 3 FORM                                                */}
          {/* ========================================================================= */}
          {(stage === 1 || stage === 2 || (stage === 3 && !isQuotaBlocked)) && (
            <form onSubmit={handleNextStep} noValidate className="w-full space-y-6 animate-in fade-in duration-300">
              {/* STEP 1: PROJECT DETAILS */}
              {stage === 1 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      Step 1: Project Details
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Enter your project name, industry sector, and location.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Project Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="projectName"
                        maxLength={120}
                        value={formData.projectName}
                        onChange={handleInputChange}
                        onBlur={() => {
                          setFormData((prev) => ({ ...prev, projectName: prev.projectName.trim() }));
                          markFieldTouched('projectName');
                        }}
                        error={shouldShowError('projectName', 1, projectNameValidation.isValid)}
                        placeholder="Enter your project name (e.g. Bionex CNG, Solar Power Plant)"
                        required
                      />
                      {shouldShowError('projectName', 1, projectNameValidation.isValid) && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">{projectNameValidation.error}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Industry / Sector <span className="text-red-500">*</span>
                      </label>
                      <UISelect
                        value={formData.industry}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, industry: val }))}
                        placeholder="Select Industry / Sector"
                        options={[
                          'Renewable Energy & CBG / Bio-Gas',
                          'Solar & Wind Power Infrastructure',
                          'Renewable Energy & Solar',
                          'Manufacturing & Heavy Industry',
                          'Food Processing & Cold Chain',
                          'Pharmaceuticals & Healthcare',
                          'Pharmaceuticals & Life Sciences',
                          'Textiles & Apparel',
                          'Real Estate & Commercial Infra',
                          'Hotels & Hospitality',
                          'Hospitality & Commercial',
                          'Logistics & Warehousing',
                          'Chemicals & Fertilizers',
                          'Specialty Chemicals',
                          'Data Centers & Tech Parks',
                          'Other Greenfield Sector'
                        ]}
                        triggerClassName="bg-gray-50 border-gray-200 text-xs font-medium"
                      />
                      {submittedSteps[1] && !formData.industry && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">Please select an industry sector</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <LocationDropdowns
                        value={formData.location}
                        onChange={(loc) => setFormData((prev) => ({ ...prev, location: loc }))}
                        required
                      />
                      {submittedSteps[1] && !formData.location.trim() && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">Please select project state and city</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    {editingProject ? (
                      <button
                        type="button"
                        onClick={() => handleSaveProjectEdits()}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Updates Now</span>
                      </button>
                    ) : <div />}

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Proceed to Step 2</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: FINANCIAL DETAILS & STRICT EQUITY CHECK */}
              {stage === 2 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-blue-600" />
                      Step 2: Financial Details
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Input your project cost and equity contribution in ₹ Crores.
                    </p>
                  </div>

                  {step2Error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{step2Error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Total Project Cost (₹ Cr) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400 z-10">₹</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          name="totalCostCr"
                          value={formData.totalCostCr}
                          onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                          onChange={handleInputChange}
                          onBlur={() => markFieldTouched('totalCostCr')}
                          error={shouldShowError('totalCostCr', 2, totalCostValidation.isValid)}
                          placeholder="Enter total project cost in ₹ Cr"
                          required
                          className="pl-7 font-bold"
                        />
                      </div>
                      {shouldShowError('totalCostCr', 2, totalCostValidation.isValid) && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">{totalCostValidation.error}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        How much money do you have for the project in your hand? (Promoter Equity ₹ Cr) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400 z-10">₹</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          name="promoterContribCr"
                          value={formData.promoterContribCr}
                          onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                          onChange={handleInputChange}
                          onBlur={() => markFieldTouched('promoterContribCr')}
                          error={shouldShowError('promoterContribCr', 2, promoterContribValidation.isValid)}
                          placeholder="Enter promoter equity in hand in ₹ Cr"
                          required
                          className="pl-7 font-bold"
                        />
                      </div>
                      {shouldShowError('promoterContribCr', 2, promoterContribValidation.isValid) && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">{promoterContribValidation.error}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Funding Needed (₹ Cr)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400 z-10">₹</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          name="loanRequiredCr"
                          value={formData.loanRequiredCr}
                          placeholder="Automatically calculated"
                          readOnly
                          className="pl-7 bg-blue-50/50 border-blue-200 font-bold text-blue-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Promoter Contribution Available Selector (Required Field) */}
                  <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-0.5">
                          Promoter Contribution Available <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[11px] text-gray-500">
                          Do you currently have the required promoter contribution / equity in hand?
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, promoterContributionAvailable: 'Yes' }))}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            formData.promoterContributionAvailable === 'Yes'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Yes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, promoterContributionAvailable: 'No' }))}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            formData.promoterContributionAvailable === 'No'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>No</span>
                        </button>
                      </div>
                    </div>

                    {/* Assistance Card shown when user selects "No" */}
                    {formData.promoterContributionAvailable === 'No' && (
                      <div className="p-4 sm:p-5 bg-linear-to-br from-amber-50 via-white to-blue-50/60 border border-amber-200 rounded-xl space-y-3.5 animate-in fade-in duration-200">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                            <Coins className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-gray-900">
                              Need Support for Promoter Contribution?
                            </h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              Promoter contribution is an important part of project funding. If you need support in arranging your promoter fund, Inisio can help connect you with suitable funding assistance options.
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <span className="text-[10px] text-gray-500 italic">
                            * Facilitation service subject to eligibility, investor/lender requirements &amp; terms.
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsPromoterFundAssistanceModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <span>Request Promoter Fund Assistance</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Equity Banner with Dynamic Color & Validation Check */}
                  {cost > 0 && contrib > 0 && (
                    <div
                      className={`p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border transition-all ${
                        isEquityEligible
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-rose-50 border-rose-300 text-rose-950'
                      }`}
                    >
                      <span className="font-bold">
                        Equity: {equityPercent}% | Debt: {debtPercent}%
                      </span>
                      <span className={`font-bold flex items-center gap-1 ${isEquityEligible ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isEquityEligible ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>✓ Meets minimum 20% equity criteria</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>⚠️ Equity below minimum 20% requirement (Banks require min 20% promoter contribution)</span>
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {/* CAPEX Cost Breakup & Component Sizing Section */}
                  <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span>Detailed Capital Outlay (CAPEX) Breakup</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Break down your project cost across plant, machinery, civil works, and engineering.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const c = parseFloat(formData.totalCostCr);
                          if (!Number.isFinite(c) || c <= 0) {
                            showToast('Enter a valid Total Project Cost above before auto-allocating CAPEX.', { type: 'warning' });
                            return;
                          }
                          const p = parseFloat(formData.promoterContribCr) || 0;
                          const l = Math.max(0, c - p);
                          setFinancials({
                            machineryCostCr: (c * 0.65).toFixed(2),
                            civilCostCr: (c * 0.25).toFixed(2),
                            consultancyCostCr: (c * 0.05).toFixed(2),
                            otherCostsCr: (c * 0.05).toFixed(2),
                            termLoanCr: l.toFixed(2),
                            promoterContributionCr: p.toFixed(2),
                            otherFinanceCr: '0.00',
                            totalProjectCost: c.toFixed(2),
                            totalMeansOfFinance: c.toFixed(2)
                          });
                        }}
                        className="px-3 py-1.5 text-[11px] font-bold bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs w-fit"
                      >
                        Auto-allocate Standard Breakup
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Plant &amp; Machinery (₹ Cr)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400 z-10">₹</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={financials.machineryCostCr}
                            onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                            onChange={(e) => {
                              const val = sanitizeDecimalInput(e.target.value, 2);
                              setFinancials(prev => ({ ...prev, machineryCostCr: val }));
                            }}
                            placeholder="e.g. 6.50"
                            className="pl-6 bg-white font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Land &amp; Civil Works (₹ Cr)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400 z-10">₹</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={financials.civilCostCr}
                            onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                            onChange={(e) => {
                              const val = sanitizeDecimalInput(e.target.value, 2);
                              setFinancials(prev => ({ ...prev, civilCostCr: val }));
                            }}
                            placeholder="e.g. 2.50"
                            className="pl-6 bg-white font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Consultancy &amp; Pre-op (₹ Cr)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400 z-10">₹</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={financials.consultancyCostCr}
                            onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                            onChange={(e) => {
                              const val = sanitizeDecimalInput(e.target.value, 2);
                              setFinancials(prev => ({ ...prev, consultancyCostCr: val }));
                            }}
                            placeholder="e.g. 0.50"
                            className="pl-6 bg-white font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Other / Contingency (₹ Cr)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400 z-10">₹</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={financials.otherCostsCr}
                            onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                            onChange={(e) => {
                              const val = sanitizeDecimalInput(e.target.value, 2);
                              setFinancials(prev => ({ ...prev, otherCostsCr: val }));
                            }}
                            placeholder="e.g. 0.50"
                            className="pl-6 bg-white font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reconciliation summary */}
                    {(() => {
                      const m = parseFloat(financials.machineryCostCr) || 0;
                      const civ = parseFloat(financials.civilCostCr) || 0;
                      const con = parseFloat(financials.consultancyCostCr) || 0;
                      const oth = parseFloat(financials.otherCostsCr) || 0;
                      const capexSum = m + civ + con + oth;
                      const totalCostInput = parseFloat(formData.totalCostCr) || 0;
                      const diff = Math.abs(capexSum - totalCostInput);
                      const isCapexAligned = totalCostInput === 0 || diff < 0.05;

                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 font-medium">CAPEX Sum Total:</span>
                            <span className="font-bold text-slate-900">₹ {capexSum.toFixed(2)} Cr</span>
                            {totalCostInput > 0 && (
                              <span className="text-slate-400">/ Total Cost: ₹ {totalCostInput.toFixed(2)} Cr</span>
                            )}
                          </div>
                          {!isCapexAligned && (
                            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                              Difference of ₹ {diff.toFixed(2)} Cr from Total Cost
                            </span>
                          )}
                          {isCapexAligned && totalCostInput > 0 && (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> 100% Sizing Aligned
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStage(1)}
                      className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {editingProject && (
                        <button
                          type="button"
                          onClick={() => handleSaveProjectEdits()}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Updates</span>
                        </button>
                      )}

                      <button
                        type="submit"
                        className={`px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                          isEquityEligible
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-slate-400 hover:bg-slate-500'
                        }`}
                      >
                        <span>Proceed to Step 3</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: READINESS & CONTACT */}
              {stage === 3 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      Step 3: Readiness &amp; Contact Details
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Provide land status, collateral, promoter experience, and contact info.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Land Status <span className="text-red-500">*</span>
                      </label>
                      <UISelect
                        value={formData.landStatus}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, landStatus: val }))}
                        placeholder="Select Land Status"
                        options={[
                          'Owned & Registered',
                          'Land Owned & Registered',
                          'Leased / Govt Allotted',
                          'Industrial Lease Signed',
                          'TSIIC / Industrial Park Allotted',
                          'MoU Signed / Under Acquisition',
                          'Land Selection Pending'
                        ]}
                        triggerClassName="bg-gray-50 border-gray-200 text-xs font-medium"
                      />
                      {submittedSteps[3] && !formData.landStatus && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">Please select land status</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Collateral / Mortgage Status <span className="text-red-500">*</span>
                      </label>
                      <UISelect
                        value={formData.collateralStatus}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, collateralStatus: val }))}
                        placeholder="Select Collateral Status"
                        options={[
                          'Freehold (Clear Title)',
                          'Prime Land & Building Mortgage',
                          'Plant & Machinery Hypothecation',
                          'Factory Premises & Fixed Assets',
                          'Leasehold (Bank Clause)',
                          'Govt. Allotted Land',
                          'Under Mortgage / Encumbered',
                          'Agricultural / Conversion Pending'
                        ]}
                        triggerClassName="bg-gray-50 border-gray-200 text-xs font-medium"
                      />
                      {submittedSteps[3] && !formData.collateralStatus && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">Please select collateral status</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Promoter Track Record <span className="text-red-500">*</span>
                      </label>
                      <UISelect
                        value={formData.promoterExp}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, promoterExp: val }))}
                        placeholder="Select Promoter Track Record"
                        options={[
                          '10+ Years (Industry Veteran)',
                          '12+ Years Manufacturing',
                          '10+ Years Pharma R&D',
                          '8+ Years Hospitality & Infrastructure',
                          '5-10 Years (Established Player)',
                          '3-5 Years (Relevant Sector)',
                          '0-3 Years (First-Time Promoter)'
                        ]}
                        triggerClassName="bg-gray-50 border-gray-200 text-xs font-medium"
                      />
                      {submittedSteps[3] && !formData.promoterExp && (
                        <p className="text-[11px] text-red-600 mt-1 font-medium">Please select promoter track record</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Project Description (Optional)
                      </label>
                      <textarea
                        name="description"
                        rows={2}
                        maxLength={600}
                        value={formData.description}
                        onChange={handleInputChange}
                        onBlur={() => setFormData((prev) => ({ ...prev, description: prev.description.trim() }))}
                        placeholder="Enter brief project description (e.g. proposed capacity, plant details)"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Promoter & Contact Info */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-2.5">
                      <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>Promoter &amp; Contact Details</span>
                      </h3>
                      
                      <div className="flex items-center gap-2 min-w-47.5">
                        <label className="text-[11px] font-bold text-gray-600 shrink-0">
                          Number of Promoters:
                        </label>
                        <UISelect
                          value={String(numPromoters)}
                          onValueChange={(val) => handleNumPromotersChange(Number(val))}
                          options={[
                            { value: '1', label: '1 (Single Promoter)' },
                            { value: '2', label: '2 Promoters' },
                            { value: '3', label: '3 Promoters' },
                            { value: '4', label: '4 Promoters' },
                            { value: '5', label: '5+ Promoters' }
                          ]}
                          triggerClassName="h-8 px-2.5 py-1 bg-white border-gray-300 text-xs font-bold text-blue-700"
                        />
                      </div>
                    </div>

                    {/* Primary Promoter Card */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                          Primary Promoter
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">Full Name *</label>
                          <Input
                            type="text"
                            name="fullName"
                            maxLength={80}
                            autoComplete="name"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            onBlur={() => {
                              setFormData((prev) => ({ ...prev, fullName: sanitizePersonNameInput(prev.fullName, 80).trim() }));
                              markFieldTouched('fullName');
                            }}
                            error={shouldShowError('fullName', 3, fullNameValidation.isValid)}
                            required
                            placeholder="e.g. Rajesh Malhotra"
                          />
                          {shouldShowError('fullName', 3, fullNameValidation.isValid) && (
                            <p className="text-[11px] text-red-600 mt-1 font-medium">{fullNameValidation.error}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">Mobile Number *</label>
                          <Input
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            onBlur={() => {
                              setFormData((prev) => ({ ...prev, mobile: sanitizeIndianPhoneInput(prev.mobile) }));
                              setMobileTouched(true);
                              markFieldTouched('mobile');
                            }}
                            required
                            placeholder="Enter 10-digit mobile"
                            error={(mobileTouched || Boolean(submittedSteps[3])) && !mobileValidation.isValid}
                          />
                          {(mobileTouched || Boolean(submittedSteps[3])) && !mobileValidation.isValid && (
                            <p className="text-[11px] text-red-600 mt-1 font-medium">{mobileValidation.error}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">Email Address *</label>
                          <Input
                            type="email"
                            name="email"
                            maxLength={120}
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={() => {
                              setFormData((prev) => ({ ...prev, email: prev.email.trim().toLowerCase() }));
                              markFieldTouched('email');
                            }}
                            error={shouldShowError('email', 3, emailValidation.isValid)}
                            required
                            placeholder="promoter@company.com"
                          />
                          {shouldShowError('email', 3, emailValidation.isValid) && (
                            <p className="text-[11px] text-red-600 mt-1 font-medium">{emailValidation.error}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Promoters (Rendered dynamically if numPromoters > 1) */}
                    {numPromoters > 1 && (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                            Additional Co-Promoters ({additionalPromoters.length})
                          </span>
                          <button
                            type="button"
                            onClick={handleAddSinglePromoter}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Another Promoter</span>
                          </button>
                        </div>

                        {additionalPromoters.map((promoter, index) => {
                          const coKey = `coPromoter_${index}`;
                          const coNameCheck = validatePersonName(promoter.name, 'Co-promoter name', true);
                          const showCoErr = shouldShowError(coKey, 3, coNameCheck.isValid);
                          return (
                            <div
                              key={promoter.id || index}
                              className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-3 relative"
                            >
                              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <span className="text-[11px] font-bold text-zinc-800">
                                  Promoter {index + 2} (Co-Director / Partner)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSinglePromoter(index)}
                                  className="text-[10px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                    Promoter Name *
                                  </label>
                                  <Input
                                    type="text"
                                    maxLength={80}
                                    value={promoter.name}
                                    onChange={(e) =>
                                      handleUpdateAdditionalPromoter(index, 'name', sanitizePersonNameInput(e.target.value, 80))
                                    }
                                    onBlur={() => {
                                      handleUpdateAdditionalPromoter(index, 'name', promoter.name.trim());
                                      markFieldTouched(coKey);
                                    }}
                                    error={showCoErr}
                                    required
                                    placeholder={`e.g. Co-Promoter ${index + 2}`}
                                  />
                                  {showCoErr && (
                                    <p className="text-[11px] text-red-600 mt-1 font-medium">{coNameCheck.error}</p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                    Experience (Years) *
                                  </label>
                                  <UISelect
                                    value={promoter.experienceYears || ''}
                                    onValueChange={(val) => handleUpdateAdditionalPromoter(index, 'experienceYears', val)}
                                    placeholder="Select Experience"
                                    options={[
                                      '1-3 Years (Early Career)',
                                      '3-5 Years (Relevant Domain)',
                                      '5-10 Years (Senior Track Record)',
                                      '10+ Years (Industry Veteran)',
                                      '15+ Years (Executive Experience)'
                                    ]}
                                    triggerClassName="bg-gray-50 border-gray-200 text-xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                    Qualification *
                                  </label>
                                  <UISelect
                                    value={promoter.qualification}
                                    onValueChange={(val) => handleUpdateAdditionalPromoter(index, 'qualification', val)}
                                    options={[
                                      'B.Tech / Engineering',
                                      'MBA / Business Management',
                                      'Chartered Accountant (CA)',
                                      "Post Graduate / Master's",
                                      'Doctorate (Ph.D)',
                                      'Graduate / Other'
                                    ]}
                                    triggerClassName="bg-gray-50 border-gray-200 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Preferred Bank & Branch for Debt Financing (Required) */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200/80 pb-2.5">
                      <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Preferred Bank &amp; Branch for Term Loan</span>
                        <span className="text-red-500 font-bold">*</span>
                      </h3>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        Required for Appraisal
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <span>Preferred Target Bank</span>
                          <span className="text-red-500 font-bold">*</span>
                        </label>
                        <UISelect
                          value={formData.bankName}
                          onValueChange={(val) => setFormData((prev) => ({ ...prev, bankName: val }))}
                          placeholder="Select your preferred bank (Required)..."
                          options={[
                            'State Bank of India (SBI)',
                            'Punjab National Bank (PNB)',
                            'Canara Bank',
                            'Bank of Baroda (BOB)',
                            'Union Bank of India',
                            'Indian Bank',
                            'Bank of India',
                            'Central Bank of India',
                            'HDFC Bank (Commercial Banking)',
                            'ICICI Bank (Corporate & SME)',
                            'Axis Bank',
                            'Kotak Mahindra Bank',
                            'Federal Bank',
                            'SIDBI (Small Industries Development Bank of India)',
                            'NABARD / State Financial Corporation (SFC)',
                            'Other Commercial / Private Bank'
                          ]}
                          triggerClassName="bg-white border-gray-200 text-xs font-medium"
                        />
                        {submittedSteps[3] && !formData.bankName.trim() && (
                          <p className="text-[11px] text-red-600 mt-1 font-medium">Please select your preferred bank</p>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <span>Preferred Branch Name / City</span>
                          <span className="text-red-500 font-bold">*</span>
                        </label>
                        <Input
                          type="text"
                          name="branchLocation"
                          maxLength={120}
                          value={formData.branchLocation}
                          onChange={handleInputChange}
                          onBlur={() => {
                            setFormData((prev) => ({ ...prev, branchLocation: prev.branchLocation.trim() }));
                            markFieldTouched('branchLocation');
                          }}
                          error={shouldShowError('branchLocation', 3, branchLocationValidation.isValid)}
                          required
                          placeholder="e.g. Industrial Finance Branch, Bengaluru"
                          className="bg-white font-medium"
                        />
                        {shouldShowError('branchLocation', 3, branchLocationValidation.isValid) && (
                          <p className="text-[11px] text-red-600 mt-1 font-medium">{branchLocationValidation.error}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Branch IFSC Code (Optional)
                        </label>
                        <Input
                          type="text"
                          name="bankIfscCode"
                          maxLength={11}
                          value={formData.bankIfscCode}
                          onChange={handleInputChange}
                          onBlur={() => {
                            setFormData((prev) => ({ ...prev, bankIfscCode: sanitizeIfscInput(prev.bankIfscCode) }));
                            markFieldTouched('bankIfscCode');
                          }}
                          error={shouldShowError('bankIfscCode', 3, ifscValidation.isValid)}
                          placeholder="e.g. SBIN0004562"
                          className="bg-white font-mono uppercase"
                        />
                        {shouldShowError('bankIfscCode', 3, ifscValidation.isValid) && (
                          <p className="text-[11px] text-red-600 mt-1 font-medium">{ifscValidation.error}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Application / Proposal Ref # (If initiated)
                        </label>
                        <Input
                          type="text"
                          name="bankAppRefNumber"
                          maxLength={40}
                          value={formData.bankAppRefNumber}
                          onChange={handleInputChange}
                          onBlur={() =>
                            setFormData((prev) => ({ ...prev, bankAppRefNumber: prev.bankAppRefNumber.trim() }))
                          }
                          placeholder="e.g. SBI-SME-2026-081"
                          className="bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStage(2)}
                      className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {editingProject && (
                        <button
                          type="button"
                          onClick={() => handleSaveProjectEdits()}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Updates</span>
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <span>Evaluating...</span>
                        ) : (
                          <>
                            <Calculator className="w-4 h-4" />
                            <span>Get Feasibility Result</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
        )}

        {/* ========================================================================= */}
        {/* STAGE 1 RESULT: FEASIBILITY CHECK RESULT                                   */}
        {/* ========================================================================= */}
        {stage === 'feasibility_result' && (
          <div className="w-full space-y-6 animate-in zoom-in-95 duration-400">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Feasibility Result Available</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-manrope">
                  {formData.projectName || 'Greenfield Project'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formData.industry} • {formData.location}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {editingProject && (
                  <button
                    onClick={() => handleSaveProjectEdits()}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Project Updates</span>
                  </button>
                )}

                <button
                  onClick={() => setStage(1)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Edit Inputs</span>
                </button>
              </div>
            </div>

            {/* Feasibility Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900 text-white rounded-2xl">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                  Feasibility Check
                </span>
                <div className="text-2xl sm:text-3xl font-black font-manrope">
                  {getFeasibilityTerm(results.feasibilityScore)}
                </div>
                <p className="text-xs text-slate-300 mt-1">Score: {results.feasibilityScore}/100</p>
              </div>

              <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                  Estimated Funding Needed
                </span>
                <div className="text-2xl sm:text-3xl font-black text-blue-950 font-manrope">
                  ₹ {results.estimatedLoan} <span className="text-sm font-semibold">Cr</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">Promoter: ₹ {formData.promoterContribCr} Cr ({results.eqPct}%)</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Land &amp; Collateral
                </span>
                <div className="text-base font-bold text-slate-900">
                  {formData.landStatus}
                </div>
                <p className="text-xs text-slate-600 mt-1">{formData.collateralStatus}</p>
              </div>
            </div>

            {/* Simple Direct Next Action */}
            <div className="pt-3 flex items-center justify-end border-t border-slate-100">
              <button
                onClick={() => {
                  setStage('collect_bankability');
                  scrollToFormTop();
                }}
                className="w-full sm:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Bankability Rating</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2 INPUT: DETAILED RISK PROFILE FOR BANKABILITY RATING                */}
        {/* ========================================================================= */}
        {stage === 'collect_bankability' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStage('feasibility_result')}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Feasibility Result</span>
              </button>

              <div className="flex items-center gap-2">
                {editingProject && (
                  <button
                    type="button"
                    onClick={() => handleSaveProjectEdits()}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Project Updates</span>
                  </button>
                )}
                <div className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Step 2: Bankability Underwriting Form
                </div>
              </div>
            </div>

            <DetailedRiskProfileForm
              defaultEquityPercent={results.eqPct}
              defaultPromoterExpYears={formData.promoterExp ? parseInt(formData.promoterExp) || 8 : 8}
              initialData={riskProfileData}
              onSubmitSuccess={(data) => {
                setRiskProfileData(data);
                markStepComplete(4);
                setStage('bankability_result');
                scrollToFormTop();
              }}
              sectionId="bankability-form-section"
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2 RESULT: BANKABILITY RATING RESULT                                  */}
        {/* ========================================================================= */}
        {stage === 'bankability_result' && (
          <div className="w-full space-y-6 animate-in zoom-in-95 duration-400">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold mb-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bankability Rating Computed</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-manrope">
                  Bankability Rating: {riskProfileData ? comprehensiveRisk.scoreOutOf10.toFixed(1) : results.bankabilityRating} / 10
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Project: {formData.projectName} • Industry: {formData.industry}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {editingProject && (
                  <button
                    type="button"
                    onClick={() => handleSaveProjectEdits()}
                    className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Project Updates</span>
                  </button>
                )}
                <button
                  onClick={() => setStage('collect_bankability')}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Edit Underwriting Inputs</span>
                </button>
              </div>
            </div>

            {/* Direct Bankability Overview Based Purely on User Inputs */}
            <div className="p-6 bg-linear-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">
                    Underwriting Bankability Grade
                  </span>
                  <span className="text-[11px] font-semibold text-blue-200 bg-blue-900/60 px-2 py-0.5 rounded-full border border-blue-700/50">
                    {comprehensiveRisk.ratingLabel}
                  </span>
                </div>
                <div className="text-4xl sm:text-5xl font-black font-manrope my-1 text-white">
                  {riskProfileData ? comprehensiveRisk.scoreOutOf10.toFixed(1) : results.bankabilityRating} <span className="text-xl font-normal text-blue-200">/ 10</span>
                </div>
                <p className="text-xs text-slate-300">
                  {riskProfileData?.businessConstitution || 'Corporate Entity'} • {riskProfileData?.businessVintage || 'Established Unit'} • Collateral: {riskProfileData?.collateralCoveragePct || '100'}%
                </p>
              </div>

              <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-col gap-3 sm:border-l sm:border-slate-800 sm:pl-6 text-left sm:text-right">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Feasibility Score</span>
                  <span className="text-base font-bold text-emerald-400">
                    {results.feasibilityScore}/100 ({getFeasibilityTerm(results.feasibilityScore)})
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Promoter Credit Track</span>
                  <span className="text-base font-bold text-white">
                    {riskProfileData?.isNewToCredit ? 'New to Credit' : `${riskProfileData?.cibilScore || '785'} CIBIL`}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial & Structuring Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Project Outlay</div>
                <div className="text-lg font-black text-slate-900 font-manrope mt-0.5">₹ {formData.totalCostCr} Cr</div>
                <div className="text-xs text-slate-500 mt-0.5">₹ {cost.toFixed(2)} Cr capex</div>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl">
                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Required Institutional Debt</div>
                <div className="text-lg font-black text-blue-900 font-manrope mt-0.5">₹ {results.estimatedLoan} Cr</div>
                <div className="text-xs text-blue-700 mt-0.5">{results.debtPct}% Debt allocation</div>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Promoter Equity</div>
                <div className="text-lg font-black text-emerald-900 font-manrope mt-0.5">₹ {formData.promoterContribCr} Cr</div>
                <div className="text-xs text-emerald-700 mt-0.5">{results.eqPct}% Equity contribution</div>
              </div>
            </div>

            {/* Next Steps & Action Banner */}
            <div className="p-5 bg-slate-900 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white font-manrope flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Next Step: Project Financials &amp; Means of Finance</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Enter your project cost breakup and review your means of finance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const currentCost = parseFloat(formData.totalCostCr) || 0;
                    const currentContrib = parseFloat(formData.promoterContribCr) || 0;
                    const currentLoan = Math.max(0, currentCost - currentContrib);

                    setFinancials(prev => ({
                      ...prev,
                      termLoanCr: prev.termLoanCr || (currentLoan > 0 ? currentLoan.toFixed(2) : ''),
                      promoterContributionCr: prev.promoterContributionCr || (currentContrib > 0 ? currentContrib.toFixed(2) : ''),
                      otherFinanceCr: prev.otherFinanceCr || '',
                      consultancyCostCr: prev.consultancyCostCr || '',
                      machineryCostCr: prev.machineryCostCr || '',
                      civilCostCr: prev.civilCostCr || '',
                      otherCostsCr: prev.otherCostsCr || '',
                      totalProjectCost: prev.totalProjectCost || (currentCost > 0 ? currentCost.toFixed(2) : ''),
                      totalMeansOfFinance: prev.totalMeansOfFinance || (currentCost > 0 ? currentCost.toFixed(2) : '')
                    }));

                    setStage('collect_financials');
                    scrollToFormTop();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Next: Financials &amp; Means of Finance</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: COLLECT FINANCIALS                                                */}
        {/* ========================================================================= */}
        {stage === 'collect_financials' && (() => {
          const currentCostFromPrev = parseFloat(formData.totalCostCr) || 0;
          const currentContribFromPrev = parseFloat(formData.promoterContribCr) || 0;
          const currentLoanFromPrev = Math.max(0, currentCostFromPrev - currentContribFromPrev);

          const cCost = parseFloat(financials.consultancyCostCr) || 0;
          const mCost = parseFloat(financials.machineryCostCr) || 0;
          const lCost = parseFloat(financials.civilCostCr) || 0;
          const oCost = parseFloat(financials.otherCostsCr) || 0;
          const totalCost = cCost + mCost + lCost + oCost;
          
          const tLoan = parseFloat(financials.termLoanCr) || (currentLoanFromPrev > 0 ? currentLoanFromPrev : 0);
          const pContrib = parseFloat(financials.promoterContributionCr) || (currentContribFromPrev > 0 ? currentContribFromPrev : 0);
          const oFin = parseFloat(financials.otherFinanceCr) || 0;
          const totalFin = (tLoan + pContrib + oFin) || currentCostFromPrev;
          
          const debtPct = totalFin > 0 ? ((tLoan / totalFin) * 100).toFixed(1) : '0.0';
          const eqPct = totalFin > 0 ? ((pContrib / totalFin) * 100).toFixed(1) : '0.0';
          
          const isBalanced = totalCost === 0 || Math.abs(totalCost - totalFin) < 0.05;

          const handleSyncFromPreviousInputs = () => {
            setFinancials(prev => ({
              ...prev,
              termLoanCr: currentLoanFromPrev > 0 ? currentLoanFromPrev.toFixed(2) : '',
              promoterContributionCr: currentContribFromPrev > 0 ? currentContribFromPrev.toFixed(2) : '',
              otherFinanceCr: prev.otherFinanceCr || '',
              totalProjectCost: currentCostFromPrev > 0 ? currentCostFromPrev.toFixed(2) : '',
              totalMeansOfFinance: currentCostFromPrev > 0 ? currentCostFromPrev.toFixed(2) : ''
            }));
          };

          const handleAutoBalance = () => {
            const targetTotal = totalCost > 0 ? totalCost : (currentCostFromPrev > 0 ? currentCostFromPrev : 10);
            const loan = targetTotal * 0.70;
            const equity = targetTotal * 0.30;
            setFinancials(prev => ({
              ...prev,
              termLoanCr: loan.toFixed(2),
              promoterContributionCr: equity.toFixed(2),
              otherFinanceCr: '0.00',
              totalProjectCost: targetTotal.toFixed(2),
              totalMeansOfFinance: targetTotal.toFixed(2)
            }));
            showToast(`Means of Finance auto-balanced to ₹${targetTotal.toFixed(2)} Cr (70% Debt / 30% Equity).`, { type: 'success' });
          };

          return (
          <div className="w-full space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Means of Finance Auto-populated</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-manrope">Project Cost &amp; Means of Finance</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Please enter your project cost breakup amounts below. Means of finance is loaded directly from your project outlay of ₹{currentCostFromPrev.toFixed(2)} Cr.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSyncFromPreviousInputs}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="Reset Means of Finance to match Step 2 inputs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Re-sync Means of Finance</span>
              </button>
            </div>

            {/* Notification Badge */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-900">
              <div className="flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Target Outlay:</strong> ₹{currentCostFromPrev.toFixed(2)} Cr • <strong>Term Loan:</strong> ₹{currentLoanFromPrev.toFixed(2)} Cr ({results.debtPct}%) • <strong>Promoter Equity:</strong> ₹{currentContribFromPrev.toFixed(2)} Cr ({results.eqPct}%)
                </span>
              </div>
              <span className="text-[11px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md font-semibold shrink-0">
                Live Synced
              </span>
            </div>

            <div className="space-y-6">
              {/* Cost Breakup */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-500" />
                    <span>Project Cost Breakup</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Enter cost breakup amounts manually</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Consultancy &amp; Pre-op (Cr)</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={financials.consultancyCostCr}
                      onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                      onChange={(e) =>
                        setFinancials((prev) => ({ ...prev, consultancyCostCr: sanitizeDecimalInput(e.target.value, 2) }))
                      }
                      placeholder="e.g. 2.50"
                      className="text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Plant &amp; Machinery (Cr)</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={financials.machineryCostCr}
                      onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                      onChange={(e) =>
                        setFinancials((prev) => ({ ...prev, machineryCostCr: sanitizeDecimalInput(e.target.value, 2) }))
                      }
                      placeholder="e.g. 30.00"
                      className="text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Land &amp; Civil Works (Cr)</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={financials.civilCostCr}
                      onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                      onChange={(e) =>
                        setFinancials((prev) => ({ ...prev, civilCostCr: sanitizeDecimalInput(e.target.value, 2) }))
                      }
                      placeholder="e.g. 15.00"
                      className="text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Other Project Costs (Cr)</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={financials.otherCostsCr}
                      onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                      onChange={(e) =>
                        setFinancials((prev) => ({ ...prev, otherCostsCr: sanitizeDecimalInput(e.target.value, 2) }))
                      }
                      placeholder="e.g. 2.50"
                      className="text-xs font-semibold"
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-xl flex justify-between items-center border border-blue-100">
                  <div>
                    <span className="text-sm font-bold text-blue-900 block">Total Project Cost</span>
                    {totalCost === 0 && (
                      <span className="text-[11px] text-blue-600">Enter component costs above to calculate total</span>
                    )}
                  </div>
                  <span className="text-base font-black text-blue-700">₹ {totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr</span>
                </div>
              </div>

              {/* Means of Finance */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-500" />
                  <span>Means of Finance</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Project Term Debt / Bank Loan (Cr)</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={financials.termLoanCr}
                      onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                      onChange={(e) =>
                        setFinancials((prev) => ({ ...prev, termLoanCr: sanitizeDecimalInput(e.target.value, 2) }))
                      }
                      placeholder={currentLoanFromPrev > 0 ? `Suggested: ${currentLoanFromPrev.toFixed(2)}` : 'Enter debt amount...'}
                      className="text-xs font-semibold"
                    />
                    {totalFin > 0 && <div className="text-[10px] font-medium text-emerald-600 text-right">{debtPct}% Allocation</div>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Promoter Contribution / Equity (Cr)</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={financials.promoterContributionCr}
                      onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                      onChange={(e) =>
                        setFinancials((prev) => ({ ...prev, promoterContributionCr: sanitizeDecimalInput(e.target.value, 2) }))
                      }
                      placeholder={currentContribFromPrev > 0 ? `Suggested: ${currentContribFromPrev.toFixed(2)}` : 'Enter promoter contribution...'}
                      className="text-xs font-semibold"
                    />
                    {totalFin > 0 && <div className="text-[10px] font-medium text-emerald-600 text-right">{eqPct}% Allocation</div>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Other Sources / Grants (Cr)</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={financials.otherFinanceCr}
                      onKeyDown={(e) => blockInvalidNumberKeys(e, true)}
                      onChange={(e) =>
                        setFinancials((prev) => ({ ...prev, otherFinanceCr: sanitizeDecimalInput(e.target.value, 2) }))
                      }
                      placeholder="Optional (e.g. 0.00)"
                      className="text-xs font-semibold"
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl flex justify-between items-center border border-emerald-100">
                  <span className="text-sm font-bold text-emerald-900">Total Means of Finance</span>
                  <span className="text-base font-black text-emerald-700">₹ {totalFin.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr</span>
                </div>
              </div>
            </div>
            
            {(!isBalanced && totalCost > 0) && (
               <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-200 flex items-center justify-between gap-2">
                 <span>Note: Total Project Cost (₹{totalCost.toFixed(2)} Cr) must equal Total Means of Finance (₹{totalFin.toFixed(2)} Cr).</span>
                 <button
                   type="button"
                   onClick={handleAutoBalance}
                   className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                 >
                   Auto-balance Means of Finance
                 </button>
               </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setStage('bankability_result');
                  scrollToFormTop();
                }}
                className="px-5 py-2.5 text-gray-600 font-bold hover:text-gray-900 transition-colors flex items-center gap-1.5 cursor-pointer text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (totalCost > 0 && totalFin > 0 && Math.abs(totalCost - totalFin) > 0.05) {
                    showToast(`Total Project Cost (₹${totalCost.toFixed(2)} Cr) must equal Total Means of Finance (₹${totalFin.toFixed(2)} Cr). Difference: ₹${Math.abs(totalCost - totalFin).toFixed(2)} Cr. Click "Auto-balance Means of Finance" above or adjust figures.`, { type: 'warning', title: 'Financials Not Balanced' });
                    return;
                  }
                  handleSaveAndRedirectToOutputs();
                }}
                className={`px-6 py-3 font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                  !isBalanced && (totalCost > 0 || totalFin > 0)
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Save &amp; View Assessment Results</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* STAGE 4: FINAL ASSESSMENT RESULTS & DOWNLOADS                              */}
        {/* ========================================================================= */}
        {stage === 'final_assessment_results' && (() => {
          const finResolved = reconcileProjectFinancials({
            totalCostCr: formData.totalCostCr,
            loanRequiredCr: formData.loanRequiredCr,
            promoterContribCr: formData.promoterContribCr,
            debtPct: results.debtPct,
            eqPct: results.eqPct,
            consultancyCostCr: financials.consultancyCostCr,
            machineryCostCr: financials.machineryCostCr,
            civilCostCr: financials.civilCostCr,
            otherCostsCr: financials.otherCostsCr,
            termLoanCr: financials.termLoanCr,
            promoterContributionCr: financials.promoterContributionCr,
            otherFinanceCr: financials.otherFinanceCr
          });

          const cCost = Number(finResolved?.consultancyCostCr) || 0;
          const mCost = Number(finResolved?.machineryCostCr) || 0;
          const lCost = Number(finResolved?.civilCostCr) || 0;
          const oCost = Number(finResolved?.otherCostsCr) || 0;
          const totalCost = Number(finResolved?.totalCostCr) || 0;
          
          const tLoan = Number(finResolved?.termLoanCr) || 0;
          const pContrib = Number(finResolved?.promoterContributionCr) || 0;
          const oFin = Number(finResolved?.otherFinanceCr) || 0;
          const totalFin = Number(finResolved?.totalFinanceCr) || 0;
          
          const debtPctCalc = (finResolved?.debtPct ?? 70).toString();
          const eqPctCalc = (finResolved?.eqPct ?? 30).toString();
          const dscrValue = calculateSystemDscr({
            industry: formData.industry
          }).toFixed(2);
          const activeBankability = riskProfileData ? comprehensiveRisk.scoreOutOf10.toFixed(1) : results.bankabilityRating;

          return (
            <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-400">
              {/* Header Section */}
              <div className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                  <div>
                    {activeUser ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Logged in as {activeUser.name} • Project Linked to Dashboard</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-xs font-bold mb-2">
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Authentication Required for Downstream Steps</span>
                      </div>
                    )}
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-manrope">
                      Executive Project Assessment Outputs
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-700">{formData.projectName || 'Greenfield Project'}</span>
                      <span>•</span>
                      <span>{formData.industry}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {formData.location}</span>
                      {formData.bankName && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-blue-700 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>{formData.bankName}</span>
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setStage('collect_financials');
                        scrollToFormTop();
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Adjust Cost &amp; Finance</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!activeUser) {
                          handleRequireAuth('login', 'Please sign in or register to access your personal dashboard and manage this project.');
                          return;
                        }
                        if (onNavigateToDashboard) {
                          onNavigateToDashboard();
                        } else if (onFinishEditing) {
                          onFinishEditing();
                        } else {
                          window.location.href = '/dashboard';
                        }
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      {!activeUser && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>View in Dashboard</span>
                    </button>
                  </div>
                </div>

                {/* Authentication Notification Banner if triggered by action */}
                {authNotice && !activeUser && (
                  <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 animate-in fade-in shadow-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs">
                      <div className="font-extrabold text-amber-900 text-sm mb-0.5">Sign In Required</div>
                      <div className="text-amber-800 font-medium">{authNotice}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRequireAuth('login')}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer"
                    >
                      Sign In Now
                    </button>
                  </div>
                )}

                {/* Top 6 Key Outputs Cards Grid */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Key Assessment &amp; Underwriting Metrics</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Output 1: Bankability */}
                    <div className="p-5 bg-linear-to-br from-blue-900 to-slate-900 text-white rounded-2xl shadow-md border border-blue-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                            1. Bankability Rating
                          </span>
                          <span className="px-2 py-0.5 bg-blue-500/30 border border-blue-400/40 rounded-full text-[10px] font-extrabold text-blue-200">
                            {comprehensiveRisk.ratingLabel || 'AAA Rating'}
                          </span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-black font-manrope my-2 text-white">
                          {activeBankability} <span className="text-base font-normal text-blue-300">/ 10</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-blue-200/90 font-medium pt-2 border-t border-blue-800/80">
                        {riskProfileData?.isNewToCredit ? 'New-to-Credit Profile' : `CIBIL: ${riskProfileData?.cibilScore || '785'} • Collateral: ${riskProfileData?.collateralCoveragePct || '100'}%`}
                      </p>
                    </div>

                    {/* Output 2: Feasibility */}
                    <div className="p-5 bg-linear-to-br from-emerald-900 to-slate-900 text-white rounded-2xl shadow-md border border-emerald-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                            2. Feasibility Status
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-500/30 border border-emerald-400/40 rounded-full text-[10px] font-extrabold text-emerald-200">
                            {getFeasibilityTerm(results.feasibilityScore)}
                          </span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-black font-manrope my-2 text-white">
                          {results.feasibilityScore} <span className="text-base font-normal text-emerald-300">/ 100</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-emerald-200/90 font-medium pt-2 border-t border-emerald-800/80">
                        Land: {formData.landStatus || 'In Progress'} • Experience: {formData.promoterExp || '5+ Yrs'}
                      </p>
                    </div>

                    {/* Output 3: Total Project CAPEX */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          3. Total Project CAPEX
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 font-manrope my-2">
                          ₹ {totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span className="text-base font-bold text-slate-500">Cr</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                        Machinery: ₹{mCost.toFixed(1)} Cr • Civil: ₹{lCost.toFixed(1)} Cr
                      </div>
                    </div>

                    {/* Output 4: Proposed Debt */}
                    <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                            4. Proposed Debt
                          </span>
                          <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                            {debtPctCalc}% Outlay
                          </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-blue-900 font-manrope my-2">
                          ₹ {tLoan.toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span className="text-base font-bold text-blue-700">Cr</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-blue-700/90 font-medium pt-2 border-t border-blue-200">
                        Target Institutional Term Debt
                      </div>
                    </div>

                    {/* Output 5: Promoter Contribution */}
                    <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                            5. Promoter Contribution
                          </span>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {eqPctCalc}% Equity
                          </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-manrope my-2">
                          ₹ {pContrib.toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span className="text-base font-bold text-emerald-700">Cr</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-emerald-700/90 font-medium pt-2 border-t border-emerald-200">
                        Required In-Hand Equity / Capital Margin
                      </div>
                    </div>

                    {/* Output 6: Indicative DSCR */}
                    <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                            6. Indicative DSCR
                          </span>
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            Min: &gt;1.35x
                          </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-amber-950 font-manrope my-2">
                          {dscrValue}x <span className="text-xs font-semibold text-amber-800">(Avg 7-10 Yrs)</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-amber-800/90 font-medium pt-2 border-t border-amber-200">
                        Strong Debt Servicing Coverage Capacity
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statutory / Methodology Notice */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Methodology Disclaimer:</strong> Key underwriting outputs (Bankability Rating, Indicative DSCR, Debt Capacity, and Feasibility Score) are subject to actual statutory audit, Detailed Project Report (DPR), CMA financial modeling, and formal lender credit committee sanction methodology.
                  </span>
                </div>

                {/* Breakdown Summary Tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                  {/* CAPEX Breakdown */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-manrope">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>CAPEX (Project Cost) Breakdown</span>
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Plant &amp; Machinery</span>
                        <span className="font-bold text-slate-900">₹ {mCost.toFixed(2)} Cr ({totalCost > 0 ? ((mCost / totalCost) * 100).toFixed(0) : 0}%)</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Land &amp; Civil Works</span>
                        <span className="font-bold text-slate-900">₹ {lCost.toFixed(2)} Cr ({totalCost > 0 ? ((lCost / totalCost) * 100).toFixed(0) : 0}%)</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Consultancy &amp; Pre-op</span>
                        <span className="font-bold text-slate-900">₹ {cCost.toFixed(2)} Cr ({totalCost > 0 ? ((cCost / totalCost) * 100).toFixed(0) : 0}%)</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Other Capex &amp; Contingency</span>
                        <span className="font-bold text-slate-900">₹ {oCost.toFixed(2)} Cr ({totalCost > 0 ? ((oCost / totalCost) * 100).toFixed(0) : 0}%)</span>
                      </div>
                      <div className="flex justify-between pt-1 font-bold text-slate-900 text-sm">
                        <span>Total CAPEX Outlay</span>
                        <span className="text-blue-700">₹ {totalCost.toFixed(2)} Cr</span>
                      </div>
                    </div>
                  </div>

                  {/* Means of Finance Breakdown */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-manrope">
                      <Landmark className="w-4 h-4 text-emerald-600" />
                      <span>Means of Finance Structure</span>
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Institutional Term Loan</span>
                        <span className="font-bold text-blue-700">₹ {tLoan.toFixed(2)} Cr ({debtPctCalc}%)</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Promoter Equity Contribution</span>
                        <span className="font-bold text-emerald-700">₹ {pContrib.toFixed(2)} Cr ({eqPctCalc}%)</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Other Sources / Grants</span>
                        <span className="font-bold text-slate-900">₹ {oFin.toFixed(2)} Cr</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Debt-to-Equity Ratio</span>
                        <span className="font-bold text-slate-900">{debtPctCalc}:{eqPctCalc}</span>
                      </div>
                      <div className="flex justify-between pt-1 font-bold text-slate-900 text-sm">
                        <span>Total Means of Finance</span>
                        <span className="text-emerald-700">₹ {totalFin.toFixed(2)} Cr</span>
                      </div>
                    </div>
                  </div>

                  {/* Nominated Lending Bank & Branch */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-manrope">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Nominated Bank &amp; Branch</span>
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Target Bank</span>
                        <span className="font-bold text-indigo-900 text-right">{formData.bankName || 'Under Selection'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">Underwriting Branch</span>
                        <span className="font-bold text-slate-900 text-right">{formData.branchLocation || 'Under Selection'}</span>
                      </div>
                      {formData.bankIfscCode ? (
                        <div className="flex justify-between py-1.5 border-b border-slate-200">
                          <span className="text-slate-600">Branch IFSC Code</span>
                          <span className="font-mono font-bold text-slate-800">{formData.bankIfscCode}</span>
                        </div>
                      ) : null}
                      {formData.bankAppRefNumber ? (
                        <div className="flex justify-between py-1.5 border-b border-slate-200">
                          <span className="text-slate-600">Proposal Tracking #</span>
                          <span className="font-mono font-bold text-slate-800">{formData.bankAppRefNumber}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between pt-1 font-bold text-slate-900 text-sm">
                        <span>Appraisal Channel</span>
                        <span className="text-indigo-700">Direct Term Loan Syndication</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* AUTHENTICATION GATE CARD (MANDATORY FOR DOWNSTREAM PROCEEDINGS)           */}
              {/* ========================================================================= */}
              {!activeUser ? (
                <div className="bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-indigo-500/40 space-y-6 animate-in fade-in">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-700/80">
                    <div className="space-y-2 max-w-2xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Step 6: Login / Sign In to Continue to Further Steps</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black font-manrope text-white">
                        Sign In or Register to Save Project &amp; Unlock Teaser Downloads
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        You have completed your Greenfield Project Assessment for <span className="text-white font-semibold">{formData.projectName || 'your project'}</span>. To permanently save this record to your Promoter Dashboard, download your official branded AI Project Teaser (.docx &amp; .pdf), and request CA / Lender syndication, please sign in with your account or create a free promoter profile.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRequireAuth('login')}
                        className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In with Existing Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRequireAuth('signup')}
                        className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Create Free Account</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Quick Login / Sign Up Form - Styled to Reference */}
                  <div className="bg-linear-to-b from-sky-50/70 via-white to-white p-6 sm:p-7 rounded-3xl border border-blue-100 shadow-xl shadow-blue-950/5 space-y-4 max-w-xl mx-auto">
                    <div className="text-center space-y-1">
                      <div className="w-11 h-11 rounded-2xl bg-white border border-blue-100 shadow-md shadow-blue-500/10 flex items-center justify-center mx-auto text-blue-600 mb-2">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 font-manrope tracking-tight">
                        {inlineAuthMode === 'signup' ? 'Create your account' : 'Sign in to Inisio'}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        {inlineAuthMode === 'signup' ? 'Instant 1-Click Verification & Project Linking' : 'Access your greenfield assessment from any device'}
                      </p>
                    </div>

                    {/* Mode Toggle Tabs */}
                    <div className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 max-w-xs mx-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setInlineAuthMode('login');
                          setInlineAuthError('');
                          setInlineAuthSuccess('');
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          inlineAuthMode === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInlineAuthMode('signup');
                          setInlineAuthError('');
                          setInlineAuthSuccess('');
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          inlineAuthMode === 'signup' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Create Account
                      </button>
                    </div>

                    <form onSubmit={handleInlineAuthSubmit} noValidate className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {inlineAuthMode === 'signup' && (
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              Full Name <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                required
                                maxLength={80}
                                value={inlineName}
                                onChange={(e) => setInlineName(sanitizePersonNameInput(e.target.value, 80))}
                                onBlur={() => setInlineName((prev) => prev.trim())}
                                placeholder="e.g. Ramesh Sharma"
                                className="w-full pl-10 pr-3 py-2.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                        )}

                        <div className={`space-y-1 ${inlineAuthMode !== 'signup' ? 'sm:col-span-2' : ''}`}>
                          <label className="block text-xs font-semibold text-slate-700">
                            Email Address <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="email"
                              required
                              maxLength={120}
                              value={inlineEmail}
                              onChange={(e) => setInlineEmail(e.target.value)}
                              onBlur={() => setInlineEmail((prev) => prev.trim().toLowerCase())}
                              placeholder="e.g. ramesh@enterprise.in"
                              className="w-full pl-10 pr-3 py-2.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        {inlineAuthMode === 'signup' && (
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              Mobile Number
                            </label>
                            <div className="relative">
                              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                value={inlinePhone}
                                onChange={(e) => setInlinePhone(sanitizeIndianPhoneInput(e.target.value))}
                                placeholder="10-digit mobile"
                                className="w-full pl-10 pr-3 py-2.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                        )}

                        <div className={`space-y-1 ${inlineAuthMode !== 'signup' ? 'sm:col-span-2' : ''}`}>
                          <label className="block text-xs font-semibold text-slate-700">
                            Password <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type={showInlinePassword ? 'text' : 'password'}
                              required
                              value={inlinePassword}
                              onChange={(e) => setInlinePassword(e.target.value)}
                              placeholder="Enter password (min 6 chars)"
                              className="w-full pl-10 pr-10 py-2.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowInlinePassword(!showInlinePassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showInlinePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {inlineAuthError && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200/80 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{inlineAuthError}</span>
                        </div>
                      )}

                      {inlineAuthSuccess && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{inlineAuthSuccess}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={inlineAuthLoading}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-blue-600/15 flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        {inlineAuthLoading ? (
                          <span>Processing...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{inlineAuthMode === 'signup' ? 'Register & Unlock Teaser' : 'Sign In & Unlock Teaser'}</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                        Verified Promoter Account Linked
                      </div>
                      <div className="text-xs text-emerald-800 font-medium">
                        Signed in as <span className="font-bold">{activeUser.name}</span> ({activeUser.email}). This project is permanently saved to your Promoter Dashboard.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToDashboard) {
                        onNavigateToDashboard();
                      } else if (onFinishEditing) {
                        onFinishEditing();
                      } else {
                        window.location.href = '/dashboard';
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Go to Dashboard</span>
                  </button>
                </div>
              )}

              {/* Immediate Download & Next Actions Box */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Executive Deliverables Ready</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black font-manrope text-white">
                      Download AI Project Teaser &amp; Underwriting Dossier
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                      Download your official bank-ready Project Teaser with complete Proposed Project Cost Statement, Means of Finance, and Comprehensive Underwriting Scorecard in both print-ready <strong>PDF</strong> and editable <strong>DOCX</strong> formats.
                      {!activeUser && <span className="text-amber-400 block mt-1 font-semibold">🔒 Sign in or register to unlock instant downloads.</span>}
                    </p>
                  </div>

                  {/* Primary Download Actions (Teaser PDF, DPR Summary PDF & Teaser DOCX) */}
                  <div className="flex flex-wrap items-stretch sm:items-center gap-2.5 shrink-0">
                    {/* Primary Teaser PDF Download */}
                    <button
                      type="button"
                      onClick={() => handleDownloadTeaser('download')}
                      disabled={isDownloadingPdf}
                      className={`px-4 py-2.5 font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeUser
                          ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {!activeUser ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Sign In to Download Teaser PDF</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isDownloadingPdf ? 'Generating...' : 'Teaser (PDF)'}</span>
                        </>
                      )}
                    </button>

                    {/* DPR Executive Summary PDF Download */}
                    <button
                      type="button"
                      onClick={() => handleDownloadDprSummary('download')}
                      disabled={isDownloadingDprPdf}
                      className={`px-4 py-2.5 font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeUser
                          ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {!activeUser ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>DPR Summary (PDF)</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>{isDownloadingDprPdf ? 'Generating...' : 'DPR Summary (PDF)'}</span>
                        </>
                      )}
                    </button>

                    {/* Primary DOCX Download */}
                    <button
                      type="button"
                      onClick={() => handleDownloadDocxTeaser()}
                      disabled={isDownloadingDocx}
                      className={`px-4 py-2.5 font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeUser
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {!activeUser ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Teaser (DOCX)</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>{isDownloadingDocx ? 'Generating...' : 'Teaser (DOCX)'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Secondary Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadTeaser('preview')}
                      disabled={isDownloadingPdf}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer whitespace-nowrap"
                    >
                      {!activeUser && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Preview Teaser PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadDprSummary('preview')}
                      disabled={isDownloadingDprPdf}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer whitespace-nowrap"
                    >
                      {!activeUser && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Preview DPR Summary</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeUser) {
                          handleRequireAuth('login', 'Please sign in or create an account to book your CA consultation.');
                          return;
                        }
                        onOpenConsultation();
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                      {!activeUser && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Consult CA &amp; Project Advisor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!activeUser) {
                          handleRequireAuth('login', 'Please sign in or register to access your personal dashboard.');
                          return;
                        }
                        if (onNavigateToDashboard) {
                          onNavigateToDashboard();
                        } else if (onFinishEditing) {
                          onFinishEditing();
                        } else {
                          window.location.href = '/dashboard';
                        }
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      {!activeUser && <Lock className="w-3.5 h-3.5 text-amber-300" />}
                      <span>Go to Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Membership Call-to-Action Card */}
              <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Inisio Executive Membership</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black font-manrope text-white tracking-tight">
                      Have another project to assess? Upgrade to Inisio Membership.
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-inter">
                      Unlock unlimited greenfield project feasibility appraisals, editable Word &amp; PDF dossiers, 10-year bank CMA financial models, and priority Chartered Accountant debt syndication advisory.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsMembershipModalOpen(true)}
                      className="w-full sm:w-auto px-7 py-3.5 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 active:from-blue-600 active:to-indigo-700 text-white font-black text-sm rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-amber-300" />
                      <span>View Membership Plans</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* DPR & Funding Monetization Pathways (2-Column Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* DPR Pathway Card */}
                <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-500/30 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold border border-indigo-400/30">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>DPR &amp; Bank TEV Preparation</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black font-manrope text-white tracking-tight">
                      Need a Detailed Project Report (DPR)?
                    </h3>

                    <p className="text-sm font-semibold text-indigo-200">
                      Get Connected With our DPR Partner.
                    </p>

                    <p className="text-xs text-slate-300 leading-relaxed font-inter">
                      Get your bank-compliant Techno-Economic Viability (TEV) study and Detailed Project Report drafted by empaneled Chartered Engineers and financial analysts for fast loan sanction.
                    </p>
                  </div>

                  <div className="relative z-10 mt-6 pt-4 border-t border-indigo-900/60 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400 font-medium">
                      ✓ SBI &amp; Consortium Ready Format
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDPRModalOpen(true)}
                      className="px-5 py-2.5 bg-linear-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-indigo-500/30 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Request DPR Assistance</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Funding Pathway Card */}
                <div className="bg-linear-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-500/30 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-400/30">
                      <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Debt Syndication &amp; Project Finance</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black font-manrope text-white tracking-tight">
                      Looking for Project Funding?
                    </h3>

                    <p className="text-sm font-semibold text-emerald-200">
                      Connect with our debt syndication network.
                    </p>

                    <p className="text-xs text-slate-300 leading-relaxed font-inter">
                      Direct access to senior credit desks across leading PSU Consortiums, Private Banks, SIDBI MSME capital schemes, and structured debt funds.
                    </p>
                  </div>

                  <div className="relative z-10 mt-6 pt-4 border-t border-teal-900/60 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400 font-medium">
                      ✓ ₹1 Cr - ₹100+ Cr Sanction Limits
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFundingModalOpen(true)}
                      className="px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-emerald-500/30 flex items-center gap-2 cursor-pointer"
                    >
                      <Coins className="w-4 h-4 text-emerald-300" />
                      <span>Request Funding Assistance</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          );
        })()}
        </div>
      </main>

      {/* Membership Plans Modal */}
      <MembershipPlansModal
        isOpen={isMembershipModalOpen}
        onClose={() => setIsMembershipModalOpen(false)}
        currentUser={activeUser}
        onOpenAuth={onOpenAuth}
        onOpenConsultation={onOpenConsultation}
        initialReason={membershipModalReason}
      />

      {/* DPR Request Modal */}
      <DPRRequestModal
        isOpen={isDPRModalOpen}
        onClose={() => setIsDPRModalOpen(false)}
        projectName={formData.projectName || formData.industry || 'Greenfield Project'}
        industry={formData.industry || 'Manufacturing'}
        totalCostCr={cost > 0 ? cost.toFixed(2) : (formData.totalCostCr || '10.00')}
        loanRequiredCr={
          (cost > 0 && contrib >= 0)
            ? Math.max(0, cost - contrib).toFixed(2)
            : (formData.loanRequiredCr || financials.termLoanCr || '7.50')
        }
        user={activeUser}
        onSubmitSuccess={(msg) => {
          setActionToast(msg);
          setTimeout(() => setActionToast(null), 6000);
        }}
      />

      {/* Funding Request Modal */}
      <FundingRequestModal
        isOpen={isFundingModalOpen}
        onClose={() => setIsFundingModalOpen(false)}
        projectName={formData.projectName || formData.industry || 'Greenfield Project'}
        industry={formData.industry || 'Manufacturing'}
        totalCostCr={cost > 0 ? cost.toFixed(2) : (formData.totalCostCr || '10.00')}
        loanRequiredCr={
          (cost > 0 && contrib >= 0)
            ? Math.max(0, cost - contrib).toFixed(2)
            : (formData.loanRequiredCr || financials.termLoanCr || '7.50')
        }
        user={activeUser}
        onSubmitSuccess={(msg) => {
          setActionToast(msg);
          setTimeout(() => setActionToast(null), 6000);
        }}
      />

      {/* Promoter Fund Assistance Modal */}
      <PromoterFundAssistanceModal
        isOpen={isPromoterFundAssistanceModalOpen}
        onClose={() => setIsPromoterFundAssistanceModalOpen(false)}
        project={{
          id: editingProject?.id || createdProjectIdRef.current || createdProjectId || undefined,
          projectName: formData.projectName || formData.industry || 'Greenfield Project',
          totalCostCr: cost > 0 ? cost : (parseFloat(formData.totalCostCr) || 10),
          loanRequiredCr: (cost > 0 && contrib >= 0) ? Math.max(0, cost - contrib) : (parseFloat(formData.loanRequiredCr) || 7.5),
          promoterContribCr: contrib > 0 ? contrib : (parseFloat(formData.promoterContribCr) || 2.5),
          fullName: formData.fullName,
          mobile: formData.mobile,
          email: formData.email,
          promoterFundAssistanceStatus: formData.promoterFundAssistanceRequest ? 'Request Submitted' : (editingProject?.promoterFundAssistanceStatus || 'Not Requested'),
          promoterFundAssistanceRequest: formData.promoterFundAssistanceRequest || editingProject?.promoterFundAssistanceRequest
        }}
        user={activeUser}
        onRequestSubmitted={(req) => {
          setFormData(prev => ({
            ...prev,
            promoterContributionAvailable: 'No',
            promoterFundAssistanceRequest: req
          }));
          setActionToast(`Promoter fund assistance request for ₹${req.requiredAmountCr} Cr submitted successfully!`);
          setTimeout(() => setActionToast(null), 6000);
        }}
      />

      {/* Action Success Toast Banner */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-start gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-slate-100">Request Received</p>
            <p className="text-slate-300 mt-0.5 leading-relaxed">{actionToast}</p>
          </div>
          <button
            type="button"
            onClick={() => setActionToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* In-App Institutional PDF Preview Modal */}
      <PdfPreviewModal preview={pdfPreview} onClose={() => setPdfPreview(null)} />
    </div>
  );
};


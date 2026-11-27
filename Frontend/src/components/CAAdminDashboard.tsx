import React, { useState, useEffect, useRef } from 'react';
import { AuthUser } from '../types';
import {
  LayoutDashboard,
  CreditCard,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Upload,
  Camera,
  Copy,
  Save,
  Check,
  Loader2,
  MapPin,
  Sparkles,
  Users,
  Clock,
  Send,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  RotateCw,
  Crop,
} from 'lucide-react';
import { resolveApiUrl } from '../utils/apiClient';
import { isValidGmail, validateCaAdminEmail } from '../config/adminAccess';
import { maskEmail, maskEmailsInText } from '../utils/privacyMask';
import { VisitingCardCropper } from './VisitingCardCropper';
import {
  scanBusinessCardLocally,
  rotateImageDataUrl,
  terminateCardOcrWorker,
  OcrProgressUpdate,
  CardOcrMode,
} from '../utils/cardOcrScanner';
import {
  sanitizeIndianPhoneInput,
  sanitizePersonNameInput,
  validateEmailAddress,
  validateIndianMobileNumber,
  validatePersonName,
  validateRequiredText,
} from '../utils/validation';
import { CaActivationModal } from './CaActivationModal';
import { DashboardLayout } from './dashboard/DashboardLayout';
import {
  DashboardBottomSheet,
  DashboardCard,
  DashboardCardHeader,
  DashboardEmptyState,
  DashboardFilterButton,
  DashboardKpiCard,
  DashboardSearchInput,
  DashboardStatusBadge,
  DASHBOARD_TABLE,
} from './dashboard/DashboardPrimitives';

interface CAAdminDashboardProps {
  user?: AuthUser | null;
  onLogout?: () => void;
  onNavigateHome?: () => void;
}

type CAAdminTab = 'card-registration' | 'reporting' | 'email-templates';

const STORAGE_KEY_CA_ADMIN_SESSION = 'inisio_ca_admin_session';

const escapePreviewHtml = (value: string): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderEmailTemplatePreview = (
  subjectTpl: string,
  htmlTpl: string,
  vars: {
    name: string;
    firmName: string;
    email: string;
    claimUrl: string;
    loginUrl: string;
    sourceTag: string;
    expiryDays: string;
  }
) => {
  const apply = (tpl: string, isHtml: boolean) => {
    const v = (s: string) => (isHtml ? escapePreviewHtml(s) : s);
    return String(tpl || '')
      .replace(/\{\{\s*name\s*\}\}|\{\s*name\s*\}/gi, v(vars.name))
      .replace(/\{\{\s*firmName\s*\}\}|\{\s*firmName\s*\}/gi, v(vars.firmName))
      .replace(/\{\{\s*email\s*\}\}|\{\s*email\s*\}/gi, v(vars.email))
      .replace(/\{\{\s*claimUrl\s*\}\}|\{\s*claimUrl\s*\}/gi, v(vars.claimUrl))
      .replace(/\{\{\s*loginUrl\s*\}\}|\{\s*loginUrl\s*\}/gi, v(vars.loginUrl))
      .replace(/\{\{\s*sourceTag\s*\}\}|\{\s*sourceTag\s*\}/gi, v(vars.sourceTag))
      .replace(/\{\{\s*expiryDays\s*\}\}|\{\s*expiryDays\s*\}/gi, v(vars.expiryDays));
  };

  const renderedSubject = apply(subjectTpl, false);
  const renderedHtml = apply(htmlTpl, true);
  const unresolvedMatches = [
    ...(renderedSubject.match(/\{\{[^}]+\}\}/g) || []),
    ...(renderedHtml.match(/\{\{[^}]+\}\}/g) || []),
  ];
  return {
    subject: renderedSubject,
    html: renderedHtml,
    unresolvedPlaceholders: Array.from(new Set(unresolvedMatches)),
  };
};

export const CAAdminDashboard: React.FC<CAAdminDashboardProps> = ({
  user,
  onLogout,
  onNavigateHome,
}) => {
  const [caAdminSession, setCaAdminSession] = useState<{ email: string; token?: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      if (user && user.role === 'ca_admin') {
        return { email: user.email, token: user.token };
      }
      const saved = localStorage.getItem(STORAGE_KEY_CA_ADMIN_SESSION);
      if (saved && saved !== 'true') {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && validateCaAdminEmail(parsed.email)) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    if (user && user.role === 'ca_admin') {
      setCaAdminSession({ email: user.email, token: user.token });
    }
  }, [user]);

  const [authView, setAuthView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const [activeTab, setActiveTab] = useState<CAAdminTab>('card-registration');
  const [loading, setLoading] = useState(false);

  const [registrationStep, setRegistrationStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [rawCardImage, setRawCardImage] = useState<string>('');
  const [showCropper, setShowCropper] = useState<boolean>(false);
  const [cardImagePreview, setCardImagePreview] = useState<string>('');
  const [cardFileName, setCardFileName] = useState<string>('');
  const [showEmailPreviewPane, setShowEmailPreviewPane] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [cardFormData, setCardFormData] = useState({
    name: '',
    email: '',
    phone: '',
    firmName: '',
    membershipNumber: '',
    city: '',
    state: '',
    sourceTag: 'WOFA-2026',
    notes: '',
    ocrRawText: '',
  });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgressUpdate>({ status: '', progress: 0 });
  const [ocrError, setOcrError] = useState<string>('');
  const [ocrNotice, setOcrNotice] = useState<string>('');
  const [scanMode, setScanMode] = useState<CardOcrMode>('auto');
  const [alternatePhones, setAlternatePhones] = useState<string[]>([]);
  const [showRawOcrText, setShowRawOcrText] = useState(false);
  const [cardTouched, setCardTouched] = useState<Record<string, boolean>>({});
  const [cardSubmitted, setCardSubmitted] = useState(false);
  const [profileSubmitError, setProfileSubmitError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void terminateCardOcrWorker();
    };
  }, []);

  const [createdProfile, setCreatedProfile] = useState<any>(null);

  const [claimDispatchLoading, setClaimDispatchLoading] = useState(false);
  const [claimDispatchResult, setClaimDispatchResult] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [testClaimToken, setTestClaimToken] = useState<string | null>(null);

  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [sourceTagReports, setSourceTagReports] = useState<any>({
    totals: { totalProfiles: 0, pending: 0, invited: 0, activated: 0 },
    bySourceTag: [],
  });
  const [profileSearch, setProfileSearch] = useState('');
  const [profileStatusFilter, setProfileStatusFilter] = useState('ALL');
  const [profileTagFilter, setProfileTagFilter] = useState('ALL');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const [emailTemplates, setEmailTemplates] = useState<any>(null);
  const [editingTemplateType, setEditingTemplateType] = useState<'claimInvitation' | 'activationConfirmation'>('claimInvitation');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateHtml, setTemplateHtml] = useState('');
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateSavedBanner, setTemplateSavedBanner] = useState(false);

  const getAuthHeaders = (withJson = false): Record<string, string> => {
    const token =
      caAdminSession?.token ||
      (typeof window !== 'undefined' ? localStorage.getItem('inisio_auth_token') : null);
    const headers: Record<string, string> = {};
    if (withJson) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders(false);
      const [reportsRes, profilesRes] = await Promise.all([
        fetch(resolveApiUrl('/ca-admin/reports'), { headers }).then((r) => r.json()).catch(() => null),
        fetch(resolveApiUrl('/ca-admin/profiles'), { headers }).then((r) => r.json()).catch(() => null),
      ]);

      if (reportsRes && reportsRes.data) {
        setSourceTagReports(reportsRes.data);
      }
      if (profilesRes && profilesRes.data) {
        setAllProfiles(profilesRes.data);
      }
    } catch (err) {
      console.warn('Error loading CA Admin reporting data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caAdminSession) {
      fetchDashboardData();
    }
  }, [caAdminSession]);

  useEffect(() => {
    if (!caAdminSession) return;
    fetch(resolveApiUrl('/ca-admin/templates'), { headers: getAuthHeaders(false) })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setEmailTemplates(data.data);
          const activeTpl = data.data[editingTemplateType];
          if (activeTpl) {
            setTemplateSubject(activeTpl.subject || '');
            setTemplateHtml(activeTpl.html || activeTpl.body || '');
          }
        }
      })
      .catch(() => {});
  }, [activeTab, editingTemplateType, caAdminSession]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    const clean = loginEmail.trim().toLowerCase();
    if (!isValidGmail(clean)) {
      setLoginError('Please enter a valid @gmail.com address for CA Admin access.');
      return;
    }
    if (!validateCaAdminEmail(clean)) {
      setLoginError('Access Denied: This Gmail address is not an authorized CA_ADMIN account.');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('Please enter your password to sign in.');
      return;
    }

    setLoginLoading(true);

    try {
      const res = await fetch(resolveApiUrl('/ca-admin/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean, password: loginPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data?.token && data.data?.role === 'ca_admin') {
        const session = {
          email: data.data.email,
          token: data.data.token,
        };
        setCaAdminSession(session);
        setLoginPassword('');
        try {
          localStorage.setItem(STORAGE_KEY_CA_ADMIN_SESSION, JSON.stringify(session));
          localStorage.setItem('inisio_auth_token', data.data.token);
        } catch {}
      } else {
        setLoginError(data.message || 'Access Denied: Only authorized CA_ADMIN is permitted.');
      }
    } catch {
      setLoginError('Unable to reach authentication server. Please check backend connection.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRequestCaReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    const clean = loginEmail.trim().toLowerCase();
    if (!isValidGmail(clean) || !validateCaAdminEmail(clean)) {
      setLoginError('Access Denied: Only authorized CA Admin @gmail.com accounts can reset passwords here.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const maskedNotice = data.message
          ? maskEmailsInText(data.message)
          : `A 6-digit password reset code has been sent to ${maskEmail(clean)}.`;
        setLoginSuccess(maskedNotice);
        setResendCooldown(30);
        setAuthView('reset');
      } else {
        setLoginError(data.message || 'Unable to send reset code. Please check your CA Admin Gmail.');
      }
    } catch {
      setLoginError('Network error while sending reset code. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleConfirmCaReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    const clean = loginEmail.trim().toLowerCase();
    const cleanOtp = resetOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setLoginError('Please enter the 6-digit code sent to your Gmail.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setLoginError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLoginError('Passwords do not match.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean, otp: cleanOtp, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setLoginSuccess('Password updated successfully. You can now sign in with your new password.');
        setLoginPassword('');
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setAuthView('login');
      } else {
        setLoginError(data.message || 'Invalid or expired 6-digit code.');
      }
    } catch {
      setLoginError('Network error while resetting password. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = () => {
    setCaAdminSession(null);
    try {
      localStorage.removeItem(STORAGE_KEY_CA_ADMIN_SESSION);
    } catch {}
    if (onLogout) onLogout();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value so re-selecting the same file always triggers onChange
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setOcrError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    setOcrError('');
    setOcrNotice('');
    setProfileSubmitError('');
    setCardFileName(file.name);

    const reader = new FileReader();
    reader.onerror = () => {
      setOcrError('Could not read the selected image file. Please try another photo or fill the form manually.');
    };
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        setOcrError('Image could not be loaded. Please try again or fill the form manually.');
        return;
      }
      setRawCardImage(result);
      setCardImagePreview('');
      setShowCropper(true);
      setScanMode('auto');
      setAlternatePhones([]);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmCropAndScan = (croppedDataUrl: string) => {
    setShowCropper(false);
    setCardImagePreview(croppedDataUrl);
    setScanMode('auto');
    setAlternatePhones([]);
    triggerOcrExtraction(croppedDataUrl, 'auto');
  };

  const triggerOcrExtraction = async (imageData: string, modeOverride?: CardOcrMode) => {
    const activeMode = modeOverride ?? scanMode;
    setOcrLoading(true);
    setOcrError('');
    setOcrNotice('');
    setProfileSubmitError('');
    setDuplicateWarning(null);
    setCardTouched({});
    setCardSubmitted(false);
    setOcrProgress({ status: 'Preparing image...', progress: 5 });

    try {
      const parsed = await scanBusinessCardLocally(
        imageData,
        (update) => {
          setOcrProgress(update);
        },
        { mode: activeMode }
      );

      const noteSegments: string[] = [];
      if (parsed.designation) noteSegments.push(`Designation: ${parsed.designation}`);
      if (parsed.website) noteSegments.push(`Website: ${parsed.website}`);
      if (parsed.address) noteSegments.push(`Address: ${parsed.address}`);
      const notesText =
        noteSegments.length > 0
          ? noteSegments.join(' | ')
          : 'Captured via client-side business card OCR.';

      const cleanEmail = parsed.email.trim().toLowerCase();
      const cleanPhone = sanitizeIndianPhoneInput(parsed.phone);
      const cleanAltPhones = (parsed.alternatePhones || [])
        .map((p) => sanitizeIndianPhoneInput(p))
        .filter((p) => p.length === 10 && p !== cleanPhone);
      const cleanName = sanitizePersonNameInput(parsed.name).trim();
      const cleanFirm = parsed.firmName.trim().slice(0, 100);
      const cleanMbr = parsed.membershipNumber.trim().slice(0, 24);
      const cleanCity = sanitizePersonNameInput(parsed.city, 60).trim();
      const cleanState = sanitizePersonNameInput(parsed.state, 60).trim();

      setAlternatePhones(cleanAltPhones);
      setCardFormData((prev) => ({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        firmName: cleanFirm,
        membershipNumber: cleanMbr,
        city: cleanCity,
        state: cleanState,
        sourceTag: prev.sourceTag || 'WOFA-2026',
        notes: notesText,
        ocrRawText: parsed.ocrRawText || '',
      }));

      const detectedCount = [cleanName, cleanFirm, cleanEmail, cleanPhone, cleanMbr, cleanCity].filter(Boolean).length;
      if (detectedCount === 0) {
        setOcrNotice(
          'Could not read clear text from this photo. Try rotating the card, switching to High Contrast or Dark Card mode, or edit the fields manually below.'
        );
      } else if (parsed.source === 'qr') {
        setOcrNotice('QR contact code detected and fields prefilled. Please review before saving.');
      } else if (detectedCount < 3) {
        setOcrNotice(
          'Partial details extracted from the card. Try Rotate 90° or High Contrast / Dark Card re-scan if needed, or complete missing fields below.'
        );
      } else {
        setOcrNotice(
          `Extracted ${detectedCount} fields locally in your browser${
            typeof parsed.confidence === 'number' ? ` (${Math.round(parsed.confidence)}% OCR confidence)` : ''
          }. Review and edit before saving.`
        );
      }

      setRegistrationStep(2);
      if (cleanEmail || cleanPhone || cleanMbr) {
        checkDuplicates(cleanEmail, cleanPhone, cleanMbr);
      }
    } catch (err: any) {
      console.warn('Client-side OCR processing error:', err);
      setOcrError(
        err?.message
          ? `Card scan failed: ${err.message} You can retry with a clearer photo or fill the form manually.`
          : 'Card OCR failed to read this image. Please retry with a clearer photo or enter details manually.'
      );
    } finally {
      setOcrLoading(false);
    }
  };

  const handleRotateAndRescan = async () => {
    if (!cardImagePreview || ocrLoading) return;
    try {
      const rotated = await rotateImageDataUrl(cardImagePreview, 90);
      setCardImagePreview(rotated);
      await triggerOcrExtraction(rotated, scanMode);
    } catch {
      setOcrError('Could not rotate the card preview. Please upload the image again.');
    }
  };

  const handleScanModeChange = async (nextMode: CardOcrMode) => {
    setScanMode(nextMode);
    if (cardImagePreview && !ocrLoading) {
      await triggerOcrExtraction(cardImagePreview, nextMode);
    }
  };

  const checkDuplicates = async (emailToCheck: string, phoneToCheck: string, regToCheck?: string) => {
    const cleanEmail = (emailToCheck || '').trim().toLowerCase();
    const cleanPhone = sanitizeIndianPhoneInput(phoneToCheck || '');
    const cleanReg = (regToCheck || '').trim();
    if (!cleanEmail && cleanPhone.length < 10 && !cleanReg) {
      setDuplicateWarning(null);
      return;
    }
    try {
      const res = await fetch(resolveApiUrl('/ca-admin/cards/check-duplicate'), {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          email: cleanEmail,
          phone: cleanPhone,
          membershipNumber: cleanReg,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.duplicate) {
        setDuplicateWarning(
          `Duplicate Warning: A CA profile with matching ${data.data.field} (${data.data.existingProfile?.name || cleanEmail || cleanPhone}) is already registered in the system.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // ignore network glitches during advisory duplicate check
    }
  };

  const getCardFieldErrors = (data = cardFormData) => {
    const errors: Record<string, string> = {};

    const nameRes = validatePersonName(data.name, 'CA Full Name', true);
    if (!nameRes.isValid && nameRes.error) errors.name = nameRes.error;

    const firmRes = validateRequiredText(data.firmName, 'CA Firm Name', 100);
    if (!firmRes.isValid && firmRes.error) errors.firmName = firmRes.error;

    const emailRes = validateEmailAddress(data.email, true);
    if (!emailRes.isValid && emailRes.error) errors.email = emailRes.error;

    const phoneRes = validateIndianMobileNumber(data.phone);
    if (!phoneRes.isValid && phoneRes.error) errors.phone = phoneRes.error;

    const tagRes = validateRequiredText(data.sourceTag, 'Conference Source Tag', 40);
    if (!tagRes.isValid && tagRes.error) errors.sourceTag = tagRes.error;

    if (data.city.trim()) {
      const cityRes = validatePersonName(data.city, 'City', false);
      if (!cityRes.isValid && cityRes.error) errors.city = cityRes.error;
    }

    if (data.state.trim()) {
      const stateRes = validatePersonName(data.state, 'State', false);
      if (!stateRes.isValid && stateRes.error) errors.state = stateRes.error;
    }

    return errors;
  };

  const cardFieldErrors = getCardFieldErrors();
  const shouldShowCardError = (field: string) =>
    Boolean((cardTouched[field] || cardSubmitted) && cardFieldErrors[field]);

  const handleCreatePendingProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardSubmitted(true);
    setProfileSubmitError('');

    const trimmedData = {
      ...cardFormData,
      name: sanitizePersonNameInput(cardFormData.name).trim(),
      firmName: cardFormData.firmName.trim(),
      email: cardFormData.email.trim().toLowerCase(),
      phone: sanitizeIndianPhoneInput(cardFormData.phone),
      membershipNumber: cardFormData.membershipNumber.trim().toUpperCase(),
      sourceTag: cardFormData.sourceTag.trim(),
      city: sanitizePersonNameInput(cardFormData.city, 60).trim(),
      state: sanitizePersonNameInput(cardFormData.state, 60).trim(),
      notes: cardFormData.notes.trim(),
    };
    setCardFormData(trimmedData);

    const errors = getCardFieldErrors(trimmedData);
    if (Object.keys(errors).length > 0) {
      setProfileSubmitError('Please fix the highlighted fields before saving the CA profile.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(resolveApiUrl('/ca-admin/profiles'), {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          ...trimmedData,
          cardImageUrl: cardImagePreview,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setCreatedProfile(data.data);
        setProfileSubmitError('');
        setRegistrationStep(3);
        fetchDashboardData();
      } else {
        setProfileSubmitError(data.message || 'Failed to create profile. Please check duplicates and try again.');
      }
    } catch (err: any) {
      setProfileSubmitError(err?.message || 'Network error while creating pending profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchClaimInvitation = async (profileId: string) => {
    setClaimDispatchLoading(true);
    try {
      const res = await fetch(resolveApiUrl(`/ca-admin/profiles/${profileId}/claim-invitation`), {
        method: 'POST',
        headers: getAuthHeaders(false),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setClaimDispatchResult(data.data);
        setRegistrationStep(4);
        fetchDashboardData();
      }
    } catch (err: any) {
      console.warn('Failed to dispatch claim invitation:', err);
    } finally {
      setClaimDispatchLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    setTemplateSaving(true);
    try {
      const typeEndpoint = editingTemplateType === 'claimInvitation' ? 'claim-invitation' : 'activation-confirmation';
      const res = await fetch(resolveApiUrl(`/ca-admin/templates/${typeEndpoint}`), {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ subject: templateSubject, html: templateHtml }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailTemplates((prev: any) => ({
          ...(prev || {}),
          [editingTemplateType]: {
            ...(prev?.[editingTemplateType] || {}),
            subject: templateSubject,
            html: templateHtml,
          },
        }));
        setTemplateSavedBanner(true);
        setTimeout(() => setTemplateSavedBanner(false), 3000);
      }
    } catch (err) {
      console.warn('Failed to save template updates:', err);
    } finally {
      setTemplateSaving(false);
    }
  };

  if (!caAdminSession) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 font-inter overflow-y-auto">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl space-y-6 text-center my-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold text-white font-manrope">
              {authView === 'forgot'
                ? 'Reset / Set CA Admin Password'
                : authView === 'reset'
                  ? 'Create New Password'
                  : 'CA Admin Portal'}
            </h1>
            <p className="text-xs text-slate-400">
              {authView === 'forgot'
                ? 'Enter your authorized CA Admin Gmail to receive a 6-digit code.'
                : authView === 'reset'
                  ? 'Enter the 6-digit code sent to your Gmail and choose a new password.'
                  : 'Restricted Operations: Visiting Card Scanner & Network Administration'}
            </p>
          </div>

          {loginSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-medium text-left flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{loginSuccess}</span>
            </div>
          )}

          {loginError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-medium text-left space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
              {authView === 'login' && loginError.toLowerCase().includes('no password') && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('forgot');
                    setLoginError('');
                  }}
                  className="text-blue-400 hover:text-blue-300 underline font-semibold pl-6 cursor-pointer"
                >
                  Set password via email code &rarr;
                </button>
              )}
            </div>
          )}

          {authView === 'forgot' ? (
            <form onSubmit={handleRequestCaReset} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Authorized Gmail Address
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="yourname@gmail.com"
                  className="w-full px-4 py-3 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading || !loginEmail.trim()}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send 6-Digit Code</span>}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('reset');
                    setLoginError('');
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  Already have a code?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setLoginError('');
                    setLoginSuccess('');
                  }}
                  className="text-slate-400 hover:text-white font-semibold cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : authView === 'reset' ? (
            <form onSubmit={handleConfirmCaReset} className="space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Authorized Gmail Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  6-Digit Reset Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-mono tracking-widest text-center bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  disabled={loginLoading || resendCooldown > 0}
                  onClick={() => handleRequestCaReset()}
                  className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {loginLoading && <RotateCw className="w-3 h-3 animate-spin" />}
                  <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setLoginError('');
                    setLoginSuccess('');
                  }}
                  className="text-slate-400 hover:text-white font-semibold cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading || resetOtp.length < 6 || newPassword.length < 6}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save New Password</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Authorized Gmail Address
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="yourname@gmail.com"
                  className="w-full px-4 py-3 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('forgot');
                      setLoginError('');
                      setLoginSuccess('');
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    Forgot / Set password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Authenticate &amp; Enter</span>}
              </button>
            </form>
          )}

          {onNavigateHome && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateHome}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Website</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'card-registration' as CAAdminTab, label: 'Card Registration', mobileLabel: 'Card Scan', icon: CreditCard },
    { id: 'reporting' as CAAdminTab, label: 'Profiles & Tag Reporting', mobileLabel: 'Reporting', icon: LayoutDashboard, count: allProfiles.length },
    { id: 'email-templates' as CAAdminTab, label: 'Email Templates', mobileLabel: 'Templates', icon: Mail },
  ];

  const uniqueTags = Array.from(new Set(allProfiles.map((p) => p.sourceTag).filter(Boolean)));
  const activeFilterCount =
    (profileStatusFilter !== 'ALL' ? 1 : 0) + (profileTagFilter !== 'ALL' ? 1 : 0);

  const filteredProfiles = allProfiles.filter((p) => {
    if (profileStatusFilter !== 'ALL' && (p.status || '').toLowerCase() !== profileStatusFilter.toLowerCase()) {
      return false;
    }
    if (profileTagFilter !== 'ALL' && (p.sourceTag || '').toUpperCase() !== profileTagFilter.toUpperCase()) {
      return false;
    }
    if (profileSearch.trim()) {
      const q = profileSearch.toLowerCase();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.firmName || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q) ||
        (p.sourceTag || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pageTitles: Record<CAAdminTab, string> = {
    'card-registration': 'Business Card Registration Workflow',
    reporting: 'CA Profiles & Conference Tag Reporting',
    'email-templates': 'Email Notification Templates',
  };

  const renderMobileStickyAction = () => {
    if (activeTab === 'card-registration') {
      if (registrationStep === 1 && !showCropper) {
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 min-h-[44px] px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Capture from Camera</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span>Upload</span>
            </button>
          </div>
        );
      }
      if (registrationStep === 2) {
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRegistrationStep(1)}
              className="min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer shrink-0"
            >
              Back
            </button>
            <button
              type="submit"
              form="ca-card-review-form"
              disabled={loading}
              className="flex-1 min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving Profile...' : 'Save as Pending Profile'}
            </button>
          </div>
        );
      }
      if (registrationStep === 3 && createdProfile) {
        return (
          <button
            type="button"
            onClick={() => handleDispatchClaimInvitation(createdProfile._id || createdProfile.id)}
            disabled={claimDispatchLoading}
            className="w-full min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>{claimDispatchLoading ? 'Dispatching...' : 'Verified — Send Claim Invitation Email'}</span>
          </button>
        );
      }
      if (registrationStep === 4 && claimDispatchResult) {
        return (
          <button
            type="button"
            onClick={() => {
              setRegistrationStep(1);
              setRawCardImage('');
              setShowCropper(false);
              setCardImagePreview('');
              setCardFileName('');
              setAlternatePhones([]);
              setScanMode('auto');
              setCreatedProfile(null);
              setClaimDispatchResult(null);
            }}
            className="w-full min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Scan Another Card</span>
          </button>
        );
      }
      return undefined;
    }

    if (activeTab === 'reporting') {
      return (
        <button
          type="button"
          onClick={() => {
            setActiveTab('card-registration');
            setRegistrationStep(1);
          }}
          className="w-full min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>Scan Visiting Card</span>
        </button>
      );
    }

    if (activeTab === 'email-templates') {
      return (
        <button
          type="button"
          onClick={handleSaveTemplate}
          disabled={templateSaving}
          className="w-full min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4 shrink-0" />
          <span>{templateSaving ? 'Saving...' : 'Save Template Updates'}</span>
        </button>
      );
    }
    return undefined;
  };

  return (
    <>
      <DashboardLayout
        portalName="Inisio"
        portalSubtitle="CA Admin Portal"
        portalIcon={ShieldCheck}
        roleLabel="CA Operations Admin"
        userEmail={caAdminSession.email}
        navItems={navItems}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as CAAdminTab)}
        pageTitle={pageTitles[activeTab]}
        pageBreadcrumb={activeTab !== 'card-registration' ? 'Card Registration' : undefined}
        showBackButton={activeTab !== 'card-registration'}
        onGoBack={() => setActiveTab('card-registration')}
        onNavigateHome={onNavigateHome}
        homeLabel="Public Website"
        onLogout={handleSignOut}
        logoutLabel="Sign Out"
        mobileStickyAction={renderMobileStickyAction()}
        headerActions={
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            aria-label="Refresh"
            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-[36px] px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      >
        {/* SECTION 1: BUSINESS CARD REGISTRATION */}
        {activeTab === 'card-registration' && (
          <div className="space-y-5 sm:space-y-6 w-full">
            <DashboardCard className="p-2.5 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {[
                  { num: 1, label: '1. Scan & OCR' },
                  { num: 2, label: '2. Admin Review' },
                  { num: 3, label: '3. Pending Profile' },
                  { num: 4, label: '4. Claim Invitation' },
                ].map((s) => (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setRegistrationStep(s.num as any)}
                    className={`min-h-[44px] sm:min-h-[38px] py-2 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap truncate ${
                      registrationStep === s.num
                        ? 'bg-blue-600 text-white'
                        : registrationStep > s.num
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </DashboardCard>

            {registrationStep === 1 && (
              <DashboardCard className="p-6 sm:p-8 space-y-6 text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto border border-blue-200">
                  <CreditCard className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 font-manrope">Scan Visiting Card</h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Upload a photo from your mobile camera or desktop file to automatically extract CA name, firm, contact details, and ICAI registration number.
                  </p>
                </div>

                {showCropper && rawCardImage ? (
                  <div className="max-w-2xl mx-auto text-left">
                    <VisitingCardCropper
                      imageSrc={rawCardImage}
                      isProcessing={ocrLoading}
                      onConfirmCrop={handleConfirmCropAndScan}
                      onCancel={() => {
                        setShowCropper(false);
                        setRawCardImage('');
                        setCardImagePreview('');
                        setCardFileName('');
                      }}
                    />
                  </div>
                ) : cardImagePreview ? (
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-950 flex items-center justify-center">
                      <img src={cardImagePreview} alt="Scanned Card Preview" className="max-h-56 object-contain" />
                    </div>
                    <div className="text-xs text-slate-500 font-medium">{cardFileName}</div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {rawCardImage && (
                        <button
                          type="button"
                          disabled={ocrLoading}
                          onClick={() => setShowCropper(true)}
                          className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          <Crop className="w-3.5 h-3.5" />
                          <span>Adjust Crop</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={ocrLoading}
                        onClick={handleRotateAndRescan}
                        className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Rotate 90&deg;</span>
                      </button>
                      {(
                        [
                          { id: 'auto', label: 'Auto' },
                          { id: 'high-contrast', label: 'High Contrast' },
                          { id: 'dark-card', label: 'Dark Card' },
                        ] as { id: CardOcrMode; label: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={ocrLoading}
                          onClick={() => handleScanModeChange(opt.id)}
                          className={`min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                            scanMode === opt.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRawCardImage('');
                        setShowCropper(false);
                        setCardImagePreview('');
                        setCardFileName('');
                        setAlternatePhones([]);
                        setScanMode('auto');
                      }}
                      className="min-h-[44px] px-3 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Remove and re-scan photo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-6 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-600 hover:bg-blue-50/40 transition-colors flex flex-col items-center gap-2 cursor-pointer group"
                    >
                      <Camera className="w-7 h-7 text-blue-600" />
                      <span className="text-xs font-semibold text-slate-800">Capture from Camera</span>
                      <span className="text-[11px] text-slate-500">Mobile Camera Capture</span>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-600 hover:bg-slate-50 transition-colors flex flex-col items-center gap-2 cursor-pointer group"
                    >
                      <Upload className="w-7 h-7 text-slate-600" />
                      <span className="text-xs font-semibold text-slate-800">Upload Card Photo</span>
                      <span className="text-[11px] text-slate-500">PNG, JPG, or WEBP file</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </button>
                  </div>
                )}

                {ocrLoading && (
                  <div className="max-w-md mx-auto p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-2 text-left">
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                        <span>{ocrProgress.status || 'Running browser OCR...'}</span>
                      </span>
                      <span className="tabular-nums text-blue-700">{ocrProgress.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${Math.max(5, ocrProgress.progress)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-blue-700/80">
                      Processed privately in your browser — image is never sent to external OCR services.
                    </p>
                  </div>
                )}

                {ocrError && (
                  <div className="max-w-md mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs text-left space-y-2">
                    <div className="flex items-start gap-2 font-semibold">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{ocrError}</span>
                    </div>
                    <div className="pl-6 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setOcrError('');
                          setRegistrationStep(2);
                        }}
                        className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                      >
                        Enter details manually &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {!ocrLoading && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOcrError('');
                        setRegistrationStep(2);
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Or skip scan and enter CA details manually
                    </button>
                  </div>
                )}
              </DashboardCard>
            )}

            {registrationStep === 2 && (
              <DashboardCard className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-manrope">
                      Admin Review &amp; Field Verification
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify and edit extracted details before saving. All fields remain editable and are never auto-submitted.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {cardFormData.ocrRawText && (
                      <button
                        type="button"
                        onClick={() => setShowRawOcrText((prev) => !prev)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer whitespace-nowrap"
                      >
                        {showRawOcrText ? 'Hide Raw OCR' : 'View Raw OCR'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setOcrError('');
                        setRegistrationStep(1);
                      }}
                      className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer whitespace-nowrap"
                    >
                      Re-scan Card
                    </button>
                  </div>
                </div>

                {cardImagePreview && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={cardImagePreview}
                        alt="Card thumbnail"
                        className="w-16 h-11 rounded-lg object-cover border border-slate-200 bg-slate-900 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {cardFileName || 'Uploaded Visiting Card'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ocrLoading
                            ? `${ocrProgress.status || 'Re-scanning...'} (${ocrProgress.progress}%)`
                            : 'Need clearer digits? Rotate or switch OCR contrast mode.'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {rawCardImage && (
                        <button
                          type="button"
                          disabled={ocrLoading}
                          onClick={() => {
                            setShowCropper(true);
                            setRegistrationStep(1);
                          }}
                          className="inline-flex items-center gap-1 min-h-[44px] sm:min-h-[34px] px-3 sm:px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                        >
                          <Crop className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                          <span>Re-crop</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={ocrLoading}
                        onClick={handleRotateAndRescan}
                        className="inline-flex items-center gap-1 min-h-[44px] sm:min-h-[34px] px-3 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                      >
                        <RotateCw className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                        <span>Rotate 90&deg;</span>
                      </button>
                      {(
                        [
                          { id: 'auto', label: 'Auto' },
                          { id: 'high-contrast', label: 'High Contrast' },
                          { id: 'dark-card', label: 'Dark Card' },
                        ] as { id: CardOcrMode; label: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={ocrLoading}
                          onClick={() => handleScanModeChange(opt.id)}
                          className={`min-h-[44px] sm:min-h-[34px] px-3 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-[11px] font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                            scanMode === opt.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {ocrNotice && (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{ocrNotice}</span>
                  </div>
                )}

                {showRawOcrText && cardFormData.ocrRawText && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Raw Extracted Text
                    </div>
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto">
                      {cardFormData.ocrRawText}
                    </pre>
                  </div>
                )}

                {duplicateWarning && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-950">Duplicate Warning</div>
                      <div>{duplicateWarning}</div>
                    </div>
                  </div>
                )}

                {profileSubmitError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{profileSubmitError}</span>
                  </div>
                )}

                <form id="ca-card-review-form" onSubmit={handleCreatePendingProfile} noValidate className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">CA Full Name *</label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={cardFormData.name}
                        onChange={(e) => {
                          const sanitized = sanitizePersonNameInput(e.target.value, 80);
                          setCardFormData((prev) => ({ ...prev, name: sanitized }));
                        }}
                        onBlur={() => {
                          setCardFormData((prev) => ({ ...prev, name: prev.name.trim() }));
                          setCardTouched((prev) => ({ ...prev, name: true }));
                        }}
                        placeholder="e.g. Rajesh Kulkarni"
                        className={`w-full min-h-[44px] sm:min-h-[38px] px-3.5 py-2 text-sm sm:text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white ${
                          shouldShowCardError('name')
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-blue-600'
                        }`}
                      />
                      {shouldShowCardError('name') && (
                        <p className="text-[11px] text-rose-600 font-medium">{cardFieldErrors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">CA Firm Name *</label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={cardFormData.firmName}
                        onChange={(e) => setCardFormData((prev) => ({ ...prev, firmName: e.target.value }))}
                        onBlur={() => {
                          setCardFormData((prev) => ({ ...prev, firmName: prev.firmName.trim() }));
                          setCardTouched((prev) => ({ ...prev, firmName: true }));
                        }}
                        placeholder="e.g. Kulkarni & Associates"
                        className={`w-full min-h-[44px] sm:min-h-[38px] px-3.5 py-2 text-sm sm:text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white ${
                          shouldShowCardError('firmName')
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-blue-600'
                        }`}
                      />
                      {shouldShowCardError('firmName') && (
                        <p className="text-[11px] text-rose-600 font-medium">{cardFieldErrors.firmName}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                      <input
                        type="email"
                        required
                        maxLength={120}
                        autoComplete="email"
                        value={cardFormData.email}
                        onChange={(e) => setCardFormData((prev) => ({ ...prev, email: e.target.value }))}
                        onBlur={() => {
                          const normalizedEmail = cardFormData.email.trim().toLowerCase();
                          setCardFormData((prev) => ({ ...prev, email: normalizedEmail }));
                          setCardTouched((prev) => ({ ...prev, email: true }));
                          if (validateEmailAddress(normalizedEmail).isValid) {
                            checkDuplicates(normalizedEmail, cardFormData.phone, cardFormData.membershipNumber);
                          }
                        }}
                        placeholder="ca.name@firm.in"
                        className={`w-full min-h-[44px] sm:min-h-[38px] px-3.5 py-2 text-sm sm:text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white ${
                          shouldShowCardError('email')
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-blue-600'
                        }`}
                      />
                      {shouldShowCardError('email') && (
                        <p className="text-[11px] text-rose-600 font-medium">{cardFieldErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Mobile / Contact Phone *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        required
                        value={cardFormData.phone}
                        onChange={(e) => {
                          const cleaned = sanitizeIndianPhoneInput(e.target.value);
                          setCardFormData((prev) => ({ ...prev, phone: cleaned }));
                        }}
                        onBlur={() => {
                          const cleaned = sanitizeIndianPhoneInput(cardFormData.phone);
                          setCardFormData((prev) => ({ ...prev, phone: cleaned }));
                          setCardTouched((prev) => ({ ...prev, phone: true }));
                          if (validateIndianMobileNumber(cleaned).isValid) {
                            checkDuplicates(cardFormData.email, cleaned, cardFormData.membershipNumber);
                          }
                        }}
                        placeholder="10-digit Indian mobile (e.g. 9876543210)"
                        className={`w-full min-h-[44px] sm:min-h-[38px] px-3.5 py-2 text-sm sm:text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white tabular-nums ${
                          shouldShowCardError('phone')
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-blue-600'
                        }`}
                      />
                      {shouldShowCardError('phone') && (
                        <p className="text-[11px] text-rose-600 font-medium">{cardFieldErrors.phone}</p>
                      )}
                      {alternatePhones.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-slate-500 font-medium">Also detected:</span>
                          {alternatePhones.map((altPhone) => (
                            <button
                              key={altPhone}
                              type="button"
                              onClick={() => {
                                const prevPhone = sanitizeIndianPhoneInput(cardFormData.phone);
                                setCardFormData((prev) => ({ ...prev, phone: altPhone }));
                                setAlternatePhones((prev) => {
                                  const next = prev.filter((p) => p !== altPhone);
                                  if (prevPhone.length === 10 && prevPhone !== altPhone && !next.includes(prevPhone)) {
                                    next.push(prevPhone);
                                  }
                                  return next;
                                });
                                if (validateIndianMobileNumber(altPhone).isValid) {
                                  checkDuplicates(cardFormData.email, altPhone, cardFormData.membershipNumber);
                                }
                              }}
                              className="min-h-[36px] px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold tabular-nums cursor-pointer transition-colors"
                            >
                              {altPhone}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">ICAI Registration / Membership No.</label>
                      <input
                        type="text"
                        maxLength={24}
                        value={cardFormData.membershipNumber}
                        onChange={(e) =>
                          setCardFormData((prev) => ({ ...prev, membershipNumber: e.target.value.toUpperCase() }))
                        }
                        onBlur={() => {
                          const cleanReg = cardFormData.membershipNumber.trim().toUpperCase();
                          setCardFormData((prev) => ({ ...prev, membershipNumber: cleanReg }));
                          if (cleanReg) {
                            checkDuplicates(cardFormData.email, cardFormData.phone, cleanReg);
                          }
                        }}
                        placeholder="e.g. FCA-048291"
                        className="w-full min-h-[44px] sm:min-h-[38px] px-3.5 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Conference Source Tag *</label>
                      <input
                        type="text"
                        required
                        maxLength={40}
                        value={cardFormData.sourceTag}
                        onChange={(e) => setCardFormData((prev) => ({ ...prev, sourceTag: e.target.value }))}
                        onBlur={() => {
                          setCardFormData((prev) => ({ ...prev, sourceTag: prev.sourceTag.trim() }));
                          setCardTouched((prev) => ({ ...prev, sourceTag: true }));
                        }}
                        placeholder="e.g. WOFA-2026, ICAI-SUMMIT-2026"
                        className={`w-full min-h-[44px] sm:min-h-[38px] px-3.5 py-2 text-sm sm:text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white font-mono ${
                          shouldShowCardError('sourceTag')
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-blue-600'
                        }`}
                      />
                      {shouldShowCardError('sourceTag') && (
                        <p className="text-[11px] text-rose-600 font-medium">{cardFieldErrors.sourceTag}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">City</label>
                      <input
                        type="text"
                        maxLength={60}
                        value={cardFormData.city}
                        onChange={(e) =>
                          setCardFormData((prev) => ({ ...prev, city: sanitizePersonNameInput(e.target.value, 60) }))
                        }
                        onBlur={() => {
                          setCardFormData((prev) => ({ ...prev, city: prev.city.trim() }));
                          setCardTouched((prev) => ({ ...prev, city: true }));
                        }}
                        placeholder="e.g. Hyderabad"
                        className={`w-full min-h-[44px] sm:min-h-[38px] px-3.5 py-2 text-sm sm:text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white ${
                          shouldShowCardError('city')
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-blue-600'
                        }`}
                      />
                      {shouldShowCardError('city') && (
                        <p className="text-[11px] text-rose-600 font-medium">{cardFieldErrors.city}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">State</label>
                      <input
                        type="text"
                        maxLength={60}
                        value={cardFormData.state}
                        onChange={(e) =>
                          setCardFormData((prev) => ({ ...prev, state: sanitizePersonNameInput(e.target.value, 60) }))
                        }
                        onBlur={() => {
                          setCardFormData((prev) => ({ ...prev, state: prev.state.trim() }));
                          setCardTouched((prev) => ({ ...prev, state: true }));
                        }}
                        placeholder="e.g. Telangana"
                        className={`w-full min-h-[44px] sm:min-h-[38px] px-3.5 py-2 text-sm sm:text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white ${
                          shouldShowCardError('state')
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-blue-600'
                        }`}
                      />
                      {shouldShowCardError('state') && (
                        <p className="text-[11px] text-rose-600 font-medium">{cardFieldErrors.state}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 hidden lg:flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setRegistrationStep(1)}
                      className="min-h-[40px] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="min-h-[40px] px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Saving Profile...' : 'Save as Pending Profile'}
                    </button>
                  </div>
                </form>
              </DashboardCard>
            )}

            {registrationStep === 3 && createdProfile && (() => {
              const originBase =
                typeof window !== 'undefined' ? window.location.origin : 'https://inisio.in';
              const sampleClaimUrl = `${originBase}/?action=activate-ca&token=clm_generated_on_send`;
              const claimTpl = emailTemplates?.claimInvitation;
              const previewData = renderEmailTemplatePreview(
                claimTpl?.subject || 'Claim Your Chartered Accountant Profile on Inisio ({{sourceTag}})',
                claimTpl?.html ||
                  `<div style="font-family:sans-serif;padding:24px;color:#1e293b;"><h2>Dear {{name}},</h2><p>Your CA profile for <strong>{{firmName}}</strong> is ready on Inisio Capital.</p><p><a href="{{claimUrl}}">Claim &amp; Activate CA Profile</a></p></div>`,
                {
                  name: createdProfile.name || 'Partner',
                  firmName: createdProfile.firmName || 'Chartered Accountancy Practice',
                  email: createdProfile.email || '',
                  claimUrl: sampleClaimUrl,
                  loginUrl: `${originBase}/#ca-login`,
                  sourceTag: createdProfile.sourceTag || 'WOFA-2026',
                  expiryDays: '7',
                }
              );

              return (
                <DashboardCard className="p-5 sm:p-8 space-y-6 max-w-3xl mx-auto">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto border border-emerald-200">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 font-manrope">
                      Pending Profile Created — Verify Invitation Email
                    </h2>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto">
                      Inspect the exact invitation email content and recipient details below before sending the activation link.
                    </p>
                  </div>

                  {/* Recipient & Profile Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Recipient Name:</span>
                        <span className="font-semibold text-slate-900 text-right">{createdProfile.name}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Practice / Firm:</span>
                        <span className="font-semibold text-slate-900 text-right">
                          {createdProfile.firmName || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Recipient Email:</span>
                        <span className="font-semibold text-slate-900 text-right break-all">
                          {createdProfile.email}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Reference Tag:</span>
                        <span className="font-semibold text-blue-700 font-mono">{createdProfile.sourceTag}</span>
                      </div>
                      <div className="flex justify-between gap-2 items-center">
                        <span className="text-slate-500">Status:</span>
                        <DashboardStatusBadge status="Pending" />
                      </div>
                      <div className="flex justify-between gap-2 items-center">
                        <span className="text-slate-500">Template Check:</span>
                        {previewData.unresolvedPlaceholders.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            All fields verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Check: {previewData.unresolvedPlaceholders.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inline Rendered Email Preview */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Email Preview Before Dispatch
                        </div>
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          Subject: {previewData.subject}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveTab('email-templates')}
                          className="px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 cursor-pointer"
                        >
                          Edit Template
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEmailPreviewPane((prev) => !prev)}
                          className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg border border-slate-200 cursor-pointer"
                        >
                          {showEmailPreviewPane ? 'Hide Preview' : 'Show Preview'}
                        </button>
                      </div>
                    </div>
                    {showEmailPreviewPane && (
                      <div className="bg-slate-100 p-2 sm:p-3">
                        <iframe
                          title="Claim Invitation Email Preview"
                          sandbox=""
                          srcDoc={previewData.html}
                          className="w-full h-[360px] sm:h-[420px] bg-white rounded-lg border border-slate-200"
                        />
                        <p className="text-[11px] text-slate-500 mt-2 px-1">
                          A unique 7-day activation link will be generated automatically when you click Send Claim Invitation Email.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDispatchClaimInvitation(createdProfile._id || createdProfile.id)}
                      disabled={claimDispatchLoading}
                      className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{claimDispatchLoading ? 'Dispatching...' : 'Verified — Send Claim Invitation Email'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reporting')}
                      className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
                    >
                      View in Reporting Table
                    </button>
                  </div>
                </DashboardCard>
              );
            })()}

            {registrationStep === 4 && claimDispatchResult && (
              <DashboardCard className="p-6 sm:p-8 space-y-6 text-center max-w-xl mx-auto">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto border border-blue-200">
                  <Mail className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 font-manrope">Claim Invitation Dispatched</h2>
                  <p className="text-xs text-slate-500">
                    An invitation email has been sent with a unique expiring token. Status has updated to <strong>Invited</strong>.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2">
                  <div className="text-xs font-semibold text-slate-600">Unique Claim &amp; Activation URL</div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 break-all select-all">
                    {claimDispatchResult.claimUrl}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Token expires in 7 days</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(claimDispatchResult.claimUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTestClaimToken(claimDispatchResult.claimToken)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Test Claim Profile Flow (CA Side)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationStep(1);
                      setCardImagePreview('');
                      setCardFileName('');
                      setAlternatePhones([]);
                      setScanMode('auto');
                      setCreatedProfile(null);
                      setClaimDispatchResult(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
                  >
                    Scan Another Card
                  </button>
                </div>
              </DashboardCard>
            )}
          </div>
        )}

        {/* SECTION 2: CA PROFILES & CONFERENCE TAG REPORTING */}
        {activeTab === 'reporting' && (
          <div className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <DashboardKpiCard
                label="Total CA Profiles"
                value={sourceTagReports.totals?.totalProfiles || allProfiles.length}
                subtext="All registered conference cards"
                icon={Users}
                tone="blue"
              />
              <DashboardKpiCard
                label="Pending Profiles"
                value={sourceTagReports.totals?.pending || allProfiles.filter((p) => p.status === 'pending').length}
                valueClassName="text-amber-600"
                subtext="Card saved, uninvited"
                icon={Clock}
                tone="amber"
              />
              <DashboardKpiCard
                label="Invited Profiles"
                value={
                  sourceTagReports.totals?.invited ||
                  allProfiles.filter((p) => p.status === 'invited' || p.status === 'claimed').length
                }
                valueClassName="text-indigo-600"
                subtext="Claim token dispatched"
                icon={Send}
                tone="indigo"
              />
              <DashboardKpiCard
                label="Activated Profiles"
                value={sourceTagReports.totals?.activated || allProfiles.filter((p) => p.status === 'activated').length}
                valueClassName="text-emerald-600"
                subtext="Fully activated CA accounts"
                icon={CheckCircle2}
                tone="emerald"
              />
            </div>

            <DashboardCard className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-sm font-bold text-slate-900 font-manrope">Profiles by Conference Tag</h2>
                <span className="text-xs text-slate-500 tabular-nums">Total tags: {uniqueTags.length}</span>
              </div>

              {uniqueTags.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No conference tags registered yet. Tag names set during business card scan (e.g. <code>WOFA-2026</code>) will appear here.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {uniqueTags.map((tag) => {
                    const tagProfiles = allProfiles.filter((p) => p.sourceTag === tag);
                    const activated = tagProfiles.filter((p) => p.status === 'activated').length;
                    return (
                      <div key={tag} className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                            {tag}
                          </span>
                          <span className="text-xs font-bold text-slate-900 tabular-nums">
                            {tagProfiles.length} Profiles
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex justify-between tabular-nums">
                          <span>Activated: {activated}</span>
                          <span>Pending/Invited: {tagProfiles.length - activated}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </DashboardCard>

            <DashboardCard>
              <DashboardCardHeader
                title="CA Profiles Directory"
                description="Listing of all CA profiles created via visiting card registration. Filter by status or conference tag."
                actions={
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Mobile Filter Bottom Sheet Trigger */}
                    <div className="md:hidden flex items-center gap-2 w-full">
                      <DashboardSearchInput
                        value={profileSearch}
                        onChange={setProfileSearch}
                        placeholder="Search CA profiles..."
                        className="flex-1"
                      />
                      <DashboardFilterButton
                        onClick={() => setIsFilterSheetOpen(true)}
                        activeCount={activeFilterCount}
                      />
                    </div>

                    {/* Desktop Inline Filters */}
                    <div className="hidden md:flex flex-wrap items-center gap-2">
                      <select
                        value={profileStatusFilter}
                        onChange={(e) => setProfileStatusFilter(e.target.value)}
                        className="min-h-[40px] px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-800"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="invited">Invited</option>
                        <option value="activated">Activated</option>
                      </select>

                      <select
                        value={profileTagFilter}
                        onChange={(e) => setProfileTagFilter(e.target.value)}
                        className="min-h-[40px] px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-800"
                      >
                        <option value="ALL">All Tags</option>
                        {uniqueTags.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>

                      <DashboardSearchInput
                        value={profileSearch}
                        onChange={setProfileSearch}
                        placeholder="Search CA profiles..."
                        className="sm:w-48"
                      />
                    </div>
                  </div>
                }
              />

              {/* Mobile Stacked Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredProfiles.length === 0 ? (
                  <DashboardEmptyState
                    icon={CreditCard}
                    title="No CA profiles yet"
                    description="Scan and register visiting cards in the Card Registration tab to populate profiles and track conference tags here."
                  />
                ) : (
                  filteredProfiles.map((p) => {
                    const statusLower = (p.status || '').toLowerCase();
                    return (
                      <div key={p._id || p.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                            <div className="text-xs text-slate-600 mt-0.5">{p.firmName}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {p.membershipNumber || 'Reg Pending'}
                            </div>
                          </div>
                          <DashboardStatusBadge status={p.status || 'Pending'} />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{p.city ? `${p.city}, ${p.state || 'India'}` : 'India'}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                            {p.sourceTag || 'WOFA-2026'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            {p.claimedAt
                              ? new Date(p.claimedAt).toLocaleDateString()
                              : p.createdAt
                              ? new Date(p.createdAt).toLocaleDateString()
                              : 'Recent'}
                          </span>
                          {statusLower === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => handleDispatchClaimInvitation(p._id || p.id)}
                              className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs whitespace-nowrap"
                            >
                              Send Invite
                            </button>
                          ) : statusLower === 'invited' || statusLower === 'claimed' ? (
                            <button
                              type="button"
                              onClick={() => setTestClaimToken(p.claimToken)}
                              className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs whitespace-nowrap"
                            >
                              Test Claim
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600">Active</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table */}
              <div className={`hidden md:block ${DASHBOARD_TABLE.wrapper}`}>
                <table className={DASHBOARD_TABLE.table}>
                  <thead className={DASHBOARD_TABLE.thead}>
                    <tr>
                      <th className={DASHBOARD_TABLE.th}>CA Name &amp; Reg No.</th>
                      <th className={DASHBOARD_TABLE.th}>Firm Name</th>
                      <th className={DASHBOARD_TABLE.th}>Location</th>
                      <th className={DASHBOARD_TABLE.th}>Conference Tag</th>
                      <th className={DASHBOARD_TABLE.th}>Status</th>
                      <th className={DASHBOARD_TABLE.th}>Claim / Reg Date</th>
                      <th className={`${DASHBOARD_TABLE.th} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={DASHBOARD_TABLE.tbody}>
                    {filteredProfiles.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <DashboardEmptyState
                            icon={CreditCard}
                            title="No CA profiles yet"
                            description="Scan and register visiting cards in the Card Registration tab to populate profiles and track conference tags here."
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredProfiles.map((p) => {
                        const statusLower = (p.status || '').toLowerCase();
                        return (
                          <tr key={p._id || p.id} className={DASHBOARD_TABLE.tr}>
                            <td className={DASHBOARD_TABLE.td}>
                              <div className="font-semibold text-slate-900">{p.name}</div>
                              <div className="text-xs text-slate-500 font-mono">
                                {p.membershipNumber || 'Reg Pending'}
                              </div>
                            </td>
                            <td className={`${DASHBOARD_TABLE.td} font-medium text-slate-800`}>{p.firmName}</td>
                            <td className={`${DASHBOARD_TABLE.td} text-slate-600`}>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{p.city ? `${p.city}, ${p.state || 'India'}` : 'India'}</span>
                              </div>
                            </td>
                            <td className={DASHBOARD_TABLE.td}>
                              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                {p.sourceTag || 'WOFA-2026'}
                              </span>
                            </td>
                            <td className={DASHBOARD_TABLE.td}>
                              <DashboardStatusBadge status={p.status || 'Pending'} />
                            </td>
                            <td className={`${DASHBOARD_TABLE.td} text-slate-500 tabular-nums whitespace-nowrap`}>
                              {p.claimedAt
                                ? new Date(p.claimedAt).toLocaleDateString()
                                : p.createdAt
                                ? new Date(p.createdAt).toLocaleDateString()
                                : 'Recent'}
                            </td>
                            <td className={`${DASHBOARD_TABLE.td} text-right`}>
                              {statusLower === 'pending' ? (
                                <button
                                  type="button"
                                  onClick={() => handleDispatchClaimInvitation(p._id || p.id)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs whitespace-nowrap"
                                >
                                  Send Invite
                                </button>
                              ) : statusLower === 'invited' || statusLower === 'claimed' ? (
                                <button
                                  type="button"
                                  onClick={() => setTestClaimToken(p.claimToken)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs whitespace-nowrap"
                                >
                                  Test Claim
                                </button>
                              ) : (
                                <span className="text-xs font-semibold text-emerald-600">Active</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </DashboardCard>

            {/* Mobile Filter Bottom Sheet */}
            <DashboardBottomSheet
              open={isFilterSheetOpen}
              onClose={() => setIsFilterSheetOpen(false)}
              title="Filter CA Profiles"
              description="Filter by status or conference tag."
              footer={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileStatusFilter('ALL');
                      setProfileTagFilter('ALL');
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilterSheetOpen(false)}
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              }
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Status</label>
                <select
                  value={profileStatusFilter}
                  onChange={(e) => setProfileStatusFilter(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-800"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="invited">Invited</option>
                  <option value="activated">Activated</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Conference Tag</label>
                <select
                  value={profileTagFilter}
                  onChange={(e) => setProfileTagFilter(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-800"
                >
                  <option value="ALL">All Tags</option>
                  {uniqueTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            </DashboardBottomSheet>
          </div>
        )}

        {/* SECTION 3: EMAIL TEMPLATES */}
        {activeTab === 'email-templates' && (
          <DashboardCard className="p-6 sm:p-8 space-y-6 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-manrope">Notification Email Templates</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preview and configure the email templates for Claim Invitations and Activation Confirmations.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplateType('claimInvitation');
                    if (emailTemplates?.claimInvitation) {
                      setTemplateSubject(emailTemplates.claimInvitation.subject || '');
                      setTemplateHtml(emailTemplates.claimInvitation.html || '');
                    }
                  }}
                  className={`min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    editingTemplateType === 'claimInvitation'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Claim Invitation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplateType('activationConfirmation');
                    if (emailTemplates?.activationConfirmation) {
                      setTemplateSubject(emailTemplates.activationConfirmation.subject || '');
                      setTemplateHtml(emailTemplates.activationConfirmation.html || '');
                    }
                  }}
                  className={`min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    editingTemplateType === 'activationConfirmation'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Activation Confirmation
                </button>
              </div>
            </div>

            {templateSavedBanner && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Template saved successfully!</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Subject</label>
                <input
                  type="text"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  className="w-full min-h-[44px] sm:min-h-[38px] px-3.5 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700">Email HTML Content</label>
                  <span className="text-[11px] text-slate-500">
                    Variables: <code>&#123;&#123;name&#125;&#125;</code>, <code>&#123;&#123;firmName&#125;&#125;</code>,{' '}
                    <code>&#123;&#123;email&#125;&#125;</code>,{' '}
                    {editingTemplateType === 'claimInvitation' ? (
                      <>
                        <code>&#123;&#123;claimUrl&#125;&#125;</code>, <code>&#123;&#123;expiryDays&#125;&#125;</code>,{' '}
                      </>
                    ) : (
                      <>
                        <code>&#123;&#123;loginUrl&#125;&#125;</code>,{' '}
                      </>
                    )}
                    <code>&#123;&#123;sourceTag&#125;&#125;</code>
                  </span>
                </div>
                <textarea
                  rows={12}
                  value={templateHtml}
                  onChange={(e) => setTemplateHtml(e.target.value)}
                  className="w-full p-4 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Live Sandboxed Preview */}
              {(() => {
                const samplePreview = renderEmailTemplatePreview(templateSubject, templateHtml, {
                  name: createdProfile?.name || 'CA Rajesh Kulkarni',
                  firmName: createdProfile?.firmName || 'Kulkarni & Associates',
                  email: createdProfile?.email || 'ca.rajesh@example.com',
                  claimUrl: 'https://inisio.in/?action=activate-ca&token=sample_preview_token',
                  loginUrl: 'https://inisio.in/#ca-login',
                  sourceTag: createdProfile?.sourceTag || 'WOFA-2026',
                  expiryDays: '7',
                });
                return (
                  <div className="space-y-2 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700">Live Rendered Preview</span>
                      <span className="text-[11px] text-slate-500 truncate max-w-full">
                        Subject: <strong className="text-slate-800">{samplePreview.subject}</strong>
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-100 p-2">
                      <iframe
                        title="Email Template Live Preview"
                        sandbox=""
                        srcDoc={samplePreview.html}
                        className="w-full h-[340px] bg-white rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={templateSaving}
                  className="min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  <span>{templateSaving ? 'Saving...' : 'Save Template Updates'}</span>
                </button>
              </div>
            </div>
          </DashboardCard>
        )}
      </DashboardLayout>

      {testClaimToken && (
        <CaActivationModal
          token={testClaimToken}
          isOpen={Boolean(testClaimToken)}
          onClose={() => setTestClaimToken(null)}
          onActivationSuccess={() => {
            setTestClaimToken(null);
            fetchDashboardData();
          }}
        />
      )}
    </>
  );
};

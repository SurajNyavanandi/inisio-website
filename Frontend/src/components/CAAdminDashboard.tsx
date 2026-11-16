import React, { useState, useEffect, useRef } from 'react';
import { AuthUser } from '../types';
import {
  LayoutDashboard,
  CreditCard,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  X,
  LogOut,
  Home,
  Upload,
  Camera,
  Copy,
  ExternalLink,
  Edit3,
  Save,
  Check,
  Tag,
  Loader2,
  Building2,
  Phone,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { resolveApiUrl } from '../utils/apiClient';
import { validateCaAdminEmail } from '../config/adminAccess';
import { CaActivationModal } from './CaActivationModal';

interface CAAdminDashboardProps {
  user?: AuthUser | null;
  onLogout?: () => void;
  onNavigateHome?: () => void;
}

type CAAdminTab = 'card-registration' | 'reporting' | 'email-templates';

const STORAGE_KEY_CA_ADMIN_SESSION = 'inisio_ca_admin_session';

export const CAAdminDashboard: React.FC<CAAdminDashboardProps> = ({
  user,
  onLogout,
  onNavigateHome,
}) => {
  // Session State (Single email access check for CA_ADMIN)
  const [caAdminSession, setCaAdminSession] = useState<{ email: string; token?: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      // If user prop is already authorized ca_admin, initialize with that
      if (user && user.role === 'ca_admin') {
        return { email: user.email, token: user.token };
      }
      const saved = localStorage.getItem(STORAGE_KEY_CA_ADMIN_SESSION);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Login Input State (Single email input with no extra helper text)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Section: Card Registration, Reporting, Email Templates
  const [activeTab, setActiveTab] = useState<CAAdminTab>('card-registration');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stepper State (Steps 1 to 5)
  const [registrationStep, setRegistrationStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [cardImagePreview, setCardImagePreview] = useState<string>('');
  const [cardFileName, setCardFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Extracted & Editable Review Form State
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
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Created Pending Profile Result
  const [createdProfile, setCreatedProfile] = useState<any>(null);

  // Claim Invitation State
  const [claimDispatchLoading, setClaimDispatchLoading] = useState(false);
  const [claimDispatchResult, setClaimDispatchResult] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // In-Dashboard Activation Testing State
  const [testClaimToken, setTestClaimToken] = useState<string | null>(null);

  // Reporting Data
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [sourceTagReports, setSourceTagReports] = useState<any>({
    totals: { totalProfiles: 0, pending: 0, invited: 0, activated: 0 },
    bySourceTag: [],
  });
  const [profileSearch, setProfileSearch] = useState('');
  const [profileStatusFilter, setProfileStatusFilter] = useState('ALL');
  const [profileTagFilter, setProfileTagFilter] = useState('ALL');

  // Email Templates State
  const [emailTemplates, setEmailTemplates] = useState<any>(null);
  const [editingTemplateType, setEditingTemplateType] = useState<'claimInvitation' | 'activationConfirmation'>('claimInvitation');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateHtml, setTemplateHtml] = useState('');
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateSavedBanner, setTemplateSavedBanner] = useState(false);

  // Load profiles and reporting
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsRes, profilesRes] = await Promise.all([
        fetch(resolveApiUrl('/ca-admin/reports')).then((r) => r.json()).catch(() => null),
        fetch(resolveApiUrl('/ca-admin/profiles')).then((r) => r.json()).catch(() => null),
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

  // Load Email Templates
  useEffect(() => {
    if (activeTab === 'email-templates') {
      fetch(resolveApiUrl('/ca-admin/templates'))
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
    }
  }, [activeTab, editingTemplateType]);

  // 1. Login Handler (Single email input check against CA_ADMIN)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const clean = loginEmail.trim().toLowerCase();
    const isLocalAllowed = validateCaAdminEmail(clean);

    try {
      const res = await fetch(resolveApiUrl('/ca-admin/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        const session = {
          email: data.data.email,
          token: data.data.token,
        };
        setCaAdminSession(session);
        try {
          localStorage.setItem(STORAGE_KEY_CA_ADMIN_SESSION, JSON.stringify(session));
        } catch {}
      } else if (isLocalAllowed) {
        const session = {
          email: clean,
          token: 'ca_admin_session_' + Date.now(),
        };
        setCaAdminSession(session);
        try {
          localStorage.setItem(STORAGE_KEY_CA_ADMIN_SESSION, JSON.stringify(session));
        } catch {}
      } else {
        setLoginError(data.message || 'Access Denied: Only authorized CA_ADMIN is permitted.');
      }
    } catch {
      if (isLocalAllowed) {
        const session = {
          email: clean,
          token: 'ca_admin_session_' + Date.now(),
        };
        setCaAdminSession(session);
        try {
          localStorage.setItem(STORAGE_KEY_CA_ADMIN_SESSION, JSON.stringify(session));
        } catch {}
      } else {
        setLoginError('Unable to reach authentication server. Please check backend connection.');
      }
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

  // 2. Card Upload & OCR Extraction Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCardFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCardImagePreview(result);
        triggerOcrExtraction(result, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerOcrExtraction = async (imageData: string, fileName: string) => {
    setOcrLoading(true);
    setDuplicateWarning(null);
    try {
      const res = await fetch(resolveApiUrl('/ca-admin/cards/scan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardImage: imageData,
          fileName,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const ocr = data.data;
        setCardFormData({
          name: ocr.name || '',
          email: ocr.email || '',
          phone: ocr.phone || '',
          firmName: ocr.firmName || '',
          membershipNumber: ocr.membershipNumber || '',
          city: ocr.city || '',
          state: ocr.state || '',
          sourceTag: 'WOFA-2026',
          notes: 'Captured via business card scanner.',
          ocrRawText: ocr.ocrRawText || '',
        });
        setRegistrationStep(2); // Advance to Admin Review
        checkDuplicates(ocr.email, ocr.phone, ocr.membershipNumber);
      }
    } catch (err) {
      console.warn('OCR processing error:', err);
    } finally {
      setOcrLoading(false);
    }
  };

  // Duplicate Check: Checks by email, phone, or registration number
  const checkDuplicates = async (emailToCheck: string, phoneToCheck: string, regToCheck?: string) => {
    if (!emailToCheck && !phoneToCheck && !regToCheck) return;
    try {
      const res = await fetch(resolveApiUrl('/ca-admin/cards/check-duplicate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToCheck,
          phone: phoneToCheck,
          membershipNumber: regToCheck,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.duplicate) {
        setDuplicateWarning(
          `Duplicate Warning: A CA profile with matching ${data.data.field} (${data.data.existingProfile?.name || emailToCheck}) is already registered in the system.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // ignore
    }
  };

  // 3. Create Pending Profile
  const handleCreatePendingProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(resolveApiUrl('/ca-admin/profiles'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cardFormData,
          cardImageUrl: cardImagePreview,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCreatedProfile(data.data);
        setRegistrationStep(3); // Advance to Created Pending Profile
        fetchDashboardData();
      } else {
        alert(data.message || 'Failed to create profile. Please check duplicates.');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating pending profile');
    } finally {
      setLoading(false);
    }
  };

  // 4. Send Claim Invitation
  const handleDispatchClaimInvitation = async (profileId: string) => {
    setClaimDispatchLoading(true);
    try {
      const res = await fetch(resolveApiUrl(`/ca-admin/profiles/${profileId}/claim-invitation`), {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.data) {
        setClaimDispatchResult(data.data);
        setRegistrationStep(4); // Advance to Invitation Dispatched
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch claim invitation');
    } finally {
      setClaimDispatchLoading(false);
    }
  };

  // 5. Save Template
  const handleSaveTemplate = async () => {
    setTemplateSaving(true);
    try {
      const typeEndpoint = editingTemplateType === 'claimInvitation' ? 'claim-invitation' : 'activation-confirmation';
      const res = await fetch(resolveApiUrl(`/ca-admin/templates/${typeEndpoint}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: templateSubject, html: templateHtml }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplateSavedBanner(true);
        setTimeout(() => setTemplateSavedBanner(false), 3000);
      }
    } catch {
      alert('Failed to save template updates');
    } finally {
      setTemplateSaving(false);
    }
  };

  // =========================================================================
  // ACCESS SCREEN: Only the email in CA_ADMIN can enter. Single email input.
  // =========================================================================
  if (!caAdminSession) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 font-inter">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-black text-white font-manrope">CA Admin Portal</h1>
            <p className="text-xs text-slate-400">
              Restricted Operations: Visiting Card Scanner &amp; Network Administration
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-medium text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Single email input with no extra helper text */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <input
              type="email"
              required
              autoFocus
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter authorized CA_ADMIN email"
              className="w-full px-4 py-3 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
            />

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Authenticate &amp; Enter</span>}
            </button>
          </form>

          {onNavigateHome && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateHome}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Website</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // FULL-SCREEN CA ADMIN DASHBOARD LAYOUT
  // =========================================================================
  const navItems = [
    { id: 'card-registration' as CAAdminTab, label: 'Visiting Card Registration', icon: CreditCard },
    { id: 'reporting' as CAAdminTab, label: 'CA Profiles & Tag Reporting', icon: LayoutDashboard },
    { id: 'email-templates' as CAAdminTab, label: 'Email Templates', icon: Mail },
  ];

  // Unique Conference Tags extracted from profiles
  const uniqueTags = Array.from(new Set(allProfiles.map((p) => p.sourceTag).filter(Boolean)));

  // Filtered CA Profiles for Reporting Table
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 font-inter text-slate-800">
      {/* Mobile Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Fixed Left Dark Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-5 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 shrink-0 border-r border-slate-800 ${
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
                  <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">CA Admin Portal</span>
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
                CA Operations Admin
              </span>
              <span className="text-[11px] text-slate-400 font-medium truncate max-w-32">
                {caAdminSession.email}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Public Website</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out (CA Admin)</span>
          </button>
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />
            </button>
            <h1 className="text-base font-extrabold text-slate-900 font-manrope">
              {activeTab === 'card-registration' && 'Business Card Registration Workflow'}
              {activeTab === 'reporting' && 'CA Profiles & Conference Tag Reporting'}
              {activeTab === 'email-templates' && 'Email Notification Templates'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Scrolling Main Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* ========================================================
              SECTION 1: BUSINESS CARD REGISTRATION (7-STEP WORKFLOW)
              ======================================================== */}
          {activeTab === 'card-registration' && (
            <div className="space-y-6 w-full">
              {/* Stepper Navigation */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
                <div className="grid grid-cols-4 gap-2 text-center">
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
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        registrationStep === s.num
                          ? 'bg-blue-600 text-white shadow-xs'
                          : registrationStep > s.num
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 1: Scan Visiting Card (Upload from Camera or File) */}
              {registrationStep === 1 && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6 text-center">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
                    <CreditCard className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-slate-900 font-manrope">Scan Visiting Card</h2>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Upload a photo from your mobile camera or desktop file to automatically extract CA name, firm, contact details, and ICAI registration number.
                    </p>
                  </div>

                  {cardImagePreview ? (
                    <div className="space-y-4 max-w-md mx-auto">
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs max-h-56 bg-slate-950 flex items-center justify-center">
                        <img src={cardImagePreview} alt="Scanned Card Preview" className="max-h-56 object-contain" />
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{cardFileName}</div>
                      <button
                        type="button"
                        onClick={() => {
                          setCardImagePreview('');
                          setCardFileName('');
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                      >
                        Remove and re-scan photo
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-2">
                      {/* Mobile Camera Capture */}
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="p-6 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-600 hover:bg-blue-50/40 transition-all flex flex-col items-center gap-2 cursor-pointer group"
                      >
                        <Camera className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800">Capture from Camera</span>
                        <span className="text-[10px] text-slate-400">Mobile Camera Capture</span>
                        <input
                          ref={cameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </button>

                      {/* Desktop / Gallery File Upload */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-600 hover:bg-slate-50 transition-all flex flex-col items-center gap-2 cursor-pointer group"
                      >
                        <Upload className="w-8 h-8 text-slate-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800">Upload Card Photo</span>
                        <span className="text-[10px] text-slate-400">PNG, JPG, or WEBP file</span>
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
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center gap-2 text-xs font-bold">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Extracting card text via OCR parser...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Admin Review & Duplicate Checks */}
              {registrationStep === 2 && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 font-manrope">Admin Review &amp; Field Verification</h2>
                      <p className="text-xs text-slate-500">
                        Verify and correct OCR extracted details. The system checks in real time for duplicate email, phone, or ICAI registration numbers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegistrationStep(1)}
                      className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Re-scan Card
                    </button>
                  </div>

                  {duplicateWarning && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-950">Duplicate Warning</div>
                        <div>{duplicateWarning}</div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleCreatePendingProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">CA Full Name *</label>
                        <input
                          type="text"
                          required
                          value={cardFormData.name}
                          onChange={(e) => setCardFormData({ ...cardFormData, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">CA Firm Name *</label>
                        <input
                          type="text"
                          required
                          value={cardFormData.firmName}
                          onChange={(e) => setCardFormData({ ...cardFormData, firmName: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={cardFormData.email}
                          onChange={(e) => {
                            setCardFormData({ ...cardFormData, email: e.target.value });
                            checkDuplicates(e.target.value, cardFormData.phone, cardFormData.membershipNumber);
                          }}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Mobile / Contact Phone *</label>
                        <input
                          type="text"
                          required
                          value={cardFormData.phone}
                          onChange={(e) => {
                            setCardFormData({ ...cardFormData, phone: e.target.value });
                            checkDuplicates(cardFormData.email, e.target.value, cardFormData.membershipNumber);
                          }}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ICAI Registration / Membership No.</label>
                        <input
                          type="text"
                          value={cardFormData.membershipNumber}
                          onChange={(e) => {
                            setCardFormData({ ...cardFormData, membershipNumber: e.target.value });
                            checkDuplicates(cardFormData.email, cardFormData.phone, e.target.value);
                          }}
                          placeholder="e.g. FCA-048291"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Conference Source Tag *</label>
                        <input
                          type="text"
                          required
                          value={cardFormData.sourceTag}
                          onChange={(e) => setCardFormData({ ...cardFormData, sourceTag: e.target.value })}
                          placeholder="e.g. WOFA-2026, ICAI-SUMMIT-2026"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">City</label>
                        <input
                          type="text"
                          value={cardFormData.city}
                          onChange={(e) => setCardFormData({ ...cardFormData, city: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">State</label>
                        <input
                          type="text"
                          value={cardFormData.state}
                          onChange={(e) => setCardFormData({ ...cardFormData, state: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setRegistrationStep(1)}
                        className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {loading ? 'Saving Profile...' : 'Save as Pending Profile'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 3: Pending Profile Created Confirmation */}
              {registrationStep === 3 && createdProfile && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6 text-center max-w-xl mx-auto">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-slate-900 font-manrope">Pending Profile Created</h2>
                    <p className="text-xs text-slate-500">
                      The CA profile has been recorded with status <strong>Pending</strong>. No active login account exists yet.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-bold text-slate-900">{createdProfile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Firm:</span>
                      <span className="font-bold text-slate-900">{createdProfile.firmName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-bold text-slate-900">{createdProfile.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Conference Tag:</span>
                      <span className="font-bold text-blue-700 font-mono">{createdProfile.sourceTag}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDispatchClaimInvitation(createdProfile._id || createdProfile.id)}
                      disabled={claimDispatchLoading}
                      className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {claimDispatchLoading ? 'Dispatching...' : 'Send Claim Invitation Email'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reporting');
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      View in Reporting Table
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Claim Invitation Dispatched & Testing */}
              {registrationStep === 4 && claimDispatchResult && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6 text-center max-w-xl mx-auto">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
                    <Mail className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-slate-900 font-manrope">Claim Invitation Dispatched</h2>
                    <p className="text-xs text-slate-500">
                      An invitation email has been sent with a unique expiring token. Status has updated to <strong>Invited</strong>.
                    </p>
                  </div>

                  {/* Invitation Link Box */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Unique Claim &amp; Activation URL
                    </div>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 break-all select-all">
                      {claimDispatchResult.claimUrl}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Token expires in 7 days</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(claimDispatchResult.claimUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Test Claim Profile Button (opens in-dialog activation modal) */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTestClaimToken(claimDispatchResult.claimToken)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
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
                        setCreatedProfile(null);
                        setClaimDispatchResult(null);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Scan Another Card
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              SECTION 2: CA PROFILES & CONFERENCE TAG REPORTING
              ======================================================== */}
          {activeTab === 'reporting' && (
            <div className="space-y-6">
              {/* Grouped Totals Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total CA Profiles</span>
                  <p className="text-3xl font-black text-slate-900 font-manrope">
                    {sourceTagReports.totals?.totalProfiles || allProfiles.length}
                  </p>
                  <span className="text-xs text-blue-600 font-medium">All registered conference cards</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase">Pending Profiles</span>
                  <p className="text-3xl font-black text-amber-600 font-manrope">
                    {sourceTagReports.totals?.pending || allProfiles.filter((p) => p.status === 'pending').length}
                  </p>
                  <span className="text-xs text-amber-600 font-medium">Card saved, uninvited</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase">Invited Profiles</span>
                  <p className="text-3xl font-black text-indigo-600 font-manrope">
                    {sourceTagReports.totals?.invited || allProfiles.filter((p) => p.status === 'invited' || p.status === 'claimed').length}
                  </p>
                  <span className="text-xs text-indigo-600 font-medium">Claim token dispatched</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase">Activated Profiles</span>
                  <p className="text-3xl font-black text-emerald-600 font-manrope">
                    {sourceTagReports.totals?.activated || allProfiles.filter((p) => p.status === 'activated').length}
                  </p>
                  <span className="text-xs text-emerald-600 font-medium">Fully activated CA accounts</span>
                </div>
              </div>

              {/* Count of Profiles by Conference Tag */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 font-manrope">Profiles by Conference Tag</h2>
                  <span className="text-xs text-slate-400">Total tags: {uniqueTags.length}</span>
                </div>

                {uniqueTags.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No conference tags registered yet. Tag names set during business card scan (e.g. <code>WOFA-2026</code>) will appear here.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {uniqueTags.map((tag) => {
                      const tagProfiles = allProfiles.filter((p) => p.sourceTag === tag);
                      const activated = tagProfiles.filter((p) => p.status === 'activated').length;
                      return (
                        <div key={tag} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 font-mono">
                              {tag}
                            </span>
                            <span className="text-xs font-black text-slate-900">{tagProfiles.length} Profiles</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex justify-between">
                            <span>Activated: {activated}</span>
                            <span>Pending/Invited: {tagProfiles.length - activated}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CA Profiles Table with Filters */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 font-manrope">CA Profiles Directory</h2>
                    <p className="text-xs text-slate-500">
                      Listing of all CA profiles created via visiting card registration. Filter by status or conference tag.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter */}
                    <select
                      value={profileStatusFilter}
                      onChange={(e) => setProfileStatusFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="invited">Invited</option>
                      <option value="activated">Activated</option>
                    </select>

                    {/* Tag Filter */}
                    <select
                      value={profileTagFilter}
                      onChange={(e) => setProfileTagFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                    >
                      <option value="ALL">All Tags</option>
                      {uniqueTags.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-48">
                      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search CA profiles..."
                        value={profileSearch}
                        onChange={(e) => setProfileSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-6">CA Name &amp; Reg No.</th>
                        <th className="py-3 px-6">Firm Name</th>
                        <th className="py-3 px-6">Location</th>
                        <th className="py-3 px-6">Conference Tag</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6">Claim / Reg Date</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProfiles.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                            No CA profiles yet. Scan and register visiting cards in the 'Visiting Card Registration' tab to populate profiles and track conference tags here.
                          </td>
                        </tr>
                      ) : (
                        filteredProfiles.map((p) => {
                          const statusLower = (p.status || '').toLowerCase();
                          return (
                            <tr key={p._id || p.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-6">
                                <div className="font-bold text-slate-900">{p.name}</div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {p.membershipNumber || 'Reg Pending'}
                                </div>
                              </td>
                              <td className="py-3.5 px-6 font-medium text-slate-800">{p.firmName}</td>
                              <td className="py-3.5 px-6 text-slate-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{p.city ? `${p.city}, ${p.state || 'India'}` : 'India'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-6">
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                  {p.sourceTag || 'WOFA-2026'}
                                </span>
                              </td>
                              <td className="py-3.5 px-6">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                                    statusLower === 'activated'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : statusLower === 'invited' || statusLower === 'claimed'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-6 text-slate-500">
                                {p.claimedAt
                                  ? new Date(p.claimedAt).toLocaleDateString()
                                  : p.createdAt
                                  ? new Date(p.createdAt).toLocaleDateString()
                                  : 'Recent'}
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                {statusLower === 'pending' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDispatchClaimInvitation(p._id || p.id)}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                                  >
                                    Send Invite
                                  </button>
                                ) : statusLower === 'invited' || statusLower === 'claimed' ? (
                                  <button
                                    type="button"
                                    onClick={() => setTestClaimToken(p.claimToken)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                                  >
                                    Test Claim
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-bold text-emerald-600">Active</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 3: EMAIL TEMPLATES
              ======================================================== */}
          {activeTab === 'email-templates' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-manrope">Notification Email Templates</h2>
                  <p className="text-xs text-slate-500">
                    Preview and configure the email templates for Claim Invitations and Activation Confirmations.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplateType('claimInvitation');
                      if (emailTemplates?.claimInvitation) {
                        setTemplateSubject(emailTemplates.claimInvitation.subject || '');
                        setTemplateHtml(emailTemplates.claimInvitation.html || '');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      editingTemplateType === 'claimInvitation'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      editingTemplateType === 'activationConfirmation'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Activation Confirmation
                  </button>
                </div>
              </div>

              {templateSavedBanner && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Template saved successfully!</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email Subject</label>
                  <input
                    type="text"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Email HTML Content</label>
                    <span className="text-[11px] text-slate-400">
                      Variables: <code>&#123;name&#125;</code>, <code>&#123;firmName&#125;</code>,{' '}
                      <code>&#123;claimUrl&#125;</code>, <code>&#123;sourceTag&#125;</code>
                    </span>
                  </div>
                  <textarea
                    rows={12}
                    value={templateHtml}
                    onChange={(e) => setTemplateHtml(e.target.value)}
                    className="w-full p-4 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={templateSaving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{templateSaving ? 'Saving...' : 'Save Template Updates'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Claim & Activation Testing Modal (CA Side) */}
      {testClaimToken && (
        <CaActivationModal
          token={testClaimToken}
          isOpen={Boolean(testClaimToken)}
          onClose={() => setTestClaimToken(null)}
          onActivationSuccess={() => {
            setTestClaimToken(null);
            fetchDashboardData();
            alert('Profile successfully claimed and activated! Account created for the CA.');
          }}
        />
      )}
    </div>
  );
};

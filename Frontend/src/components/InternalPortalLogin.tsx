import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, ArrowLeft, Loader2, KeyRound, CheckCircle2, RotateCw, Eye, EyeOff } from 'lucide-react';
import { AuthUser } from '../types';
import api from '../utils/apiClient';
import { validateAdminEmail, validateCaAdminEmail } from '../config/adminAccess';
import { maskEmail, maskEmailsInText } from '../utils/privacyMask';

interface InternalPortalLoginProps {
  portalType: 'admin' | 'ca' | 'prosync' | 'dpr' | 'ca-admin';
  onLoginSuccess: (user: AuthUser) => void;
  onNavigateHome: () => void;
}

export const InternalPortalLogin: React.FC<InternalPortalLoginProps> = ({
  portalType,
  onLoginSuccess,
  onNavigateHome
}) => {
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const isAdminGmailPortal = portalType === 'admin' || portalType === 'ca-admin';

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const titles: Record<string, { title: string; subtitle: string; roleTag: string }> = {
    admin: {
      title: 'Executive Admin Portal',
      subtitle: 'Restricted administrative desk for platform analytics, pipeline leads, and executive audits.',
      roleTag: 'Executive Desk'
    },
    ca: {
      title: 'Chartered Accountant (CA) Desk',
      subtitle: 'Authorized desk for CMA financial validation, banking compliance audits, and ratio reviews.',
      roleTag: 'CA / CMA Network'
    },
    prosync: {
      title: 'ProSync Operations Hub',
      subtitle: 'Internal operational management, banking syndication tracking, and client handoffs.',
      roleTag: 'ProSync Team'
    },
    dpr: {
      title: 'DPR Consultant Desk',
      subtitle: 'Technical project report drafting, engineering schedules, and techno-economic validation.',
      roleTag: 'Consultant Network'
    },
    'ca-admin': {
      title: 'CA Network Admin Portal',
      subtitle: 'Restricted administrative desk for Chartered Accountant onboarding, visiting card processing, and regional consultant coordination.',
      roleTag: 'CA Operations Admin'
    }
  };

  const portalInfo = titles[portalType] || titles.admin;

  const handleRequestReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your registered email address.');
      return;
    }
    if (portalType === 'admin') {
      const check = validateAdminEmail(cleanEmail);
      if (!check.allowed) {
        setError(check.error || 'Access Denied: Only authorized admin @gmail.com accounts are permitted.');
        return;
      }
    } else if (portalType === 'ca-admin') {
      if (!validateCaAdminEmail(cleanEmail)) {
        setError('Access Denied: Only authorized CA Admin @gmail.com accounts are permitted.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const resData = await response.json().catch(() => ({}));
      if (response.ok && resData.success) {
        setSuccessMessage(
          resData.message
            ? maskEmailsInText(resData.message)
            : `A password reset link and 6-digit code have been sent to ${maskEmail(cleanEmail)}.`
        );
        setResendCooldown(30);
        setView('reset');
      } else {
        setError(resData.message || 'Unable to send reset code. Please check your email address.');
      }
    } catch {
      setError('Network error while sending reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = resetOtp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp, newPassword }),
      });
      const resData = await response.json().catch(() => ({}));
      if (response.ok && resData.success) {
        setSuccessMessage('Your password has been updated. You can now sign in with your new password.');
        setPassword('');
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setView('login');
      } else {
        setError(resData.message || 'Invalid or expired reset code.');
      }
    } catch {
      setError('Network error while resetting password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (portalType === 'admin') {
      const check = validateAdminEmail(cleanEmail);
      if (!check.allowed) {
        setError(check.error || 'Access Denied: Only authorized admin @gmail.com accounts are permitted.');
        return;
      }
    } else if (portalType === 'ca-admin') {
      if (!validateCaAdminEmail(cleanEmail)) {
        setError('Access Denied: Only authorized CA Admin @gmail.com accounts are permitted.');
        return;
      }
    }

    if (!password.trim()) {
      setError('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint =
        portalType === 'ca-admin'
          ? '/ca-admin/auth'
          : portalType === 'admin'
            ? '/auth/admin-login'
            : '/auth/login';
      const payload = { email: cleanEmail, password };

      const userData = await api.post(endpoint, payload);
      if (userData && (userData.token || userData.email)) {
        if (userData.requiresVerification || (!userData.token && userData.isVerified === false)) {
          setError(
            userData.message ||
              'Your email is not verified yet. Please check your inbox for the 6-digit verification code and sign in from the main Sign In modal.'
          );
          return;
        }

        const resolvedRole = userData.role || (portalType === 'ca-admin' ? 'ca_admin' : 'admin');
        if (portalType === 'admin' && !['admin', 'superadmin'].includes(resolvedRole)) {
          setError('Access Denied: This account does not have Administrator privileges.');
          return;
        }
        if (portalType === 'ca-admin' && resolvedRole !== 'ca_admin') {
          setError('Access Denied: This account does not have CA Admin privileges.');
          return;
        }

        const authUser: AuthUser = {
          id: userData._id || userData.id,
          email: userData.email || cleanEmail,
          role: resolvedRole,
          name: userData.name || cleanEmail.split('@')[0],
          company: userData.company,
          phone: userData.phone,
          token: userData.token
        };
        if (userData.token) {
          localStorage.setItem('inisio_auth_token', userData.token);
        }
        if (portalType === 'ca-admin' && userData.token) {
          localStorage.setItem(
            'inisio_ca_admin_session',
            JSON.stringify({ email: authUser.email, token: userData.token })
          );
        }
        localStorage.setItem('inisio_active_user', JSON.stringify(authUser));
        onLoginSuccess(authUser);
      } else {
        setError(userData?.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      const serverMessage = err?.message || err?.response?.data?.message || 'Authentication failed. Please verify your email and credentials.';
      setError(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold font-inter border border-blue-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{portalInfo.roleTag}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-manrope">
            {view === 'forgot'
              ? 'Reset Portal Password'
              : view === 'reset'
                ? 'Set New Password'
                : portalInfo.title}
          </h2>
          <p className="text-xs text-slate-500 font-inter leading-relaxed">
            {view === 'forgot'
              ? 'Enter your registered email address and we will send a 6-digit reset code.'
              : view === 'reset'
                ? 'Enter the 6-digit code from your email and choose a new password.'
                : portalInfo.subtitle}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium space-y-1.5">
            <p>{error}</p>
            {view === 'login' && error.toLowerCase().includes('no password') && (
              <button
                type="button"
                onClick={() => {
                  setView('forgot');
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-blue-700 hover:text-blue-900 underline font-semibold cursor-pointer"
              >
                Set password via email code &rarr;
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {view === 'forgot' ? (
          <form onSubmit={handleRequestReset} className="space-y-4 font-inter text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                Registered Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your registered email"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setView('reset');
                  setError('');
                }}
                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                Already have a code?
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : view === 'reset' ? (
          <form onSubmit={handleConfirmReset} className="space-y-4 font-inter text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                Registered Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                6-Digit Reset Code *
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-mono tracking-widest text-center bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={isLoading || resendCooldown > 0}
                onClick={() => handleRequestReset()}
                className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isLoading && <RotateCw className="w-3 h-3 animate-spin" />}
                <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || resetOtp.length < 6 || newPassword.length < 6}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 font-inter text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                {isAdminGmailPortal ? 'Authorized Gmail Address *' : 'Registered Email Address *'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={isAdminGmailPortal ? 'yourname@gmail.com' : 'Enter your registered email'}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                  Access Password *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  {isAdminGmailPortal ? 'Forgot / Set password?' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your account password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Authenticate &amp; Access Desk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </button>
        </div>
      </div>
    </div>
  );
};

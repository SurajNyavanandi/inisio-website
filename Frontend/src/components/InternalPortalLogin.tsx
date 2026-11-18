import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { AuthUser } from '../types';
import api from '../utils/apiClient';
import { isValidGmail } from '../config/adminAccess';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdminEmailOnlyPortal = portalType === 'admin' || portalType === 'ca-admin';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (isAdminEmailOnlyPortal && !isValidGmail(cleanEmail)) {
      setError('Please enter a valid @gmail.com address for administrative access.');
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
      const payload = isAdminEmailOnlyPortal ? { email: cleanEmail } : { email: cleanEmail, password };

      const userData = await api.post(endpoint, payload);
      if (userData && (userData.token || userData.email)) {
        const authUser: AuthUser = {
          id: userData._id || userData.id,
          email: userData.email || cleanEmail,
          role: userData.role || (portalType === 'ca-admin' ? 'ca_admin' : 'admin'),
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
          <h2 className="text-2xl font-black text-slate-900 font-manrope">{portalInfo.title}</h2>
          <p className="text-xs text-slate-500 font-inter leading-relaxed">
            {portalInfo.subtitle}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-inter text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
              {isAdminEmailOnlyPortal ? 'Authorized Gmail Address *' : 'Registered Email Address *'}
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
                placeholder={isAdminEmailOnlyPortal ? 'yourname@gmail.com' : 'Enter your registered email'}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {!isAdminEmailOnlyPortal && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                Access Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

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

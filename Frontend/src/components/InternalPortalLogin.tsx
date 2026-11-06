import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { AuthUser } from '../types';
import api from '../utils/apiClient';

interface InternalPortalLoginProps {
  portalType: 'admin' | 'ca' | 'prosync' | 'dpr';
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
    }
  };

  const portalInfo = titles[portalType] || titles.admin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response && response.data && response.data.success) {
        const userData = response.data.data;
        const authUser: AuthUser = {
          email: userData.email,
          role: userData.role,
          name: userData.name,
          company: userData.company,
          phone: userData.phone,
          token: userData.token
        };
        if (userData.token) {
          localStorage.setItem('inisio_auth_token', userData.token);
        }
        localStorage.setItem('inisio_active_user', JSON.stringify(authUser));
        onLoginSuccess(authUser);
      } else {
        setError(response.data?.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      const serverMessage = err?.message || err?.response?.data?.message || 'Authentication failed. Please verify your registered credentials.';
      setError(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
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
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-inter text-left">
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
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
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

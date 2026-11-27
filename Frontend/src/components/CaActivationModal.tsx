import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, Lock, Building2, User, Phone, MapPin, AlertCircle, ArrowRight, Loader2, X } from 'lucide-react';
import { AuthUser } from '../types';
import { resolveApiUrl } from '../utils/apiClient';

interface CaActivationModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onActivationSuccess: (user: AuthUser) => void;
}

export const CaActivationModal: React.FC<CaActivationModalProps> = ({
  token,
  isOpen,
  onClose,
  onActivationSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // Editable fields for activation
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [firmName, setFirmName] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token || !isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError('');

    fetch(resolveApiUrl(`/ca-admin/verify-claim?token=${encodeURIComponent(token)}`))
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.data && data.data.profile) {
          const prof = data.data.profile;
          setProfileData(prof);
          setName(prof.name || '');
          setPhone(prof.phone || '');
          setFirmName(prof.firmName || '');
          setCity(prof.city || '');
        } else {
          setError(data.message || 'The claim invitation link is invalid or has expired.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Unable to connect to verification server. Please try again.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(resolveApiUrl('/ca-admin/activate-profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          name,
          phone,
          firmName,
          city,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        // Automatically authenticate user as active CA
        const loginRes = await fetch(resolveApiUrl('/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: profileData.email, password }),
        });
        const loginData = await loginRes.json();

        if (loginData.success && loginData.data) {
          const authUser: AuthUser = {
            email: loginData.data.email,
            role: loginData.data.role || 'ca',
            name: loginData.data.name || name,
            company: loginData.data.company || firmName,
            phone: loginData.data.phone || phone,
            token: loginData.data.token,
          };
          if (loginData.data.token) {
            localStorage.setItem('inisio_auth_token', loginData.data.token);
          }
          localStorage.setItem('inisio_active_user', JSON.stringify(authUser));

          setTimeout(() => {
            onActivationSuccess(authUser);
            onClose();
          }, 1200);
        }
      } else {
        setError(data.message || 'Activation failed. Please check details and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Activation failed. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-inter">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-5 sm:top-5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-16 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Verifying CA Invitation Link...</h3>
            <p className="text-xs text-slate-500">Checking verification token and accreditation status.</p>
          </div>
        ) : error && !profileData ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900 font-manrope">Invalid or Expired Invitation</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">{error}</p>
            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        ) : success ? (
          <div className="py-12 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-manrope">CA Account Activated!</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your profile is verified. Logging you in and redirecting to your dedicated <strong>CA Audit Desk</strong>...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Source Tag: {profileData?.sourceTag || 'WOFA-2026'}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-manrope">Claim Your CA Audit Desk</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complete your account registration for <strong>{profileData?.email}</strong>. Set a secure password to activate your CMA underwriting desk.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">CA Practice / Firm Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">City / Region</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Create Password (min 6 characters)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Details & Activate My CA Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

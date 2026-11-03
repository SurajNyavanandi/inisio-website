import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, LayoutDashboard } from 'lucide-react';
import { AuthUser } from '../types';

interface ForbiddenPageProps {
  currentUser: AuthUser | null;
  attemptedDashboard: string;
  onNavigateToAuthorizedDashboard: () => void;
  onNavigateHome: () => void;
  onSwitchAccount: () => void;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({
  currentUser,
  attemptedDashboard,
  onNavigateToAuthorizedDashboard,
  onNavigateHome,
  onSwitchAccount
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 font-manrope">Restricted Area</h2>
          <p className="text-sm text-slate-600 font-inter leading-relaxed">
            Your signed-in account role (<strong>{currentUser?.role || 'Guest'}</strong>) does not have authorization to view the <strong>{attemptedDashboard}</strong>.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onNavigateToAuthorizedDashboard}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to My Authorized Portal</span>
          </button>

          <button
            type="button"
            onClick={onSwitchAccount}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch to Another Account</span>
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer pt-2"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

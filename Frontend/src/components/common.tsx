import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <div className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between p-4 shrink-0">
        <div className="space-y-5">
          <div className="h-9 bg-slate-800 rounded-lg" />
          <div className="space-y-2">
            <div className="h-9 bg-slate-800 rounded-lg" />
            <div className="h-9 bg-slate-800/70 rounded-lg" />
            <div className="h-9 bg-slate-800/70 rounded-lg" />
            <div className="h-9 bg-slate-800/70 rounded-lg" />
          </div>
        </div>
        <div className="h-12 bg-slate-800 rounded-lg" />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 px-6 lg:px-8 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="h-5 w-44 bg-slate-200 rounded-md" />
          <div className="h-8 w-28 bg-slate-200 rounded-lg" />
        </div>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-28 bg-white border border-slate-200 rounded-xl" />
            <div className="h-28 bg-white border border-slate-200 rounded-xl" />
            <div className="h-28 bg-white border border-slate-200 rounded-xl" />
            <div className="h-28 bg-white border border-slate-200 rounded-xl" />
          </div>
          <div className="h-96 bg-white border border-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

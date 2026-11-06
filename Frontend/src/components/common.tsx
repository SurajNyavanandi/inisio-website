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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="h-28 bg-slate-200 rounded-2xl"></div>
        <div className="h-28 bg-slate-200 rounded-2xl"></div>
        <div className="h-28 bg-slate-200 rounded-2xl"></div>
        <div className="h-28 bg-slate-200 rounded-2xl"></div>
      </div>
      <div className="h-96 bg-slate-200 rounded-3xl"></div>
    </div>
  );
};

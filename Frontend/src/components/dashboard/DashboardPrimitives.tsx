import React, { useEffect } from 'react';
import { LucideIcon, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';

export type KpiTone = 'blue' | 'emerald' | 'amber' | 'indigo' | 'slate';

const KPI_ICON_TONES: Record<KpiTone, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

const KPI_SUBTEXT_TONES: Record<KpiTone, string> = {
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  indigo: 'text-indigo-600',
  slate: 'text-slate-500',
};

export interface DashboardKpiCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  icon: LucideIcon;
  tone?: KpiTone;
  valueClassName?: string;
  onClick?: () => void;
}

export const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'blue',
  valueClassName = 'text-slate-900',
  onClick,
}) => {
  const baseClass =
    'bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 flex flex-col justify-between gap-2 sm:gap-2.5 text-left transition-colors min-w-0';
  const interactiveClass = onClick
    ? 'hover:border-blue-400 hover:bg-slate-50/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600'
    : '';

  const content = (
    <>
      <div className="flex items-center justify-between gap-2 w-full min-w-0">
        <span className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-tight truncate">
          {label}
        </span>
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${KPI_ICON_TONES[tone]}`}
        >
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
      <div
        className={`text-lg sm:text-2xl font-extrabold font-manrope tabular-nums leading-tight truncate ${valueClassName}`}
      >
        {value}
      </div>
      {subtext && (
        <div className={`text-[11px] sm:text-xs font-medium leading-snug line-clamp-2 ${KPI_SUBTEXT_TONES[tone]}`}>
          {subtext}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${baseClass} ${interactiveClass}`}>
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
};

export interface DashboardSectionBannerProps {
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const DashboardSectionBanner: React.FC<DashboardSectionBannerProps> = ({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  description,
  badge,
  actions,
}) => (
  <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
    <div className="space-y-1.5 min-w-0">
      {(eyebrow || badge) && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-700">
          {EyebrowIcon && <EyebrowIcon className="w-4 h-4 shrink-0" />}
          {eyebrow && <span>{eyebrow}</span>}
          {badge}
        </div>
      )}
      <h2 className="text-lg sm:text-2xl font-bold text-slate-900 font-manrope tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">{actions}</div>
    )}
  </div>
);

export const DashboardCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

export const DashboardCardHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
}> = ({ title, description, actions }) => (
  <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="min-w-0">
      <h3 className="text-sm sm:text-base font-bold text-slate-900 font-manrope">{title}</h3>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">{actions}</div>}
  </div>
);

export const DashboardStatusBadge: React.FC<{
  status: string;
  icon?: LucideIcon;
}> = ({ status, icon: Icon }) => {
  const normalized = (status || 'Active').toLowerCase();

  let toneClass = 'bg-blue-50 text-blue-700 border-blue-200';
  let dotClass = 'bg-blue-600';

  if (
    normalized.includes('approved') ||
    normalized.includes('funded') ||
    normalized.includes('activated') ||
    normalized.includes('assessed') ||
    normalized.includes('completed') ||
    normalized.includes('sanction') ||
    normalized.includes('cleared')
  ) {
    toneClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotClass = 'bg-emerald-600';
  } else if (
    normalized.includes('pending') ||
    normalized.includes('new') ||
    normalized.includes('review') ||
    normalized.includes('progress') ||
    normalized.includes('waiting')
  ) {
    toneClass = 'bg-amber-50 text-amber-700 border-amber-200';
    dotClass = 'bg-amber-600';
  } else if (
    normalized.includes('declined') ||
    normalized.includes('rejected') ||
    normalized.includes('failed') ||
    normalized.includes('error')
  ) {
    toneClass = 'bg-rose-50 text-rose-700 border-rose-200';
    dotClass = 'bg-rose-600';
  } else if (normalized.includes('invited') || normalized.includes('claimed')) {
    toneClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotClass = 'bg-indigo-600';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border whitespace-nowrap ${toneClass}`}
    >
      {Icon ? (
        <Icon className="w-3 h-3 shrink-0" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} aria-hidden="true" />
      )}
      <span>{status}</span>
    </span>
  );
};

export const DashboardSearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative w-full sm:w-64 ${className}`}>
    <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full min-h-[44px] sm:min-h-[40px] pl-9 pr-3 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors"
    />
  </div>
);

export const DashboardFilterButton: React.FC<{
  onClick: () => void;
  activeCount?: number;
  label?: string;
  className?: string;
}> = ({ onClick, activeCount = 0, label = 'Filters', className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
      activeCount > 0
        ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
    } ${className}`}
  >
    <SlidersHorizontal className="w-4 h-4 shrink-0" />
    <span>{label}</span>
    {activeCount > 0 && (
      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold tabular-nums inline-flex items-center justify-center">
        {activeCount}
      </span>
    )}
  </button>
);

export const DashboardBottomSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onClose, title, description, footer, children }) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl border-t sm:border border-slate-200 shadow-2xl max-h-[82dvh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" aria-hidden="true" />
        </div>
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 font-manrope truncate">{title}</h3>
            {description && <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">{children}</div>
        {footer && (
          <div className="px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const DashboardEmptyState: React.FC<{
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, description, action }) => (
  <div className="py-10 sm:py-12 px-4 flex flex-col items-center justify-center text-center space-y-2">
    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mb-1">
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-sm font-semibold text-slate-800">{title}</p>
    <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>
    {action && <div className="pt-2">{action}</div>}
  </div>
);

export const DashboardLoadingState: React.FC<{
  label?: string;
}> = ({ label = 'Loading records from database...' }) => (
  <div className="py-10 px-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
    <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
    <span>{label}</span>
  </div>
);

export const DASHBOARD_TABLE = {
  wrapper: 'overflow-x-auto -mx-px',
  table: 'w-full text-left text-xs',
  thead: 'bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 sticky top-0 z-10',
  th: 'py-3 px-3.5 sm:px-5 whitespace-nowrap',
  tbody: 'divide-y divide-slate-100',
  tr: 'hover:bg-slate-50/80 transition-colors',
  td: 'py-3 sm:py-3.5 px-3.5 sm:px-5',
};

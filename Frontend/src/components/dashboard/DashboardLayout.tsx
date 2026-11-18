import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Home,
  LogOut,
  LucideIcon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

export interface DashboardLayoutProps {
  portalName: string;
  portalSubtitle: string;
  portalIcon: LucideIcon;
  roleLabel: string;
  roleModeLabel?: string;
  userName?: string;
  userEmail?: string;
  navItems: DashboardNavItem[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  pageTitle: string;
  pageBreadcrumb?: string;
  showBackButton?: boolean;
  onGoBack?: () => void;
  headerActions?: React.ReactNode;
  sidebarAction?: React.ReactNode;
  onNavigateHome?: () => void;
  homeLabel?: string;
  onLogout?: () => void;
  logoutLabel?: string;
  onCloseOverlay?: () => void;
  closeOverlayLabel?: string;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  portalName,
  portalSubtitle,
  portalIcon: PortalIcon,
  roleLabel,
  roleModeLabel,
  userName,
  userEmail,
  navItems,
  activeTab,
  onSelectTab,
  pageTitle,
  pageBreadcrumb,
  showBackButton = false,
  onGoBack,
  headerActions,
  sidebarAction,
  onNavigateHome,
  homeLabel = 'Website',
  onLogout,
  logoutLabel = 'Sign Out',
  onCloseOverlay,
  closeOverlayLabel = 'Close (Esc)',
  children,
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen]);

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : roleLabel);
  const displayInitial = (displayName || 'U').charAt(0).toUpperCase();

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    setIsMobileDrawerOpen(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 font-inter antialiased">
      {/* Mobile / Tablet Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
          aria-hidden="true"
        />
      )}

      {/* Collapsible Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-all duration-200 ease-out lg:static lg:translate-x-0 shrink-0 ${
          isSidebarCollapsed ? 'w-64 lg:w-[72px]' : 'w-64'
        } ${isMobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Section: Brand + Role + Nav */}
        <div className="flex-1 flex flex-col min-h-0 p-4 space-y-5 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div className={`flex items-center gap-2.5 min-w-0 ${isSidebarCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <PortalIcon className="w-4 h-4" />
              </div>
              <div className={`min-w-0 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                <div className="text-sm font-extrabold text-white font-manrope leading-tight truncate">
                  {portalName}
                </div>
                <div className="text-[11px] font-semibold text-blue-400 tracking-wide truncate">
                  {portalSubtitle}
                </div>
              </div>
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden lg:inline-flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Role Context Strip */}
          <div
            className={`px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-800 flex items-center justify-between gap-2 ${
              isSidebarCollapsed ? 'lg:hidden' : ''
            }`}
          >
            <span className="text-[11px] font-semibold text-blue-300 truncate">{roleLabel}</span>
            {roleModeLabel && (
              <span className="text-[11px] font-medium text-slate-400 shrink-0">{roleModeLabel}</span>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1" aria-label={`${portalSubtitle} navigation`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className={`truncate whitespace-nowrap ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                      {item.label}
                    </span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md shrink-0 ${
                        isSidebarCollapsed ? 'lg:hidden' : ''
                      } ${
                        isActive
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Optional Sidebar CTA */}
          {sidebarAction && (
            <div className={isSidebarCollapsed ? 'lg:hidden' : 'pt-1'}>
              {sidebarAction}
            </div>
          )}
        </div>

        {/* Sidebar Footer: User Profile & Actions */}
        <div className="p-4 border-t border-slate-800 space-y-3 shrink-0">
          {/* User Identity Row */}
          <div className={`flex items-center gap-2.5 ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 flex items-center justify-center text-xs font-bold shrink-0">
              {displayInitial}
            </div>
            <div className={`min-w-0 flex-1 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
              <div className="text-xs font-semibold text-white truncate">{displayName}</div>
              {userEmail && (
                <div className="text-[11px] text-slate-400 truncate">{userEmail}</div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div
            className={`flex items-center gap-2 pt-1 ${
              isSidebarCollapsed ? 'lg:flex-col lg:items-center' : 'justify-between flex-wrap'
            }`}
          >
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                title={isSidebarCollapsed ? homeLabel : undefined}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{homeLabel}</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title={isSidebarCollapsed ? logoutLabel : undefined}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{logoutLabel}</span>
              </button>
            )}

            {onCloseOverlay && (
              <button
                type="button"
                onClick={onCloseOverlay}
                title={isSidebarCollapsed ? closeOverlayLabel : undefined}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5 shrink-0" />
                <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{closeOverlayLabel}</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Right-Side Main Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-slate-50">
        {/* Sticky Top Header Bar */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {showBackButton && onGoBack && (
              <button
                type="button"
                onClick={onGoBack}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            <div className="min-w-0 flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 font-manrope truncate">
                {pageTitle}
              </h1>
              {pageBreadcrumb && (
                <>
                  <span className="text-slate-300 hidden md:inline" aria-hidden="true">/</span>
                  <span className="text-xs font-medium text-slate-500 hidden md:inline truncate">
                    {pageBreadcrumb}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {headerActions}

            <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {displayInitial}
              </div>
              <div className="leading-tight max-w-36">
                <div className="text-xs font-semibold text-slate-900 truncate">{displayName}</div>
                <div className="text-[11px] text-slate-500 truncate">{roleLabel}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Right Content Viewport */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

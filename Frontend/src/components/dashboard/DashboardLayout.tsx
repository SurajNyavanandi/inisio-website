import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  Home,
  LogOut,
  LucideIcon,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';

export interface DashboardNavItem {
  id: string;
  label: string;
  mobileLabel?: string;
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
  mobileStickyAction?: React.ReactNode;
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
  mobileStickyAction,
  onNavigateHome,
  homeLabel = 'Website',
  onLogout,
  logoutLabel = 'Sign Out',
  onCloseOverlay,
  closeOverlayLabel = 'Close (Esc)',
  children,
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMoreSheetOpen) setIsMoreSheetOpen(false);
        if (isMobileDrawerOpen) setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen, isMoreSheetOpen]);

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : roleLabel);
  const displayInitial = (displayName || 'U').charAt(0).toUpperCase();
  const homeAction = onNavigateHome || onCloseOverlay;
  const homeActionTitle = onNavigateHome ? `Back to ${homeLabel}` : closeOverlayLabel;

  const hasOverflowTabs = navItems.length > 5;
  const primaryBottomItems = hasOverflowTabs ? navItems.slice(0, 4) : navItems;
  const overflowBottomItems = hasOverflowTabs ? navItems.slice(4) : [];
  const isOverflowTabActive = overflowBottomItems.some((item) => item.id === activeTab);

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    setIsMobileDrawerOpen(false);
    setIsMoreSheetOpen(false);
  };

  const handleReturnHome = () => {
    setIsMobileDrawerOpen(false);
    setIsMoreSheetOpen(false);
    if (homeAction) homeAction();
  };

  return (
    <div className="flex h-screen supports-[height:100dvh]:h-[100dvh] w-full overflow-hidden bg-slate-50 text-slate-900 font-inter antialiased">
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
          isSidebarCollapsed ? 'w-64 lg:w-[72px]' : 'w-72 sm:w-64'
        } ${isMobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Section: Brand + Role + Nav */}
        <div className="flex-1 flex flex-col min-h-0 p-4 space-y-5 overflow-y-auto">
          {/* Brand Header (Clickable to Return Home) */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800">
            {homeAction ? (
              <button
                type="button"
                onClick={handleReturnHome}
                title={homeActionTitle}
                aria-label={homeActionTitle}
                className={`group flex items-center gap-2.5 min-w-0 min-h-[44px] lg:min-h-0 text-left rounded-lg p-1.5 -m-1.5 hover:bg-slate-800/80 transition-colors cursor-pointer ${
                  isSidebarCollapsed ? 'lg:justify-center lg:w-full lg:mx-0' : 'flex-1'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 group-hover:bg-blue-500 text-white flex items-center justify-center shrink-0 transition-colors">
                  <PortalIcon className="w-4 h-4" />
                </div>
                <div className={`min-w-0 flex-1 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                  <div className="text-sm font-extrabold text-white font-manrope leading-tight truncate flex items-center gap-1">
                    <span className="truncate">{portalName}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-blue-400 group-hover:text-blue-300 tracking-wide truncate flex items-center gap-1">
                    <ChevronLeft className="w-3 h-3 -ml-0.5 opacity-70 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all shrink-0" />
                    <span className="truncate">{portalSubtitle}</span>
                  </div>
                </div>
              </button>
            ) : (
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
            )}

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
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
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
                  className={`w-full min-h-[44px] lg:min-h-[40px] flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
                className="inline-flex items-center gap-1.5 min-h-[44px] lg:min-h-[34px] px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer whitespace-nowrap"
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
                className="inline-flex items-center gap-1.5 min-h-[44px] lg:min-h-[34px] px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer whitespace-nowrap"
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
                className="inline-flex items-center gap-1.5 min-h-[44px] lg:min-h-[34px] px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer whitespace-nowrap"
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
        {/* Sticky Top App Bar */}
        <header className="h-14 sm:h-16 px-2.5 sm:px-6 lg:px-8 bg-white border-b border-slate-200 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-20">
          <div className="flex items-center gap-1 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {showBackButton && onGoBack ? (
              <button
                type="button"
                onClick={onGoBack}
                aria-label="Go back"
                className="inline-flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-[36px] px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Back</span>
              </button>
            ) : homeAction ? (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleReturnHome}
                  aria-label={homeActionTitle}
                  title={homeActionTitle}
                  className="group inline-flex items-center justify-center gap-1 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-[36px] px-1.5 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-800 group-hover:-translate-x-0.5 transition-all shrink-0" />
                  <span className="hidden sm:inline">Home</span>
                </button>
                <span className="text-slate-300 select-none hidden sm:inline" aria-hidden="true">/</span>
              </div>
            ) : null}

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2 min-w-0">
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
              {pageBreadcrumb && (
                <span className="text-[11px] font-medium text-slate-500 truncate md:hidden leading-tight">
                  {pageBreadcrumb}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div
            className={`max-w-7xl mx-auto p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 ${
              mobileStickyAction ? 'pb-36 lg:pb-8' : 'pb-24 lg:pb-8'
            }`}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sticky Action Bar (Primary Next Step) */}
      {mobileStickyAction && (
        <div
          className="lg:hidden fixed left-0 right-0 bottom-16 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3.5 py-2 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
          style={{ paddingBottom: '0.5rem' }}
        >
          {mobileStickyAction}
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {navItems.length > 0 && (
        <nav
          aria-label={`${portalSubtitle} mobile navigation`}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(15,23,42,0.05)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div
            className="grid h-16 items-stretch"
            style={{
              gridTemplateColumns: `repeat(${
                hasOverflowTabs ? primaryBottomItems.length + 1 : primaryBottomItems.length
              }, minmax(0, 1fr))`,
            }}
          >
            {primaryBottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const shortLabel = item.mobileLabel || item.label;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex flex-col items-center justify-center gap-1 min-h-[48px] px-1 transition-colors cursor-pointer ${
                    isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full bg-blue-600"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative flex items-center justify-center">
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold tabular-nums flex items-center justify-center ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.count > 99 ? '99+' : item.count}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-semibold leading-tight truncate max-w-full">
                    {shortLabel}
                  </span>
                </button>
              );
            })}

            {hasOverflowTabs && (
              <button
                type="button"
                onClick={() => setIsMoreSheetOpen(true)}
                aria-expanded={isMoreSheetOpen}
                className={`relative flex flex-col items-center justify-center gap-1 min-h-[48px] px-1 transition-colors cursor-pointer ${
                  isOverflowTabActive || isMoreSheetOpen
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {(isOverflowTabActive || isMoreSheetOpen) && (
                  <span
                    className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full bg-blue-600"
                    aria-hidden="true"
                  />
                )}
                <MoreHorizontal className="w-5 h-5 shrink-0" />
                <span className="text-[10px] font-semibold leading-tight">More</span>
              </button>
            )}
          </div>
        </nav>
      )}

      {/* Mobile "More" Bottom Sheet for Overflow Navigation */}
      {isMoreSheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="More navigation options"
        >
          <div
            onClick={() => setIsMoreSheetOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
            aria-hidden="true"
          />
          <div
            className="relative z-10 bg-white rounded-t-2xl border-t border-slate-200 shadow-2xl max-h-[80dvh] flex flex-col animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300" aria-hidden="true" />
            </div>
            <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 font-manrope truncate">{portalSubtitle}</div>
                <div className="text-xs text-slate-500 truncate">{displayName}</div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreSheetOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 space-y-1.5 overflow-y-auto">
              {overflowBottomItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full min-h-[48px] flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.count !== undefined && (
                      <span
                        className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md ${
                          isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}

              {(onNavigateHome || onLogout || onCloseOverlay) && (
                <div className="pt-2 mt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                  {onNavigateHome && (
                    <button
                      type="button"
                      onClick={handleReturnHome}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Home className="w-4 h-4 shrink-0" />
                      <span>{homeLabel}</span>
                    </button>
                  )}
                  {onCloseOverlay && (
                    <button
                      type="button"
                      onClick={handleReturnHome}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <X className="w-4 h-4 shrink-0" />
                      <span>{closeOverlayLabel}</span>
                    </button>
                  )}
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreSheetOpen(false);
                        onLogout();
                      }}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>{logoutLabel}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { AuthUser } from '../types';
import {
  TrendingUp,
  Menu,
  X,
  ArrowRight,
  LogOut,
  LogIn,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAssessment: (defaultIndustry?: string) => void;
  onOpenConsultation: () => void;
  selectedIndustryName?: string;
  onSelectIndustry?: (industryName: string) => void;
  currentUser: AuthUser | null;
  onOpenAuth: (mode?: 'login' | 'signup' | 'forgot-password' | 'reset-password') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAssessment,
  currentUser,
  onOpenAuth,
  onLogout
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'blue');

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Lock body scroll cleanly when mobile menu is open & close menus on Escape / outside click
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // 4 concise navigation items with crawlable public URLs
  const navLinks = [
    { id: 'how-it-works', name: 'Solutions', target: 'how-it-works', href: '/how-it-works' },
    { id: 'industries', name: 'Industries', target: 'industries', href: '/industries' },
    { id: 'faq', name: 'Insights & FAQ', target: 'faq', href: '/faq' },
    { id: 'contact', name: 'Contact', target: 'contact', href: '/contact' }
  ];

  const handleNavClick = (target: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    onSelectTab(target);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const getDashboardTabForRole = (role?: string) => {
    if (!role) return 'user-dashboard';
    if (role === 'ca_admin') return 'ca-admin-dashboard';
    if (role === 'superadmin' || role === 'admin' || role === 'admin1' || role === 'admin2' || role === 'admin3') return 'admin-dashboard';
    if (role === 'ca') return 'ca-dashboard';
    if (role === 'prosync_admin' || role === 'prosync') return 'prosync-dashboard';
    if (role === 'dpr_consultant') return 'dpr-dashboard';
    return 'user-dashboard';
  };

  const getRoleLabel = (role?: string) => {
    if (role === 'admin' || role === 'superadmin' || role === 'admin1' || role === 'admin2' || role === 'admin3') return 'Administrator';
    if (role === 'ca') return 'CA / CMA Auditor';
    if (role === 'ca_admin') return 'CA Admin';
    if (role === 'dpr_consultant') return 'DPR Consultant';
    if (role === 'prosync' || role === 'prosync_admin') return 'Prosync Desk';
    return 'Promoter';
  };

  const userInitial = (currentUser?.name?.trim() || currentUser?.email || 'U').charAt(0).toUpperCase();

  return (
    <>
      {/* Full-width Crisp Institutional Top Bar — always stays sharp ABOVE mobile backdrop */}
      <header
        className={`sticky top-0 z-50 w-full transition-colors duration-200 ${
          isScrolled || mobileMenuOpen
            ? 'bg-white border-b border-slate-200 shadow-[0_1px_12px_rgba(15,23,42,0.06)]'
            : 'bg-white/95 backdrop-blur-md border-b border-slate-200/75'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 lg:gap-8 h-16">
            {/* Zone 1: Clean Single-Line Brand Mark */}
            <a
              href="/"
              onClick={(e) => handleNavClick('home', e)}
              aria-label="Inisio Home"
              className="flex items-center gap-2.5 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-lg group"
            >
              <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors shrink-0">
                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              </span>
              <span className="font-manrope text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                Inisio
              </span>
            </a>

            {/* Zone 2: Clean Typographic Navigation Links (Visible on Tablet 768px+ and Desktop) */}
            <nav
              className="hidden md:flex items-center gap-6 lg:gap-8 font-inter"
              aria-label="Main navigation"
            >
              {navLinks.map((link) => {
                const isActive =
                  activeTab === link.target ||
                  (link.target === 'faq' && activeTab === 'blogs') ||
                  (link.target === 'how-it-works' && activeTab === 'about');
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => handleNavClick(link.target, e)}
                    className={`relative py-1 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-sm ${
                      isActive
                        ? 'text-blue-600 font-semibold'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 right-0 -bottom-[21px] h-0.5 bg-blue-600 rounded-full"
                      />
                    )}
                  </a>
                );
              })}
            </nav>

            {/* Zone 3: Tablet & Desktop Actions (768px+) */}
            <div className="hidden md:flex items-center gap-3 shrink-0 font-inter">
              {currentUser ? (
                <div className="relative shrink-0" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="h-9 px-2.5 text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    title={`${currentUser.name} (${currentUser.email})`}
                    aria-expanded={userDropdownOpen}
                  >
                    <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {userInitial}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[96px] lg:max-w-[130px]">
                      {currentUser.name}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
                        userDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
                      <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                        <p className="text-[11px] font-medium text-blue-600 mt-1">
                          {getRoleLabel(currentUser.role)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleNavClick(getDashboardTabForRole(currentUser.role))}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>My Dashboard</span>
                      </button>

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5 shrink-0" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  id="navbar-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="h-9 px-3.5 text-sm font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  Sign In
                </button>
              )}

              <a
                href="/assessment"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenAssessment();
                }}
                className="h-9 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-lg shadow-xs transition-all inline-flex items-center gap-1.5 group cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>Free Assessment</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            {/* Mobile Controls (< 768px): Uncluttered 1 CTA + Menu Toggle */}
            <div className="flex items-center gap-2 md:hidden shrink-0 font-inter">
              <a
                href="/assessment"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  onOpenAssessment();
                }}
                className="h-9 px-3.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs inline-flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>Free Assessment</span>
              </a>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="w-10 h-10 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg border border-slate-200/80 cursor-pointer flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Down Drawer (< 768px) — Backdrop starts BELOW header so header stays 100% crisp */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 font-inter">
          {/* Subtle Scrim Below Header Only */}
          <div
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Clean Full-Width Drawer Panel Attached Flush to Header */}
          <div className="relative bg-white border-b border-slate-200 shadow-xl px-4 py-4 space-y-4">
            <nav className="flex flex-col divide-y divide-slate-100" aria-label="Mobile navigation">
              {navLinks.map((link) => {
                const isActive =
                  activeTab === link.target ||
                  (link.target === 'faq' && activeTab === 'blogs') ||
                  (link.target === 'how-it-works' && activeTab === 'about');
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => handleNavClick(link.target, e)}
                    className={`w-full py-3.5 px-2 text-sm font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                      isActive ? 'text-blue-600' : 'text-slate-800 hover:text-blue-600'
                    }`}
                  >
                    <span>{link.name}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </a>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-200/80 space-y-3">
              {currentUser ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-2 bg-slate-50 rounded-lg border border-slate-200/70">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {userInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {getRoleLabel(currentUser.role)} · {currentUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleNavClick(getDashboardTabForRole(currentUser.role))}
                      className="h-11 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="h-11 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full h-11 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span>Sign In to Your Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

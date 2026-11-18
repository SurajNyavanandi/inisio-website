import React, { useState, useEffect, useRef } from 'react';
import { AuthUser } from '../types';
import {
  TrendingUp,
  Menu,
  X,
  ArrowRight,
  Calculator,
  User,
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
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

  // Exactly 4 essential navigation items
  const navLinks = [
    { id: 'solutions', name: 'Solutions', target: 'solutions' },
    { id: 'industries', name: 'Industries', target: 'industries' },
    { id: 'faqs', name: 'FAQs & Insights', target: 'faqs' },
    { id: 'contact', name: 'Contact Us', target: 'contact' }
  ];

  const handleNavClick = (target: string) => {
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
    <header className="sticky top-2 sm:top-3 z-40 w-full px-3 sm:px-6 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Floating Translucent Glassmorphism Rail - Standardized height & spacing across breakpoints */}
        <div
          className={`relative flex items-center justify-between h-14 sm:h-15 px-3 sm:px-5 lg:px-6 rounded-2xl lg:rounded-full border transition-all duration-300 ${
            isScrolled
              ? 'bg-white/90 backdrop-blur-xl border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.07)]'
              : 'bg-white/80 backdrop-blur-md border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.04)]'
          }`}
        >
          {/* Logo / Brand */}
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer text-left focus:outline-none shrink-0 group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl lg:rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-manrope text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight whitespace-nowrap">
                Inisio
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-blue-600 tracking-wider uppercase -mt-0.5 font-inter whitespace-nowrap">
                Greenfield Advisory
              </span>
            </div>
          </button>

          {/* 4 Essential Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 font-inter" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = activeTab === link.target;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.target)}
                  className={`relative px-3.5 xl:px-4 h-9 rounded-full text-xs xl:text-sm font-semibold transition-colors duration-200 cursor-pointer group flex items-center whitespace-nowrap ${
                    isActive ? 'text-blue-600 bg-blue-50/90' : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  <span className="relative z-10">{link.name}</span>
                  {!isActive && (
                    <span className="absolute inset-0 bg-blue-50/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100 -z-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {currentUser ? (
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="h-9 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-full transition-all flex items-center gap-2 cursor-pointer"
                  title={`${currentUser.name} (${currentUser.email})`}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {userInitial}
                  </div>
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[90px] xl:max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Desktop User Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2.5 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                        {getRoleLabel(currentUser.role)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleNavClick(getDashboardTabForRole(currentUser.role))}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                      <span>My Dashboard</span>
                    </button>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
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
                className="h-9 px-3.5 text-xs xl:text-sm font-semibold text-slate-700 hover:text-blue-600 bg-slate-100/80 hover:bg-blue-50/80 border border-slate-200/70 rounded-full transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Sign In</span>
              </button>
            )}

            {/* Start Free Assessment CTA */}
            <button
              type="button"
              onClick={() => onOpenAssessment()}
              className="h-9 px-4 text-xs xl:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-full shadow-xs transition-all flex items-center gap-1.5 group cursor-pointer whitespace-nowrap"
            >
              <Calculator className="w-3.5 h-3.5 text-blue-100" />
              <span>Free Assessment</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile & Tablet Actions (375px - 1023px) */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
            {currentUser ? (
              <button
                type="button"
                onClick={() => handleNavClick(getDashboardTabForRole(currentUser.role))}
                className="h-9 px-2 sm:px-3 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-800 rounded-full flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer transition-colors"
                title="My Dashboard"
                aria-label="Open My Dashboard"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {userInitial}
                </div>
                <span className="hidden sm:inline truncate max-w-[90px]">Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="h-9 px-2.5 sm:px-3.5 text-slate-700 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/70 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Sign In</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAssessment();
              }}
              className="h-9 px-3 sm:px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
            >
              <Calculator className="w-3.5 h-3.5 text-blue-100 shrink-0" />
              <span className="sm:hidden">Assess</span>
              <span className="hidden sm:inline">Free Assessment</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 cursor-pointer flex items-center justify-center shrink-0 transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-40 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 shadow-xl space-y-3 font-inter animate-in fade-in slide-in-from-top-2">
              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                {navLinks.map((link) => {
                  const isActive = activeTab === link.target;
                  return (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => handleNavClick(link.target)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/70'
                      }`}
                    >
                      <span>{link.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                {currentUser ? (
                  <>
                    <div className="flex items-center justify-between gap-3 px-2 py-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {userInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                          <p className="text-[11px] font-mono text-slate-500 truncate">{currentUser.email}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 shrink-0">
                        {getRoleLabel(currentUser.role)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleNavClick(getDashboardTabForRole(currentUser.role))}
                        className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>My Dashboard</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onLogout();
                        }}
                        className="h-9 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/70 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth('login');
                      }}
                      className="h-9 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5 text-blue-600" />
                      <span>Sign In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAssessment();
                      }}
                      className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Free Assessment</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

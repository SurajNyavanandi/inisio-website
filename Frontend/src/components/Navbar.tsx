import React, { useState, useEffect } from 'react';
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
  ChevronDown
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'blue');

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
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

  const getDashboardTabForRole = (role: string) => {
    if (role === 'superadmin' || role === 'admin' || role === 'admin1' || role === 'admin2' || role === 'admin3') return 'admin-dashboard';
    if (role === 'ca') return 'ca-dashboard';
    if (role === 'dpr_consultant') return 'dpr-dashboard';
    if (role === 'prosync_admin' || role === 'prosync') return 'prosync-dashboard';
    return 'user-dashboard';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Executive Admin';
      case 'ca': return 'Chartered Accountant';
      case 'dpr_consultant': return 'DPR Consultant';
      case 'prosync':
      case 'prosync_admin': return 'ProSync Desk';
      default: return 'Promoter';
    }
  };

  return (
    <header className="sticky top-2 sm:top-3 z-40 w-full px-2.5 sm:px-6 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Floating Translucent Glassmorphism Rail */}
        <div
          className={`relative flex items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5 rounded-2xl sm:rounded-full border transition-all duration-300 ${
            isScrolled
              ? 'bg-white/80 backdrop-blur-xl border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.07)]'
              : 'bg-white/65 backdrop-blur-md border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)]'
          }`}
        >
          {/* Logo / Brand */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer text-left focus:outline-none shrink-0 group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
              <TrendingUp className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-manrope text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                Inisio
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-blue-600 tracking-wider uppercase -mt-0.5 font-inter">
                Greenfield Advisory
              </span>
            </div>
          </button>

          {/* 4 Essential Desktop Navigation Links with Modern Hover Highlight Effect */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 font-inter">
            {navLinks.map((link) => {
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.target)}
                  className="relative px-3.5 xl:px-4 py-1.5 rounded-full text-xs xl:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer group"
                >
                  <span className="relative z-10">{link.name}</span>
                  {/* Subtle hovering pill highlight */}
                  <span className="absolute inset-0 bg-blue-50/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 -z-0" />
                </button>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
            {/* User Dropdown */}
            {currentUser ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="px-2.5 py-1.5 bg-slate-50/90 hover:bg-slate-100 border border-slate-200/80 rounded-full transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                  title={`${currentUser.name} (${currentUser.email})`}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[80px] xl:max-w-[110px]">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2.5 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">{currentUser.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                        {getRoleLabel(currentUser.role)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleNavClick(getDashboardTabForRole(currentUser.role))}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-blue-50 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>My Dashboard</span>
                    </button>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 cursor-pointer"
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
                id="navbar-login-btn"
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs xl:text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 rounded-full transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Sign In</span>
              </button>
            )}

            {/* Start Free Assessment CTA */}
            <button
              onClick={() => onOpenAssessment()}
              className="px-4 py-1.5 xl:py-2 text-xs xl:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-full shadow-xs transition-all flex items-center gap-1.5 group cursor-pointer min-h-[36px] whitespace-nowrap"
            >
              <Calculator className="w-3.5 h-3.5 text-blue-100" />
              <span>Free Assessment</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
            {currentUser ? (
              <button
                onClick={() => handleNavClick(getDashboardTabForRole(currentUser.role))}
                className="px-2.5 py-1.5 bg-slate-900 text-white rounded-full flex items-center gap-1.5 text-xs font-bold shrink-0 min-h-[36px]"
                title="My Dashboard"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.email.charAt(0).toUpperCase()}
                </div>
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-slate-700 bg-slate-100/90 rounded-full text-xs font-semibold flex items-center gap-1 min-h-[36px]"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={() => onOpenAssessment()}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-full shadow-2xs flex items-center gap-1 min-h-[36px] whitespace-nowrap"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Assess</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-40 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 shadow-xl space-y-3 font-inter animate-in fade-in slide-in-from-top-2">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.target)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 transition-colors cursor-pointer"
                  >
                    {link.name}
                  </button>
                ))}
              </nav>

              {currentUser && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 truncate">{currentUser.name}</span>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="text-red-600 font-bold hover:underline"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthUser } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustNumbers } from './components/TrustNumbers';
import { BankLogosCarousel } from './components/BankLogosCarousel';
import { Testimonials } from './components/Testimonials';
import { ProjectActionCards } from './components/ProjectActionCards';
import { IndustriesSection } from './components/IndustriesSection';
import { ContactSection } from './components/ContactSection';
import { WhyChooseInisio } from './components/WhyChooseInisio';
import { HowItWorks } from './components/HowItWorks';
import { FAQSection } from './components/FAQSection';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { FloatingContactButtons } from './components/FloatingContactButtons';
import { DashboardSkeleton, LoadingSpinner } from './components/common';
import { Shield } from 'lucide-react';
import { canUserStartAssessment } from './utils/membershipStore';
import { getStoredLeads } from './utils/leadStore';
import { recordPageView } from './utils/visitorStore';
import { recordUserLogin } from './utils/userStore';
import { ForbiddenPage } from './components/ForbiddenPage';
import { InternalPortalLogin } from './components/InternalPortalLogin';

// Code-split / Lazy-loaded heavy modules and dashboards
const UserDashboard = lazy(() => import('./components/UserDashboard').then(m => ({ default: m.UserDashboard })));
const CADashboard = lazy(() => import('./components/CADashboard').then(m => ({ default: m.CADashboard })));
const AdminDashboardView = lazy(() => import('./components/AdminDashboardView').then(m => ({ default: m.AdminDashboardView })));
const ProsyncDashboard = lazy(() => import('./components/ProsyncDashboard').then(m => ({ default: m.ProsyncDashboard })));
const DPRConsultantDashboard = lazy(() => import('./components/DPRConsultantDashboard').then(m => ({ default: m.DPRConsultantDashboard })));
const ProjectAssessmentPage = lazy(() => import('./components/ProjectAssessmentPage').then(m => ({ default: m.ProjectAssessmentPage })));
const LatestBlogs = lazy(() => import('./components/LatestBlogs').then(m => ({ default: m.LatestBlogs })));
const BlogsPage = lazy(() => import('./components/BlogsPage').then(m => ({ default: m.BlogsPage })));

// Code-split modals
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const ConsultationModal = lazy(() => import('./components/ConsultationModal').then(m => ({ default: m.ConsultationModal })));
const AdminLeadsModal = lazy(() => import('./components/AdminLeadsModal').then(m => ({ default: m.AdminLeadsModal })));
const MembershipPlansModal = lazy(() => import('./components/MembershipPlansModal').then(m => ({ default: m.MembershipPlansModal })));

export default function App() {
  const [activeBlogSlug, setActiveBlogSlug] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const path = window.location.pathname;
    if (path.startsWith('/blogs/')) return path.replace('/blogs/', '');
    if (path.startsWith('/blog/')) return path.replace('/blog/', '');
    return '';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const portal = searchParams.get('portal');

    if (portal === 'admin' || portal === 'superadmin' || path === '/admin' || path === '/admin/login' || path === '/superadmin' || path === '/superadmin/login' || path === '/admin-dashboard') {
      return 'admin-dashboard';
    }
    if (portal === 'ca' || path === '/ca' || path === '/ca/login' || path === '/ca-dashboard') {
      return 'ca-dashboard';
    }
    if (portal === 'prosync' || path === '/prosync' || path === '/prosync/login' || path === '/prosync-dashboard') {
      return 'prosync-dashboard';
    }
    if (portal === 'dpr' || path === '/dpr' || path === '/dpr/login' || path === '/dpr-dashboard') {
      return 'dpr-dashboard';
    }
    if (path === '/user-dashboard' || path === '/dashboard' || path === '/promoter-portal') {
      return 'user-dashboard';
    }
    if (path === '/blogs' || path.startsWith('/blogs/') || path === '/blog' || path.startsWith('/blog/')) {
      return 'blogs';
    }
    if (path === '/assessment') return 'assessment';
    if (path === '/how-it-works') return 'how-it-works';
    if (path === '/about') return 'about';
    if (path === '/industries') return 'industries';
    if (path === '/contact') return 'contact';
    if (path === '/faq') return 'faq';
    return 'home';
  });

  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [membershipModalReason, setMembershipModalReason] = useState('');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password'>('login');
  
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('inisio_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [selectedIndustryForAssessment, setSelectedIndustryForAssessment] = useState<string>('');
  const [editingProjectForAssessment, setEditingProjectForAssessment] = useState<any>(null);

  const [authPrefill, setAuthPrefill] = useState<{ email?: string; name?: string; phone?: string; otp?: string }>({});

  // Dynamically verify active user token and session with the backend API
  useEffect(() => {
    const token = localStorage.getItem('inisio_auth_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.data) {
            const user: AuthUser = {
              email: data.data.email,
              role: data.data.role,
              name: data.data.name,
              company: data.data.company,
              phone: data.data.phone,
              token: token,
            };
            setCurrentUser(user);
            localStorage.setItem('inisio_active_user', JSON.stringify(user));
          } else {
            // Token is expired or invalid on the backend
            localStorage.removeItem('inisio_auth_token');
            localStorage.removeItem('inisio_active_user');
            setCurrentUser(null);
          }
        })
        .catch(() => {
          // Keep active state if network is temporarily offline
        });
    }
  }, []);

  const handleOpenAuth = (
    mode: 'login' | 'signup' | 'forgot-password' | 'reset-password' = 'login',
    prefill?: { email?: string; name?: string; phone?: string; otp?: string }
  ) => {
    setAuthInitialMode(mode);
    setAuthPrefill(prefill || {});
    setAuthModalOpen(true);
  };

  useEffect(() => {
    // Check if URL has #admin or ?admin
    const checkAdminHash = () => {
      if (window.location.hash === '#admin' || window.location.search.includes('admin')) {
        setAdminModalOpen(true);
      }
      const anchor = window.location.hash.replace('#', '');
      if (['solutions', 'industries', 'faqs', 'contact'].includes(anchor)) {
        setTimeout(() => {
          document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    };
    checkAdminHash();

    // Check for password reset link parameters in URL (e.g. ?action=reset-password&email=...&otp=...)
    const checkResetPasswordParams = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const action = searchParams.get('action');
        const email = searchParams.get('email') || searchParams.get('to');
        const otp = searchParams.get('otp') || searchParams.get('token') || searchParams.get('code');

        if (action === 'reset-password' || searchParams.has('resetPassword') || searchParams.has('resetToken')) {
          setAuthInitialMode('reset-password');
          setAuthPrefill({
            email: email || '',
            otp: otp || '',
          });
          setAuthModalOpen(true);
        }
      } catch (err) {
        console.warn('Error reading URL search params:', err);
      }
    };
    checkResetPasswordParams();

    const handlePopState = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const portal = searchParams.get('portal');

      if (portal === 'admin' || portal === 'superadmin' || path === '/admin' || path === '/admin/login' || path === '/superadmin' || path === '/superadmin/login' || path === '/admin-dashboard') {
        setActiveTab('admin-dashboard');
      } else if (portal === 'ca' || path === '/ca' || path === '/ca/login' || path === '/ca-dashboard') {
        setActiveTab('ca-dashboard');
      } else if (portal === 'prosync' || path === '/prosync' || path === '/prosync/login' || path === '/prosync-dashboard') {
        setActiveTab('prosync-dashboard');
      } else if (portal === 'dpr' || path === '/dpr' || path === '/dpr/login' || path === '/dpr-dashboard') {
        setActiveTab('dpr-dashboard');
      } else if (path === '/user-dashboard' || path === '/dashboard' || path === '/promoter-portal') {
        setActiveTab('user-dashboard');
      } else if (path === '/blogs' || path.startsWith('/blogs/') || path === '/blog' || path.startsWith('/blog/')) {
        setActiveTab('blogs');
        if (path.startsWith('/blogs/')) {
          setActiveBlogSlug(path.replace('/blogs/', ''));
        } else if (path.startsWith('/blog/')) {
          setActiveBlogSlug(path.replace('/blog/', ''));
        } else {
          setActiveBlogSlug('');
        }
      } else if (path === '/assessment') {
        setActiveTab('assessment');
      } else if (path === '/how-it-works') {
        setActiveTab('how-it-works');
      } else if (path === '/about') {
        setActiveTab('about');
      } else if (path === '/industries') {
        setActiveTab('industries');
      } else if (path === '/contact') {
        setActiveTab('contact');
      } else if (path === '/faq') {
        setActiveTab('faq');
      } else if (path === '/' || path === '') {
        setActiveTab('home');
      }
    };

    window.addEventListener('hashchange', checkAdminHash);
    window.addEventListener('popstate', handlePopState);

    // Track initial page view
    recordPageView('Home / Greenfield Landing', currentUser?.email);

    // Keyboard shortcut Ctrl+Shift+S or Cmd+Shift+S to open Admin Portal
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifierActive = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key ? e.key.toLowerCase() : '';
      const code = e.code || '';

      if (isModifierActive && isShift && (key === 's' || code === 'KeyS')) {
        e.preventDefault();
        const isAdmin = currentUser && ['superadmin', 'admin', 'admin1', 'admin2', 'admin3'].includes(currentUser.role);
        if (isAdmin) {
          setActiveTab('admin-dashboard');
          window.history.pushState({}, '', '/admin-dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setAdminModalOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkAdminHash);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentUser?.email]);

  // Track page transitions
  useEffect(() => {
    const tabLabels: Record<string, string> = {
      'home': 'Home / Greenfield Landing',
      'blogs': 'Advisory Blogs & Research Hub',
      'assessment': 'Greenfield Project Assessment',
      'user-dashboard': 'Promoter Project Dashboard',
      'admin-dashboard': 'Executive Admin Control Desk',
      'ca-dashboard': 'Chartered Accountant Audit Desk',
      'prosync-dashboard': 'Prosync Operations Hub',
      'dpr-dashboard': 'DPR Consultant Desk',
      'about': 'Why Choose Inisio',
      'industries': 'Sector Directory',
      'contact': 'Contact Advisory',
      'how-it-works': 'How It Works Process',
      'faq': 'Frequently Asked Questions',
    };
    recordPageView(tabLabels[activeTab] || activeTab, currentUser?.email);
  }, [activeTab, currentUser?.email]);

  const getDashboardTabForRole = (role?: string) => {
    if (!role) return 'user-dashboard';
    if (role === 'superadmin' || role === 'admin' || role === 'admin1' || role === 'admin2' || role === 'admin3') return 'admin-dashboard';
    if (role === 'ca') return 'ca-dashboard';
    if (role === 'prosync_admin' || role === 'prosync') return 'prosync-dashboard';
    if (role === 'dpr_consultant') return 'dpr-dashboard';
    return 'user-dashboard';
  };

  const isRoleAuthorizedForDashboard = (role: string | undefined, dashboardTab: string): boolean => {
    if (!role) return false;
    const isAdmin = role === 'superadmin' || role === 'admin' || role === 'admin1' || role === 'admin2' || role === 'admin3';
    
    // Admins and Superadmins have cross-portal supervisor audit access
    if (isAdmin) return true;

    switch (dashboardTab) {
      case 'user-dashboard':
        return role === 'user';
      case 'admin-dashboard':
        return isAdmin;
      case 'ca-dashboard':
        return role === 'ca';
      case 'prosync-dashboard':
        return role === 'prosync_admin' || role === 'prosync';
      case 'dpr-dashboard':
        return role === 'dpr_consultant';
      default:
        return false;
    }
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('inisio_active_user', JSON.stringify(user));
    recordUserLogin(user);

    if (activeTab === 'assessment') {
      // Stay on assessment page so user's outputs unlock immediately
      return;
    }

    // Redirect to corresponding authorized dashboard based on assigned role
    const targetDashboard = getDashboardTabForRole(user.role);
    setActiveTab(targetDashboard);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('inisio_active_user');
    localStorage.removeItem('inisio_auth_token');
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAssessment = (industryName?: string, projectToEdit?: any) => {
    // If editing an existing project, always allow
    if (projectToEdit) {
      setSelectedIndustryForAssessment(industryName || '');
      setEditingProjectForAssessment(projectToEdit);
      setActiveTab('assessment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check if user has already completed one free assessment
    const storedLeads = currentUser?.email ? getStoredLeads(currentUser.email) : getStoredLeads();
    const submittedAssessmentCount = storedLeads.filter((lead) => lead.assessmentCompleted === true).length;
    const eligibility = canUserStartAssessment(currentUser?.email, submittedAssessmentCount);

    if (!eligibility.allowed) {
      setMembershipModalReason("You've completed your 1 free project assessment! Upgrade to Inisio Membership to evaluate additional greenfield projects.");
      setMembershipModalOpen(true);
      return;
    }

    setSelectedIndustryForAssessment(industryName || '');
    setEditingProjectForAssessment(null);
    setActiveTab('assessment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToAnchor = (anchorId: string) => {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectTab = (tab: string, blogSlug?: string) => {
    if (tab === 'assessment') {
      handleOpenAssessment();
      return;
    }

    // Single-page anchor navigation (solutions, industries, faqs, contact)
    const singlePageAnchors = ['solutions', 'industries', 'faqs', 'faq', 'contact', 'how-it-works', 'about'];
    if (singlePageAnchors.includes(tab)) {
      const targetAnchor = tab === 'faq' ? 'faqs' : tab === 'how-it-works' || tab === 'about' ? 'solutions' : tab;
      setEditingProjectForAssessment(null);
      if (activeTab !== 'home') {
        setActiveTab('home');
        window.history.pushState({}, '', `/#${targetAnchor}`);
        setTimeout(() => scrollToAnchor(targetAnchor), 80);
      } else {
        window.history.pushState({}, '', `/#${targetAnchor}`);
        scrollToAnchor(targetAnchor);
      }
      return;
    }

    if (tab === 'home') {
      setActiveBlogSlug('');
      setEditingProjectForAssessment(null);
      if (activeTab !== 'home') {
        setActiveTab('home');
      }
      window.history.pushState({}, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setEditingProjectForAssessment(null);
    setActiveTab(tab);

    if (tab === 'blogs') {
      if (blogSlug) {
        setActiveBlogSlug(blogSlug);
        window.history.pushState({}, '', `/blogs/${blogSlug}`);
      } else {
        // Direct to blogs section on single-page home
        setActiveTab('home');
        window.history.pushState({}, '', '/#faqs');
        setTimeout(() => scrollToAnchor('faqs'), 80);
        return;
      }
    } else {
      setActiveBlogSlug('');
      window.history.pushState({}, '', `/${tab}`);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectIndustryFromNav = (industryName: string) => {
    setSelectedIndustryForAssessment(industryName);
    setActiveTab('industries');
    window.history.pushState({}, '', '/industries');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-800 flex flex-col justify-between overflow-x-hidden">
      <div className="w-full min-w-0">
        {/* Navbar */}
        <Navbar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onOpenAssessment={() => handleOpenAssessment()}
          onOpenConsultation={() => setConsultationModalOpen(true)}
          selectedIndustryName={selectedIndustryForAssessment}
          onSelectIndustry={handleSelectIndustryFromNav}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />

        {/* View Switcher */}
        <main className="transition-all duration-300 pt-16 sm:pt-20">
          {activeTab === 'home' && (
            <div className="animate-in fade-in duration-300 pt-0 font-sans space-y-0">
              <div id="hero">
                <Hero
                  onOpenAssessment={() => handleOpenAssessment()}
                  onOpenConsultation={() => setConsultationModalOpen(true)}
                  onExploreIndustries={() => handleSelectTab('industries')}
                />
              </div>

              <BankLogosCarousel />
              <TrustNumbers />

              {/* Solutions & How It Works Anchor Section */}
              <div id="solutions" className="scroll-mt-20">
                <HowItWorks
                  onOpenConsultation={() => setConsultationModalOpen(true)}
                  onOpenAssessment={() => handleOpenAssessment()}
                  onNavigateToContact={() => handleSelectTab('contact')}
                />
                <WhyChooseInisio
                  onOpenAssessment={() => handleOpenAssessment()}
                  onOpenConsultation={() => setConsultationModalOpen(true)}
                />
                <ProjectActionCards
                  onNavigateToAbout={() => handleSelectTab('solutions')}
                  onNavigateToContact={() => handleSelectTab('contact')}
                />
              </div>

              {/* Industries & Sectors Anchor Section */}
              <div id="industries" className="scroll-mt-20">
                <IndustriesSection
                  onSelectIndustryForAssessment={(indName) => handleOpenAssessment(indName)}
                  onOpenAssessment={() => handleOpenAssessment()}
                  onOpenConsultation={() => setConsultationModalOpen(true)}
                  selectedIndustryName={selectedIndustryForAssessment}
                />
              </div>

              <Testimonials />

              {/* FAQs & Insights / Blogs Anchor Section */}
              <div id="faqs" className="scroll-mt-20">
                <FAQSection onOpenConsultation={() => setConsultationModalOpen(true)} />
                <Suspense fallback={<div className="py-12 flex justify-center"><LoadingSpinner size="lg" /></div>}>
                  <LatestBlogs
                    onOpenAssessment={() => handleOpenAssessment()}
                    onOpenConsultation={() => setConsultationModalOpen(true)}
                    onNavigateToBlogs={(slug) => handleSelectTab('blogs', slug)}
                  />
                </Suspense>
              </div>

              {/* Contact Us Anchor Section */}
              <div id="contact" className="scroll-mt-20">
                <ContactSection />
              </div>

              {/* Final Conversion CTA */}
              <FinalCTA
                onOpenAssessment={() => handleOpenAssessment()}
                onOpenConsultation={() => setConsultationModalOpen(true)}
              />
            </div>
          )}

          {/* User / Promoter Dashboard (Only for role="user" or authorized admins) */}
          {activeTab === 'user-dashboard' && (
            !currentUser ? (
              <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900 font-manrope">Sign In to Promoter Portal</h2>
                <p className="text-sm text-slate-600 font-inter">
                  Please log in with your promoter account credentials to access your live project appraisals and financial models.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAuth('login')}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Sign In to Continue
                  </button>
                </div>
              </div>
            ) : !isRoleAuthorizedForDashboard(currentUser.role, 'user-dashboard') ? (
              <ForbiddenPage
                currentUser={currentUser}
                attemptedDashboard="user-dashboard"
                onNavigateToAuthorizedDashboard={() => handleSelectTab(getDashboardTabForRole(currentUser.role))}
                onNavigateHome={() => handleSelectTab('home')}
                onSwitchAccount={() => { handleLogout(); handleOpenAuth('login'); }}
              />
            ) : (
              <Suspense fallback={<DashboardSkeleton />}>
                <div className="animate-in fade-in duration-300">
                  <UserDashboard
                    user={currentUser}
                    onOpenAssessment={(projectToEdit) => handleOpenAssessment('', projectToEdit)}
                    onOpenConsultation={() => setConsultationModalOpen(true)}
                    onOpenMembership={() => {
                      setMembershipModalReason('');
                      setMembershipModalOpen(true);
                    }}
                  />
                </div>
              </Suspense>
            )
          )}

          {/* CA / CMA Audit Dashboard (Only for role="ca" or authorized admins) */}
          {activeTab === 'ca-dashboard' && (
            !currentUser ? (
              <InternalPortalLogin
                portalType="ca"
                onLoginSuccess={handleLoginSuccess}
                onNavigateHome={() => handleSelectTab('home')}
              />
            ) : !isRoleAuthorizedForDashboard(currentUser.role, 'ca-dashboard') ? (
              <ForbiddenPage
                currentUser={currentUser}
                attemptedDashboard="ca-dashboard"
                onNavigateToAuthorizedDashboard={() => handleSelectTab(getDashboardTabForRole(currentUser.role))}
                onNavigateHome={() => handleSelectTab('home')}
                onSwitchAccount={() => { handleLogout(); handleOpenAuth('login'); }}
              />
            ) : (
              <Suspense fallback={<DashboardSkeleton />}>
                <div className="animate-in fade-in duration-300">
                  <CADashboard user={currentUser} />
                </div>
              </Suspense>
            )
          )}

          {/* DPR Consultant Dashboard (Only for role="dpr_consultant" or authorized admins) */}
          {activeTab === 'dpr-dashboard' && (
            !currentUser ? (
              <InternalPortalLogin
                portalType="dpr"
                onLoginSuccess={handleLoginSuccess}
                onNavigateHome={() => handleSelectTab('home')}
              />
            ) : !isRoleAuthorizedForDashboard(currentUser.role, 'dpr-dashboard') ? (
              <ForbiddenPage
                currentUser={currentUser}
                attemptedDashboard="dpr-dashboard"
                onNavigateToAuthorizedDashboard={() => handleSelectTab(getDashboardTabForRole(currentUser.role))}
                onNavigateHome={() => handleSelectTab('home')}
                onSwitchAccount={() => { handleLogout(); handleOpenAuth('login'); }}
              />
            ) : (
              <Suspense fallback={<DashboardSkeleton />}>
                <DPRConsultantDashboard user={currentUser} onLogout={handleLogout} />
              </Suspense>
            )
          )}

          {/* Executive Admin & Super Admin Dashboard (Only for role="admin" / "superadmin") */}
          {activeTab === 'admin-dashboard' && (
            !currentUser ? (
              <InternalPortalLogin
                portalType="admin"
                onLoginSuccess={handleLoginSuccess}
                onNavigateHome={() => handleSelectTab('home')}
              />
            ) : !isRoleAuthorizedForDashboard(currentUser.role, 'admin-dashboard') ? (
              <ForbiddenPage
                currentUser={currentUser}
                attemptedDashboard="admin-dashboard"
                onNavigateToAuthorizedDashboard={() => handleSelectTab(getDashboardTabForRole(currentUser.role))}
                onNavigateHome={() => handleSelectTab('home')}
                onSwitchAccount={() => { handleLogout(); handleOpenAuth('login'); }}
              />
            ) : (
              <Suspense fallback={<DashboardSkeleton />}>
                <div className="animate-in fade-in duration-300">
                  <AdminDashboardView user={currentUser} />
                </div>
              </Suspense>
            )
          )}

          {/* Prosync Banking Desk Dashboard (Only for role="prosync" / "prosync_admin" or authorized admins) */}
          {activeTab === 'prosync-dashboard' && (
            !currentUser ? (
              <InternalPortalLogin
                portalType="prosync"
                onLoginSuccess={handleLoginSuccess}
                onNavigateHome={() => handleSelectTab('home')}
              />
            ) : !isRoleAuthorizedForDashboard(currentUser.role, 'prosync-dashboard') ? (
              <ForbiddenPage
                currentUser={currentUser}
                attemptedDashboard="prosync-dashboard"
                onNavigateToAuthorizedDashboard={() => handleSelectTab(getDashboardTabForRole(currentUser.role))}
                onNavigateHome={() => handleSelectTab('home')}
                onSwitchAccount={() => { handleLogout(); handleOpenAuth('login'); }}
              />
            ) : (
              <Suspense fallback={<DashboardSkeleton />}>
                <div className="animate-in fade-in duration-300">
                  <ProsyncDashboard user={currentUser} onLogout={handleLogout} />
                </div>
              </Suspense>
            )
          )}

          {activeTab === 'assessment' && (
            <Suspense fallback={<DashboardSkeleton />}>
              <div className="animate-in fade-in duration-300">
                <ProjectAssessmentPage
                  currentUser={currentUser}
                  onOpenAuth={handleOpenAuth}
                  onLoginSuccess={handleLoginSuccess}
                  onOpenConsultation={() => setConsultationModalOpen(true)}
                  defaultIndustry={selectedIndustryForAssessment}
                  editingProject={editingProjectForAssessment}
                  onFinishEditing={() => {
                    setEditingProjectForAssessment(null);
                    setActiveTab('user-dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNavigateToDashboard={() => {
                    setEditingProjectForAssessment(null);
                    setActiveTab('user-dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            </Suspense>
          )}

          {activeTab === 'how-it-works' && (
            <div className="animate-in fade-in duration-300">
              <HowItWorks
                onOpenConsultation={() => setConsultationModalOpen(true)}
                onOpenAssessment={() => handleOpenAssessment()}
                onNavigateToContact={() => handleSelectTab('contact')}
              />
            </div>
          )}

          {activeTab === 'about' && (
            <div className="animate-in fade-in duration-300">
              <WhyChooseInisio
                onOpenAssessment={() => handleOpenAssessment()}
                onOpenConsultation={() => setConsultationModalOpen(true)}
              />
            </div>
          )}

          {activeTab === 'industries' && (
            <div className="animate-in fade-in duration-300">
              <IndustriesSection
                onSelectIndustryForAssessment={(indName) => handleOpenAssessment(indName)}
                onOpenAssessment={() => handleOpenAssessment()}
                onOpenConsultation={() => setConsultationModalOpen(true)}
                selectedIndustryName={selectedIndustryForAssessment}
              />
            </div>
          )}

          {activeTab === 'blogs' && (
            <Suspense fallback={<DashboardSkeleton />}>
              <div className="animate-in fade-in duration-300 min-h-[85vh]">
                <BlogsPage
                  activeSlug={activeBlogSlug}
                  onOpenAssessment={(ind) => handleOpenAssessment(ind)}
                  onOpenConsultation={() => setConsultationModalOpen(true)}
                  onSelectBlog={(slug) => {
                    setActiveBlogSlug(slug);
                    window.history.pushState({}, '', `/blogs/${slug}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onBackToBlogs={() => {
                    setActiveBlogSlug('');
                    window.history.pushState({}, '', '/blogs');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNavigateHome={() => handleSelectTab('home')}
                />
              </div>
            </Suspense>
          )}

          {activeTab === 'contact' && (
            <div className="animate-in fade-in duration-300">
              <ContactSection />
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="animate-in fade-in duration-300">
              <FAQSection onOpenConsultation={() => setConsultationModalOpen(true)} />
            </div>
          )}
        </main>
      </div>

      <div>
        {/* Footer */}
        <Footer
          onSelectTab={handleSelectTab}
          onOpenAssessment={() => handleOpenAssessment()}
          onOpenConsultation={() => setConsultationModalOpen(true)}
        />
      </div>

      {/* Interactive Modals (Code-Split / Suspense Loaded) */}
      {authModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
            initialMode={authInitialMode}
            prefilledEmail={authPrefill.email}
            prefilledName={authPrefill.name}
            prefilledPhone={authPrefill.phone}
            initialOtp={authPrefill.otp}
          />
        </Suspense>
      )}

      {consultationModalOpen && (
        <Suspense fallback={null}>
          <ConsultationModal
            isOpen={consultationModalOpen}
            onClose={() => setConsultationModalOpen(false)}
          />
        </Suspense>
      )}

      {adminModalOpen && (
        <Suspense fallback={null}>
          <AdminLeadsModal
            isOpen={adminModalOpen}
            onClose={() => setAdminModalOpen(false)}
            currentUser={currentUser}
            onLoginSuccess={(user) => {
              handleLoginSuccess(user);
              setActiveTab('admin-dashboard');
            }}
            onOpenAdminDashboard={() => setActiveTab('admin-dashboard')}
          />
        </Suspense>
      )}

      {membershipModalOpen && (
        <Suspense fallback={null}>
          <MembershipPlansModal
            isOpen={membershipModalOpen}
            onClose={() => setMembershipModalOpen(false)}
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
            onOpenConsultation={() => setConsultationModalOpen(true)}
            initialReason={membershipModalReason}
          />
        </Suspense>
      )}

      {/* Floating Call & WhatsApp Buttons */}
      <FloatingContactButtons />
    </div>
  );
}

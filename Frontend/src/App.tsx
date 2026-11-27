import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthUser } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustNumbers } from './components/TrustNumbers';
import { BankLogosCarousel } from './components/BankLogosCarousel';
import { Footer } from './components/Footer';
import { FloatingContactButtons } from './components/FloatingContactButtons';
import { DashboardSkeleton, LoadingSpinner } from './components/common';
import { SEOHead } from './components/SEOHead';
import { Shield } from 'lucide-react';
import { canUserStartAssessment, fetchServerAssessmentQuota } from './utils/membershipStore';
import { getStoredLeads } from './utils/leadStore';
import { recordPageView } from './utils/visitorStore';
import { recordUserLogin } from './utils/userStore';
import { resolveApiUrl } from './utils/apiClient';
import { ForbiddenPage } from './components/ForbiddenPage';
import { InternalPortalLogin } from './components/InternalPortalLogin';

// Helper to recover gracefully if a cached index.html references an outdated chunk hash after rebuild
function lazyWithRetry<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await importer();
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('inisio_chunk_retry_ts');
        } catch {}
      }
      return mod;
    } catch (error: any) {
      const msg = String(error?.message || error || '');
      const isChunkError =
        /failed to fetch dynamically imported module|importing a module script failed|loading chunk|chunkloaderror/i.test(
          msg
        );
      if (isChunkError && typeof window !== 'undefined') {
        try {
          const lastRetry = Number(sessionStorage.getItem('inisio_chunk_retry_ts') || '0');
          if (!lastRetry || Date.now() - lastRetry > 15000) {
            sessionStorage.setItem('inisio_chunk_retry_ts', String(Date.now()));
            window.location.reload();
            return new Promise<{ default: T }>(() => {});
          }
        } catch {}
      }
      throw error;
    }
  });
}

// Code-split / Lazy-loaded heavy modules and dashboards
const UserDashboard = lazyWithRetry(() => import('./components/UserDashboard').then(m => ({ default: m.UserDashboard })));
const CADashboard = lazyWithRetry(() => import('./components/CADashboard').then(m => ({ default: m.CADashboard })));
const AdminDashboardView = lazyWithRetry(() => import('./components/AdminDashboardView').then(m => ({ default: m.AdminDashboardView })));
const ProsyncDashboard = lazyWithRetry(() => import('./components/ProsyncDashboard').then(m => ({ default: m.ProsyncDashboard })));
const DPRConsultantDashboard = lazyWithRetry(() => import('./components/DPRConsultantDashboard').then(m => ({ default: m.DPRConsultantDashboard })));
const CAAdminDashboard = lazyWithRetry(() => import('./components/CAAdminDashboard').then(m => ({ default: m.CAAdminDashboard })));
const ProjectAssessmentPage = lazyWithRetry(() => import('./components/ProjectAssessmentPage').then(m => ({ default: m.ProjectAssessmentPage })));
const HowItWorks = lazyWithRetry(() => import('./components/HowItWorks').then(m => ({ default: m.HowItWorks })));
const WhyChooseInisio = lazyWithRetry(() => import('./components/WhyChooseInisio').then(m => ({ default: m.WhyChooseInisio })));
const ProjectActionCards = lazyWithRetry(() => import('./components/ProjectActionCards').then(m => ({ default: m.ProjectActionCards })));
const IndustriesSection = lazyWithRetry(() => import('./components/IndustriesSection').then(m => ({ default: m.IndustriesSection })));
const Testimonials = lazyWithRetry(() => import('./components/Testimonials').then(m => ({ default: m.Testimonials })));
const FAQSection = lazyWithRetry(() => import('./components/FAQSection').then(m => ({ default: m.FAQSection })));
const ContactSection = lazyWithRetry(() => import('./components/ContactSection').then(m => ({ default: m.ContactSection })));
const FinalCTA = lazyWithRetry(() => import('./components/FinalCTA').then(m => ({ default: m.FinalCTA })));
const LatestBlogs = lazyWithRetry(() => import('./components/LatestBlogs').then(m => ({ default: m.LatestBlogs })));
const BlogsPage = lazyWithRetry(() => import('./components/BlogsPage').then(m => ({ default: m.BlogsPage })));

// Code-split modals
const AuthModal = lazyWithRetry(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const MembershipPlansModal = lazyWithRetry(() => import('./components/MembershipPlansModal').then(m => ({ default: m.MembershipPlansModal })));
const ConsultationModal = lazyWithRetry(() => import('./components/ConsultationModal').then(m => ({ default: m.ConsultationModal })));
const CaActivationModal = lazyWithRetry(() => import('./components/CaActivationModal').then(m => ({ default: m.CaActivationModal })));
const AdminPanel = lazyWithRetry(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));

export default function App() {
  const [activeBlogSlug, setActiveBlogSlug] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const path = window.location.pathname;
    if (path.startsWith('/blogs/')) return path.replace('/blogs/', '');
    if (path.startsWith('/blog/')) return path.replace('/blog/', '');
    return '';
  });
  const [activeBlogData, setActiveBlogData] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;

    if (path === '/user-dashboard' || path === '/dashboard' || path === '/promoter-portal') {
      return 'user-dashboard';
    }
    if (path === '/ca-admin-dashboard' || path === '/ca-admin') {
      return 'ca-admin-dashboard';
    }
    if (path === '/blogs' || path.startsWith('/blogs/') || path === '/blog' || path.startsWith('/blog/')) {
      return 'blogs';
    }
    if (path === '/assessment') return 'assessment';
    if (path === '/how-it-works') return 'how-it-works';
    if (path === '/about') return 'about';
    if (path === '/industries') return 'industries';
    if (path === '/faq') return 'faq';
    if (path === '/contact') return 'contact';
    return 'home';
  });

  const [activeHomeSection, setActiveHomeSection] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const hash = window.location.hash.replace('#', '');
    if (['solutions', 'industries', 'faqs', 'contact'].includes(hash)) return hash;
    if (hash === 'how-it-works') return 'solutions';
    if (hash === 'faq') return 'faqs';
    return '';
  });

  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    return path === '/admin' || path === '/admin-panel';
  });
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

  const [selectedIndustryForAssessment, setSelectedIndustryForAssessment] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return new URLSearchParams(window.location.search).get('industry') || '';
    } catch {
      return '';
    }
  });
  const [editingProjectForAssessment, setEditingProjectForAssessment] = useState<any>(null);

  const [authPrefill, setAuthPrefill] = useState<{ email?: string; name?: string; phone?: string; otp?: string }>({});
  const [activationToken, setActivationToken] = useState<string>('');
  const [activationModalOpen, setActivationModalOpen] = useState(false);

  // Dynamically verify active user token and session with the backend API
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('inisio_auth_token');
    if (token) {
      fetch(resolveApiUrl('/auth/me'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
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
    return () => {
      isMounted = false;
    };
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
    // Check if URL has #admin, ?admin, or /admin
    const checkAdminHash = () => {
      const path = window.location.pathname;
      if (window.location.hash === '#admin' || window.location.search.includes('admin') || path === '/admin' || path === '/admin-panel') {
        setIsAdminPanelOpen(true);
      }
      const hashAnchor = window.location.hash.replace('#', '');
      const normalizedAnchor =
        hashAnchor === 'how-it-works' ? 'solutions' : hashAnchor === 'faq' ? 'faqs' : hashAnchor;
      if (
        (path === '/' || path === '') &&
        ['solutions', 'industries', 'faqs', 'contact'].includes(normalizedAnchor)
      ) {
        setActiveTab('home');
        setActiveHomeSection(normalizedAnchor);
        setTimeout(() => {
          const el = document.getElementById(normalizedAnchor);
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 72;
            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          }
        }, 150);
      }
    };
    checkAdminHash();

    // Check for password reset link parameters in URL (e.g. ?mode=reset-password&token=...&email=...)
    const checkResetPasswordParams = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const action = searchParams.get('action');
        const mode = searchParams.get('mode');
        const email = searchParams.get('email') || searchParams.get('to');
        const otp = searchParams.get('token') || searchParams.get('otp') || searchParams.get('code');

        if (action === 'activate-ca' || mode === 'activate-ca' || searchParams.has('activateCa')) {
          const claimToken = searchParams.get('token') || searchParams.get('claimToken') || '';
          if (claimToken) {
            setActivationToken(claimToken);
            setActivationModalOpen(true);
            window.history.replaceState({}, '', window.location.pathname);
            return;
          }
        }

        if (
          mode === 'reset-password' ||
          action === 'reset-password' ||
          searchParams.has('resetPassword') ||
          searchParams.has('resetToken')
        ) {
          setAuthInitialMode('reset-password');
          setAuthPrefill({
            email: email || '',
            otp: otp || '',
          });
          setAuthModalOpen(true);
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (err) {
        console.warn('Error reading URL search params:', err);
      }
    };
    checkResetPasswordParams();

    const handlePopState = () => {
      const path = window.location.pathname;

      if (path === '/user-dashboard' || path === '/dashboard' || path === '/promoter-portal') {
        setActiveTab('user-dashboard');
      } else if (path === '/ca-admin-dashboard' || path === '/ca-admin') {
        setActiveTab('ca-admin-dashboard');
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
        setActiveHomeSection('');
        setActiveTab('how-it-works');
      } else if (path === '/about') {
        setActiveHomeSection('');
        setActiveTab('about');
      } else if (path === '/industries') {
        setActiveHomeSection('');
        setActiveTab('industries');
      } else if (path === '/contact') {
        setActiveHomeSection('');
        setActiveTab('contact');
      } else if (path === '/faq') {
        setActiveHomeSection('');
        setActiveTab('faq');
      } else if (path === '/' || path === '') {
        setActiveTab('home');
        const hashAnchor = window.location.hash.replace('#', '');
        const normalizedHash =
          hashAnchor === 'how-it-works' ? 'solutions' : hashAnchor === 'faq' ? 'faqs' : hashAnchor;
        if (['solutions', 'industries', 'faqs', 'contact'].includes(normalizedHash)) {
          setActiveHomeSection(normalizedHash);
          setTimeout(() => scrollToAnchor(normalizedHash), 80);
        } else {
          setActiveHomeSection('');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Track initial page view
    recordPageView('Home / Greenfield Landing', currentUser?.email);

    // Global keyboard shortcut Ctrl+Shift+S or Cmd+Shift+S to open Admin Panel
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifierActive = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key ? e.key.toLowerCase() : '';
      const code = e.code || '';

      if (isModifierActive && isShift && (key === 's' || code === 'KeyS')) {
        // Prevent browser's default Save action
        e.preventDefault();
        setIsAdminPanelOpen((prev) => !prev);
      }

      // Dedicated keyboard shortcut Ctrl+Shift+C or Cmd+Shift+C to open CA Admin Dashboard
      if (isModifierActive && isShift && (key === 'c' || code === 'KeyC')) {
        e.preventDefault();
        setActiveTab('ca-admin-dashboard');
        window.history.pushState({}, '', '/ca-admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentUser?.email]);

  // Track which home page section is currently in view to highlight active Navbar link
  useEffect(() => {
    if (activeTab !== 'home') return;

    const sectionIds = ['solutions', 'industries', 'faqs', 'contact'] as const;
    const handleScrollSpy = () => {
      const scrollPos = window.scrollY + 130;
      let currentSection = '';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (scrollPos >= top) {
            currentSection = id;
          }
        }
      }
      setActiveHomeSection(currentSection);
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [activeTab]);

  // Track page transitions
  useEffect(() => {
    const tabLabels: Record<string, string> = {
      'home': 'Home / Greenfield Landing',
      'blogs': 'Advisory Blogs & Research Hub',
      'assessment': 'Greenfield Project Assessment',
      'user-dashboard': 'Promoter Project Dashboard',
      'about': 'Why Choose Inisio',
      'industries': 'Sector Directory',
      'contact': 'Contact Advisory',
      'how-it-works': 'How It Works Process',
      'faq': 'Frequently Asked Questions',
    };
    recordPageView(tabLabels[activeTab] || activeTab, currentUser?.email);
  }, [activeTab, currentUser?.email]);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('inisio_active_user', JSON.stringify(user));
    recordUserLogin(user);

    if (activeTab === 'assessment') {
      // Stay on assessment page so user's outputs unlock immediately
      return;
    }

    // Route to the correct dashboard based on the user's role
    const role = user.role;
    let targetTab = 'user-dashboard';
    let targetPath = '/dashboard';

    if (role === 'superadmin' || role === 'admin' || role === 'admin1' || role === 'admin2' || role === 'admin3') {
      targetTab = 'admin-dashboard';
      targetPath = '/admin';
      localStorage.setItem('inisio_active_admin_session', 'true');
    } else if (role === 'ca_admin') {
      targetTab = 'ca-admin-dashboard';
      targetPath = '/ca-admin';
      localStorage.setItem('inisio_ca_admin_session', 'true');
    } else if (role === 'ca') {
      targetTab = 'ca-dashboard';
      targetPath = '/ca-dashboard';
    } else if (role === 'dpr_consultant') {
      targetTab = 'dpr-dashboard';
      targetPath = '/dpr-dashboard';
    } else if (role === 'prosync_admin' || role === 'prosync') {
      targetTab = 'prosync-dashboard';
      targetPath = '/prosync-dashboard';
    }

    setActiveTab(targetTab);
    window.history.pushState({}, '', targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('inisio_active_user');
    localStorage.removeItem('inisio_auth_token');
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAssessment = async (industryName?: string, projectToEdit?: any) => {
    // If editing an existing project, always allow viewing, editing & re-downloading
    if (projectToEdit) {
      setSelectedIndustryForAssessment(industryName || '');
      setEditingProjectForAssessment(projectToEdit);
      setActiveTab('assessment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // For logged-in users starting a NEW assessment, enforce the 1-free-assessment quota (local + authoritative server check)
    if (currentUser?.email) {
      const storedLeads = getStoredLeads(currentUser.email);
      const submittedAssessmentCount = storedLeads.filter(
        (lead) => lead.assessmentCompleted === true || lead.downloadedPDF === true
      ).length;
      const localEligibility = canUserStartAssessment(currentUser, submittedAssessmentCount);

      if (!localEligibility.allowed) {
        setMembershipModalReason(
          localEligibility.reason ||
            "You've already used your 1 free project assessment! You can view, edit, or re-download your existing project from your Dashboard, or upgrade to assess additional projects."
        );
        setMembershipModalOpen(true);
        return;
      }

      const serverQuota = await fetchServerAssessmentQuota({
        user: currentUser,
        email: currentUser.email,
        mobile: currentUser.phone,
        localCompletedCount: submittedAssessmentCount,
      });

      if (!serverQuota.allowed) {
        setMembershipModalReason(
          serverQuota.reason ||
            "You've already used your 1 free project assessment! You can view, edit, or re-download your existing project from your Dashboard, or upgrade to assess additional projects."
        );
        setMembershipModalOpen(true);
        return;
      }
    }

    setSelectedIndustryForAssessment(industryName || '');
    setEditingProjectForAssessment(null);
    setActiveTab('assessment');
    window.history.pushState({}, '', '/assessment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToAnchor = (anchorId: string) => {
    const el = document.getElementById(anchorId);
    if (el) {
      const stickyOffset = 72;
      const targetTop = Math.max(0, el.getBoundingClientRect().top + window.scrollY - stickyOffset);
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  };

  const HOME_ANCHOR_MAP: Record<string, string> = {
    solutions: 'solutions',
    'home-industries': 'industries',
    faqs: 'faqs',
    'home-contact': 'contact',
  };

  const handleSelectTab = (tab: string, blogSlug?: string) => {
    if (tab === 'assessment') {
      handleOpenAssessment();
      return;
    }

    // Single-page smooth-scroll navigation for Home page sections
    const anchorTarget = HOME_ANCHOR_MAP[tab];
    if (anchorTarget) {
      setEditingProjectForAssessment(null);
      setActiveBlogSlug('');
      setActiveBlogData(null);
      setActiveHomeSection(anchorTarget);
      window.history.pushState({}, '', `/#${anchorTarget}`);
      if (activeTab !== 'home') {
        setActiveTab('home');
        requestAnimationFrame(() => {
          setTimeout(() => scrollToAnchor(anchorTarget), 90);
        });
      } else {
        scrollToAnchor(anchorTarget);
      }
      return;
    }

    if (tab === 'home') {
      setActiveBlogSlug('');
      setActiveBlogData(null);
      setEditingProjectForAssessment(null);
      setActiveHomeSection('');
      if (activeTab !== 'home') {
        setActiveTab('home');
      }
      window.history.pushState({}, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setEditingProjectForAssessment(null);
    setActiveHomeSection('');
    setActiveTab(tab);

    if (tab === 'blogs') {
      if (blogSlug) {
        setActiveBlogSlug(blogSlug);
        window.history.pushState({}, '', `/blogs/${blogSlug}`);
      } else {
        setActiveBlogSlug('');
        setActiveBlogData(null);
        window.history.pushState({}, '', '/blogs');
      }
    } else {
      setActiveBlogSlug('');
      setActiveBlogData(null);
      window.history.pushState({}, '', `/${tab}`);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectIndustryFromNav = (industryName: string) => {
    setSelectedIndustryForAssessment(industryName);
    handleSelectTab('industries');
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
      case 'ca-admin-dashboard':
        return role === 'ca_admin' || isAdmin;
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

  // Open dashboard and assessment views in full-screen workspace mode with no site header or footer.
  // Public pages (home, industries, solutions, blogs, contact, etc.) always show Navbar, Footer, and normal page scroll.
  const isDashboardView =
    activeTab === 'user-dashboard' ||
    activeTab === 'ca-dashboard' ||
    activeTab === 'dpr-dashboard' ||
    activeTab === 'prosync-dashboard' ||
    activeTab === 'ca-admin-dashboard' ||
    activeTab === 'admin-dashboard' ||
    activeTab === 'assessment';

  const isFullScreenMode = isDashboardView;

  return (
    <div className={`min-h-screen w-full bg-white text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-800 flex flex-col ${isFullScreenMode ? 'h-screen overflow-hidden' : 'justify-between overflow-x-clip'}`}>
      {/* Dynamic SEO Meta, Titles & Structured Data */}
      <SEOHead activeTab={activeTab} activeBlogSlug={activeBlogSlug} activeBlog={activeBlogData} />

      <div className={`w-full min-w-0 ${isFullScreenMode ? 'h-full flex flex-col' : ''}`}>
        {/* Navbar (Hidden in full-screen dashboard/assessment mode) */}
        {!isFullScreenMode && (
          <Navbar
            activeTab={activeTab}
            activeSection={activeHomeSection}
            onSelectTab={handleSelectTab}
            onOpenAssessment={() => handleOpenAssessment()}
            onOpenConsultation={() => setConsultationModalOpen(true)}
            selectedIndustryName={selectedIndustryForAssessment}
            onSelectIndustry={handleSelectIndustryFromNav}
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
          />
        )}

        {/* View Switcher */}
        <main className={isFullScreenMode ? "w-full h-full overflow-y-auto p-0 m-0" : "transition-all duration-300 pt-16"}>
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
                <Suspense fallback={<div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>}>
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
                    onNavigateToAbout={() => handleSelectTab('about')}
                    onNavigateToContact={() => handleSelectTab('contact')}
                  />
                </Suspense>
              </div>

              {/* Industries & Sectors Anchor Section */}
              <div id="industries" className="scroll-mt-20">
                <Suspense fallback={<div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>}>
                  <IndustriesSection
                    onSelectIndustryForAssessment={(indName) => handleOpenAssessment(indName)}
                    onOpenAssessment={() => handleOpenAssessment()}
                    onOpenConsultation={() => setConsultationModalOpen(true)}
                    selectedIndustryName={selectedIndustryForAssessment}
                  />
                </Suspense>
              </div>

              <Suspense fallback={<div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>}>
                <Testimonials />
              </Suspense>

              {/* FAQs & Insights / Blogs Anchor Section */}
              <div id="faqs" className="scroll-mt-20">
                <Suspense fallback={<div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>}>
                  <FAQSection onOpenConsultation={() => setConsultationModalOpen(true)} />
                  <LatestBlogs
                    onOpenAssessment={() => handleOpenAssessment()}
                    onOpenConsultation={() => setConsultationModalOpen(true)}
                    onNavigateToBlogs={(slug) => handleSelectTab('blogs', slug)}
                  />
                </Suspense>
              </div>

              {/* Contact Us Anchor Section */}
              <div id="contact" className="scroll-mt-20">
                <Suspense fallback={<div className="py-16 flex justify-center"><LoadingSpinner size="lg" /></div>}>
                  <ContactSection />
                </Suspense>
              </div>

              {/* Final Conversion CTA */}
              <Suspense fallback={<div className="py-12 flex justify-center"><LoadingSpinner size="lg" /></div>}>
                <FinalCTA
                  onOpenAssessment={() => handleOpenAssessment()}
                  onOpenConsultation={() => setConsultationModalOpen(true)}
                />
              </Suspense>
            </div>
          )}

          {/* User / Promoter Dashboard (Only for role="user" or authorized admins) */}
          {activeTab === 'user-dashboard' && (
            !currentUser ? (
              <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-black text-slate-900 font-manrope">Sign In to Promoter Portal</h1>
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
            ) : (
              <Suspense fallback={<DashboardSkeleton />}>
                <div className="animate-in fade-in duration-300 h-full">
                  <UserDashboard
                    user={currentUser}
                    onOpenAssessment={(projectToEdit) => handleOpenAssessment('', projectToEdit)}
                    onOpenConsultation={() => setConsultationModalOpen(true)}
                    onOpenMembership={() => {
                      setMembershipModalReason('');
                      setMembershipModalOpen(true);
                    }}
                    onLogout={handleLogout}
                    onNavigateHome={() => handleSelectTab('home')}
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
                <div className="animate-in fade-in duration-300 h-full">
                  <CADashboard
                    user={currentUser}
                    onLogout={handleLogout}
                    onNavigateHome={() => handleSelectTab('home')}
                  />
                </div>
              </Suspense>
            )
          )}

          {/* CA Admin Operations Dashboard (Completely separate panel with dedicated CA_ADMIN login check) */}
          {activeTab === 'ca-admin-dashboard' && (
            <Suspense fallback={<DashboardSkeleton />}>
              <div className="animate-in fade-in duration-300 h-full">
                <CAAdminDashboard
                  user={currentUser}
                  onLogout={handleLogout}
                  onNavigateHome={() => handleSelectTab('home')}
                />
              </div>
            </Suspense>
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
                <div className="animate-in fade-in duration-300 h-full">
                  <DPRConsultantDashboard
                    user={currentUser}
                    onLogout={handleLogout}
                    onNavigateHome={() => handleSelectTab('home')}
                  />
                </div>
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
                <div className="animate-in fade-in duration-300 h-full">
                  <AdminDashboardView
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onNavigateHome={() => handleSelectTab('home')}
                  />
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
                <div className="animate-in fade-in duration-300 h-full">
                  <ProsyncDashboard
                    user={currentUser}
                    onLogout={handleLogout}
                    onNavigateHome={() => handleSelectTab('home')}
                  />
                </div>
              </Suspense>
            )
          )}

          {activeTab === 'assessment' && (
            <Suspense fallback={<DashboardSkeleton />}>
              <div className="animate-in fade-in duration-300 h-full w-full">
                <ProjectAssessmentPage
                  currentUser={currentUser}
                  onOpenAuth={handleOpenAuth}
                  onLoginSuccess={handleLoginSuccess}
                  onOpenConsultation={() => setConsultationModalOpen(true)}
                  onOpenMembership={(reason) => {
                    setMembershipModalReason(reason || '');
                    setMembershipModalOpen(true);
                  }}
                  onNavigateHome={() => handleSelectTab('home')}
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
            <Suspense fallback={<DashboardSkeleton />}>
              <div className="animate-in fade-in duration-300">
                <HowItWorks
                  isStandalone
                  onOpenConsultation={() => setConsultationModalOpen(true)}
                  onOpenAssessment={() => handleOpenAssessment()}
                  onNavigateToContact={() => handleSelectTab('contact')}
                  onNavigateToPage={(tab) => handleSelectTab(tab)}
                />
              </div>
            </Suspense>
          )}

          {activeTab === 'about' && (
            <Suspense fallback={<DashboardSkeleton />}>
              <div className="animate-in fade-in duration-300">
                <WhyChooseInisio
                  isStandalone
                  onOpenAssessment={() => handleOpenAssessment()}
                  onOpenConsultation={() => setConsultationModalOpen(true)}
                  onNavigateToPage={(tab) => handleSelectTab(tab)}
                />
              </div>
            </Suspense>
          )}

          {activeTab === 'industries' && (
            <Suspense fallback={<DashboardSkeleton />}>
              <div className="animate-in fade-in duration-300">
                <IndustriesSection
                  isStandalone
                  onSelectIndustryForAssessment={(indName) => handleOpenAssessment(indName)}
                  onOpenAssessment={() => handleOpenAssessment()}
                  onOpenConsultation={() => setConsultationModalOpen(true)}
                  selectedIndustryName={selectedIndustryForAssessment}
                  onNavigateToPage={(tab) => handleSelectTab(tab)}
                />
              </div>
            </Suspense>
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
                    setActiveBlogData(null);
                    window.history.pushState({}, '', '/blogs');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onBlogLoaded={(blog) => setActiveBlogData(blog)}
                  onNavigateToPage={(tab) => handleSelectTab(tab)}
                  onNavigateHome={() => handleSelectTab('home')}
                />
              </div>
            </Suspense>
          )}

          {activeTab === 'contact' && (
            <Suspense fallback={<DashboardSkeleton />}>
              <div className="animate-in fade-in duration-300">
                <ContactSection
                  isStandalone
                  onNavigateToPage={(tab) => handleSelectTab(tab)}
                />
              </div>
            </Suspense>
          )}

          {activeTab === 'faq' && (
            <Suspense fallback={<DashboardSkeleton />}>
              <div className="animate-in fade-in duration-300">
                <FAQSection
                  isStandalone
                  onOpenConsultation={() => setConsultationModalOpen(true)}
                  onNavigateToPage={(tab) => handleSelectTab(tab)}
                />
              </div>
            </Suspense>
          )}
        </main>
      </div>

      {!isFullScreenMode && (
        <div>
          {/* Footer (Hidden in full-screen mode when logged in or viewing dashboards) */}
          <Footer
            onSelectTab={handleSelectTab}
            onOpenAssessment={() => handleOpenAssessment()}
            onOpenConsultation={() => setConsultationModalOpen(true)}
          />
        </div>
      )}

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

      {/* CA Profile Claim Activation Modal */}
      {activationModalOpen && (
        <Suspense fallback={null}>
          <CaActivationModal
            token={activationToken}
            isOpen={activationModalOpen}
            onClose={() => setActivationModalOpen(false)}
            onActivationSuccess={(activatedUser) => {
              handleLoginSuccess(activatedUser);
              setActiveTab('ca-dashboard');
            }}
          />
        </Suspense>
      )}

      {/* Admin Panel (Opened via Ctrl+Shift+S or /admin) */}
      {isAdminPanelOpen && (
        <Suspense fallback={null}>
          <AdminPanel
            isOpen={isAdminPanelOpen}
            onClose={() => {
              setIsAdminPanelOpen(false);
              if (window.location.pathname === '/admin' || window.location.pathname === '/admin-panel') {
                window.history.pushState({}, '', '/');
              }
            }}
          />
        </Suspense>
      )}

      {/* Floating Call & WhatsApp Buttons */}
      {!isFullScreenMode && <FloatingContactButtons />}
    </div>
  );
}

import { useState, useEffect, lazy, Suspense } from 'react';
import TopNavBar from './components/layout/TopNavBar';
import SideNavBar from './components/layout/SideNavBar';
import Footer from './components/layout/Footer';
import { useAuth } from './context/AuthContext';
import { tokenManager } from './utils/tokenManager';

// Lazy-loaded page components for better initial load time
const Login = lazy(() => import('./pages/Login'));
const MenteeOnboarding = lazy(() => import('./pages/MenteeOnboarding'));
const MentorRegistration = lazy(() => import('./pages/MentorRegistration'));
const MenteeRegistration = lazy(() => import('./pages/MenteeRegistration'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const MenteeDashboard = lazy(() => import('./pages/MenteeDashboard'));
const MentorDashboard = lazy(() => import('./pages/MentorDashboard'));
const MentorDiscovery = lazy(() => import('./pages/MentorDiscovery'));
const MentorProfile = lazy(() => import('./pages/MentorProfile'));
const Booking = lazy(() => import('./pages/Booking'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));
const VideoInterview = lazy(() => import('./pages/VideoInterview'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const OTPVerification = lazy(() => import('./pages/OTPVerification'));
const WaitingForApproval = lazy(() => import('./pages/WaitingForApproval'));
const AIChatWidget = lazy(() => import('./components/AIChatWidget'));
const ChatbotFab = lazy(() => import('./components/ChatbotFab'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-3">
      <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
      <p className="text-sm text-on-surface-variant">Loading...</p>
    </div>
  </div>
);



// Protected route helper — returns true if user can access the page
const canAccessPage = (page, user) => {
  const publicPages = ['home', 'landing', 'login', 'mentorRegistration', 'menteeRegistration',
    'how-it-works', 'terms', 'privacy', 'cookies', 'cookie-policy', 'find-mentors', 'mentorProfile', 'booking'];
  if (publicPages.includes(page)) return true;

  // Verify-OTP and onboarding should be accessible for users in progress
  if (page === 'verify-otp' || page === 'onboarding') return true;

  // Not authenticated — only public pages allowed
  if (!user) return false;

  // Authenticated users can access these
  const authedPages = ['settings', 'analytics', 'sessions', 'video-interview', 'waiting-approval'];
  if (authedPages.includes(page)) return true;

  // Role-specific dashboards
  if (page === 'admindashboard' || page === 'admin') return user.role === 'admin';
  if (page === 'mentor-dashboard') return user.role === 'mentor' && user.status === 'approved';
  if (page === 'mentee-dashboard') return user.role === 'mentee';
  if (page === 'dashboard') return !!user;

  return true;
};

const getRouteForUser = (user) => {
  if (user?.role === 'mentor') {
    if (user?.status === 'pending') return 'waiting-approval';
    return 'mentor-dashboard';
  }
  if (user?.role === 'admin') return 'admindashboard';
  if (user?.role === 'mentee') {
    if (!user.isProfileComplete) return 'onboarding';
    return 'mentee-dashboard';
  }
  return 'home';
};

// URL mapping
const routeToPath = {
  'home': '/',
  'landing': '/',
  'login': '/login',
  'signup': '/signup',
  'mentorRegistration': '/register/mentor',
  'menteeRegistration': '/register/mentee',
  'verify-otp': '/verify-otp',
  'onboarding': '/onboarding',
  'dashboard': '/dashboard',
  'dashboard/profile': '/dashboard/profile',
  'dashboard/settings': '/dashboard/settings',
  'dashboard/sessions': '/dashboard/sessions',
  'dashboard/bookings': '/dashboard/bookings',
  'mentor-dashboard': '/mentor/dashboard',
  'mentee-dashboard': '/mentee/dashboard',
  'admindashboard': '/admin',
  'admin': '/admin',
  'admin/users': '/admin/users',
  'admin/mentors': '/admin/mentors',
  'admin/verification': '/admin/verification',
  'find-mentors': '/find-mentors',
  'settings': '/settings',
  'analytics': '/analytics',
  'sessions': '/sessions',
  'how-it-works': '/how-it-works',
  'terms': '/terms',
  'privacy': '/privacy',
  'cookies': '/cookies',
  'cookie-policy': '/cookies',
  'waiting-approval': '/waiting-approval',
  'forgot-password': '/forgot-password',
};

const pathToRoute = {
  '/': 'home',
  '/login': 'login',
  '/signup': 'signup',
  '/register/mentor': 'mentorRegistration',
  '/register/mentee': 'menteeRegistration',
  '/verify-otp': 'verify-otp',
  '/onboarding': 'onboarding',
  '/dashboard': 'dashboard',
  '/dashboard/profile': 'dashboard',
  '/dashboard/settings': 'settings',
  '/dashboard/sessions': 'sessions',
  '/dashboard/bookings': 'sessions',
  '/mentor/dashboard': 'mentor-dashboard',
  '/mentee/dashboard': 'mentee-dashboard',
  '/admin': 'admindashboard',
  '/admin/users': 'admindashboard',
  '/admin/mentors': 'admindashboard',
  '/admin/verification': 'admindashboard',
  '/find-mentors': 'find-mentors',
  '/settings': 'settings',
  '/analytics': 'analytics',
  '/sessions': 'sessions',
  '/how-it-works': 'how-it-works',
  '/terms': 'terms',
  '/privacy': 'privacy',
  '/cookies': 'cookies',
  '/waiting-approval': 'waiting-approval',
  '/forgot-password': 'login',
};

function App() {
  const { user, loading, login, logout } = useAuth();
  const [currentRoute, setCurrentRoute] = useState(() => {
    // Parse initial URL
    const path = window.location.pathname;
    const route = pathToRoute[path];
    const params = {};
    
    // Handle parameterized routes
    if (path.startsWith('/mentor/') && path.split('/').length === 3) {
      return { page: 'mentorProfile', params: { mentorId: path.split('/')[2] } };
    }
    if (path.startsWith('/book/') && path.split('/').length === 3) {
      return { page: 'booking', params: { mentorId: path.split('/')[2] } };
    }
    if (path.startsWith('/video-interview/') && path.split('/').length === 3) {
      return { page: 'video-interview', params: { sessionId: path.split('/')[2] } };
    }
    
    return { page: route || 'home', params };
  });
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('prolign-theme') || 'light');

  // Handle Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const role = params.get('role');
    const isProfileComplete = params.get('isProfileComplete');
    if (token && role) {
      tokenManager.setAccessToken(token);
      const userData = { role, isEmailVerified: true, isProfileComplete: isProfileComplete === 'true' };
      login(userData, token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [login]);

  // Popstate listener for back/forward navigation
  useEffect(() => {
    const handlePopState = (event) => {
      const path = window.location.pathname;
      const route = pathToRoute[path];
      
      if (path.startsWith('/mentor/') && path.split('/').length === 3) {
        setCurrentRoute({ page: 'mentorProfile', params: { mentorId: path.split('/')[2] } });
        return;
      }
      if (path.startsWith('/book/') && path.split('/').length === 3) {
        setCurrentRoute({ page: 'booking', params: { mentorId: path.split('/')[2] } });
        return;
      }
      if (path.startsWith('/video-interview/') && path.split('/').length === 3) {
        setCurrentRoute({ page: 'video-interview', params: { sessionId: path.split('/')[2] } });
        return;
      }
      
      setCurrentRoute({ page: route || 'home', params: null });
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route protection + initial redirect after auth
  useEffect(() => {
    if (loading) return;

    const page = currentRoute.page;

    // Never redirect away from these pages
    const neverRedirect = ['verify-otp', 'home', 'landing', 'waiting-approval'];
    if (neverRedirect.includes(page)) return;

    // If user is logged in, redirect to their appropriate dashboard on initial load
    // but only if they're on a public page or login
    if (user) {
      const publicOrLogin = ['login', 'signup', 'mentorRegistration', 'menteeRegistration', 'onboarding'];
      if (publicOrLogin.includes(page)) {
        const target = getRouteForUser(user);
        navigateTo(target);
        return;
      }
    }

    // Route protection — redirect to home if user can't access
    if (!canAccessPage(page, user)) {
      navigateTo(user ? 'dashboard' : 'home');
    }
  }, [user, loading, currentRoute.page]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('prolign-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const navigateTo = (page, params = null) => {
    setCurrentRoute({ page, params });
    window.scrollTo(0, 0);
    
    // Update browser URL
    if (page === 'mentorProfile' && params?.mentorId) {
      window.history.pushState({}, '', `/mentor/${params.mentorId}`);
    } else if (page === 'booking' && params?.mentorId) {
      window.history.pushState({}, '', `/book/${params.mentorId}`);
    } else if (page === 'video-interview' && params?.sessionId) {
      window.history.pushState({}, '', `/video-interview/${params.sessionId}`);
    } else {
      const path = routeToPath[page] || '/';
      window.history.pushState({}, '', path);
    }
  };

  const renderPage = () => {
    const page = currentRoute.page;
    const pageContent = (() => {
      switch (page) {
        case 'signup':
          return <Login navigateTo={navigateTo} initialView="signup" />;
        case 'forgot-password':
          return <Login navigateTo={navigateTo} initialView="forgot-password" />;
        case 'login':
          return <Login navigateTo={navigateTo} />;
        case 'mentorRegistration':
          return <MentorRegistration navigateTo={navigateTo} />;
        case 'menteeRegistration':
          return <MenteeRegistration navigateTo={navigateTo} />;
        case 'verify-otp':
          return <OTPVerification navigateTo={navigateTo} params={currentRoute.params} />;
        case 'onboarding':
          return <MenteeOnboarding navigateTo={navigateTo} />;
        case 'home':
        case 'landing':
          return <LandingPage navigateTo={navigateTo} />;
        case 'waiting-approval':
          return <WaitingForApproval navigateTo={navigateTo} />;
        case 'dashboard':
        case 'dashboard/profile': {
          if (user?.role === 'admin') return <AdminDashboard navigateTo={navigateTo} />;
          if (user?.role === 'mentor') return <MentorDashboard navigateTo={navigateTo} />;
          return <MenteeDashboard navigateTo={navigateTo} initialView="dashboard" />;
        }
        case 'mentor-dashboard':
          return <MentorDashboard navigateTo={navigateTo} />;
        case 'mentee-dashboard':
          return <MenteeDashboard navigateTo={navigateTo} initialView="dashboard" />;
        case 'admindashboard':
        case 'admin':
        case 'admin/users':
        case 'admin/mentors':
        case 'admin/verification':
          return <AdminDashboard navigateTo={navigateTo} />;
        case 'find-mentors':
          return <MentorDiscovery navigateTo={navigateTo} />;
        case 'mentorProfile':
          return <MentorProfile navigateTo={navigateTo} params={currentRoute.params} />;
        case 'booking':
          return <Booking navigateTo={navigateTo} params={currentRoute.params} />;
        case 'settings':
        case 'dashboard/settings':
          return user?.role === 'mentee'
            ? <MenteeDashboard navigateTo={navigateTo} initialView="settings" />
            : <Settings navigateTo={navigateTo} />;
        case 'analytics':
          return user?.role === 'mentee'
            ? <MenteeDashboard navigateTo={navigateTo} initialView="analytics" />
            : <Analytics navigateTo={navigateTo} />;
        case 'sessions':
        case 'dashboard/sessions':
        case 'dashboard/bookings':
          return user?.role === 'mentee'
            ? <MenteeDashboard navigateTo={navigateTo} initialView="sessions" />
            : <MentorDashboard navigateTo={navigateTo} />;
        case 'video-interview':
          return <VideoInterview onNavigate={navigateTo} sessionId={currentRoute.params?.sessionId} />;
        case 'how-it-works':
          return <HowItWorks navigateTo={navigateTo} onHelpClick={() => setIsChatbotOpen(true)} />;
        case 'terms':
          return <TermsOfService navigateTo={navigateTo} />;
        case 'privacy':
          return <PrivacyPolicy navigateTo={navigateTo} />;
        case 'cookies':
        case 'cookie-policy':
          return <CookiePolicy navigateTo={navigateTo} />;
        default:
          return <LandingPage navigateTo={navigateTo} />;
      }
    })();
    return <Suspense fallback={<PageLoader />}>{pageContent}</Suspense>;
  };

  const hideNavPages = [
    'login', 'signup', 'forgot-password', 'onboarding', 'mentorRegistration', 'menteeRegistration',
    'admindashboard', 'admin', 'admin/users', 'admin/mentors', 'admin/verification',
    'video-interview', 'booking', 'verify-otp',
    'mentor-dashboard', 'mentee-dashboard', 'dashboard', 'dashboard/profile',
    'waiting-approval'
  ];
  const hideNavigation = hideNavPages.includes(currentRoute.page) ||
    (user?.role === 'mentee' && ['sessions', 'settings', 'analytics', 'dashboard/sessions', 'dashboard/settings', 'dashboard/bookings'].includes(currentRoute.page));

  const showSidebar = false;

  const fullWidthPages = ['home', 'landing', 'how-it-works',
    'terms', 'privacy', 'cookies', 'cookie-policy', 'find-mentors', 'mentorProfile', 'booking'];
  const isFullWidthPage = fullWidthPages.includes(currentRoute.page);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
          <p className="text-on-surface-variant font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background font-body-md">
      {!hideNavigation && (
        <TopNavBar
          navigateTo={navigateTo}
          currentPage={currentRoute.page}
          theme={theme}
          toggleTheme={toggleTheme}
          user={user}
          logout={logout}
        />
      )}

      <div className="flex flex-1 w-full relative">
        {showSidebar && (
          <SideNavBar
            navigateTo={navigateTo}
            currentPage={currentRoute.page}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}

        <main className={`flex-1 w-full ${
          !hideNavigation && !isFullWidthPage ? 'p-4 md:p-8 max-w-7xl mx-auto' : ''
        }`}>
          {renderPage()}
        </main>
      </div>

      {!hideNavigation && <Footer navigateTo={navigateTo} />}

      {!['video-interview', 'login', 'signup', 'forgot-password', 'menteeRegistration', 'mentorRegistration', 'onboarding'].includes(currentRoute.page) && (
        <ChatbotFab isOpen={isChatbotOpen} onOpen={() => setIsChatbotOpen(true)} />
      )}

      {!['video-interview', 'login', 'signup', 'forgot-password', 'menteeRegistration', 'mentorRegistration', 'onboarding'].includes(currentRoute.page) && (
        <AIChatWidget isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
      )}
    </div>
  );
}

export default App;

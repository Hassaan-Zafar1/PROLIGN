import { useState, useEffect } from 'react';
import TopNavBar from './components/layout/TopNavBar';
import SideNavBar from './components/layout/SideNavBar';
import Footer from './components/layout/Footer';
import Login from './pages/Login';
import MenteeOnboarding from './pages/MenteeOnboarding';
import MentorRegistration from './pages/MentorRegistration';
import MenteeRegistration from './pages/MenteeRegistration';
import LandingPage from './pages/LandingPage';
import MenteeDashboard from './pages/MenteeDashboard';
import MentorDashboard from './pages/MentorDashboard';
import MentorDiscovery from './pages/MentorDiscovery';
import MentorProfile from './pages/MentorProfile';
import Booking from './pages/Booking';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import VideoInterview from './pages/VideoInterview';
import HowItWorks from './pages/HowItWorks';
import HelpCenter from './pages/HelpCenter';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Chatbot from './pages/Chatbot';
import OTPVerification from './pages/OTPVerification';
import AIChatWidget from './components/AIChatWidget';
import { useAuth } from './context/AuthContext';
import { tokenManager } from './utils/tokenManager';

const getRouteForUser = (user) => {
  if (user?.role === 'mentor') return 'mentor-dashboard';
  if (user?.role === 'admin') return 'admindashboard';
  if (user?.role === 'mentee') return 'mentee-dashboard';
  return 'home';
};

function App() {
  const { user, loading, login } = useAuth();
  const [currentRoute, setCurrentRoute] = useState({ page: 'home', params: null });
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Redirect based on auth state — but never override verify-otp page
  useEffect(() => {
    if (!loading) {
      // ✅ Don't override if we're on the OTP page
      if (currentRoute.page === 'verify-otp') return;

      if (user) {
        setCurrentRoute({ page: getRouteForUser(user), params: null });
      }
    }
  }, [user, loading]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('prolign-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const navigateTo = (page, params = null) => {
    setCurrentRoute({ page, params });
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentRoute.page) {
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
        return <LandingPage navigateTo={navigateTo} />;
      case 'landing':
        return <LandingPage navigateTo={navigateTo} />;
      case 'dashboard': {
        if (user?.role === 'admin') return <AdminDashboard navigateTo={navigateTo} />;
        if (user?.role === 'mentor') return <MentorDashboard navigateTo={navigateTo} />;
        return <MenteeDashboard navigateTo={navigateTo} initialView="dashboard" />;
      }
      case 'mentor-dashboard':
        return <MentorDashboard navigateTo={navigateTo} />;
      case 'mentee-dashboard':
        return <MenteeDashboard navigateTo={navigateTo} initialView="dashboard" />;
      case 'admindashboard':
        return <AdminDashboard navigateTo={navigateTo} />;
      case 'admin':
        return <AdminDashboard navigateTo={navigateTo} />;
      case 'discovery':
        return <MentorDiscovery navigateTo={navigateTo} />;
      case 'mentorProfile':
        return <MentorProfile navigateTo={navigateTo} params={currentRoute.params} />;
      case 'booking':
        return <Booking navigateTo={navigateTo} params={currentRoute.params} />;
      case 'settings':
        return user?.role === 'mentee'
          ? <MenteeDashboard navigateTo={navigateTo} initialView="settings" />
          : <Settings navigateTo={navigateTo} />;
      case 'analytics':
        return user?.role === 'mentee'
          ? <MenteeDashboard navigateTo={navigateTo} initialView="analytics" />
          : <Analytics navigateTo={navigateTo} />;
      case 'sessions':
        return user?.role === 'mentee'
          ? <MenteeDashboard navigateTo={navigateTo} initialView="sessions" />
          : <MentorDashboard navigateTo={navigateTo} />;
      case 'video-interview':
        return <VideoInterview onNavigate={navigateTo} sessionId={currentRoute.params?.sessionId} />;
      case 'how-it-works':
        return <HowItWorks navigateTo={navigateTo} />;
      case 'help-center':
      case 'helpcenter':
      case 'contact':
      case 'community':
        return <HelpCenter navigateTo={navigateTo} />;
      case 'terms':
        return <TermsOfService navigateTo={navigateTo} />;
      case 'privacy':
        return <PrivacyPolicy navigateTo={navigateTo} />;
      case 'cookies':
      case 'cookie-policy':
        return <CookiePolicy navigateTo={navigateTo} />;
      case 'chatbot':
        return <Chatbot navigateTo={navigateTo} />;
      default:
        return <LandingPage navigateTo={navigateTo} />;
    }
  };

  const hideNavPages = [
    'login', 'onboarding', 'mentorRegistration', 'menteeRegistration',
    'admindashboard', 'video-interview', 'booking', 'verify-otp',
    'mentor-dashboard', 'mentee-dashboard', 'dashboard'
  ];
  const hideNavigation = hideNavPages.includes(currentRoute.page) ||
    (user?.role === 'mentee' && ['sessions', 'settings', 'analytics'].includes(currentRoute.page));

  const noSidebarPages = ['mentorProfile'];
  const showSidebar = !hideNavigation && !!user && !noSidebarPages.includes(currentRoute.page);

  const fullWidthPages = ['home', 'landing', 'how-it-works', 'help-center', 'helpcenter',
    'terms', 'privacy', 'cookies', 'cookie-policy', 'community', 'discovery', 'mentorProfile', 'booking'];
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
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      <div className="flex flex-1 w-full relative">
        {showSidebar && (
          <SideNavBar
            navigateTo={navigateTo}
            currentPage={currentRoute.page}
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
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

      {currentRoute.page !== 'video-interview' && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-8 right-8 z-[60] flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-xl transition-all hover:scale-105 hover:shadow-2xl active:scale-95 group"
          title="Chat with ProLign AI"
        >
          <span className="absolute inset-0 rounded-full bg-secondary/30 animate-ping"></span>
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-error text-[10px] font-bold text-on-error">AI</span>
          <img
            src="/chatbot-icon.svg"
            alt="ProLign AI"
            className="relative h-12 w-12 rounded-full object-cover transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-6"
          />
        </button>
      )}

      <AIChatWidget isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </div>
  );
}

export default App;
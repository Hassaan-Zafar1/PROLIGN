import { useState, useEffect } from 'react';
import TopNavBar from './components/layout/TopNavBar';
import SideNavBar from './components/layout/SideNavBar';
import Footer from './components/layout/Footer';
import Login from './pages/Login';
import MenteeOnboarding from './pages/MenteeOnboarding';
import MentorRegistration from './pages/MentorRegistration';
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
import Pricing from './pages/Pricing';
import Resources from './pages/Resources';
import HelpCenter from './pages/HelpCenter';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Chatbot from './pages/Chatbot';
import AIChatWidget from './components/AIChatWidget';
import { initDB, getCurrentUser } from './utils/db';

const getRouteForUser = (user) => {
  if (user?.role === 'mentor') return 'dashboard';
  if (user?.role === 'admin') return 'admindashboard';
  if (user?.role === 'mentee') return 'dashboard';
  return 'home';
};

function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    initDB();
    const user = getCurrentUser();
    return { page: user ? getRouteForUser(user) : 'home', params: null };
  });
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('mentorbridge-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mentorbridge-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const navigateTo = (page, params = null) => {
    setCurrentRoute({ page, params });
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
    window.scrollTo(0, 0);
  };

  // Render current page based on state
  const renderPage = () => {
    switch (currentRoute.page) {
      case 'login':
        return <Login navigateTo={navigateTo} />;
      case 'mentorRegistration':
        return <MentorRegistration navigateTo={navigateTo} />;
      case 'onboarding':
        return <MenteeOnboarding navigateTo={navigateTo} />;
      case 'home':
        return <LandingPage navigateTo={navigateTo} />;
      case 'landing':
        return <LandingPage navigateTo={navigateTo} />;
      case 'dashboard': {
        const currentUser = getCurrentUser();
        if (currentUser?.role === 'admin') {
          return <AdminDashboard navigateTo={navigateTo} />;
        }
        if (currentUser?.role === 'mentor') {
          return <MentorDashboard navigateTo={navigateTo} />;
        }
        return <MenteeDashboard navigateTo={navigateTo} initialView="dashboard" />;
      }
      case 'discovery':
        return <MentorDiscovery navigateTo={navigateTo} />;
      case 'admindashboard':
        return <AdminDashboard navigateTo={navigateTo} />;
      case 'admin':
        return <AdminDashboard navigateTo={navigateTo} />;
      case 'mentor-dashboard':
        return <MentorDashboard navigateTo={navigateTo} />;
      case 'mentee-dashboard':
        return <MenteeDashboard navigateTo={navigateTo} initialView="dashboard" />;
      case 'mentorProfile':
        return <MentorProfile navigateTo={navigateTo} params={currentRoute.params} />;
      case 'booking':
        return <Booking navigateTo={navigateTo} params={currentRoute.params} />;
      case 'settings':
        return getCurrentUser()?.role === 'mentee'
          ? <MenteeDashboard navigateTo={navigateTo} initialView="settings" />
          : <Settings navigateTo={navigateTo} />;
      case 'analytics':
        return getCurrentUser()?.role === 'mentee'
          ? <MenteeDashboard navigateTo={navigateTo} initialView="analytics" />
          : <Analytics navigateTo={navigateTo} />;
      case 'sessions': {
        const currentUser = getCurrentUser();
        if (currentUser?.role === 'mentee') {
          return <MenteeDashboard navigateTo={navigateTo} initialView="sessions" />;
        }
        return <MentorDashboard navigateTo={navigateTo} />;
      }
      case 'video-interview':
        return <VideoInterview onNavigate={navigateTo} sessionId={currentRoute.params?.sessionId} />;
      case 'how-it-works':
        return <HowItWorks navigateTo={navigateTo} />;
      case 'pricing':
        return <Pricing navigateTo={navigateTo} />;
      case 'resources':
        return <Resources navigateTo={navigateTo} />;
      case 'help-center':
        return <HelpCenter navigateTo={navigateTo} />;
      case 'helpcenter':
        return <HelpCenter navigateTo={navigateTo} />;
      case 'contact':
        return <HelpCenter navigateTo={navigateTo} />;
      case 'terms':
        return <TermsOfService navigateTo={navigateTo} />;
      case 'privacy':
        return <PrivacyPolicy navigateTo={navigateTo} />;
      case 'cookies':
        return <CookiePolicy navigateTo={navigateTo} />;
      case 'cookie-policy':
        return <CookiePolicy navigateTo={navigateTo} />;
      case 'chatbot':
        return <Chatbot navigateTo={navigateTo} />;
      case 'community':
        return <Resources navigateTo={navigateTo} />;
      default:
        return <LandingPage navigateTo={navigateTo} />;
    }
  };

  const user = getCurrentUser();
  const menteeDashboardPages = ['dashboard', 'sessions', 'settings', 'analytics', 'mentee-dashboard'];
  const hideNavigation = ['login', 'onboarding', 'mentorRegistration', 'admindashboard', 'video-interview', 'booking'].includes(currentRoute.page) ||
                         currentRoute.page === 'dashboard' ||
                         (user?.role === 'mentee' && menteeDashboardPages.includes(currentRoute.page));

  // Pages where sidebar is shown (logged-in state with non-full-screen pages)
  const showSidebar = !hideNavigation && !!user;

  // Pages that manage their own full-width layout (no padding)
  const fullWidthPages = ['home', 'how-it-works', 'pricing', 'resources', 'help-center', 'terms', 'privacy', 'cookies', 'community', 'discovery', 'mentorProfile', 'booking'];
  const isFullWidthPage = fullWidthPages.includes(currentRoute.page);

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

      {/* Global AI Chatbot FAB — visible on every page except full-screen video */}
      {currentRoute.page !== 'video-interview' && (
        <button 
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-8 right-8 z-[60] flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-xl transition-all hover:scale-105 hover:shadow-2xl active:scale-95 group"
          title="Chat with MentorBridge AI"
        >
          <span className="absolute inset-0 rounded-full bg-secondary/30 animate-ping"></span>
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-error text-[10px] font-bold text-on-error">AI</span>
          <img
            src="/chatbot-icon.svg"
            alt="MentorBridge AI"
            className="relative h-12 w-12 rounded-full object-cover transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-6"
          />
        </button>
      )}

      <AIChatWidget isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </div>
  );
}

export default App;

import { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import TopNavBar from './components/layout/TopNavBar';
import SideNavBar from './components/layout/SideNavBar';
import Footer from './components/layout/Footer';
import { useAuth } from './context/AuthContext';
import { useAppNavigate } from './routes/useAppNavigate';
import { routeKeyForPath } from './routes/routeConfig';
import AppRoutes from './routes/AppRoutes';

// App-wide floating widgets — lazy so they don't weigh down initial load.
const AIChatWidget = lazy(() => import('./components/AIChatWidget'));
const ChatbotFab = lazy(() => import('./components/ChatbotFab'));

/**
 * App shell.
 *
 * Routing now lives in <AppRoutes> (React Router). App is only responsible for
 * the persistent chrome (top nav, footer, chatbot, theme) and for deciding which
 * chrome to show on the current page. That decision still reasons in "page-keys",
 * so we derive the key from the current pathname via routeKeyForPath().
 */
function App() {
  const { user, loading, logout } = useAuth();
  const navigateTo = useAppNavigate();
  const location = useLocation();
  const currentPage = routeKeyForPath(location.pathname);

  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('prolign-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('prolign-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // Pages that render their own full-screen chrome — hide the global nav/footer.
  const hideNavPages = [
    'login', 'signup', 'forgot-password', 'reset-password', 'onboarding', 'interview',
    'mentor-onboarding', 'mentorRegistration', 'menteeRegistration', 'auth-callback',
    'admindashboard', 'admin', 'video-interview', 'booking', 'verify-otp',
    'mentor-dashboard', 'mentee-dashboard', 'dashboard', 'waiting-approval',
  ];
  const hideNavigation = hideNavPages.includes(currentPage) ||
    (user?.role === 'mentee' && ['sessions', 'settings', 'analytics'].includes(currentPage));

  const showSidebar = false;

  const fullWidthPages = ['home', 'landing', 'how-it-works', 'terms', 'privacy',
    'cookies', 'cookie-policy', 'find-mentors', 'mentorProfile', 'booking'];
  const isFullWidthPage = fullWidthPages.includes(currentPage);

  const hideChatbotPages = ['video-interview', 'login', 'signup', 'forgot-password',
    'reset-password', 'menteeRegistration', 'mentorRegistration', 'onboarding', 'interview',
    'mentor-onboarding', 'auth-callback'];
  const showChatbot = !hideChatbotPages.includes(currentPage);

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
          currentPage={currentPage}
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
            currentPage={currentPage}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}

        <main className={`flex-1 w-full ${
          !hideNavigation && !isFullWidthPage ? 'p-4 md:p-8 max-w-7xl mx-auto' : ''
        }`}>
          <AppRoutes openChatbot={() => setIsChatbotOpen(true)} />
        </main>
      </div>

      {!hideNavigation && <Footer navigateTo={navigateTo} />}

      {showChatbot && (
        <Suspense fallback={null}>
          <ChatbotFab isOpen={isChatbotOpen} onOpen={() => setIsChatbotOpen(true)} />
          <AIChatWidget isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

export default App;

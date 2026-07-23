/**
 * Central route configuration — single source of truth for the mapping between
 * the app's legacy page-keys (used everywhere via `navigateTo(page, params)`)
 * and real URL paths now served by React Router.
 *
 * ARCHITECTURE NOTE:
 * The codebase navigates with string page-keys (`navigateTo('mentor-dashboard')`)
 * in 88+ call sites. Rather than rewrite every page to import `useNavigate`/`<Link>`
 * (a large, risky change), we keep the ergonomic page-key API and translate it to
 * real paths here. This preserves the existing coding style while moving the app
 * onto React Router's history, guards and lazy loading. New code can still use
 * React Router primitives directly.
 */

// Static page-key -> path. Parameterized routes are handled in pathForRoute().
export const staticPaths = {
  home: '/',
  landing: '/',
  login: '/login',
  signup: '/signup',
  'forgot-password': '/forgot-password',
  'reset-password': '/reset-password',
  mentorRegistration: '/register/mentor',
  menteeRegistration: '/register/mentee',
  'verify-otp': '/verify-otp',
  'verify-email': '/verify-otp',
  'auth-callback': '/auth/callback',
  onboarding: '/onboarding',
  interview: '/interview',
  'mentor-onboarding': '/mentor/onboarding',
  dashboard: '/dashboard',
  'mentor-dashboard': '/mentor/dashboard',
  'mentee-dashboard': '/mentee/dashboard',
  admindashboard: '/admin',
  admin: '/admin',
  'admin-mentors': '/admin/mentors',
  'admin-mentees': '/admin/mentees',
  'admin-applications': '/admin/applications',
  'admin-earnings': '/admin/earnings',
  'find-mentors': '/find-mentors',
  settings: '/settings',
  analytics: '/analytics',
  sessions: '/sessions',
  payments: '/payments',
  availability: '/availability',
  earnings: '/earnings',
  ratings: '/ratings',
  'how-it-works': '/how-it-works',
  terms: '/terms',
  privacy: '/privacy',
  cookies: '/cookies',
  'cookie-policy': '/cookies',
  'waiting-approval': '/waiting-approval',
};

/**
 * Build a real URL path from a legacy page-key (+ optional params).
 * Used by the navigateTo() compatibility shim.
 */
export const pathForRoute = (page, params = null) => {
  if (page === 'mentorProfile' && params?.mentorId) return `/mentor/${params.mentorId}`;
  if (page === 'booking' && params?.mentorId) return `/book/${params.mentorId}`;
  if (page === 'video-interview' && params?.sessionId) return `/video-interview/${params.sessionId}`;
  return staticPaths[page] || '/';
};

/**
 * Reverse lookup: real pathname -> canonical page-key.
 * Used by layout code (App shell) that still reasons in page-keys to decide
 * which chrome (nav bar, footer, chatbot, full-width) to show.
 */
export const routeKeyForPath = (pathname) => {
  // Exact matches take precedence over the parameterized routes below, so that
  // e.g. /mentor/dashboard and /mentor/onboarding are not mistaken for a mentor
  // profile (/mentor/:id).
  const pathToKey = {
    '/': 'home',
    '/login': 'login',
    '/signup': 'signup',
    '/forgot-password': 'forgot-password',
    '/reset-password': 'reset-password',
    '/register/mentor': 'mentorRegistration',
    '/register/mentee': 'menteeRegistration',
    '/verify-otp': 'verify-otp',
    '/auth/callback': 'auth-callback',
    '/onboarding': 'onboarding',
    '/interview': 'interview',
    '/mentor/onboarding': 'mentor-onboarding',
    '/dashboard': 'dashboard',
    '/mentor/dashboard': 'mentor-dashboard',
    '/mentee/dashboard': 'mentee-dashboard',
    '/admin': 'admindashboard',
    '/admin/mentors': 'admin-mentors',
    '/admin/mentees': 'admin-mentees',
    '/admin/applications': 'admin-applications',
    '/admin/earnings': 'admin-earnings',
    '/find-mentors': 'find-mentors',
    '/settings': 'settings',
    '/analytics': 'analytics',
    '/sessions': 'sessions',
    '/payments': 'payments',
    '/availability': 'availability',
    '/earnings': 'earnings',
    '/ratings': 'ratings',
    '/how-it-works': 'how-it-works',
    '/terms': 'terms',
    '/privacy': 'privacy',
    '/cookies': 'cookies',
    '/waiting-approval': 'waiting-approval',
  };
  if (pathToKey[pathname]) return pathToKey[pathname];

  // Parameterized routes.
  if (/^\/mentor\/[^/]+$/.test(pathname)) return 'mentorProfile';
  if (/^\/book\/[^/]+$/.test(pathname)) return 'booking';
  if (/^\/video-interview\/[^/]+$/.test(pathname)) return 'video-interview';

  return 'home';
};

/**
 * Where a freshly-authenticated user should land, as a page-key.
 * Mirrors the historical getRouteForUser() logic so redirect behaviour is preserved.
 */
export const homeRouteKeyForUser = (user) => {
  if (!user) return 'home';
  // Mentors go straight to their dashboard after onboarding — admin approval
  // is tracked (status) for admin visibility but does not gate mentor access.
  if (user.role === 'mentor') return 'mentor-dashboard';
  if (user.role === 'admin') return 'admindashboard';
  if (user.role === 'mentee') return user.isProfileComplete ? 'mentee-dashboard' : 'interview';
  return 'home';
};

// Convenience: the landing path for a user's role/status.
export const homePathForUser = (user) => pathForRoute(homeRouteKeyForUser(user));

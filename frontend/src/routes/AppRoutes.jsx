import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppNavigate } from './useAppNavigate';
import { PublicRoute, ProtectedRoute, RoleRoute } from './guards';

// Lazy-loaded pages — code-split so each route only loads when visited.
const Login = lazy(() => import('../pages/Login'));
const MenteeOnboarding = lazy(() => import('../pages/MenteeOnboarding'));
const MenteeInterview = lazy(() => import('../pages/MenteeInterview'));
const MentorOnboarding = lazy(() => import('../pages/MentorOnboarding'));
const MentorRegistration = lazy(() => import('../pages/MentorRegistration'));
const MenteeRegistration = lazy(() => import('../pages/MenteeRegistration'));
const LandingPage = lazy(() => import('../pages/LandingPage'));
const MenteeDashboard = lazy(() => import('../pages/MenteeDashboard'));
const MentorDashboard = lazy(() => import('../pages/MentorDashboard'));
const MentorDiscovery = lazy(() => import('../pages/MentorDiscovery'));
const MentorProfile = lazy(() => import('../pages/MentorProfile'));
const Booking = lazy(() => import('../pages/Booking'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const Settings = lazy(() => import('../pages/Settings'));
const Analytics = lazy(() => import('../pages/Analytics'));
const VideoInterview = lazy(() => import('../pages/VideoInterview'));
const HowItWorks = lazy(() => import('../pages/HowItWorks'));
const TermsOfService = lazy(() => import('../pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('../pages/CookiePolicy'));
const OTPVerification = lazy(() => import('../pages/OTPVerification'));
const WaitingForApproval = lazy(() => import('../pages/WaitingForApproval'));
const AuthCallback = lazy(() => import('../pages/AuthCallback'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-3">
      <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
      <p className="text-sm text-on-surface-variant">Loading...</p>
    </div>
  </div>
);

/*
 * Role-aware wrappers.
 * Several URLs (/dashboard, /settings, /analytics, /sessions) render a different
 * page depending on the user's role. These small components preserve the exact
 * branching that used to live in App.jsx's renderPage() switch.
 */
const DashboardRoute = () => {
  const { user } = useAuth();
  const navigateTo = useAppNavigate();
  if (user?.role === 'admin') return <AdminDashboard navigateTo={navigateTo} />;
  if (user?.role === 'mentor') return <MentorDashboard navigateTo={navigateTo} />;
  return <MenteeDashboard navigateTo={navigateTo} initialView="dashboard" />;
};

const SettingsRoute = () => {
  const { user } = useAuth();
  const navigateTo = useAppNavigate();
  return user?.role === 'mentee'
    ? <MenteeDashboard navigateTo={navigateTo} initialView="settings" />
    : <Settings navigateTo={navigateTo} />;
};

const AnalyticsRoute = () => {
  const { user } = useAuth();
  const navigateTo = useAppNavigate();
  return user?.role === 'mentee'
    ? <MenteeDashboard navigateTo={navigateTo} initialView="analytics" />
    : <Analytics navigateTo={navigateTo} />;
};

const SessionsRoute = () => {
  const { user } = useAuth();
  const navigateTo = useAppNavigate();
  return user?.role === 'mentee'
    ? <MenteeDashboard navigateTo={navigateTo} initialView="sessions" />
    : <MentorDashboard navigateTo={navigateTo} />;
};

// A mentor still awaiting approval shouldn't reach the mentor dashboard directly
// (preserves the historical status check); route them to the waiting screen.
const MentorDashboardRoute = () => {
  const { user } = useAuth();
  const navigateTo = useAppNavigate();
  if (user?.status === 'pending') return <Navigate to="/waiting-approval" replace />;
  return <MentorDashboard navigateTo={navigateTo} />;
};

// Parameterized routes: read the URL param and hand it to pages in the shape
// they already expect (`params={{ mentorId }}` / `sessionId`).
const MentorProfileRoute = () => {
  const { mentorId } = useParams();
  const navigateTo = useAppNavigate();
  return <MentorProfile navigateTo={navigateTo} params={{ mentorId }} />;
};

const BookingRoute = () => {
  const { mentorId } = useParams();
  const navigateTo = useAppNavigate();
  return <Booking navigateTo={navigateTo} params={{ mentorId }} />;
};

const VideoInterviewRoute = () => {
  const { sessionId } = useParams();
  const navigateTo = useAppNavigate();
  return <VideoInterview onNavigate={navigateTo} sessionId={sessionId} />;
};

/**
 * Application route tree.
 * `openChatbot` is threaded from the App shell so the HowItWorks page can keep
 * its "need help?" -> open chat behaviour.
 */
const AppRoutes = ({ openChatbot }) => {
  const navigateTo = useAppNavigate();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ---------- Public ---------- */}
        <Route path="/" element={<PublicRoute><LandingPage navigateTo={navigateTo} /></PublicRoute>} />
        <Route path="/how-it-works" element={<PublicRoute><HowItWorks navigateTo={navigateTo} onHelpClick={openChatbot} /></PublicRoute>} />
        <Route path="/terms" element={<PublicRoute><TermsOfService navigateTo={navigateTo} /></PublicRoute>} />
        <Route path="/privacy" element={<PublicRoute><PrivacyPolicy navigateTo={navigateTo} /></PublicRoute>} />
        <Route path="/cookies" element={<PublicRoute><CookiePolicy navigateTo={navigateTo} /></PublicRoute>} />
        <Route path="/find-mentors" element={<PublicRoute><MentorDiscovery navigateTo={navigateTo} /></PublicRoute>} />
        <Route path="/mentor/:mentorId" element={<PublicRoute><MentorProfileRoute /></PublicRoute>} />
        <Route path="/book/:mentorId" element={<PublicRoute><BookingRoute /></PublicRoute>} />

        {/* ---------- Auth (redirect authenticated users away) ---------- */}
        <Route path="/login" element={<PublicRoute restricted><Login navigateTo={navigateTo} /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute restricted><Login navigateTo={navigateTo} initialView="signup" /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute restricted><Login navigateTo={navigateTo} initialView="forgot-password" /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><Login navigateTo={navigateTo} initialView="reset-password" /></PublicRoute>} />
        <Route path="/register/mentor" element={<PublicRoute restricted><MentorRegistration navigateTo={navigateTo} /></PublicRoute>} />
        <Route path="/register/mentee" element={<PublicRoute restricted><MenteeRegistration navigateTo={navigateTo} /></PublicRoute>} />

        {/* ---------- In-progress auth flows (no redirect) ---------- */}
        <Route path="/verify-otp" element={<OTPVerification navigateTo={navigateTo} />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* ---------- Protected (any authenticated user) ---------- */}
        <Route path="/onboarding" element={<ProtectedRoute><MenteeOnboarding navigateTo={navigateTo} /></ProtectedRoute>} />
        <Route path="/interview" element={<RoleRoute roles={['mentee']}><MenteeInterview navigateTo={navigateTo} /></RoleRoute>} />
        <Route path="/waiting-approval" element={<ProtectedRoute><WaitingForApproval navigateTo={navigateTo} /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsRoute /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsRoute /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><SessionsRoute /></ProtectedRoute>} />
        <Route path="/video-interview/:sessionId" element={<ProtectedRoute><VideoInterviewRoute /></ProtectedRoute>} />

        {/* ---------- Role-based ---------- */}
        <Route path="/mentor/onboarding" element={<RoleRoute roles={['mentor']}><MentorOnboarding navigateTo={navigateTo} /></RoleRoute>} />
        <Route path="/mentor/dashboard" element={<RoleRoute roles={['mentor']}><MentorDashboardRoute /></RoleRoute>} />
        <Route path="/mentee/dashboard" element={<RoleRoute roles={['mentee']}><MenteeDashboard navigateTo={navigateTo} initialView="dashboard" /></RoleRoute>} />
        <Route path="/admin" element={<RoleRoute roles={['admin']}><AdminDashboard navigateTo={navigateTo} /></RoleRoute>} />

        {/* ---------- Fallback ---------- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

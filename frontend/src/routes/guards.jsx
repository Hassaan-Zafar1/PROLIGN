import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathForUser } from './routeConfig';

/**
 * Route guards for React Router.
 *
 * These replace the old imperative redirect useEffect in App.jsx with
 * declarative, per-route protection:
 *   - PublicRoute:    open to everyone; `restricted` sends authed users to their dashboard
 *                     (used for /login, /signup, /register/* so logged-in users can't see them)
 *   - ProtectedRoute: requires authentication; unauthenticated users go to /login
 *   - RoleRoute:      requires authentication AND a matching role; others go to their own dashboard
 *
 * While auth is still initializing we render a lightweight loader so guards
 * never redirect on a not-yet-known user.
 */

const GuardLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-surface">
    <div className="flex flex-col items-center gap-4">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
      <p className="text-on-surface-variant font-medium">Loading...</p>
    </div>
  </div>
);

export const PublicRoute = ({ children, restricted = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <GuardLoader />;
  if (restricted && user) return <Navigate to={homePathForUser(user)} replace />;
  return children;
};

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <GuardLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
};

export const RoleRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <GuardLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homePathForUser(user)} replace />;
  return children;
};

import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tokenManager } from '../utils/tokenManager';
import { homePathForUser } from '../routes/routeConfig';

/**
 * Dedicated landing route for Google OAuth (backend redirects to /auth/callback
 * with ?token&role&isProfileComplete). Previously this was handled by an ad-hoc
 * query-param effect on the root route; giving it a real route keeps the OAuth
 * flow explicit and lets the router own the post-login redirect.
 */
const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const isProfileComplete = searchParams.get('isProfileComplete');

    if (token && role) {
      tokenManager.setAccessToken(token);
      const userData = {
        role,
        isEmailVerified: true,
        isProfileComplete: isProfileComplete === 'true',
      };
      login(userData, token);
      navigate(homePathForUser(userData), { replace: true });
    } else {
      navigate('/login?error=google_failed', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
        <p className="text-on-surface-variant font-medium">Signing you in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;

/**
 * Login Page Component
 * Unified login page for all user roles (mentee, mentor, admin)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';
import { MOCK_USERS } from '../constants/mockData';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = MOCK_USERS.find(
        (u) => u.email === email && u.password === password
      );

      if (!user) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('authToken', user.token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        })
      );

      if (user.role === 'mentor') {
        navigate('/mentor-dashboard');
      } else if (user.role === 'mentee') {
        navigate('/mentee-dashboard');
      } else {
        navigate('/admin-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <TopNavBar isHome={false} />

      <main className="flex-grow flex items-center justify-center px-gutter py-loose">
        <div className="w-full max-w-md">
          <div className="text-center mb-loose">
            <h1 className="font-headline-xl text-headline-xl text-primary mb-4">
              Sign In
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Welcome back to MentorBridge. Enter your credentials to continue.
            </p>
          </div>

          <div className="bg-surface-container-low p-base rounded-xl shadow-natural border border-outline-variant">
            <form onSubmit={handleLogin} className="space-y-base">
              {error && (
                <div className="flex items-start gap-4 p-4 bg-error-container rounded-lg border border-error">
                  <span className="material-symbols-outlined text-error flex-shrink-0">
                    error
                  </span>
                  <p className="font-body-md text-body-md text-on-error-container">
                    {error}
                  </p>
                </div>
              )}

              <div className="group">
                <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-surface-dim border border-outline-variant rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary focus:outline-none"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="group">
                <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-surface-dim border border-outline-variant rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary focus:outline-none"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="text-right">
                <a
                  href="#"
                  className="font-label-sm text-label-sm text-secondary hover:underline"
                >
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-base">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface-container-low text-on-surface-variant">
                  or
                </span>
              </div>
            </div>

            <p className="text-center font-body-md text-body-md text-on-surface-variant">
              Do not have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-secondary font-bold hover:underline"
              >
                Sign up
              </button>
              {' or '}
              <button
                type="button"
                onClick={() => navigate('/mentor-registration')}
                className="text-secondary font-bold hover:underline"
              >
                Join as Mentor
              </button>
            </p>
          </div>

          <div className="mt-8 p-4 bg-surface-container rounded-lg border border-outline-variant">
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-2 font-bold">
              Demo Credentials:
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Mentee: mentee@example.com / password123
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Mentor: mentor@example.com / password123
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

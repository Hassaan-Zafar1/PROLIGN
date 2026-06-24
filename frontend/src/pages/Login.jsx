import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const Login = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(email, password);

      // If email not verified, redirect to OTP verification
      if (response.userId) {
        // Store userId in sessionStorage for OTP page
        sessionStorage.setItem('otpUserId', response.userId);
        navigateTo('verify-otp');
      } else {
        // Email is verified, log in user
        login(response.user, response.accessToken);
        navigateTo('dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authService.googleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-4">
      <div className="max-w-md w-full bg-surface rounded-3xl natural-shadow p-8 border border-outline-variant">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Home
        </button>
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-primary text-5xl mb-4">school</span>
          <h2 className="text-3xl font-headline-md font-bold text-on-surface">Welcome Back</h2>
          <p className="text-on-surface-variant mt-2">Log in to continue to ProLign</p>
        </div>
        
        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 text-sm flex items-center space-x-2">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-surface-bright"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-surface-bright"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary"
                disabled={loading}
              />
              <span className="text-sm text-on-surface-variant">Remember me</span>
            </label>
            <button 
              type="button" 
              onClick={() => navigateTo('help-center')} 
              className="text-sm font-medium text-primary hover:text-primary-container transition-colors"
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary-container transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Logging in...' : 'Login'}</span>
            {!loading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
          </button>
        </form>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-surface-bright text-on-surface rounded-xl font-medium border border-outline-variant hover:bg-surface transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">account_circle</span>
            <span>Login with Google</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <button 
              onClick={() => navigateTo('mentorRegistration')} 
              className="font-medium text-primary hover:text-primary-container transition-colors"
              disabled={loading}
            >
              Sign up
            </button>
          </p>
        </div>
        
        <div className="mt-6 p-4 bg-surface-variant rounded-xl text-xs text-on-surface-variant text-left">
          <strong>Demo Login Details:</strong><br />
          Mentee: <code>mentee@prolign.com</code> / <code>mentee123</code><br />
          Mentor: <code>mentor@prolign.com</code> / <code>mentor123</code><br />
          Admin: <code>admin@prolign.com</code> / Password: <code>password123</code>
        </div>
      </div>
    </div>
  );
};

export default Login;
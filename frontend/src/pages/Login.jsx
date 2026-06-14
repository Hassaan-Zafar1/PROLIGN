import React, { useState } from 'react';
// import { login } from '../utils/db';

const Login = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    // Perform mock login
    const user = login(email, password);
    if (user) {
      if (user.role === 'mentor') {
        navigateTo('dashboard'); // mentor dashboard
      } else if (user.role === 'admin') {
        navigateTo('admindashboard');
      } else {
        navigateTo('dashboard'); // mentee dashboard
      }
    } else {
      setError('Invalid login credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-4">
      <div className="max-w-md w-full bg-white rounded-3xl natural-shadow p-8 border border-outline-variant">
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
          <p className="text-on-surface-variant mt-2">Log in to continue to MentorBridge</p>
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
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary" />
              <span className="text-sm text-on-surface-variant">Remember me</span>
            </label>
            <button type="button" onClick={() => navigateTo('help-center')} className="text-sm font-medium text-primary hover:text-primary-container transition-colors">
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary-container transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <span>Login</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <button onClick={() => navigateTo('signup')} className="font-medium text-primary hover:text-primary-container transition-colors">
              Sign up
            </button>
          </p>
        </div>
        
        <div className="mt-6 p-4 bg-surface-variant rounded-xl text-xs text-on-surface-variant text-left">
          <strong>Demo Login Details:</strong><br />
          Mentee: <code>mentee@mentorbridge.com</code> / <code>mentee123</code><br />
          Mentor: <code>mentor@mentorbridge.com</code> / <code>mentor123</code><br />
          Admin: <code>admin@mentorbridge.com</code> / Password: <code>password123</code>
        </div>
      </div>
    </div>
  );
};

export default Login;

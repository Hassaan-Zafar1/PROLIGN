import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const Login = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const modalRef = useRef(null);
  const firstButtonRef = useRef(null);
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
      const response = await authService.login({ email, password });

      // If email not verified, redirect to OTP verification
      if (response.userId) {
        sessionStorage.setItem('otpUserId', response.userId);
        navigateTo('verify-otp');
      } else {
        login(response.user, response.accessToken);
        navigateTo('dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showRoleModal) return;
    const timer = setTimeout(() => firstButtonRef.current?.focus(), 100);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowRoleModal(false);
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showRoleModal]);

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-background overflow-hidden">
      {/* Left Side — Brand Story */}
      <div className="hidden md:flex md:w-full lg:w-[55%] xl:w-[60%] bg-gradient-to-br from-primary via-primary-container to-surface-dim relative overflow-hidden flex-col">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-on-primary-fixed rounded-full blur-[100px]" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-on-primary-fixed rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-secondary-fixed rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-8 md:p-10 xl:p-14 w-full h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <span className="material-symbols-outlined text-on-primary text-3xl fill-icon">school</span>
            <span className="font-headline-lg text-2xl font-bold text-on-primary tracking-tight">ProLign</span>
          </div>

          {/* Hero Content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full bg-on-primary/15 px-4 py-2 text-sm font-semibold text-on-primary w-fit mb-5">
              <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
              Trusted by 10,000+ Professionals
            </span>

            <h1 className="text-3xl md:text-4xl xl:text-5xl 2xl:text-[3.25rem] font-headline-xl font-bold text-on-primary leading-[1.15] mb-4">
              Grow Faster with<br />Expert Mentorship
            </h1>

            <p className="text-on-primary/75 text-base md:text-lg xl:text-xl leading-relaxed max-w-md">
              Connect with experienced mentors, gain career guidance, and accelerate your professional journey.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mt-6 md:mt-8">
            {[
              { icon: 'groups', value: '500+', label: 'Mentors' },
              { icon: 'event_available', value: '10,000+', label: 'Sessions' },
              { icon: 'thumb_up', value: '95%', label: 'Satisfaction' },
              { icon: 'domain', value: '50+', label: 'Industries' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-on-primary/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-on-primary/10 hover:bg-on-primary/15 transition-all duration-200 cursor-default"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-primary/80 text-xl">{stat.icon}</span>
                  <div>
                    <p className="text-lg md:text-xl font-bold text-on-primary">{stat.value}</p>
                    <p className="text-xs text-on-primary/60 font-medium">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* New Here? CTA */}
          <div className="mt-6 md:mt-8 bg-on-primary/10 backdrop-blur-sm rounded-xl p-5 border border-on-primary/10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1">
                <p className="font-bold text-on-primary text-sm mb-0.5">New Here?</p>
                <p className="text-on-primary/65 text-xs leading-relaxed">Join our mentorship community and start your growth journey today.</p>
              </div>
              <button
                onClick={() => setShowRoleModal(true)}
                className="inline-flex items-center justify-center gap-2 bg-on-primary text-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-on-primary/90 transition-all shadow-sm flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side — Auth Card */}
      <div className="flex-1 flex flex-col h-full lg:h-screen">
        {/* Top-back Button (mobile + desktop) */}
        <div className="px-4 pt-5 pb-3">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Home
          </button>
        </div>
        {/* Mobile Header */}
        <div className="lg:hidden px-4 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-2xl fill-icon">school</span>
            <span className="font-headline-lg text-xl font-bold text-on-surface tracking-tight">ProLign</span>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-4 lg:py-0">
          <div className="w-full max-w-[480px]">
            {/* Auth Card */}
            <div className="bg-surface rounded-2xl lg:rounded-3xl shadow-[0_2px_24px_rgba(0,0,0,0.06)] border border-outline-variant/40 p-5 sm:p-7 lg:p-8">
              {/* Logo — Desktop only */}
              <div className="hidden lg:flex items-center gap-2.5 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl fill-icon">school</span>
                <span className="font-headline-lg text-xl font-bold text-on-surface tracking-tight">ProLign</span>
              </div>

              {/* Welcome Message */}
              <div className="text-center lg:text-left mb-5">
                <h2 className="text-2xl sm:text-3xl font-headline-md font-bold text-on-surface">Welcome Back</h2>
                <p className="text-on-surface-variant mt-1.5 text-sm sm:text-base">Sign in to continue your mentorship journey.</p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="bg-error-container text-on-error-container p-3.5 rounded-xl mb-5 text-sm flex items-center gap-2.5" role="alert">
                  <span className="material-symbols-outlined text-lg">error</span>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Email Field */}
                <div>
                  <label htmlFor="login-email" className="block text-sm font-semibold text-on-surface mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-[52px] px-4 pl-11 rounded-xl border border-outline-variant bg-surface-bright text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all outline-none"
                      placeholder="you@example.com"
                      required
                      disabled={loading}
                      autoComplete="email"
                      aria-label="Email address"
                    />
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">mail</span>
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="login-password" className="block text-sm font-semibold text-on-surface mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-[52px] px-4 pl-11 pr-11 rounded-xl border border-outline-variant bg-surface-bright text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all outline-none"
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                      aria-label="Password"
                    />
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">lock</span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Remember Me + Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 cursor-pointer"
                      disabled={loading}
                      aria-label="Remember me"
                    />
                    <span className="text-sm text-on-surface-variant">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="text-sm font-semibold text-primary hover:text-primary-container transition-colors"
                    disabled={loading}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[52px] bg-primary text-on-primary rounded-xl font-semibold text-base hover:bg-primary-container active:scale-[0.98] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  aria-label={loading ? 'Logging in...' : 'Login'}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>

                {/* Mobile-only Signup Link */}
                <div className="md:hidden text-center pt-2">
                  <p className="text-sm text-on-surface-variant">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setShowRoleModal(true)}
                      className="font-semibold text-primary hover:text-primary-container transition-colors"
                      disabled={loading}
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setShowRoleModal(false)}
          />

          {/* Modal */}
          <div
            ref={modalRef}
            className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-[700px] animate-[scaleIn_0.2s_ease-out] overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Header */}
            <div className="text-center px-6 pt-8 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-2xl">group_add</span>
              </div>
              <h2 id="role-modal-title" className="text-xl sm:text-2xl font-bold text-on-surface mb-1">Join Our Mentorship Community</h2>
              <p className="text-on-surface-variant text-sm">Choose how you would like to get started.</p>
            </div>

            {/* Cards */}
            <div className="flex flex-col sm:flex-row gap-4 px-6 pb-8">
              {/* Mentee Card */}
              <button
                ref={firstButtonRef}
                onClick={() => { setShowRoleModal(false); navigateTo('menteeRegistration'); }}
                className="flex-1 group bg-surface-container-low hover:bg-primary-container/10 border border-outline-variant/20 hover:border-primary/30 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-2xl">school</span>
                </div>
                <h3 className="font-bold text-on-surface text-base mb-1">Join as a Mentee</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                  Connect with experienced mentors and accelerate your learning journey.
                </p>
                <span className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm">
                  Continue as Mentee
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </span>
              </button>

              {/* Mentor Card */}
              <button
                onClick={() => { setShowRoleModal(false); navigateTo('mentorRegistration'); }}
                className="flex-1 group bg-surface-container-low hover:bg-secondary-container/10 border border-outline-variant/20 hover:border-secondary/30 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-secondary text-2xl">workspace_premium</span>
                </div>
                <h3 className="font-bold text-on-surface text-base mb-1">Join as a Mentor</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                  Share your expertise and guide learners toward success.
                </p>
                <span className="inline-flex items-center gap-1.5 text-secondary font-semibold text-sm">
                  Continue as Mentor
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

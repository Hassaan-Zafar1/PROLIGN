import { useState } from 'react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function OTPVerification({ navigateTo, params }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { login } = useAuth();

  const userId = params?.userId;

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="bg-surface-container-low p-8 rounded-2xl text-center max-w-md border border-outline-variant/10 shadow-lg">
          <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">Invalid Request</h2>
          <p className="text-on-surface-variant mb-6">No registration session found. Please register again.</p>
          <button
            onClick={() => navigateTo('home')}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-semibold hover:brightness-110 transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authService.verifyOTP(userId, otp);
      if (response.user.role === 'mentee' && response.user.isProfileComplete === undefined) {
        response.user.isProfileComplete = false;
      }
      login(response.user, response.accessToken);
      const role = response.user.role;
      if (role === 'mentor')      navigateTo('mentor-dashboard');
      else if (role === 'mentee') navigateTo('onboarding');
      else if (role === 'admin')  navigateTo('admindashboard');
      else                        navigateTo('home');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccessMsg('');
    setResendLoading(true);
    try {
      await authService.resendOTP(userId);
      setSuccessMsg('New OTP sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">

      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] brand-panel relative overflow-hidden flex-col">
        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-20 left-20 w-72 h-72 bg-on-primary-fixed rounded-full blur-[100px]" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-on-primary-fixed rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full h-full">
          {/* Logo */}
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-3 w-fit"
            aria-label="Go to home"
          >
            <span className="material-symbols-outlined text-on-primary text-3xl" aria-hidden="true">school</span>
            <span className="font-headline-lg text-2xl font-bold text-on-primary tracking-tight">ProLign</span>
          </button>

          {/* Hero content */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-on-primary/15 px-4 py-2 text-sm font-semibold text-on-primary w-fit mb-6">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">mark_email_read</span>
              Email Verification
            </div>
            <h1 className="font-headline-xl text-4xl xl:text-5xl font-bold text-on-primary leading-tight mb-4">
              One step away from your goals
            </h1>
            <p className="text-on-primary/75 text-lg leading-relaxed">
              We sent a 6-digit code to your email to confirm your identity. Enter it to complete your registration.
            </p>

            {/* Steps */}
            <div className="mt-10 space-y-4">
              {[
                { icon: 'mail', label: 'Check your inbox' },
                { icon: 'pin',  label: 'Enter the 6-digit code' },
                { icon: 'rocket_launch', label: 'Start your journey' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-on-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-primary text-base" aria-hidden="true">{step.icon}</span>
                  </div>
                  <span className="text-on-primary/80 text-sm font-medium">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-on-primary/40 text-xs">
            &copy; {new Date().getFullYear()} ProLign. Secure verification.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 mb-8 lg:hidden"
            aria-label="Go to home"
          >
            <span className="material-symbols-outlined text-primary text-2xl" aria-hidden="true">school</span>
            <span className="font-headline-md font-bold text-xl text-primary">ProLign</span>
          </button>

          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-3xl" aria-hidden="true">mark_email_read</span>
            </div>
            <h2 className="text-3xl font-bold text-on-surface mb-2">Verify Your Email</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Enter the 6-digit code sent to your email address. The code expires in 10 minutes.
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-center gap-3 p-4 bg-error/8 border border-error/30 text-error rounded-xl text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-lg flex-shrink-0" aria-hidden="true">error</span>
              {error}
            </div>
          )}
          {successMsg && (
            <div
              role="status"
              className="mb-5 flex items-center gap-3 p-4 bg-secondary/8 border border-secondary/30 text-secondary rounded-xl text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-lg flex-shrink-0" aria-hidden="true">check_circle</span>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleVerifyOTP} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="otp-input"
                className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3"
              >
                One-Time Password
              </label>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full h-16 bg-surface border-2 rounded-2xl text-center text-3xl font-bold text-on-surface focus:ring-0 outline-none transition-all duration-200 tracking-[0.6em] placeholder:text-outline-variant/60 placeholder:tracking-widest"
                style={{
                  borderColor: otp.length > 0 ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                  boxShadow: otp.length > 0 ? '0 0 0 3px rgba(26,40,10,0.08)' : 'none',
                }}
                autoFocus
                placeholder="——————"
                aria-label="Enter 6-digit OTP code"
                aria-describedby="otp-hint"
                maxLength={6}
              />
              <p id="otp-hint" className="text-xs text-on-surface-variant mt-2 text-center">
                {otp.length}/6 digits entered
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold text-base hover:brightness-110 active:scale-[0.99] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">verified</span>
                  Verify Email
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-on-surface-variant">Didn't receive the code?</p>
            <button
              onClick={handleResendOTP}
              disabled={resendLoading}
              className="text-primary font-semibold text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {resendLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base" aria-hidden="true">refresh</span>
                  Resend OTP
                </>
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigateTo('home')}
              className="text-xs text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
              Back to Home
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
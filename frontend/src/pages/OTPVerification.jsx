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
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
        <div className="bg-surface-container-low p-8 rounded-xl text-center max-w-md">
          <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">Invalid Request</h2>
          <p className="text-on-surface-variant mb-6">No registration session found. Please register again.</p>
          <button
            onClick={() => navigateTo('home')}
            className="bg-primary text-on-primary px-6 py-2 rounded-lg font-semibold"
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
      if (role === 'mentor') navigateTo('mentor-dashboard');
      else if (role === 'mentee') navigateTo('onboarding');
      else if (role === 'admin') navigateTo('admindashboard');
      else navigateTo('home');
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
    <div className="flex items-center justify-center min-h-screen bg-surface px-4">
      <div className="w-full max-w-md bg-surface-container-low p-8 rounded-xl border border-outline-variant/10 shadow-md">
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-primary text-5xl mb-3">mark_email_read</span>
          <h2 className="text-3xl font-bold text-primary">Verify Your Email</h2>
          <p className="text-on-surface-variant mt-2">Enter the 6-digit OTP sent to your email address.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error text-error rounded-lg text-sm font-semibold">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary text-primary rounded-lg text-sm font-semibold">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              required
              className="w-full bg-surface-dim border-none rounded-lg p-3 text-center text-2xl font-bold tracking-[0.5em] text-on-surface focus:ring-2 focus:ring-secondary/50 outline-none"
            />
            <p className="text-xs text-on-surface-variant mt-2 text-center">OTP expires in 10 minutes</p>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-on-surface-variant mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResendOTP}
            disabled={resendLoading}
            className="text-primary font-semibold text-sm hover:underline disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigateTo('home')}
            className="text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
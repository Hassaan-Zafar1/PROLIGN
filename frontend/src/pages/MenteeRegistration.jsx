import { useState } from 'react';
import { authService } from '../services/authService';

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateLinkedIn = (url) => /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/.test(url.trim());
const validatePassword = (pwd) => {
  const errors = [];
  if (pwd.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(pwd)) errors.push('1 uppercase letter');
  if (!/[a-z]/.test(pwd)) errors.push('1 lowercase letter');
  if (!/[0-9]/.test(pwd)) errors.push('1 number');
  if (!/[^A-Za-z0-9]/.test(pwd)) errors.push('1 special character');
  return errors;
};

/**
 * Mentee registration — kept intentionally minimal (name, email, password,
 * optional LinkedIn). Mentees fill in the rest of their profile through the
 * text-based AI interview right after signup (see MenteeInterview.jsx), so
 * there's no CV step or multi-page wizard here.
 */
export default function MenteeRegistration({ navigateTo }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', linkedIn: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const errs = {};
    const { name, email, password, confirmPassword, linkedIn } = form;

    if (!name.trim()) errs.name = 'Name is required.';
    else if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
    else if (name.trim().length > 100) errs.name = 'Name must be under 100 characters.';

    if (!email.trim()) errs.email = 'Email is required.';
    else if (!validateEmail(email)) errs.email = 'Enter a valid email address.';

    const pwdErrors = validatePassword(password);
    if (!password) errs.password = 'Password is required.';
    else if (pwdErrors.length > 0) errs.password = `Password must contain: ${pwdErrors.join(', ')}.`;

    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';

    // LinkedIn is optional — only validate the format if something was entered.
    if (linkedIn.trim() && !validateLinkedIn(linkedIn)) errs.linkedIn = 'Please enter a valid LinkedIn profile URL.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setApiError('');
    setTouched({ name: true, email: true, password: true, confirmPassword: true, linkedIn: true });

    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authService.register({
        email: form.email,
        password: form.password,
        role: 'mentee',
        name: form.name,
        ...(form.linkedIn.trim() && { linkedinUrl: form.linkedIn.trim() }),
      });

      sessionStorage.setItem('otpUserId', response.userId);
      navigateTo('verify-otp', { userId: response.userId });
    } catch (error) {
      console.error('Registration failed:', error);
      setApiError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full bg-surface-dim border-none rounded-lg p-3 sm:p-3.5 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50 outline-none ${
      errors[field] && touched[field] ? 'ring-2 ring-error' : ''
    }`;

  const renderError = (field) => errors[field] && touched[field] ? <p className="text-error text-xs mt-1 font-semibold">{errors[field]}</p> : null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface overflow-y-auto">
      {/* Left Side — Brand Story */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] brand-panel relative overflow-hidden flex-col justify-between p-8 xl:p-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-on-primary-fixed rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-on-primary-fixed rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <button type="button" onClick={() => navigateTo('home')} className="inline-flex items-center gap-2 text-sm font-medium text-on-primary/80 hover:text-on-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Home
          </button>
        </div>
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-on-primary/20 px-4 py-2 text-sm font-bold text-on-primary w-fit mb-6">
            <span className="material-symbols-outlined text-[18px]">school</span>
            Mentee Registration
          </span>
          <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-bold text-on-primary leading-tight mb-4">
            Start Your Growth<br />Journey Today
          </h1>
          <p className="text-on-primary/80 text-base xl:text-lg max-w-md leading-relaxed">
            Connect with expert mentors who will help you achieve your professional and personal goals.
          </p>

          <div className="mt-8">
            <p className="text-on-primary/65 text-sm mb-2">Already have an account?</p>
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="inline-flex items-center gap-2 bg-on-primary/15 text-on-primary border border-on-primary/25 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-on-primary/25 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              Sign In
            </button>
          </div>
        </div>

      </div>

      {/* Right Side — Form */}
      <div className="flex-1 flex flex-col min-h-full lg:min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden px-3 sm:px-4 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <button type="button" onClick={() => navigateTo('home')} className="mb-3 sm:mb-4 inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Home
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-on-primary-container">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">school</span>
              Mentee Registration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Start Your Growth Journey</h1>
          <p className="text-on-surface-variant mt-1.5 sm:mt-2 text-sm sm:text-base">Connect with expert mentors to achieve your goals.</p>
          <div className="mt-4 md:hidden">
            <p className="text-on-surface-variant text-sm mb-2">Already have an account?</p>
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="inline-flex items-center gap-2 border border-outline-variant/20 px-4 py-2.5 rounded-xl font-semibold text-sm text-primary hover:bg-primary-container/20 transition-all min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              Sign In
            </button>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 px-3 sm:px-4 lg:px-10 py-5 sm:py-8 flex items-start lg:items-center">
          <div className="max-w-lg mx-auto w-full">
            {apiError && (
              <div className="mb-6 p-4 bg-error/10 border border-error text-error rounded-lg text-sm font-semibold">
                {apiError}
              </div>
            )}

            <form onSubmit={handleRegister} noValidate>
              <div className="bg-surface-container-low p-5 sm:p-8 rounded-2xl shadow-sm border border-outline-variant/10 space-y-4 sm:space-y-5">
                <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">Create your account</h2>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Full Name <span className="text-error">*</span></label>
                  <input className={inputClass('name')} placeholder="Your full name" type="text" value={form.name} onChange={e => set('name', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, name: true }))} required autoComplete="name" />
                  {renderError('name')}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Email Address <span className="text-error">*</span></label>
                  <input className={inputClass('email')} placeholder="you@example.com" type="email" inputMode="email" value={form.email} onChange={e => set('email', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, email: true }))} required autoComplete="email" />
                  {renderError('email')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Password <span className="text-error">*</span></label>
                    <input className={inputClass('password')} placeholder="Create a password" type="password" value={form.password} onChange={e => set('password', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, password: true }))} required autoComplete="new-password" />
                    {renderError('password')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-2">Confirm Password <span className="text-error">*</span></label>
                    <input className={inputClass('confirmPassword')} placeholder="Confirm your password" type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))} required autoComplete="new-password" />
                    {renderError('confirmPassword')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    LinkedIn Profile URL <span className="text-on-surface-variant text-xs font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input className={`${inputClass('linkedIn')} pl-10`} placeholder="linkedin.com/in/your-profile" type="url" inputMode="url" value={form.linkedIn} onChange={e => set('linkedIn', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, linkedIn: true }))} autoComplete="url" />
                    <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant/60 text-[18px]">link</span>
                  </div>
                  {renderError('linkedIn')}
                </div>
                <div className="pt-2 relative overflow-hidden rounded-lg">
                  <div className="flex items-center gap-4 text-on-surface-variant p-4 bg-surface-container-high rounded-lg">
                    <span className="material-symbols-outlined text-secondary">forum</span>
                    <p className="text-sm font-semibold">After verifying your email, a quick interview helps us match you with the right mentors.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end mt-6 sm:mt-8">
                <button type="submit" disabled={loading} className="flex items-center gap-1.5 sm:gap-2 px-6 sm:px-8 py-3 rounded-lg bg-primary text-on-primary font-bold text-sm sm:text-base hover:scale-[1.01] active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px]">check_circle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

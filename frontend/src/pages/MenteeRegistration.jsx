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

const STEPS = [
  { id: 1, label: 'Account', icon: 'person' },
  { id: 2, label: 'Professional', icon: 'work' },
  { id: 3, label: 'Profile', icon: 'upload_file' },
  { id: 4, label: 'Review', icon: 'check_circle' },
];

export default function MenteeRegistration({ navigateTo }) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', linkedIn: '' });
  const [cvFile, setCvFile] = useState(null);
  const [cvError, setCvError] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validateStep = (step) => {
    const errs = {};
    const { name, email, password, confirmPassword, linkedIn } = form;

    if (step === 1) {
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
    }

    if (step === 2) {
      if (!linkedIn.trim()) errs.linkedIn = 'LinkedIn profile URL is required.';
      else if (!validateLinkedIn(linkedIn)) errs.linkedIn = 'Please enter a valid LinkedIn profile URL.';
    }

    if (cvError) errs.cv = cvError;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

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

    if (!linkedIn.trim()) errs.linkedIn = 'LinkedIn profile URL is required.';
    else if (!validateLinkedIn(linkedIn)) errs.linkedIn = 'Please enter a valid LinkedIn profile URL.';

    if (cvError) errs.cv = cvError;
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    setCvError('');
    if (!file) { setCvFile(null); return; }
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) { setCvError('Only PDF, DOC, DOCX files are allowed.'); setCvFile(null); return; }
    if (file.size > 10 * 1024 * 1024) { setCvError('File size must be under 10 MB.'); setCvFile(null); return; }
    setCvFile(file);
  };

  const handleNext = () => {
    const allTouched = {};
    if (currentStep === 1) {
      allTouched.name = true;
      allTouched.email = true;
      allTouched.password = true;
      allTouched.confirmPassword = true;
    } else if (currentStep === 2) {
      allTouched.linkedIn = true;
    }
    setTouched(prev => ({ ...prev, ...allTouched }));

    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (currentStep !== 4) return;
    setApiError('');

    const allTouched = Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), { cv: true });
    setTouched(allTouched);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        email: form.email,
        password: form.password,
        role: 'mentee',
        name: form.name,
        linkedinUrl: form.linkedIn,
      });
      
      navigateTo('verify-otp', { userId: response.userId });
    } catch (error) {
      console.error('Registration failed:', error);
      setApiError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50 outline-none ${
      errors[field] && touched[field] ? 'ring-2 ring-error' : ''
    }`;

  const renderError = (field) => errors[field] && touched[field] ? <p className="text-error text-xs mt-1 font-semibold">{errors[field]}</p> : null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-5">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">Account Information</h2>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Full Name <span className="text-error">*</span></label>
              <input className={inputClass('name')} placeholder="Your full name" type="text" value={form.name} onChange={e => set('name', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, name: true }))} required />
              {renderError('name')}
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Email Address <span className="text-error">*</span></label>
              <input className={inputClass('email')} placeholder="you@example.com" type="email" value={form.email} onChange={e => set('email', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, email: true }))} required />
              {renderError('email')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Password <span className="text-error">*</span></label>
                <input className={inputClass('password')} placeholder="Create a password" type="password" value={form.password} onChange={e => set('password', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, password: true }))} required />
                {renderError('password')}
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Confirm Password <span className="text-error">*</span></label>
                <input className={inputClass('confirmPassword')} placeholder="Confirm your password" type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))} required />
                {renderError('confirmPassword')}
              </div>
            </div>
            <div className="pt-4 relative overflow-hidden rounded-lg">
              <div className="flex items-center gap-4 text-on-surface-variant p-4 bg-surface-container-high rounded-lg">
                <span className="material-symbols-outlined text-secondary">verified_user</span>
                <p className="text-sm font-semibold">Your account will be verified via email after registration.</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-5">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">Professional Details</h2>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">LinkedIn Profile URL <span className="text-error">*</span></label>
              <div className="relative">
                <input className={`${inputClass('linkedIn')} pl-10`} placeholder="linkedin.com/in/your-profile" type="url" value={form.linkedIn} onChange={e => set('linkedIn', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, linkedIn: true }))} required />
                <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant/60 text-[18px]">link</span>
              </div>
              {renderError('linkedIn')}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-5">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">Profile Setup</h2>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Curriculum Vitae <span className="text-on-surface-variant text-xs font-normal">(Optional)</span></label>
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-outline-variant/40 rounded-lg cursor-pointer bg-surface-dim hover:bg-secondary-container/10 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {cvFile ? (
                    <>
                      <span className="material-symbols-outlined text-secondary mb-2">description</span>
                      <p className="text-sm font-semibold text-on-surface">{cvFile.name}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{(cvFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-on-surface-variant mb-2">cloud_upload</span>
                      <p className="text-sm font-semibold text-on-surface-variant">Click to upload or drag and drop</p>
                      <p className="text-xs text-on-surface-variant mt-1">PDF, DOC, DOCX (max 10 MB)</p>
                    </>
                  )}
                </div>
                <input className="hidden" type="file" accept=".pdf,.doc,.docx" onChange={handleCvChange} />
              </label>
              {cvError && <p className="text-error text-xs mt-1 font-semibold">{cvError}</p>}
              <p className="text-on-surface-variant text-xs mt-2 italic">Uploading a CV is optional but recommended to help mentors better understand your background.</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">Review & Submit</h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-surface-container-high rounded-xl p-4 sm:p-5 border border-outline-variant/10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-on-surface">Account Information</h3>
                  <button type="button" onClick={() => setCurrentStep(1)} className="text-xs sm:text-sm font-semibold text-primary hover:underline">Edit</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-on-surface-variant">Full Name</p>
                    <p className="font-semibold text-on-surface">{form.name}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant">Email</p>
                    <p className="font-semibold text-on-surface">{form.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-high rounded-xl p-4 sm:p-5 border border-outline-variant/10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-on-surface">Professional Details</h3>
                  <button type="button" onClick={() => setCurrentStep(2)} className="text-xs sm:text-sm font-semibold text-primary hover:underline">Edit</button>
                </div>
                <div className="text-sm">
                  <p className="text-on-surface-variant">LinkedIn</p>
                  <p className="font-semibold text-on-surface truncate">{form.linkedIn}</p>
                </div>
              </div>

              <div className="bg-surface-container-high rounded-xl p-4 sm:p-5 border border-outline-variant/10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-on-surface">CV / Resume</h3>
                  <button type="button" onClick={() => setCurrentStep(3)} className="text-xs sm:text-sm font-semibold text-primary hover:underline">Edit</button>
                </div>
                <div className="text-sm">
                  {cvFile ? (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">description</span>
                      <div>
                        <p className="font-semibold text-on-surface">{cvFile.name}</p>
                        <p className="text-on-surface-variant text-xs">{(cvFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-on-surface-variant italic">No file uploaded (optional)</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-surface overflow-hidden">
      {/* Left Side — Brand Story */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] bg-gradient-to-br from-primary to-primary-fixed relative overflow-hidden flex-col justify-between p-8 xl:p-10">
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
      <div className="flex-1 flex flex-col h-full lg:h-screen">
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
        </div>

        {/* Progress Stepper */}
        <div className="px-3 sm:px-4 lg:px-10 py-3 sm:py-4 border-b border-outline-variant/10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              {STEPS.map((step, idx) => (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                      currentStep > step.id
                        ? 'bg-success text-on-success'
                        : currentStep === step.id
                        ? 'bg-primary text-on-primary shadow-lg shadow-primary/30'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {currentStep > step.id ? (
                        <span className="material-symbols-outlined text-[16px] sm:text-[20px]">check</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px] sm:text-[20px]">{step.icon}</span>
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold mt-1.5 sm:mt-2 hidden md:block ${
                      currentStep >= step.id ? 'text-primary' : 'text-on-surface-variant'
                    }`}>{step.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 sm:h-1 mx-1.5 sm:mx-3 rounded-full transition-all duration-500 ${
                      currentStep > step.id ? 'bg-success' : 'bg-surface-container-high'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 px-3 sm:px-4 lg:px-10 py-5 sm:py-8">
          <div className="max-w-2xl mx-auto">
            {apiError && (
              <div className="mb-6 p-4 bg-error/10 border border-error text-error rounded-lg text-sm font-semibold">
                {apiError}
              </div>
            )}

            <form onSubmit={handleRegister} noValidate>
              <div className="bg-surface-container-low p-5 sm:p-8 rounded-2xl shadow-sm border border-outline-variant/10">
                {renderStepContent()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-6 sm:mt-8 gap-3 sm:gap-4">
                {currentStep > 1 ? (
                  <button type="button" onClick={handleBack} className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border border-outline-variant/20 text-on-surface font-semibold text-sm sm:text-base hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_back</span>
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <button type="button" onClick={handleNext} className="flex items-center gap-1.5 sm:gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg bg-primary text-on-primary font-bold text-sm sm:text-base hover:scale-[1.01] active:scale-[0.98] transition-all shadow-md">
                    Next
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_forward</span>
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className="flex items-center gap-1.5 sm:gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg bg-primary text-on-primary font-bold text-sm sm:text-base hover:scale-[1.01] active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
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
                )}
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}

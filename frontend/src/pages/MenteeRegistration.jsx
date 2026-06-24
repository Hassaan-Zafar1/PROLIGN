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

export default function MenteeRegistration({ navigateTo }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', linkedIn: '' });
  const [cvFile, setCvFile] = useState(null);
  const [cvError, setCvError] = useState('');
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(
        form.email, 
        form.password, 
        'mentee', 
        {
          name: form.name,
          linkedIn: form.linkedIn,
          cv: cvFile 
        }
      );
      
      // Pass route label and state data context up to your customized app engine
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

  return (
    <div className="w-full bg-surface px-4 py-10 md:px-10">
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => navigateTo('home')} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Home
        </button>
        <div className="mb-10 flex items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-sm font-bold text-on-primary-container">
            <span className="material-symbols-outlined text-[18px]">school</span>
            Mentee Registration
          </span>
        </div>
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Start Your Growth Journey</h1>
          <p className="text-on-surface-variant max-w-2xl text-lg">Create your free account to connect with expert mentors who will help you achieve your goals.</p>
        </div>

        {apiError && (
          <div className="mb-6 p-4 bg-error/10 border border-error text-error rounded-lg text-sm font-semibold">
            {apiError}
          </div>
        )}

        <form className="space-y-8" onSubmit={handleRegister} noValidate>
          <section className="space-y-6 bg-surface-container-low p-8 rounded-xl border border-outline-variant/10 natural-shadow">
            <h2 className="text-2xl font-bold text-primary">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          </section>

          <section className="space-y-6 bg-surface-container-low p-8 rounded-xl border border-outline-variant/10 natural-shadow">
            <h2 className="text-2xl font-bold text-primary">Professional Details</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">LinkedIn Profile URL <span className="text-error">*</span></label>
                <div className="relative">
                  <input className={`${inputClass('linkedIn')} pl-10`} placeholder="linkedin.com/in/your-profile" type="url" value={form.linkedIn} onChange={e => set('linkedIn', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, linkedIn: true }))} required />
                  <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant/60 text-[18px]">link</span>
                </div>
                {renderError('linkedIn')}
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Curriculum Vitae <span className="text-on-surface-variant text-xs font-normal">(Optional)</span></label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-outline-variant/40 rounded-lg cursor-pointer bg-surface-dim hover:bg-secondary-container/10 transition-colors">
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
          </section>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold hover:scale-[1.01] transition-all shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <button type="button" onClick={() => navigateTo('login')} className="font-medium text-primary hover:text-primary-container transition-colors">Log in</button>
          </p>
        </form>
      </div>
    </div>
  );
}
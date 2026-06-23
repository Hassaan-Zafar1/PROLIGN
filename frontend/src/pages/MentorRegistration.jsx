import { useState, useRef } from 'react';
import { getDB } from '../utils/db';

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

const MentorRegistration = ({ navigateTo }) => {
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', linkedIn: '', hourlyRate: '' });
  const [cvFile, setCvFile] = useState(null);
  const [cvError, setCvError] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const emailExists = (email) => {
    const db = getDB();
    return db.users.some(u => u.email?.toLowerCase() === email.toLowerCase());
  };

  const validate = () => {
    const errs = {};
    const { name, email, password, confirmPassword, linkedIn } = form;

    if (!name.trim()) errs.name = 'Name is required.';
    else if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
    else if (name.trim().length > 100) errs.name = 'Name must be under 100 characters.';

    if (!email.trim()) errs.email = 'Email is required.';
    else if (!validateEmail(email)) errs.email = 'Enter a valid email address.';
    else if (emailExists(email)) errs.email = 'This email is already registered.';

    const pwdErrors = validatePassword(password);
    if (!password) errs.password = 'Password is required.';
    else if (pwdErrors.length > 0) errs.password = `Password must contain: ${pwdErrors.join(', ')}.`;

    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';

    if (!linkedIn.trim()) errs.linkedIn = 'LinkedIn profile URL is required.';
    else if (!validateLinkedIn(linkedIn)) errs.linkedIn = 'Please enter a valid LinkedIn profile URL.';

    if (!cvFile) errs.cv = 'CV/Resume is required.';
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

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const errs = { ...errors };
    const nameVal = form.name;
    if (field === 'name' && touched.name) {
      if (!nameVal.trim()) errs.name = 'Name is required.';
      else if (nameVal.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
      else if (nameVal.trim().length > 100) errs.name = 'Name must be under 100 characters.';
      else delete errs.name;
    }
    setErrors(errs);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) otpRefs[index + 1].current.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs[index - 1].current.focus();
  };

  const handleSubmitApplication = () => {
    if (validate()) setStep('otp');
  };

  const handleVerifyOtp = () => {
    if (otp.join('').length === 4) { setStep('success'); window.scrollTo(0, 0); }
  };

  const inputClass = (field) =>
    `w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50 outline-none ${
      errors[field] && touched[field] ? 'ring-2 ring-error' : ''
    }`;

  const renderError = (field) => errors[field] && touched[field] ? <p className="text-error text-xs mt-1 font-semibold">{errors[field]}</p> : null;

  if (step === 'success') {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center max-w-lg">
          <div className="relative w-48 h-48 mx-auto mb-8">
            <div className="absolute inset-0 bg-secondary/10 rounded-full animate-ping"></div>
            <div className="relative bg-secondary text-on-primary w-48 h-48 rounded-full flex items-center justify-center shadow-xl">
              <span className="material-symbols-outlined text-6xl fill-icon">assignment_turned_in</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-primary mb-4">Application Submitted — Under Review</h2>
          <div className="flex justify-center mb-6">
            <span className="bg-surface-dim text-on-surface px-6 py-2 rounded-full font-bold flex items-center gap-2 border border-outline-variant">
              <span className="w-2 h-2 bg-on-tertiary-container rounded-full animate-pulse"></span>
              Pending Review
            </span>
          </div>
          <p className="text-on-surface-variant mb-8 leading-relaxed">
            Thank you for your interest in ProLign. Our curation team will review your credentials and get back to you within 3-5 business days via email.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button onClick={() => navigateTo('home')} className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold shadow-md hover:scale-[1.02] transition-transform">Back to Home</button>
            <button onClick={() => navigateTo('discovery')} className="px-8 py-3 border-2 border-secondary text-secondary rounded-lg font-bold hover:bg-secondary/5 transition-colors">Browse Marketplace</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface px-4 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => navigateTo('home')} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Home
        </button>
        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2 text-sm font-bold text-on-secondary-container">
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              Mentor Application
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Join as a Mentor</h1>
            <p className="text-on-surface-variant max-w-xl text-lg">Share your wisdom and shape the next generation of industry leaders.</p>
          </div>
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-5 natural-shadow">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined rounded-lg bg-primary-fixed p-3 text-on-primary-fixed">verified_user</span>
              <div>
                <h2 className="text-xl font-bold text-on-surface">Curated mentor review</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Credentials, expertise, availability, and pricing help admins approve the right mentors.</p>
              </div>
            </div>
          </div>
        </div>

        <form className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch" onSubmit={(e) => e.preventDefault()} noValidate>
          {/* Personal Information */}
          <section className="space-y-6 bg-surface-container-low p-8 rounded-xl shadow-sm border border-outline-variant/10 natural-shadow h-full">
            <h2 className="text-2xl font-bold text-primary mb-6">Personal Identity</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Full Name <span className="text-error">*</span></label>
                <input className={inputClass('name')} placeholder="Dr. Julian Thorne" type="text" value={form.name} onChange={e => set('name', e.target.value)} onBlur={() => handleBlur('name')} required />
                {renderError('name')}
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Email Address <span className="text-error">*</span></label>
                <input className={inputClass('email')} placeholder="julian@prolign.edu" type="email" value={form.email} onChange={e => set('email', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, email: true }))} required />
                {renderError('email')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Password <span className="text-error">*</span></label>
                  <input className={inputClass('password')} placeholder="••••••••" type="password" value={form.password} onChange={e => set('password', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, password: true }))} required />
                  {renderError('password')}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Confirm Password <span className="text-error">*</span></label>
                  <input className={inputClass('confirmPassword')} placeholder="••••••••" type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))} required />
                  {renderError('confirmPassword')}
                </div>
              </div>
            </div>
            <div className="pt-4 relative overflow-hidden rounded-lg">
              <div className="flex items-center gap-4 text-on-surface-variant p-4 bg-surface-container-high rounded-lg">
                <span className="material-symbols-outlined text-secondary">verified_user</span>
                <p className="text-sm font-semibold">Identity verification will be required after application approval.</p>
              </div>
            </div>
          </section>

          {/* Professional Credentials */}
          <section className="space-y-6 bg-surface-container-low p-8 rounded-xl shadow-sm border border-outline-variant/10 natural-shadow h-full flex flex-col">
            <h2 className="text-2xl font-bold text-primary mb-6">Professional Credentials</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">LinkedIn Profile URL <span className="text-error">*</span></label>
                <div className="relative">
                  <input className={`${inputClass('linkedIn')} pl-10`} placeholder="linkedin.com/in/username" type="url" value={form.linkedIn} onChange={e => set('linkedIn', e.target.value)} onBlur={() => setTouched(prev => ({ ...prev, linkedIn: true }))} required />
                  <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant/60">link</span>
                </div>
                {renderError('linkedIn')}
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Curriculum Vitae (PDF, DOC, DOCX) <span className="text-error">*</span></label>
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-surface-dim hover:bg-secondary-container/10 transition-colors ${errors.cv && touched.cv ? 'border-error' : 'border-secondary'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {cvFile ? (
                      <>
                        <span className="material-symbols-outlined text-secondary mb-2">description</span>
                        <p className="text-sm font-semibold text-on-surface">{cvFile.name}</p>
                        <p className="text-xs text-on-surface-variant mt-1">{(cvFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-secondary mb-2">cloud_upload</span>
                        <p className="text-sm font-semibold text-on-surface-variant">Click to upload or drag and drop</p>
                        <p className="text-xs text-on-surface-variant mt-1">PDF, DOC, DOCX (max 10 MB)</p>
                      </>
                    )}
                  </div>
                  <input className="hidden" type="file" accept=".pdf,.doc,.docx" onChange={handleCvChange} onClick={() => setTouched(prev => ({ ...prev, cv: true }))} />
                </label>
                {cvError && <p className="text-error text-xs mt-1 font-semibold">{cvError}</p>}
                {renderError('cv')}
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Hourly Rate (USD) <span className="text-error">*</span></label>
                <div className="relative">
                  <input className="w-full bg-surface-dim border-none rounded-lg p-3 pl-8 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all outline-none" placeholder="120" type="number" value={form.hourlyRate} onChange={e => set('hourlyRate', e.target.value)} required />
                  <span className="absolute left-3 top-3 text-on-surface-variant font-bold">$</span>
                </div>
              </div>
            </div>
            <div className="pt-6 mt-auto">
              <button className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold hover:scale-[1.01] active:scale-[0.98] transition-all shadow-md text-lg" onClick={handleSubmitApplication} type="button">Submit Application</button>
            </div>
          </section>
        </form>

        {/* OTP Modal */}
        {step === 'otp' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-on-background/40 backdrop-blur-sm">
            <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-8 shadow-2xl animate-fade-in relative">
              <button onClick={() => setStep('form')} className="absolute top-4 right-4 text-on-surface-variant hover:text-error transition-colors"><span className="material-symbols-outlined">close</span></button>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-4"><span className="material-symbols-outlined text-secondary text-3xl">mail</span></div>
                <h3 className="text-2xl font-bold text-primary">Verify Email</h3>
                <p className="text-on-surface-variant mt-2">Enter the 4-digit code sent to your email.</p>
              </div>
              <div className="flex justify-center gap-4 mb-8">
                {otp.map((digit, index) => (
                  <input key={index} ref={otpRefs[index]} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} className="w-14 h-16 bg-surface-container-high border-2 border-transparent focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-center text-2xl font-bold rounded-xl transition-all" maxLength="1" type="text" />
                ))}
              </div>
              <button className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold hover:opacity-90 transition-opacity" onClick={handleVerifyOtp}>Verify & Continue</button>
              <p className="text-center mt-4 text-sm font-semibold text-on-surface-variant">Didn't receive a code? <button className="text-secondary font-bold hover:underline">Resend</button></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorRegistration;

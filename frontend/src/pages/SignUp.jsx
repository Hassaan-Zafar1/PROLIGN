import React, { useState } from 'react';
// import { addMentee, login } from '../utils/db';

const SignUp = ({ navigateTo }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'mentee' // Default to mentee for this flow
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single character
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError('');
    
    // OTP verification disabled for now.
    // Create mentee in DB immediately
    addMentee({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
    
    // Navigate to onboarding
    navigateTo('onboarding');
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError("Please enter a 6-digit OTP.");
      return;
    }
    
    // Create mentee in DB
    addMentee({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
    
    // Navigate to onboarding
    navigateTo('onboarding');
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
          <span className="material-symbols-outlined text-primary text-5xl mb-4">person_add</span>
          <h2 className="text-3xl font-headline-md font-bold text-on-surface">
            {step === 1 ? 'Create Account' : 'Verify Email'}
          </h2>
          <p className="text-on-surface-variant mt-2">
            {step === 1 ? 'Join MentorBridge and accelerate your career.' : `We sent an OTP to ${formData.email}`}
          </p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 text-sm flex items-center space-x-2">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-surface-bright"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-surface-bright"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-surface-bright"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-surface-bright"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary-container transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Continue</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="space-y-8">
            <div className="flex justify-between space-x-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-surface-bright"
                  maxLength={1}
                />
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary-container transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Verify & Continue</span>
              <span className="material-symbols-outlined text-sm">check_circle</span>
            </button>

            <div className="text-center">
              <button 
                type="button"
                className="text-sm font-medium text-primary hover:text-primary-container transition-colors"
                onClick={() => setOtp(['', '', '', '', '', ''])}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Already have an account?{' '}
              <button onClick={() => navigateTo('login')} className="font-medium text-primary hover:text-primary-container transition-colors">
                Log in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;

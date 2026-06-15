/**
 * Mentee SignUp Page Component
 * Registration page for mentees to create an account
 * 
 * Mock data templates: MENTEE_PROFILE_TEMPLATE, INDUSTRIES, EXPERIENCE_LEVELS from mockData.js
 * 
 * TODO: Replace with API POST /api/auth/register-mentee
 * Expected request: { fullName, email, password, careerGoals, industry, experience, skills, budget }
 * Expected response: { token, user: { id, email, role, name } }
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';
import OTPModal from '../components/OTPModal';
import SuccessModal from '../components/SuccessModal';
import { INDUSTRIES, EXPERIENCE_LEVELS, EXPERTISE_OPTIONS } from '../constants/mockData';

export default function SignUp() {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    careerGoals: '',
    industry: '',
    experience: 'junior',
    skills: [],
    budget: 0
  });

  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [otpOpen, setOtpOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add skill/tag
  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  // Remove skill/tag
  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.careerGoals.trim()) newErrors.careerGoals = 'Career goals are required';
    if (!formData.industry) newErrors.industry = 'Industry is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/register-mentee', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message);

      // Mock registration - show OTP verification
      setOtpOpen(true);
    } catch (err) {
      setErrors({ submit: err.message || 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOTPVerify = (otpCode) => {
    // TODO: Verify OTP with backend: POST /api/auth/verify-otp
    // For now, just show success
    setOtpOpen(false);
    setSuccessOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <TopNavBar isHome={false} />

      <main className="flex-grow w-full max-w-container-max mx-auto px-gutter py-loose">
        {/* Header */}
        <div className="mb-loose max-w-2xl">
          <h1 className="font-headline-xl text-headline-xl text-primary mb-4">
            Join as a Mentee
          </h1>
          <p className="text-on-surface-variant max-w-xl">
            Find the perfect mentor to guide your career journey. Complete your profile to get matched with industry experts.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Personal Information */}
          <section className="space-y-base bg-surface-container-low p-base rounded-xl shadow-natural border border-outline-variant/10">
            <h2 className="font-headline-md text-headline-md text-primary mb-tight">
              Personal Information
            </h2>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="group">
                <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50"
                />
                {errors.fullName && (
                  <p className="text-error text-caption mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div className="group">
                <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50"
                />
                {errors.email && (
                  <p className="text-error text-caption mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50"
                  />
                  {errors.password && (
                    <p className="text-error text-caption mt-1">{errors.password}</p>
                  )}
                </div>

                <div className="group">
                  <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50"
                  />
                  {errors.confirmPassword && (
                    <p className="text-error text-caption mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="pt-tight relative overflow-hidden rounded-lg">
              <div className="flex items-center gap-4 text-on-surface-variant p-4 bg-surface-container-high rounded-lg">
                <span className="material-symbols-outlined text-secondary flex-shrink-0">
                  info
                </span>
                <p className="font-label-sm text-label-sm">
                  Your profile information will be kept confidential and secure.
                </p>
              </div>
            </div>
          </section>

          {/* Right Column: Career Information */}
          <section className="space-y-base bg-surface-container-low p-base rounded-xl shadow-natural border border-outline-variant/10">
            <h2 className="font-headline-md text-headline-md text-primary mb-tight">
              Career Profile
            </h2>

            <div className="space-y-6">
              {/* Career Goals */}
              <div className="group">
                <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                  Career Goals
                </label>
                <textarea
                  name="careerGoals"
                  value={formData.careerGoals}
                  onChange={handleInputChange}
                  placeholder="Describe your short-term and long-term career aspirations..."
                  rows="3"
                  className="w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50 resize-none"
                />
                {errors.careerGoals && (
                  <p className="text-error text-caption mt-1">{errors.careerGoals}</p>
                )}
              </div>

              {/* Industry */}
              <div className="group">
                <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                  Industry
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all"
                >
                  <option value="">Select an industry...</option>
                  {/* TODO: Replace with API call: GET /api/industries */}
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="text-error text-caption mt-1">{errors.industry}</p>
                )}
              </div>

              {/* Experience Level */}
              <div className="group">
                <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                  Experience Level
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all"
                >
                  {/* TODO: Replace with API call: GET /api/experience-levels */}
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div className="group">
                <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                  Monthly Budget (USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder="500"
                    min="0"
                    className="w-full bg-surface-dim border-none rounded-lg p-3 pl-8 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all"
                  />
                  <span className="absolute left-3 top-3 text-on-surface-variant font-bold">
                    $
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold hover:scale-[1.01] active:scale-[0.98] transition-all shadow-natural disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Login Link */}
            <p className="text-center font-body-md text-body-md text-on-surface-variant">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-secondary font-bold hover:underline"
              >
                Sign in here
              </button>
            </p>
          </section>
        </form>
      </main>

      {/* OTP Modal */}
      <OTPModal
        isOpen={otpOpen}
        email={formData.email}
        onVerify={handleOTPVerify}
        onClose={() => setOtpOpen(false)}
        onResend={() => {
          // TODO: API call to resend OTP
          console.log('Resend OTP');
        }}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={successOpen}
        title="Account Created Successfully!"
        message="Welcome to MentorBridge! Your profile has been created. You can now browse mentors and book your first session."
        onHome={() => navigate('/')}
        onBrowse={() => navigate('/mentors')}
      />

      <Footer />
    </div>
  );
}

/**
 * Mentor Registration Page Component
 * Registration page for mentors to create an account and submit application
 * 
 * Mock data templates: MENTOR_PROFILE_TEMPLATE, EXPERTISE_OPTIONS from mockData.js
 * 
 * TODO: Replace with API POST /api/auth/register-mentor
 * Expected request: { fullName, email, password, linkedinUrl, cvFile, expertise, yearsOfExperience, hourlyRate }
 * Expected response: { token, user: { id, email, role: 'mentor', name }, applicationStatus: 'pending' }
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';
import OTPModal from '../components/OTPModal';
import SuccessModal from '../components/SuccessModal';
import { EXPERTISE_OPTIONS } from '../constants/mockData';

export default function MentorRegistration() {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    linkedinUrl: '',
    cvFile: null,
    expertise: [],
    yearsOfExperience: 5,
    hourlyRate: 120,
    bio: ''
  });

  const [expertiseInput, setExpertiseInput] = useState('');
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

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Validate file type and size
      // - Allowed: PDF, DOC, DOCX
      // - Max size: 5MB
      setFormData(prev => ({
        ...prev,
        cvFile: file
      }));
    }
  };

  // Add expertise
  const addExpertise = () => {
    if (expertiseInput.trim() && !formData.expertise.includes(expertiseInput.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, expertiseInput.trim()]
      }));
      setExpertiseInput('');
    }
  };

  // Remove expertise
  const removeExpertise = (expertise) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e !== expertise)
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
    if (!formData.linkedinUrl.trim()) newErrors.linkedinUrl = 'LinkedIn profile URL is required';
    // LinkedIn and CV/Resume are optional for mentees but required for mentors
    if (formData.expertise.length === 0) newErrors.expertise = 'At least one expertise domain is required';
    if (formData.hourlyRate < 10) newErrors.hourlyRate = 'Hourly rate must be at least $10';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call with FormData for file upload
      // const formDataToSend = new FormData();
      // formDataToSend.append('fullName', formData.fullName);
      // formDataToSend.append('email', formData.email);
      // formDataToSend.append('password', formData.password);
      // formDataToSend.append('linkedinUrl', formData.linkedinUrl);
      // formDataToSend.append('expertise', JSON.stringify(formData.expertise));
      // formDataToSend.append('yearsOfExperience', formData.yearsOfExperience);
      // formDataToSend.append('hourlyRate', formData.hourlyRate);
      // if (formData.cvFile) formDataToSend.append('cvFile', formData.cvFile);
      //
      // const response = await fetch('/api/auth/register-mentor', {
      //   method: 'POST',
      //   body: formDataToSend
      // });

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
            Join as a Mentor
          </h1>
          <p className="text-on-surface-variant max-w-xl">
            Share your wisdom and shape the next generation of industry leaders. Our application process ensures a high-quality environment for both mentors and mentees.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Personal Information */}
          <section className="space-y-base bg-surface-container-low p-base rounded-xl shadow-natural border border-outline-variant/10">
            <h2 className="font-headline-md text-headline-md text-primary mb-tight">
              Personal Identity
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
                  placeholder="Dr. Julian Thorne"
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
                  placeholder="julian@mentorbridge.edu"
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
                  verified_user
                </span>
                <p className="font-label-sm text-label-sm">
                  Identity verification will be required after application approval.
                </p>
              </div>
            </div>
          </section>

          {/* Right Column: Professional Experience */}
          <section className="space-y-base bg-surface-container-low p-base rounded-xl shadow-natural border border-outline-variant/10">
            <h2 className="font-headline-md text-headline-md text-primary mb-tight">
              Professional Credentials
            </h2>

            <div className="space-y-6">
              {/* LinkedIn URL */}
              <div className="group">
                <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                  LinkedIn Profile URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleInputChange}
                    placeholder="linkedin.com/in/username"
                    className="w-full bg-surface-dim border-none rounded-lg p-3 pl-10 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant/60">
                    link
                  </span>
                </div>
                {errors.linkedinUrl && (
                  <p className="text-error text-caption mt-1">{errors.linkedinUrl}</p>
                )}
              </div>

              {/* CV File Upload */}
              <div className="group">
                <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                  Curriculum Vitae (PDF)
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-secondary rounded-lg cursor-pointer bg-surface-dim hover:bg-secondary-container/10 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <span className="material-symbols-outlined text-secondary mb-2">
                      cloud_upload
                    </span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Click to upload or drag and drop
                    </p>
                    {formData.cvFile && (
                      <p className="font-caption text-caption text-secondary mt-1">
                        {formData.cvFile.name}
                      </p>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Expertise Domains */}
              <div className="group">
                <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                  Expertise Domains
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-surface-dim rounded-lg min-h-[48px]">
                  {/* TODO: Replace with API call: GET /api/expertise-tags */}
                  {formData.expertise.map((exp) => (
                    <span
                      key={exp}
                      className="inline-flex items-center px-3 py-1 bg-secondary text-on-primary rounded-full font-label-sm text-label-sm gap-2"
                    >
                      {exp}
                      <button
                        type="button"
                        onClick={() => removeExpertise(exp)}
                        className="material-symbols-outlined text-[16px] hover:opacity-70 transition-opacity"
                      >
                        close
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addExpertise();
                      }
                    }}
                    placeholder="+ Add tag"
                    className="bg-transparent border-none focus:ring-0 font-label-sm text-label-sm min-w-[80px] outline-none"
                  />
                </div>
                {errors.expertise && (
                  <p className="text-error text-caption mt-1">{errors.expertise}</p>
                )}
              </div>

              {/* Years of Experience & Hourly Rate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group">
                  <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                    Years of Experience: <span className="text-secondary font-bold">{formData.yearsOfExperience}</span>
                  </label>
                  <input
                    type="range"
                    name="yearsOfExperience"
                    min="1"
                    max="40"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-surface-dim rounded-lg appearance-none cursor-pointer accent-secondary"
                  />
                </div>

                <div className="group">
                  <label className="block font-label-sm text-label-sm text-on-surface mb-2">
                    Hourly Rate (USD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      placeholder="120"
                      min="10"
                      className="w-full bg-surface-dim border-none rounded-lg p-3 pl-8 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all"
                    />
                    <span className="absolute left-3 top-3 text-on-surface-variant font-bold">
                      $
                    </span>
                  </div>
                  {errors.hourlyRate && (
                    <p className="text-error text-caption mt-1">{errors.hourlyRate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold hover:scale-[1.01] active:scale-[0.98] transition-all shadow-natural disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </button>
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
        title="Application Submitted — Under Review"
        message="Thank you for your interest in MentorBridge. Our curation team will review your credentials and get back to you within 3-5 business days via email."
        onHome={() => navigate('/')}
        onBrowse={() => navigate('/mentees')}
      />

      <Footer />
    </div>
  );
}

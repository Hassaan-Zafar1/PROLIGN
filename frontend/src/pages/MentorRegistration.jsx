import React, { useState, useRef } from 'react';

const MentorRegistration = ({ navigateTo }) => {
  const [step, setStep] = useState('form'); // 'form', 'otp', 'success'
  const [experience, setExperience] = useState(8);
  const [tags, setTags] = useState(['UI Design', 'Strategy']);
  const [newTag, setNewTag] = useState('');
  
  // OTP state
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single character
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleSubmitApplication = () => {
    // In a real app, validate form data here
    setStep('otp');
  };

  const handleVerifyOtp = () => {
    const otpString = otp.join('');
    if (otpString.length === 4) {
      setStep('success');
      window.scrollTo(0, 0);
    }
  };

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
          <h2 className="font-headline-xl text-3xl font-bold text-primary mb-4">Application Submitted — Under Review</h2>
          <div className="flex justify-center mb-6">
            <span className="bg-surface-dim text-on-surface px-6 py-2 rounded-full font-bold flex items-center gap-2 border border-outline-variant">
              <span className="w-2 h-2 bg-on-tertiary-container rounded-full animate-pulse"></span>
              Pending Review
            </span>
          </div>
          <p className="text-on-surface-variant font-body-md mb-8 leading-relaxed">
            Thank you for your interest in MentorBridge. Our curation team will review your credentials and get back to you within 3-5 business days via email.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigateTo('home')}
              className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold shadow-md hover:scale-[1.02] transition-transform"
            >
              Back to Home
            </button>
            <button 
              onClick={() => navigateTo('discovery')}
              className="px-8 py-3 border-2 border-secondary text-secondary rounded-lg font-bold hover:bg-secondary/5 transition-colors"
            >
              Browse Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface px-4 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
      <button
        type="button"
        onClick={() => navigateTo('home')}
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Home
      </button>
      <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2 text-sm font-bold text-on-secondary-container">
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            Mentor Application
          </span>
          <h1 className="font-headline-xl text-4xl md:text-5xl font-bold text-primary mb-4">Join as a Mentor</h1>
          <p className="text-on-surface-variant max-w-xl text-lg">
            Share your wisdom and shape the next generation of industry leaders. Our application process ensures a high-quality environment for both mentors and mentees.
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-5 natural-shadow">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined rounded-lg bg-primary-fixed p-3 text-primary">verified_user</span>
            <div>
              <h2 className="font-headline-md text-xl font-bold text-on-surface">Curated mentor review</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Credentials, expertise, availability, and pricing help admins approve the right mentors for the marketplace.
              </p>
            </div>
          </div>
        </div>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch" onSubmit={(e) => e.preventDefault()}>
        {/* Left Column: Personal Information */}
        <section className="space-y-6 bg-surface-container-low p-8 rounded-xl shadow-sm border border-outline-variant/10 natural-shadow h-full">
          <h2 className="font-headline-md text-2xl font-bold text-primary mb-6">Personal Identity</h2>
          <div className="space-y-4">
            <div className="group">
              <label className="block font-label-sm text-sm font-semibold text-on-surface mb-2">Full Name</label>
              <input 
                className="w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50 outline-none" 
                placeholder="Dr. Julian Thorne" 
                type="text"
              />
            </div>
            <div className="group">
              <label className="block font-label-sm text-sm font-semibold text-on-surface mb-2">Email Address</label>
              <input 
                className="w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50 outline-none" 
                placeholder="julian@mentorbridge.edu" 
                type="email"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group">
                <label className="block font-label-sm text-sm font-semibold text-on-surface mb-2">Password</label>
                <input 
                  className="w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50 outline-none" 
                  placeholder="••••••••" 
                  type="password"
                />
              </div>
              <div className="group">
                <label className="block font-label-sm text-sm font-semibold text-on-surface mb-2">Confirm Password</label>
                <input 
                  className="w-full bg-surface-dim border-none rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50 outline-none" 
                  placeholder="••••••••" 
                  type="password"
                />
              </div>
            </div>
          </div>
          <div className="pt-4 relative overflow-hidden rounded-lg">
            <div className="flex items-center gap-4 text-on-surface-variant p-4 bg-surface-container-high rounded-lg">
              <span className="material-symbols-outlined text-secondary">verified_user</span>
              <p className="font-label-sm text-sm font-semibold">Identity verification will be required after application approval.</p>
            </div>
          </div>
        </section>

        {/* Right Column: Professional Experience */}
        <section className="space-y-6 bg-surface-container-low p-8 rounded-xl shadow-sm border border-outline-variant/10 natural-shadow h-full flex flex-col">
          <h2 className="font-headline-md text-2xl font-bold text-primary mb-6">Professional Credentials</h2>
          <div className="space-y-6">
            <div className="group">
              <label className="block font-label-sm text-sm font-semibold text-on-surface mb-2">LinkedIn Profile URL</label>
              <div className="relative">
                <input 
                  className="w-full bg-surface-dim border-none rounded-lg p-3 pl-10 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all placeholder:text-on-surface-variant/50 outline-none" 
                  placeholder="linkedin.com/in/username" 
                  type="url"
                />
                <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant/60">link</span>
              </div>
            </div>
            <div className="group">
              <label className="block font-label-sm text-sm font-semibold text-on-surface mb-2">Curriculum Vitae (PDF)</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-secondary rounded-lg cursor-pointer bg-surface-dim hover:bg-secondary-container/10 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <span className="material-symbols-outlined text-secondary mb-2">cloud_upload</span>
                  <p className="font-label-sm text-sm font-semibold text-on-surface-variant">Click to upload or drag and drop</p>
                </div>
                <input className="hidden" type="file"/>
              </label>
            </div>
            <div className="group">
              <label className="block font-label-sm text-sm font-semibold text-on-surface mb-2">Expertise Domains</label>
              <div className="flex flex-wrap items-center gap-2 p-2 bg-surface-dim rounded-lg min-h-[48px]">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-3 py-1 bg-secondary text-on-primary rounded-full font-label-sm text-sm font-semibold gap-2">
                    {tag} 
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Remove ${tag}`}
                      className="material-symbols-outlined flex h-5 w-5 items-center justify-center rounded-full bg-on-primary text-[15px] !text-secondary hover:bg-error hover:!text-on-error transition-colors"
                    >
                      close
                    </button>
                  </span>
                ))}
                <input 
                  className="bg-transparent border-none focus:ring-0 font-label-sm text-sm font-semibold min-w-[140px] flex-1 outline-none ml-2 text-on-surface placeholder:text-on-surface-variant/80" 
                  placeholder="+ Add tag & press Enter" 
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group">
                <label className="block font-label-sm text-sm font-semibold text-on-surface mb-2">Years of Experience: <span className="text-secondary font-bold">{experience}</span></label>
                <input 
                  className="w-full h-2 bg-surface-dim rounded-lg appearance-none cursor-pointer accent-secondary" 
                  max="40" min="1" 
                  type="range" 
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>
              <div className="group">
                <label className="block font-label-sm text-sm font-semibold text-on-surface mb-2">Hourly Rate (USD)</label>
                <div className="relative">
                  <input 
                    className="w-full bg-surface-dim border-none rounded-lg p-3 pl-8 text-on-surface focus:ring-2 focus:ring-secondary/50 transition-all outline-none" 
                    placeholder="120" 
                    type="number"
                  />
                  <span className="absolute left-3 top-3 text-on-surface-variant font-bold">$</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 mt-auto">
            <button 
              className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold hover:scale-[1.01] active:scale-[0.98] transition-all shadow-md text-lg" 
              onClick={handleSubmitApplication} 
              type="button"
            >
              Submit Application
            </button>
          </div>
        </section>
      </form>
      {/* OTP Modal */}
      {step === 'otp' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-on-background/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-8 shadow-2xl animate-fade-in relative">
            <button 
              onClick={() => setStep('form')}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-secondary text-3xl">mail</span>
              </div>
              <h3 className="font-headline-md text-2xl font-bold text-primary">Verify Email</h3>
              <p className="text-on-surface-variant font-body-md mt-2">Enter the 4-digit code sent to your email.</p>
            </div>
            <div className="flex justify-center gap-4 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={otpRefs[index]}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-14 h-16 bg-surface-container-high border-2 border-transparent focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-center text-2xl font-bold rounded-xl transition-all"
                  maxLength="1"
                  type="text"
                />
              ))}
            </div>
            <button 
              className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold hover:opacity-90 transition-opacity" 
              onClick={handleVerifyOtp}
            >
              Verify & Continue
            </button>
            <p className="text-center mt-4 font-label-sm text-sm font-semibold text-on-surface-variant">
              Didn't receive a code? <button className="text-secondary font-bold hover:underline">Resend</button>
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default MentorRegistration;

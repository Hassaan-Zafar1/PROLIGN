import React, { useState } from 'react';
import { addMentee } from '../utils/db';

const SignUp = ({ navigateTo }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    currentStatus: 'Student',
    institution: '',
    city: '',
    country: '',
    interests: '',
    goals: '',
  });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (Number(formData.age) < 13) {
      setError('Mentees must be at least 13 years old.');
      return;
    }

    addMentee({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      age: Number(formData.age),
      title: formData.currentStatus,
      institution: formData.institution,
      city: formData.city,
      country: formData.country,
      skills: formData.interests.split(',').map((item) => item.trim()).filter(Boolean),
      goals: formData.goals,
    });

    navigateTo('onboarding');
  };

  return (
    <div className="w-full bg-surface px-4 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Home
        </button>

        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2 text-sm font-bold text-on-secondary-container">
              <span className="material-symbols-outlined text-[18px]">school</span>
              Mentee Access
            </span>
            <h1 className="font-headline-xl text-4xl font-bold text-primary md:text-5xl">Join as a Mentee</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-on-surface-variant">
              Build your learning profile so MentorBridge can match you with mentors, goals, and coaching formats that fit your next step.
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-5 natural-shadow">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined rounded-lg bg-primary-fixed p-3 text-primary">tips_and_updates</span>
              <div>
                <h2 className="font-headline-md text-xl font-bold text-on-surface">No mentor-only fields here</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  This mentee signup asks about your age, learning interests, and career goals. Experience years and hourly rates stay on the mentor application.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-error-container p-4 text-sm font-semibold text-on-error-container">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        <form className="grid grid-cols-1 gap-8 lg:grid-cols-2" onSubmit={handleSubmit}>
          <section className="space-y-5 rounded-xl border border-outline-variant/10 bg-surface-container-low p-8 natural-shadow">
            <h2 className="font-headline-md text-2xl font-bold text-primary">Personal Identity</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-on-surface">Full Name</span>
                <input name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border-none bg-surface-dim p-3 outline-none transition-all focus:ring-2 focus:ring-secondary/50" placeholder="Sarah Jenkins" required />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-on-surface">Email Address</span>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border-none bg-surface-dim p-3 outline-none transition-all focus:ring-2 focus:ring-secondary/50" placeholder="you@example.com" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-on-surface">Password</span>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full rounded-lg border-none bg-surface-dim p-3 outline-none transition-all focus:ring-2 focus:ring-secondary/50" placeholder="Password" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-on-surface">Confirm Password</span>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full rounded-lg border-none bg-surface-dim p-3 outline-none transition-all focus:ring-2 focus:ring-secondary/50" placeholder="Confirm password" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-on-surface">Age</span>
                <input type="number" min="13" max="100" name="age" value={formData.age} onChange={handleChange} className="w-full rounded-lg border-none bg-surface-dim p-3 outline-none transition-all focus:ring-2 focus:ring-secondary/50" placeholder="21" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-on-surface">Current Status</span>
                <select name="currentStatus" value={formData.currentStatus} onChange={handleChange} className="w-full rounded-lg border-none bg-surface-dim p-3 outline-none transition-all focus:ring-2 focus:ring-secondary/50">
                  <option>Student</option>
                  <option>Fresh Graduate</option>
                  <option>Professional</option>
                  <option>Career Switcher</option>
                </select>
              </label>
            </div>
          </section>

          <section className="space-y-5 rounded-xl border border-outline-variant/10 bg-surface-container-low p-8 natural-shadow">
            <h2 className="font-headline-md text-2xl font-bold text-primary">Learning Profile</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-on-surface">Institution / Company</span>
                <input name="institution" value={formData.institution} onChange={handleChange} className="w-full rounded-lg border-none bg-surface-dim p-3 outline-none transition-all focus:ring-2 focus:ring-secondary/50" placeholder="University, bootcamp, or workplace" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-on-surface">Country</span>
                <input name="country" value={formData.country} onChange={handleChange} className="w-full rounded-lg border-none bg-surface-dim p-3 outline-none transition-all focus:ring-2 focus:ring-secondary/50" placeholder="Pakistan" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-on-surface">City</span>
                <input name="city" value={formData.city} onChange={handleChange} className="w-full rounded-lg border-none bg-surface-dim p-3 outline-none transition-all focus:ring-2 focus:ring-secondary/50" placeholder="Lahore" />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-on-surface">Areas of Interest</span>
                <input name="interests" value={formData.interests} onChange={handleChange} className="w-full rounded-lg border-none bg-surface-dim p-3 outline-none transition-all focus:ring-2 focus:ring-secondary/50" placeholder="React, Product Design, Data Science" />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-on-surface">Career Goals</span>
                <textarea name="goals" value={formData.goals} onChange={handleChange} className="h-28 w-full resize-none rounded-lg border-none bg-surface-dim p-3 outline-none transition-all focus:ring-2 focus:ring-secondary/50" placeholder="Tell mentors what you want to learn or achieve." />
              </label>
            </div>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-lg font-bold text-on-primary shadow-md transition-all hover:scale-[1.01] active:scale-[0.98]">
              Create Mentee Profile
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </section>
        </form>
      </div>
    </div>
  );
};

export default SignUp;

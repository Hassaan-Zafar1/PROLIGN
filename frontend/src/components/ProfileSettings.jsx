import { useMemo, useRef, useState } from 'react';
import {
  deleteUser,
  getBookingsForUser,
  getCurrentUser,
  getDB,
  getReviewsForMentor,
  getSessions,
  logout,
  saveDB,
} from '../utils/db';

const sectionMap = {
  mentor: [
    { id: 'personal', icon: 'account_circle', label: 'Personal Information' },
    { id: 'security', icon: 'lock', label: 'Account & Security' },
    { id: 'about', icon: 'article', label: 'About Me' },
    { id: 'professional', icon: 'badge', label: 'Professional Profile' },
    { id: 'mentorPreferences', icon: 'psychology', label: 'Mentorship Preferences' },
    { id: 'availability', icon: 'event_available', label: 'Availability' },
    { id: 'social', icon: 'link', label: 'Social Links' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
    { id: 'achievements', icon: 'workspace_premium', label: 'Achievements' },
    { id: 'appearance', icon: 'palette', label: 'Appearance' },
    { id: 'danger', icon: 'warning', label: 'Danger Zone' },
  ],
  mentee: [
    { id: 'personal', icon: 'account_circle', label: 'Personal Information' },
    { id: 'security', icon: 'lock', label: 'Account & Security' },
    { id: 'menteeAbout', icon: 'article', label: 'About Me' },
    { id: 'learning', icon: 'school', label: 'Learning Profile' },
    { id: 'menteePreferences', icon: 'psychology', label: 'Mentorship Preferences' },
    { id: 'social', icon: 'link', label: 'Social Links' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
    { id: 'achievements', icon: 'workspace_premium', label: 'Achievements' },
    { id: 'appearance', icon: 'palette', label: 'Appearance' },
    { id: 'danger', icon: 'warning', label: 'Danger Zone' },
  ],
  admin: [
    { id: 'personal', icon: 'account_circle', label: 'Personal Information' },
    { id: 'security', icon: 'lock', label: 'Account & Security' },
    { id: 'about', icon: 'article', label: 'About Me' },
    { id: 'adminPreferences', icon: 'admin_panel_settings', label: 'Administration Preferences' },
    { id: 'adminNotifications', icon: 'notifications', label: 'Notifications' },
    { id: 'appearance', icon: 'palette', label: 'Appearance' },
    { id: 'danger', icon: 'warning', label: 'Danger Zone' },
  ],
};

const splitList = (value) => (Array.isArray(value) ? value.join(', ') : value || '');

const toList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const makeInitialForm = (user) => ({
  avatar: user?.avatar || '',
  name: user?.name || '',
  username: user?.username || '',
  email: user?.email || '',
  phone: user?.phone || '',
  country: user?.country || '',
  city: user?.city || '',
  timeZone: user?.timeZone || 'Asia/Karachi',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  twoFactorEnabled: user?.twoFactorEnabled || false,
  activeSessions: Array.isArray(user?.activeSessions) ? user.activeSessions : ['This device - active now'],
  loginHistory: user?.loginHistory || 'Last login from this device',
  bio: user?.bio || '',
  goals: user?.goals || '',
  interests: splitList(user?.interests),
  title: user?.title || '',
  company: user?.company || '',
  jobTitle: user?.jobTitle || user?.title || '',
  experience: user?.experience || '',
  education: user?.education || '',
  certifications: splitList(user?.certifications),
  resumeUrl: user?.resumeUrl || '',
  resumeName: user?.resumeName || '',
  skills: splitList(user?.skills),
  currentStatus: user?.currentStatus || user?.title || 'Student',
  careerGoals: user?.careerGoals || user?.goals || '',
  skillsToLearn: splitList(user?.skillsToLearn),
  preferredIndustries: splitList(user?.preferredIndustries),
  preferredCategories: splitList(user?.preferredCategories || user?.mentorshipCategories),
  preferredLevel: user?.preferredLevel || 'Beginner',
  preferredMentorType: user?.preferredMentorType || 'Industry Expert',
  preferredSessionDuration: user?.preferredSessionDuration || '60 min',
  learningInterests: splitList(user?.learningInterests || user?.preferredCategories),
  sessionTypes: splitList(user?.sessionTypes || user?.mentorshipTypes),
  languages: splitList(user?.languages || user?.language || 'English'),
  hourlyRate: user?.hourlyRate || '',
  weeklySchedule: user?.weeklySchedule || user?.weeklyAvailability || '',
  availableSlots: splitList(user?.availableSlots || user?.availableTimeSlots || user?.availability),
  vacationMode: user?.vacationMode || false,
  bookingNoticeHours: user?.bookingNoticeHours || 24,
  maxBookingsPerWeek: user?.maxBookingsPerWeek || 10,
  bufferMinutes: user?.bufferMinutes || 15,
  linkedIn: user?.linkedIn || '',
  emailSessionRequests: user?.emailSessionRequests ?? true,
  emailReminders: user?.emailReminders ?? true,
  emailAnnouncements: user?.emailAnnouncements ?? false,
  pushEnabled: user?.pushEnabled ?? true,
  smsEnabled: user?.smsEnabled || false,
  notifyNewRegistrations: user?.notifyNewRegistrations ?? true,
  notifyMentorApplications: user?.notifyMentorApplications ?? true,
  dashboardPreferences: user?.dashboardPreferences || 'Applications, users, sessions, revenue',
  appearanceTheme: user?.appearanceTheme || (user?.darkMode ? 'Dark' : 'System'),
  compactDensity: user?.compactDensity || false,
  accountStatus: user?.accountStatus || 'active',
});

const ProfileSettings = ({ compact = false, onSaved, onAccountClosed }) => {
  const [user, setUser] = useState(getCurrentUser());
  const [activeSection, setActiveSection] = useState('personal');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState(() => makeInitialForm(user));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const role = user?.role || 'mentee';
  const roleLabel = role === 'mentor' ? 'Mentor' : role === 'admin' ? 'Admin' : 'Mentee';
  const visibleSections = sectionMap[role] || sectionMap.mentee;

  const metrics = useMemo(() => {
    if (!user) return { rating: 0, reviewCount: 0, sessionsCompleted: 0 };
    const reviews = role === 'mentor' ? getReviewsForMentor(user.id) : [];
    const sessionsCompleted = getSessions().filter(
      (session) => (session.mentorId === user.id || session.menteeId === user.id) && String(session.status).toLowerCase() === 'completed'
    ).length;
    const bookingsCompleted = getBookingsForUser(user.id).filter((booking) => String(booking.status).toLowerCase() === 'completed').length;

    return {
      rating: safeNumber(user.rating || (reviews.reduce((sum, review) => sum + safeNumber(review.score), 0) / Math.max(reviews.length, 1)), 0),
      reviewCount: user.reviews || reviews.length,
      sessionsCompleted: sessionsCompleted + bookingsCompleted,
    };
  }, [role, user]);

  if (!user) {
    return <div className="rounded-2xl bg-surface-container-lowest p-8 text-center text-on-surface">Please login to view settings.</div>;
  }

  const setField = (field, value) => {
    setStatus('');
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const showStatus = (message) => {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 3500);
  };

  const saveSettings = (event) => {
    event.preventDefault();

    if (form.newPassword && form.newPassword.length < 6) {
      showStatus('New password must be at least 6 characters.');
      return;
    }
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      showStatus('New passwords do not match.');
      return;
    }
    if (form.newPassword && form.currentPassword !== user.password) {
      showStatus('Current password is incorrect.');
      return;
    }

    const db = getDB();
    const index = db.users.findIndex((candidate) => candidate.id === user.id);
    if (index === -1) {
      showStatus('Could not find this account.');
      return;
    }

    const updates = {
      avatar: form.avatar,
      name: form.name,
      username: form.username,
      email: form.email,
      phone: form.phone,
      country: form.country,
      city: form.city,
      timeZone: form.timeZone,
      twoFactorEnabled: form.twoFactorEnabled,
      activeSessions: form.activeSessions,
      loginHistory: form.loginHistory,
      bio: form.bio,
      goals: form.goals,
      interests: toList(form.interests),
      title: form.title,
      company: form.company,
      jobTitle: form.jobTitle,
      experience: safeNumber(form.experience, ''),
      education: form.education,
      certifications: toList(form.certifications),
      resumeUrl: form.resumeUrl,
      resumeName: form.resumeName,
      skills: toList(form.skills),
      currentStatus: form.currentStatus,
      careerGoals: form.careerGoals,
      skillsToLearn: toList(form.skillsToLearn),
      preferredIndustries: toList(form.preferredIndustries),
      preferredCategories: toList(form.preferredCategories),
      mentorshipCategories: toList(form.preferredCategories),
      preferredLevel: form.preferredLevel,
      preferredMentorType: form.preferredMentorType,
      preferredSessionDuration: form.preferredSessionDuration,
      learningInterests: toList(form.learningInterests),
      sessionTypes: toList(form.sessionTypes),
      mentorshipTypes: toList(form.sessionTypes),
      languages: toList(form.languages),
      hourlyRate: role === 'mentor' ? safeNumber(form.hourlyRate) : db.users[index].hourlyRate,
      weeklySchedule: form.weeklySchedule,
      weeklyAvailability: form.weeklySchedule,
      availableSlots: toList(form.availableSlots),
      availableTimeSlots: toList(form.availableSlots),
      availability: toList(form.availableSlots),
      vacationMode: form.vacationMode,
      bookingNoticeHours: safeNumber(form.bookingNoticeHours, 24),
      maxBookingsPerWeek: safeNumber(form.maxBookingsPerWeek, 10),
      bufferMinutes: safeNumber(form.bufferMinutes, 15),
      linkedIn: form.linkedIn,
      emailSessionRequests: form.emailSessionRequests,
      emailReminders: form.emailReminders,
      emailAnnouncements: form.emailAnnouncements,
      pushEnabled: form.pushEnabled,
      smsEnabled: form.smsEnabled,
      notifyNewRegistrations: form.notifyNewRegistrations,
      notifyMentorApplications: form.notifyMentorApplications,
      dashboardPreferences: form.dashboardPreferences,
      appearanceTheme: form.appearanceTheme,
      darkMode: form.appearanceTheme === 'Dark',
      compactDensity: form.compactDensity,
      accountStatus: form.accountStatus,
      password: form.newPassword || db.users[index].password,
      updatedAt: new Date().toISOString(),
    };

    db.users[index] = { ...db.users[index], ...updates };
    db.currentUser = db.users[index];
    saveDB(db);

    setUser(db.users[index]);
    setForm((previous) => ({ ...previous, currentPassword: '', newPassword: '', confirmPassword: '' }));
    showStatus('Settings saved successfully.');
    onSaved?.();
  };

  const handlePhotoFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setField('avatar', dataUrl);
  };

  const handleResumeFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setField('resumeUrl', dataUrl);
    setField('resumeName', file.name);
  };

  const revokeSession = (sessionName) => {
    const remaining = form.activeSessions.filter((session) => session !== sessionName);
    setField('activeSessions', remaining.length ? remaining : ['This device - active now']);
  };

  const deactivateAccount = () => {
    const confirmed = window.confirm('Deactivate your account? Your profile will be hidden until you reactivate it.');
    if (!confirmed) return;
    setField('accountStatus', 'deactivated');
    showStatus('Account marked for deactivation. Save changes to apply.');
  };

  const confirmDelete = () => {
    if (deleteInput !== user.name) return;
    deleteUser(user.id);
    logout();
    setUser(null);
    onAccountClosed?.();
  };

  const openDeleteModal = () => {
    setDeleteInput('');
    setShowDeleteModal(true);
  };

  const handleDeleteClick = () => {
    if (!user) return;
    openDeleteModal();
  };

  const Field = ({ label, field, type = 'text', placeholder = '', children, span = '' }) => (
    <label className={`space-y-2 ${span}`}>
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
      {children || (
        <input
          type={type}
          value={form[field] ?? ''}
          onChange={(event) => setField(field, event.target.value)}
          className="w-full rounded-lg border border-outline-variant/25 bg-surface px-3 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/30"
          placeholder={placeholder}
        />
      )}
    </label>
  );

  const TextArea = ({ label, field, placeholder = '', rows = 5, span = '' }) => (
    <label className={`space-y-2 ${span}`}>
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <textarea
        rows={rows}
        value={form[field] || ''}
        onChange={(event) => setField(field, event.target.value)}
        className="w-full resize-none rounded-lg border border-outline-variant/25 bg-surface px-3 py-3 text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/30"
        placeholder={placeholder}
      />
    </label>
  );

  const Toggle = ({ label, detail, field }) => (
    <button
      type="button"
      onClick={() => setField(field, !form[field])}
      className="flex min-h-20 items-center justify-between gap-4 rounded-lg bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container"
    >
      <span>
        <span className="block font-semibold text-on-surface">{label}</span>
        {detail && <span className="mt-1 block text-sm text-on-surface-variant">{detail}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form[field] ? 'bg-secondary' : 'bg-outline-variant'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${form[field] ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
    </button>
  );

  const MultiChoice = ({ field, options }) => {
    const values = toList(form[field]);
    const toggle = (option) => {
      const next = values.includes(option) ? values.filter((item) => item !== option) : [...values, option];
      setField(field, next.join(', '));
    };

    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`flex min-h-14 items-center gap-3 rounded-lg border px-4 py-3 text-left font-semibold transition-colors ${
              values.includes(option)
                ? 'border-secondary bg-secondary-container text-on-secondary-container'
                : 'border-outline-variant/25 bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{values.includes(option) ? 'check_circle' : 'radio_button_unchecked'}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderPersonal = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <img
          src={form.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || roleLabel)}`}
          alt="Profile"
          className="h-24 w-24 rounded-full object-cover ring-4 ring-surface-variant"
        />
        <div className="flex-1 space-y-3">
          <Field label="Profile Photo URL" field="avatar" placeholder="https://..." />
          <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoFile} className="hidden" />
          <button type="button" onClick={() => photoInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Upload Photo
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Full Name" field="name" />
        <Field label="Username" field="username" />
        <Field label="Email Address" field="email" type="email" />
        <Field label="Phone Number" field="phone" />
        <Field label="Country" field="country" />
        <Field label="City" field="city" />
        <Field label="Timezone" field="timeZone" placeholder="Asia/Karachi" span="md:col-span-2" />
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field label="Current Password" field="currentPassword" type="password" />
        <Field label="New Password" field="newPassword" type="password" />
        <Field label="Confirm New Password" field="confirmPassword" type="password" />
      </div>
      <Toggle label="Two-Factor Authentication" detail="Require an additional verification step when signing in." field="twoFactorEnabled" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-surface-container-low p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Login History</p>
          <p className="mt-2 font-semibold text-on-surface">{form.loginHistory}</p>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Active Sessions</p>
          {form.activeSessions.map((session) => (
            <div key={session} className="flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-4">
              <span className="font-semibold text-on-surface">{session}</span>
              <button type="button" onClick={() => revokeSession(session)} className="rounded-lg px-3 py-2 text-sm font-bold text-error hover:bg-error/10">
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'personal':
        return renderPersonal();
      case 'security':
        return renderSecurity();
      case 'about':
        return <TextArea label="Bio" field="bio" rows={8} placeholder={role === 'admin' ? 'Short internal admin profile or responsibilities.' : 'Tell mentees who you help, how you mentor, and what outcomes they can expect.'} />;
      case 'menteeAbout':
        return (
          <div className="grid grid-cols-1 gap-5">
            <TextArea label="Bio" field="bio" rows={5} placeholder="Tell mentors about your background and what kind of support helps you learn." />
            <TextArea label="Goals" field="goals" rows={4} placeholder="What do you want to accomplish through mentorship?" />
            <Field label="Interests" field="interests" placeholder="AI, Product Design, Startups" />
          </div>
        );
      case 'professional':
        return (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Headline" field="title" placeholder="Senior AI Researcher and Career Mentor" span="md:col-span-2" />
            <Field label="Company" field="company" />
            <Field label="Position" field="jobTitle" />
            <Field label="Years of Experience" field="experience" type="number" />
            <Field label="Education" field="education" />
            <Field label="Certifications" field="certifications" placeholder="AWS Solutions Architect, PMP" />
            <Field label="Expertise Tags" field="skills" placeholder="Machine Learning, Leadership, Interviews" />
            <div className="space-y-3 md:col-span-2">
              <Field label="Resume / CV URL" field="resumeUrl" placeholder="https://..." />
              <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeFile} className="hidden" />
              <button type="button" onClick={() => resumeInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high">
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Upload Resume/CV
              </button>
              {form.resumeName && <p className="text-sm font-semibold text-on-surface-variant">Selected: {form.resumeName}</p>}
            </div>
          </div>
        );
      case 'learning':
        return (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Current Status" field="currentStatus">
              <select value={form.currentStatus} onChange={(event) => setField('currentStatus', event.target.value)} className="w-full rounded-lg border border-outline-variant/25 bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-secondary/30">
                <option>Student</option>
                <option>Graduate</option>
                <option>Professional</option>
              </select>
            </Field>
            <Field label="Education" field="education" placeholder="BS Computer Science, bootcamp, self-taught" />
            <TextArea label="Career Goals" field="careerGoals" rows={4} span="md:col-span-2" placeholder="Where are you trying to go next?" />
            <Field label="Skills To Learn" field="skillsToLearn" placeholder="React, Data Structures, Communication" />
            <Field label="Preferred Industries" field="preferredIndustries" placeholder="Software, AI, Product, Finance" />
            <div className="space-y-3 md:col-span-2">
              <Field label="Resume / CV URL" field="resumeUrl" placeholder="https://..." />
              <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeFile} className="hidden" />
              <button type="button" onClick={() => resumeInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high">
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Upload Resume/CV
              </button>
              {form.resumeName && <p className="text-sm font-semibold text-on-surface-variant">Selected: {form.resumeName}</p>}
            </div>
          </div>
        );
      case 'mentorPreferences':
        return (
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Mentorship Categories</p>
              <MultiChoice field="preferredCategories" options={['Career Guidance', 'Technical Coaching', 'Interview Preparation', 'Portfolio Review', 'Startup Mentoring', 'Leadership']} />
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Session Types</p>
              <MultiChoice field="sessionTypes" options={['One-on-One', 'Group Session', 'Code Review', 'Mock Interview', 'Office Hours', 'Async Feedback']} />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <Field label="Preferred Mentee Level" field="preferredLevel">
                <select value={form.preferredLevel} onChange={(event) => setField('preferredLevel', event.target.value)} className="w-full rounded-lg border border-outline-variant/25 bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-secondary/30">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>All Levels</option>
                </select>
              </Field>
              <Field label="Languages" field="languages" placeholder="English, Urdu" />
              <Field label="Hourly Rate" field="hourlyRate" type="number" />
            </div>
          </div>
        );
      case 'menteePreferences':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Preferred Mentor Type" field="preferredMentorType">
                <select value={form.preferredMentorType} onChange={(event) => setField('preferredMentorType', event.target.value)} className="w-full rounded-lg border border-outline-variant/25 bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-secondary/30">
                  <option>Industry Expert</option>
                  <option>Career Coach</option>
                  <option>Technical Mentor</option>
                  <option>Peer Mentor</option>
                </select>
              </Field>
              <Field label="Preferred Session Duration" field="preferredSessionDuration">
                <select value={form.preferredSessionDuration || '60 min'} onChange={(event) => setField('preferredSessionDuration', event.target.value)} className="w-full rounded-lg border border-outline-variant/25 bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-secondary/30">
                  <option>30 min</option>
                  <option>45 min</option>
                  <option>60 min</option>
                  <option>90 min</option>
                </select>
              </Field>
              <Field label="Languages" field="languages" placeholder="English, Urdu" />
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Learning Interests</p>
              <MultiChoice field="learningInterests" options={['Career Growth', 'Technical Skills', 'Interview Prep', 'Portfolio Building', 'Leadership', 'Startup Advice']} />
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Session Types</p>
              <MultiChoice field="sessionTypes" options={['One-on-One', 'Group Session', 'Mock Interview', 'Project Review', 'Async Feedback', 'Office Hours']} />
            </div>
          </div>
        );
      case 'availability':
        return (
          <div className="space-y-6">
            <TextArea label="Weekly Schedule" field="weeklySchedule" rows={4} placeholder={'Monday 10:00 AM - 2:00 PM\nWednesday 4:00 PM - 7:00 PM'} />
            <Field label="Available Slots" field="availableSlots" placeholder="Monday 10:00 AM, Wednesday 2:00 PM" />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <Field label="Minimum Booking Notice (Hours)" field="bookingNoticeHours" type="number" />
              <Field label="Max Bookings Per Week" field="maxBookingsPerWeek" type="number" />
              <Field label="Buffer Between Sessions (Minutes)" field="bufferMinutes" type="number" />
            </div>
            <Toggle label="Vacation Mode" detail="Pause new bookings while keeping existing profile information intact." field="vacationMode" />
          </div>
        );
      case 'social':
        return <Field label="LinkedIn" field="linkedIn" placeholder="https://www.linkedin.com/in/your-profile" />;
      case 'notifications':
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Toggle label="Session Requests" field="emailSessionRequests" />
            <Toggle label="Session Reminders" field="emailReminders" />
            <Toggle label="Platform Announcements" field="emailAnnouncements" />
            <Toggle label="Push Notifications" field="pushEnabled" />
            <Toggle label="SMS Notifications" field="smsEnabled" />
          </div>
        );
      case 'adminPreferences':
        return (
          <div className="grid grid-cols-1 gap-5">
            <TextArea label="Dashboard Preferences" field="dashboardPreferences" rows={5} placeholder="Applications, users, sessions, revenue" />
          </div>
        );
      case 'adminNotifications':
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Toggle label="New Registrations" detail="Notify me when new users join ProLign." field="notifyNewRegistrations" />
            <Toggle label="Mentor Applications" detail="Notify me when a mentor submits or updates an application." field="notifyMentorApplications" />
            <Toggle label="Platform Announcements" field="emailAnnouncements" />
            <Toggle label="Push Notifications" field="pushEnabled" />
          </div>
        );
      case 'achievements':
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {role === 'mentor' && (
              <div className="rounded-lg bg-surface-container-low p-5">
                <span className="material-symbols-outlined mb-4 text-[28px]">star</span>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Ratings</p>
                <p className="mt-2 font-headline-md text-3xl font-bold text-primary">{metrics.rating ? metrics.rating.toFixed(1) : '0.0'}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{metrics.reviewCount} review{metrics.reviewCount === 1 ? '' : 's'}</p>
              </div>
            )}
            <div className="rounded-lg bg-surface-container-low p-5">
              <span className="material-symbols-outlined mb-4 text-[28px]">groups</span>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Completed Sessions</p>
              <p className="mt-2 font-headline-md text-3xl font-bold text-primary">{metrics.sessionsCompleted}</p>
              <p className="mt-1 text-sm text-on-surface-variant">Finished mentorship sessions</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-5">
              <span className="material-symbols-outlined mb-4 text-[28px]">workspace_premium</span>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Profile Status</p>
              <p className="mt-2 font-headline-md text-3xl font-bold text-primary">{form.accountStatus === 'deactivated' ? 'Paused' : 'Active'}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{user.status || 'approved'}</p>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Theme" field="appearanceTheme">
              <select value={form.appearanceTheme} onChange={(event) => setField('appearanceTheme', event.target.value)} className="w-full rounded-lg border border-outline-variant/25 bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-secondary/30">
                <option>System</option>
                <option>Light</option>
                <option>Dark</option>
              </select>
            </Field>
            <Toggle label="Compact Density" detail="Use tighter spacing in dashboard lists and controls." field="compactDensity" />
          </div>
        );
      case 'danger':
        return (
          <div className="space-y-4">
            {role !== 'admin' && (
              <button type="button" onClick={deactivateAccount} className="flex w-full items-center justify-between rounded-lg bg-surface-container-low p-4 text-left text-on-surface transition-colors hover:bg-surface-container">
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined">pause_circle</span>
                  <span>
                    <span className="block font-bold">Deactivate Account</span>
                    <span className="text-sm text-on-surface-variant">Hide your profile and pause platform activity.</span>
                  </span>
                </span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            )}
            <button type="button" onClick={handleDeleteClick} className="flex w-full items-center justify-between rounded-lg bg-error-container p-4 text-left text-on-error-container transition-opacity hover:opacity-90">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined">delete</span>
                <span>
                  <span className="block font-bold">Delete Account</span>
                  <span className="text-sm opacity-80">Permanently remove this account, bookings, and sessions.</span>
                </span>
              </span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            {showDeleteModal && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-2xl">
                  <div className="mb-6 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-on-error-container">
                      <span className="material-symbols-outlined text-3xl">warning</span>
                    </span>
                    <h3 className="mt-4 font-headline-md text-2xl font-bold text-on-surface">Are you sure?</h3>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      This action is permanent and cannot be undone. All your data, bookings, and sessions will be removed.
                    </p>
                  </div>

                  <div className="mb-6 space-y-3">
                    <p className="text-sm font-semibold text-on-surface">
                      Type <strong className="text-error">{user?.name}</strong> to confirm deletion:
                    </p>
                    <input
                      value={deleteInput}
                      onChange={(event) => setDeleteInput(event.target.value)}
                      className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3.5 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-error/30"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={deleteInput !== user?.name}
                      className="w-full rounded-2xl bg-error py-3.5 font-bold text-on-error shadow-md transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Yes, Delete My Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container py-3.5 font-bold text-on-surface transition-colors hover:bg-surface-container-high"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const activeLabel = visibleSections.find((section) => section.id === activeSection)?.label || 'Profile Settings';

  return (
    <div className={compact ? 'w-full' : 'mx-auto w-full max-w-7xl'}>
      <div className="mb-8">
        <h1 className="font-headline-lg text-4xl font-bold text-primary">Profile Settings</h1>
        <p className="mt-2 text-on-surface-variant">
          Manage your {roleLabel.toLowerCase()} profile, account security, preferences, notifications, and account status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3 natural-shadow xl:sticky xl:top-6 xl:self-start">
          {visibleSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              type="button"
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-bold transition-all ${
                activeSection === section.id ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </aside>

        <form onSubmit={saveSettings} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 natural-shadow md:p-8">
          <div className="mb-8 flex flex-col justify-between gap-3 border-b border-outline-variant/20 pb-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-headline-md text-2xl font-bold text-on-surface">{activeLabel}</h2>
              <p className="text-sm text-on-surface-variant">{roleLabel} account settings</p>
            </div>
            {status && <span className="rounded-full bg-secondary-container px-4 py-2 text-sm font-bold text-on-secondary-container">{status}</span>}
          </div>
          {renderSection()}
          {activeSection !== 'achievements' && (
            <div className="mt-8 flex justify-end border-t border-outline-variant/20 pt-6">
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-md transition-transform hover:scale-[1.02]">
                <span className="material-symbols-outlined text-[18px]">save</span>
                {activeSection === 'danger' ? 'Save Account Status' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;

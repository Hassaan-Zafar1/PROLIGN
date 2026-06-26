import { useEffect, useRef, useState } from 'react';
import { deleteUser, getCurrentUser, getDB, logout, saveDB } from '../utils/db';
import { tokenManager } from '../utils/tokenManager';
import AvailabilityScheduler from './AvailabilityScheduler';
import { Input, Select, Textarea, Toggle, Card, Modal, Badge, Button, Avatar } from './common';

const sectionMap = {
  mentor: [
    { id: 'profile', icon: 'person', label: 'Profile', desc: 'Manage your personal and professional information.' },
    { id: 'career', icon: 'psychology', label: 'Career', desc: 'Mentorship profile, expertise, and availability.' },
    { id: 'security', icon: 'lock', label: 'Security', desc: 'Password, sessions, and privacy settings.' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications', desc: 'Email alerts, reminders, and appearance.' },
    { id: 'account', icon: 'settings', label: 'Account', desc: 'Account actions and data management.' },
  ],
  mentee: [
    { id: 'profile', icon: 'person', label: 'Profile', desc: 'Manage your personal and professional information.' },
    { id: 'learning', icon: 'school', label: 'Learning', desc: 'Career goals, skills, and learning interests.' },
    { id: 'security', icon: 'lock', label: 'Security', desc: 'Password, sessions, and privacy settings.' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications', desc: 'Email alerts, reminders, and appearance.' },
    { id: 'account', icon: 'settings', label: 'Account', desc: 'Account actions and data management.' },
  ],
  admin: [
    { id: 'profile', icon: 'person', label: 'Profile', desc: 'Manage your personal and professional information.' },
    { id: 'platform', icon: 'admin_panel_settings', label: 'Platform', desc: 'Platform defaults, approvals, and language.' },
    { id: 'security', icon: 'lock', label: 'Security', desc: 'Password, sessions, and privacy settings.' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications', desc: 'Email alerts and appearance settings.' },
    { id: 'account', icon: 'settings', label: 'Account', desc: 'Account actions and data management.' },
  ],
};

const toList = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
const safeNumber = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const readFileAsDataUrl = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });

const makeInitialForm = (u) => ({
  avatar: u?.avatar || '',
  name: u?.name || '',
  email: u?.email || '',
  phone: u?.phone || '',
  country: u?.country || '',
  city: u?.city || '',
  title: u?.title || '',
  company: u?.company || '',
  bio: u?.bio || '',
  linkedIn: u?.linkedIn || '',
  experience: u?.experience || '',
  skills: toList(u?.skills).join(', '),
  languages: toList(u?.languages || u?.language || 'English').join(', '),
  certifications: toList(u?.certifications).join(', '),
  hourlyRate: u?.hourlyRate || '',
  preferredCategories: toList(u?.preferredCategories || u?.mentorshipCategories).join(', '),
  availableSlots: toList(u?.availableSlots || u?.availableTimeSlots || u?.availability).join(', '),
  weeklySchedule: u?.weeklySchedule || u?.weeklyAvailability || '',
  education: u?.education || '',
  careerGoals: u?.careerGoals || u?.goals || '',
  skillsToLearn: toList(u?.skillsToLearn).join(', '),
  learningInterests: toList(u?.learningInterests || u?.preferredCategories).join(', '),
  resumeUrl: u?.resumeUrl || '',
  resumeName: u?.resumeName || '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  profileVisibility: u?.profileVisibility || 'public',
  emailSessionRequests: u?.emailSessionRequests ?? true,
  emailReminders: u?.emailReminders ?? true,
  emailMarketing: u?.emailMarketing ?? false,
  appearanceTheme: u?.appearanceTheme || (u?.darkMode ? 'Dark' : 'System'),
  accountStatus: u?.accountStatus || 'active',
  notifyNewRegistrations: u?.notifyNewRegistrations ?? true,
  notifyMentorApplications: u?.notifyMentorApplications ?? true,
});

const sectionFields = {
  profile: ['avatar', 'name', 'email', 'phone', 'country', 'city', 'title', 'company', 'bio', 'linkedIn'],
  career: ['experience', 'hourlyRate', 'skills', 'languages', 'certifications', 'availableSlots', 'weeklySchedule', 'preferredCategories'],
  learning: ['education', 'languages', 'skills', 'skillsToLearn', 'preferredCategories', 'careerGoals', 'learningInterests', 'resumeUrl', 'resumeName'],
  platform: ['notifyNewRegistrations', 'notifyMentorApplications', 'languages'],
  security: ['currentPassword', 'newPassword', 'confirmPassword', 'profileVisibility'],
  notifications: ['emailSessionRequests', 'emailReminders', 'emailMarketing', 'appearanceTheme'],
  account: ['accountStatus'],
};

const ProfileSettings = ({ compact = false, onSaved, onAccountClosed, user: userProp, onThemeChange, initialTab }) => {
  const [user, setUser] = useState(userProp || getCurrentUser());
  const [activeTab, setActiveTab] = useState(initialTab || 'profile');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState(() => makeInitialForm(user));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const photoRef = useRef(null);
  const resumeRef = useRef(null);

  useEffect(() => {
    const current = userProp || getCurrentUser();
    if (current) { setUser(current); setForm(makeInitialForm(current)); }
  }, [userProp]);

  const role = user?.role || 'mentee';
  const roleLabel = role === 'mentor' ? 'Mentor' : role === 'admin' ? 'Admin' : 'Mentee';
  const tabs = sectionMap[role] || sectionMap.mentee;

  if (!user) {
    return <div className="rounded-2xl bg-surface-container-lowest p-8 text-center text-on-surface">Please login to view settings.</div>;
  }

  const setField = (f, v) => { setStatus(''); setForm((p) => ({ ...p, [f]: v })); };

  const showStatus = (msg) => { setStatus(msg); window.setTimeout(() => setStatus(''), 3500); };

  const persistFields = (fields) => {
    const db = getDB();
    const idx = db.users.findIndex((c) => c.id === user.id);
    if (idx === -1) { showStatus('Could not find this account.'); return false; }
    const existing = db.users[idx];
    const updates = { updatedAt: new Date().toISOString() };

    for (const f of fields) {
      if (['skills', 'languages', 'certifications', 'availableSlots', 'preferredCategories', 'skillsToLearn', 'learningInterests'].includes(f)) {
        updates[f] = toList(form[f]);
      } else if (['hourlyRate', 'experience'].includes(f)) {
        updates[f] = safeNumber(form[f], '');
      } else if (['emailSessionRequests', 'emailReminders', 'emailMarketing', 'notifyNewRegistrations', 'notifyMentorApplications'].includes(f)) {
        updates[f] = form[f];
      } else if (f === 'appearanceTheme') {
        updates[f] = form[f];
        updates.darkMode = form[f] === 'Dark';
      } else if (f === 'newPassword') {
        if (form.newPassword) updates.password = form.newPassword;
      } else {
        updates[f] = form[f];
      }
    }

    if (updates.preferredCategories) { updates.mentorshipCategories = updates.preferredCategories; }
    if (updates.availableSlots) { updates.availableTimeSlots = updates.availableSlots; updates.availability = updates.availableSlots; }
    if (updates.weeklySchedule) { updates.weeklyAvailability = updates.weeklySchedule; }
    if (updates.careerGoals) { updates.goals = updates.careerGoals; }

    db.users[idx] = { ...existing, ...updates };
    db.currentUser = db.users[idx];
    saveDB(db);
    setUser(db.users[idx]);
    setForm((p) => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
    return true;
  };

  const saveSection = (sectionId) => {
    if (sectionId === 'security') {
      if (form.newPassword && form.newPassword.length < 6) { showStatus('Password must be at least 6 characters.'); return; }
      if (form.newPassword && form.newPassword !== form.confirmPassword) { showStatus('Passwords do not match.'); return; }
      if (form.newPassword && form.currentPassword !== user.password) { showStatus('Current password is incorrect.'); return; }
    }
    const fields = sectionFields[sectionId] || sectionFields.profile;
    if (persistFields(fields)) { showStatus('Changes saved successfully.'); onSaved?.(); }
  };

  const handlePhotoFile = async (e) => { const f = e.target.files?.[0]; if (f) setField('avatar', await readFileAsDataUrl(f)); };
  const handleResumeFile = async (e) => { const f = e.target.files?.[0]; if (f) { setField('resumeUrl', await readFileAsDataUrl(f)); setField('resumeName', f.name); } };
  const confirmDeactivate = () => { setField('accountStatus', 'deactivated'); setShowDeactivateModal(false); saveSection('account'); };
  const confirmDelete = () => { deleteUser(user.id); logout(); tokenManager.clearTokens(); setUser(null); onAccountClosed?.(); };

  const MultiChoice = ({ field, options }) => {
    const values = toList(form[field]);
    const toggle = (o) => setField(field, (values.includes(o) ? values.filter((x) => x !== o) : [...values, o]).join(', '));
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => toggle(o)}
            className={`flex min-h-11 items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
              values.includes(o) ? 'border-secondary bg-secondary-container text-on-secondary-container' : 'border-outline-variant/25 bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{values.includes(o) ? 'check_circle' : 'radio_button_unchecked'}</span>
            <span>{o}</span>
          </button>
        ))}
      </div>
    );
  };

  const StatusBadge = () => status ? (
    <span className="mr-auto rounded-full bg-secondary-container px-3 py-1.5 text-xs font-bold text-on-secondary-container animate-[fadeIn_0.2s]">{status}</span>
  ) : null;

  const renderProfile = () => (
    <SectionWrap sectionId="profile">
      <Card title="Personal Information" icon="account_circle">
        <div className="space-y-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar src={form.avatar} name={form.name || roleLabel} size="xl" className="rounded-2xl ring-4 ring-surface-variant!" />
            <div className="flex-1 space-y-2">
              <Input label="Profile Photo URL" value={form.avatar} onChange={(e) => setField('avatar', e.target.value)} placeholder="https://..." />
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoFile} className="hidden" />
              <Button variant="outline" size="sm" icon="upload" onClick={() => photoRef.current?.click()}>Upload Photo</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Full Name" value={form.name} onChange={(e) => setField('name', e.target.value)} />
            <Input label="Email Address" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
            <Input label="Phone Number" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
            <Input label="Country" value={form.country} onChange={(e) => setField('country', e.target.value)} />
            <Input label="City" value={form.city} onChange={(e) => setField('city', e.target.value)} />
            <Input label="Professional Title" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g. Senior Software Engineer" />
            <Input label="Company / Organization" value={form.company} onChange={(e) => setField('company', e.target.value)} />
            <Input label="LinkedIn Profile" value={form.linkedIn} onChange={(e) => setField('linkedIn', e.target.value)} placeholder="https://linkedin.com/in/your-profile" />
          </div>
          <Textarea label="Short Bio" value={form.bio} onChange={(e) => setField('bio', e.target.value)} rows={3} placeholder="Tell others about yourself and your background." />
        </div>
      </Card>
    </SectionWrap>
  );

  const renderCareer = () => (
    <SectionWrap sectionId="career">
      <Card title="Mentorship Profile" icon="psychology">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Years of Experience" type="number" value={form.experience} onChange={(e) => setField('experience', e.target.value)} />
            <Input label="Session Price ($/hr)" type="number" value={form.hourlyRate} onChange={(e) => setField('hourlyRate', e.target.value)} />
            <Input label="Expertise Areas" value={form.skills} onChange={(e) => setField('skills', e.target.value)} placeholder="Machine Learning, Leadership, Interviews" span="md:col-span-2" />
            <Input label="Languages" value={form.languages} onChange={(e) => setField('languages', e.target.value)} placeholder="English, Urdu" />
            <Input label="Certifications" value={form.certifications} onChange={(e) => setField('certifications', e.target.value)} placeholder="AWS Solutions Architect, PMP" />
            <Input label="Available Days" value={form.availableSlots} onChange={(e) => setField('availableSlots', e.target.value)} placeholder="Monday, Wednesday, Friday" />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-on-surface-variant">Mentorship Categories</p>
            <MultiChoice field="preferredCategories" options={['Career Guidance', 'Technical Coaching', 'Interview Preparation', 'Portfolio Review', 'Startup Mentoring', 'Leadership']} />
          </div>
        </div>
      </Card>
      <AvailabilityScheduler mentorId={user?.id} />
    </SectionWrap>
  );

  const renderLearning = () => (
    <SectionWrap sectionId="learning">
      <Card title="Learning Profile" icon="school">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Education" value={form.education} onChange={(e) => setField('education', e.target.value)} placeholder="BS Computer Science, bootcamp, self-taught" />
            <Input label="Languages" value={form.languages} onChange={(e) => setField('languages', e.target.value)} placeholder="English, Urdu" />
            <Input label="Current Skills" value={form.skills} onChange={(e) => setField('skills', e.target.value)} placeholder="JavaScript, React, Python" />
            <Input label="Skills to Learn" value={form.skillsToLearn} onChange={(e) => setField('skillsToLearn', e.target.value)} placeholder="System Design, Leadership, ML" />
            <Input label="Preferred Categories" value={form.preferredCategories} onChange={(e) => setField('preferredCategories', e.target.value)} placeholder="Career Guidance, Interview Prep" />
          </div>
          <Textarea label="Career Goals" value={form.careerGoals} onChange={(e) => setField('careerGoals', e.target.value)} rows={3} placeholder="Where are you trying to go next?" />
          <div>
            <p className="mb-2 text-xs font-semibold text-on-surface-variant">Learning Interests</p>
            <MultiChoice field="learningInterests" options={['Career Growth', 'Technical Skills', 'Interview Prep', 'Portfolio Building', 'Leadership', 'Startup Advice']} />
          </div>
          <div>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-on-surface-variant">Resume / CV</span>
              <div className="flex items-center gap-3">
                <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeFile} className="hidden" />
                <Button variant="outline" size="sm" icon="upload_file" onClick={() => resumeRef.current?.click()}>
                  {form.resumeName || 'Upload Resume'}
                </Button>
                {form.resumeName && <span className="text-xs text-on-surface-variant truncate max-w-[200px]">{form.resumeName}</span>}
              </div>
            </label>
          </div>
        </div>
      </Card>
    </SectionWrap>
  );

  const renderPlatform = () => (
    <SectionWrap sectionId="platform">
      <Card title="Platform Preferences" icon="admin_panel_settings">
        <div className="space-y-4">
          <Toggle label="New Registrations" detail="Notify when new users join ProLign." checked={form.notifyNewRegistrations} onChange={(v) => setField('notifyNewRegistrations', v)} />
          <Toggle label="Mentor Applications" detail="Notify when a mentor submits or updates an application." checked={form.notifyMentorApplications} onChange={(v) => setField('notifyMentorApplications', v)} />
          <Input label="Default Language" value={form.languages} onChange={(e) => setField('languages', e.target.value)} placeholder="English" />
        </div>
      </Card>
    </SectionWrap>
  );

  const renderSecurity = () => (
    <SectionWrap sectionId="security">
      <Card title="Change Password" icon="lock">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input label="Current Password" type="password" value={form.currentPassword} onChange={(e) => setField('currentPassword', e.target.value)} />
          <Input label="New Password" type="password" value={form.newPassword} onChange={(e) => setField('newPassword', e.target.value)} />
          <Input label="Confirm New Password" type="password" value={form.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} />
        </div>
      </Card>
      <Card title="Privacy" icon="visibility">
        <Select label="Profile Visibility" value={form.profileVisibility} onChange={(e) => setField('profileVisibility', e.target.value)} options={[
          { value: 'public', label: 'Public — visible to everyone' },
          { value: 'members', label: 'Members Only — visible to registered users' },
          { value: 'private', label: 'Private — hidden from search' },
        ]} />
      </Card>
    </SectionWrap>
  );

  const renderNotifications = () => (
    <SectionWrap sectionId="notifications">
      <Card title="Email Notifications" icon="mail">
        <div className="space-y-3">
          <Toggle label="Session Requests" detail="Get notified when a mentorship session is requested." checked={form.emailSessionRequests} onChange={(v) => setField('emailSessionRequests', v)} />
          <Toggle label="Booking Reminders" detail="Receive reminders before upcoming sessions." checked={form.emailReminders} onChange={(v) => setField('emailReminders', v)} />
          <Toggle label="Marketing Emails" detail="Receive tips, product updates, and promotional content." checked={form.emailMarketing} onChange={(v) => setField('emailMarketing', v)} />
        </div>
      </Card>
      <Card title="Appearance" icon="palette">
        <div className="flex gap-3">
          {['System', 'Light', 'Dark'].map((t) => (
            <button key={t} type="button" onClick={() => { setField('appearanceTheme', t); onThemeChange?.(t); }}
              className={`flex-1 h-12 rounded-xl border text-sm font-semibold transition-all ${
                form.appearanceTheme === t
                  ? 'border-secondary bg-secondary-container text-on-secondary-container shadow-sm'
                  : 'border-outline-variant/25 bg-surface-container-low text-on-surface hover:bg-surface-container'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>
    </SectionWrap>
  );

  const renderAccount = () => (
    <div className="space-y-6">
      <Card title="Account Actions" icon="settings">
        <div className="space-y-3">
          {role !== 'admin' && (
            <button type="button" onClick={() => setShowDeactivateModal(true)}
              className="flex w-full items-center justify-between rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">pause_circle</span>
                </span>
                <span>
                  <span className="block text-sm font-bold text-on-surface">Deactivate Account</span>
                  <span className="block text-xs text-on-surface-variant">Hide your profile and pause platform activity.</span>
                </span>
              </span>
              <span className="material-symbols-outlined text-xl text-on-surface-variant">chevron_right</span>
            </button>
          )}
          <button type="button" onClick={() => setShowDeleteModal(true)}
            className="flex w-full items-center justify-between rounded-xl border border-error/30 bg-error-container/50 p-4 text-left transition-colors hover:bg-error-container"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error-container">
                <span className="material-symbols-outlined text-[20px] text-on-error-container">delete</span>
              </span>
              <span>
                <span className="block text-sm font-bold text-on-error-container">Delete Account</span>
                <span className="block text-xs text-on-error-container/70">Permanently remove this account, bookings, and sessions.</span>
              </span>
            </span>
            <span className="material-symbols-outlined text-xl text-on-error-container">chevron_right</span>
          </button>
          <div className="flex items-center justify-end pt-2">
            <StatusBadge />
            <Button variant="primary" size="md" icon="check" onClick={() => saveSection('account')}>Save Changes</Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const SaveFooter = ({ sectionId }) => {
    if (sectionId === 'account') return null;
    return (
      <div className="flex items-center justify-end gap-3 pt-4">
        <StatusBadge />
        <Button variant="primary" size="md" icon="check" onClick={() => saveSection(sectionId)}>Save Changes</Button>
      </div>
    );
  };

  const SectionWrap = ({ sectionId, children }) => (
    <div className="space-y-6">
      {children}
      <SaveFooter sectionId={sectionId} />
    </div>
  );

  const tabContent = {
    profile: renderProfile,
    career: renderCareer,
    learning: renderLearning,
    platform: renderPlatform,
    security: renderSecurity,
    notifications: renderNotifications,
    account: renderAccount,
  };

  return (
    <div className={`mx-auto w-full ${compact ? 'max-w-full' : 'max-w-[1200px]'}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-on-surface md:text-4xl">Settings</h1>
        <p className="mt-1.5 text-sm text-on-surface-variant">Manage your {roleLabel.toLowerCase()} profile, security, preferences, and account.</p>
      </div>

      <div className="mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide sm:overflow-visible">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shrink-0 ${
                activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
        <div className="mt-px border-b border-outline-variant/15" />
      </div>

      <div className="animate-[fadeIn_0.15s_ease-out]">
        {(tabContent[activeTab] || (() => null))()}
      </div>

      <Modal open={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} className="w-full max-w-md">
        <div className="p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tertiary/20 text-tertiary">
            <span className="material-symbols-outlined text-3xl">pause_circle</span>
          </span>
          <h3 className="mt-4 text-2xl font-bold text-on-surface">Deactivate Account?</h3>
          <p className="mt-2 text-sm text-on-surface-variant">Your profile will be hidden from other users and you won't receive new booking requests. You can reactivate anytime by saving your settings.</p>
          <div className="flex flex-col gap-3 mt-6">
            <Button variant="primary" size="xl" className="bg-tertiary hover:bg-tertiary-container text-on-tertiary" onClick={confirmDeactivate}>Yes, Deactivate My Account</Button>
            <Button variant="secondary" size="lg" onClick={() => setShowDeactivateModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} className="w-full max-w-md">
        <div className="p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-on-error-container">
            <span className="material-symbols-outlined text-3xl">delete</span>
          </span>
          <h3 className="mt-4 text-2xl font-bold text-on-surface">Delete Account?</h3>
          <p className="mt-2 text-sm text-on-surface-variant">This action is permanent and cannot be undone. All your data, bookings, and sessions will be removed.</p>
          <div className="flex flex-col gap-3 mt-6">
            <Button variant="error" size="xl" onClick={confirmDelete}>Yes, Delete My Account</Button>
            <Button variant="secondary" size="lg" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfileSettings;

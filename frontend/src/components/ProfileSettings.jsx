import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { uploadService } from '../services/uploadService';
import { tokenManager } from '../utils/tokenManager';
import { Input, Select, Textarea, Toggle, Card, Modal, Button, Avatar } from './common';

const sectionMap = {
  mentor: [
    { id: 'profile', icon: 'person', label: 'Profile', desc: 'Personal and professional information.' },
    { id: 'career', icon: 'psychology', label: 'Career', desc: 'Mentorship profile, expertise, and availability.' },
    { id: 'security', icon: 'lock', label: 'Security', desc: 'Password and privacy settings.' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications', desc: 'Email alerts and appearance.' },
    { id: 'account', icon: 'settings', label: 'Account', desc: 'Account actions and data management.' },
  ],
  mentee: [
    { id: 'profile', icon: 'person', label: 'Profile', desc: 'Personal and professional information.' },
    { id: 'learning', icon: 'school', label: 'Learning', desc: 'Career goals, skills, and learning interests.' },
    { id: 'security', icon: 'lock', label: 'Security', desc: 'Password and privacy settings.' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications', desc: 'Email alerts and appearance.' },
    { id: 'account', icon: 'settings', label: 'Account', desc: 'Account actions and data management.' },
  ],
  admin: [
    { id: 'profile', icon: 'person', label: 'Profile', desc: 'Personal and professional information.' },
    { id: 'security', icon: 'lock', label: 'Security', desc: 'Password and privacy settings.' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications', desc: 'Email alerts and appearance.' },
    { id: 'account', icon: 'settings', label: 'Account', desc: 'Account actions and data management.' },
  ],
};

const toList = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean);
  return String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
};
const toCSV = (v) => toList(v).join(', ');
const safeNumber = (v, fb = '') => { const n = Number(v); return Number.isFinite(n) ? n : fb; };

const makeInitialForm = (u) => ({
  profilePic: u?.profilePic || u?.avatar || '',
  name: u?.name || '',
  email: u?.email || '',
  phone: u?.phone || '',
  country: u?.country || '',
  city: u?.city || '',
  title: u?.title || '',
  company: u?.company || '',
  bio: u?.bio || '',
  linkedinUrl: u?.linkedinUrl || u?.linkedIn || '',
  industry: u?.industry || '',

  experience: u?.experience ?? '',
  skills: toCSV(u?.skills),
  languages: toCSV(u?.languages?.length ? u.languages : ['English']),
  certifications: toCSV(u?.certifications),
  hourlyRate: u?.hourlyRate ?? '',
  preferredCategories: toCSV(u?.preferredCategories),
  availableSlots: toCSV(u?.availableSlots),
  weeklySchedule: u?.weeklySchedule || '',
  education: u?.education || '',
  careerGoals: u?.careerGoals || '',
  skillsToLearn: toCSV(u?.skillsToLearn),
  learningInterests: toCSV(u?.learningInterests),
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  profileVisibility: u?.profileVisibility || 'public',
  emailSessionRequests: u?.emailSessionRequests ?? true,
  emailReminders: u?.emailReminders ?? true,
  emailMarketing: u?.emailMarketing ?? false,
  appearanceTheme: u?.appearanceTheme || 'System',
});

const sectionFields = {
  profile: ['profilePic', 'name', 'phone', 'country', 'city', 'title', 'company', 'bio', 'linkedinUrl', 'industry'],
  career: ['experience', 'hourlyRate', 'skills', 'languages', 'certifications', 'availableSlots', 'weeklySchedule', 'preferredCategories'],
  learning: ['education', 'languages', 'skills', 'skillsToLearn', 'preferredCategories', 'careerGoals', 'learningInterests'],
  security: ['profileVisibility'],
  notifications: ['emailSessionRequests', 'emailReminders', 'emailMarketing', 'appearanceTheme'],
};

const arrayFields = ['skills', 'languages', 'certifications', 'availableSlots', 'preferredCategories', 'skillsToLearn', 'learningInterests'];
const numberFields = ['hourlyRate', 'experience'];

const validateName = (v) => {
  if (!v || !v.trim()) return '';
  if (v.trim().length < 2) return 'Full name must be at least 2 characters';
  if (v.length > 100) return 'Full name must be under 100 characters';
  if (/[0-9]/.test(v)) return 'Full name cannot contain numbers';
  if (/[^a-zA-Z\s\-'.]/.test(v)) return 'Full name contains invalid characters';
  return '';
};
const validatePhone = (v) => {
  if (!v) return '';
  const digits = v.replace(/\D/g, '');
  if (digits.length !== 11) return 'Phone number must contain exactly 11 digits';
  return '';
};
const validateEmail = (v) => {
  if (!v) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email address';
  return '';
};
const validateCountry = (v) => {
  if (!v) return '';
  if (/[0-9]/.test(v)) return 'Country cannot contain numbers';
  if (/[^a-zA-Z\s]/.test(v)) return 'Country contains invalid characters';
  return '';
};
const validateCity = (v) => {
  if (!v) return '';
  if (/[0-9]/.test(v)) return 'City cannot contain numbers';
  if (/[^a-zA-Z\s-]/.test(v)) return 'City contains invalid characters';
  return '';
};
const validateTitle = (v) => {
  if (!v) return '';
  if (v.length > 100) return 'Professional title must be under 100 characters';
  return '';
};
const validateCompany = (v) => {
  if (!v) return '';
  if (/[^a-zA-Z0-9\s&.*,]/.test(v)) return 'Company contains invalid characters';
  return '';
};
const validateLinkedIn = (v) => {
  if (!v) return '';
  if (!/^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/.test(v)) return 'LinkedIn URL is invalid';
  return '';
};
const validateBio = (v) => {
  if (v && v.length > 1000) return 'Bio must be under 1000 characters';
  return '';
};
const validateIndustry = (v) => {
  if (!v) return '';
  if (v.length > 100) return 'Industry must be under 100 characters';
  return '';
};
const validators = {
  name: validateName, phone: validatePhone, email: validateEmail,
  country: validateCountry, city: validateCity, title: validateTitle,
  company: validateCompany, linkedinUrl: validateLinkedIn, bio: validateBio,
  industry: validateIndustry,
};

export default function ProfileSettings({ compact = false, onSaved, onAccountClosed, onThemeChange, initialTab }) {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab || 'profile');
  const [form, setForm] = useState(() => makeInitialForm(user));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ msg: '', type: '' });
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const photoRef = useRef(null);
  const formInitialized = useRef(false);
  const initialFormRef = useRef(null);

  useEffect(() => {
    if (user && !formInitialized.current) {
      const initial = makeInitialForm(user);
      setForm(initial);
      initialFormRef.current = initial;
      formInitialized.current = true;
    }
  }, [user]);

  const hasUnsavedChanges = useMemo(() => {
    if (!initialFormRef.current) return false;
    return Object.keys(initialFormRef.current).some(
      (key) => String(initialFormRef.current[key] ?? '') !== String(form[key] ?? '')
    );
  }, [form]);

  useEffect(() => {
    const handler = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const role = user?.role || 'mentee';
  const roleLabel = role === 'mentor' ? 'Mentor' : role === 'admin' ? 'Admin' : 'Mentee';
  const tabs = sectionMap[role] || sectionMap.mentee;

  if (!user) {
    return (
      <div className="rounded-2xl bg-surface-container-lowest p-8 text-center text-on-surface">
        Please login to view settings.
      </div>
    );
  }

  const validateField = (field, value) => validators[field] ? validators[field](value) : '';

  const setField = useCallback((f, v) => {
    setForm((p) => ({ ...p, [f]: v }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    const err = validateField(field, form[field]);
    setErrors((p) => ({ ...p, [field]: err }));
  };

  const validateSection = (sectionId) => {
    const fields = sectionFields[sectionId] || [];
    const newErrors = {};
    let hasError = false;
    const touchedUpdate = {};
    for (const field of fields) {
      touchedUpdate[field] = true;
      const fn = validators[field];
      if (fn) {
        const err = fn(form[field]);
        if (err) { newErrors[field] = err; hasError = true; }
      }
    }
    setErrors((p) => ({ ...p, ...newErrors }));
    setTouched((p) => ({ ...p, ...touchedUpdate }));
    return !hasError;
  };

  const showStatus = (msg, type = 'success') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 3500);
  };

  const saveSection = async (sectionId) => {
    if (sectionId !== 'security' && sectionId !== 'notifications' && !validateSection(sectionId)) {
      showStatus('Please fix the errors before saving.', 'error');
      return;
    }

    // ─── Security: Password Change ─────────────────────────────────────────────
    if (sectionId === 'security') {
      if (form.newPassword || form.currentPassword) {
        if (!form.currentPassword) {
          showStatus('Current password is required.', 'error');
          return;
        }
        if (form.newPassword.length < 8) {
          showStatus('New password must be at least 8 characters.', 'error');
          return;
        }
        if (form.newPassword !== form.confirmPassword) {
          showStatus('Passwords do not match.', 'error');
          return;
        }

        setSaving(true);
        try {
          await userService.changePassword(form.currentPassword, form.newPassword);
          const clearedForm = { ...form, currentPassword: '', newPassword: '', confirmPassword: '' };
          setForm(clearedForm);
          initialFormRef.current = makeInitialForm(user);
          showStatus('Password changed successfully.');
        } catch (error) {
          showStatus(error.response?.data?.message || 'Failed to change password.', 'error');
        } finally {
          setSaving(false);
        }
        return;
      }

      // ─── Security: Privacy only (no password fields filled) ─────────────────
      setSaving(true);
      try {
        const response = await userService.updateProfile({
          profileVisibility: form.profileVisibility,
        });
        updateUser(response.user);
        const fresh = makeInitialForm(response.user);
        setForm(fresh);
        initialFormRef.current = fresh;
        showStatus('Privacy settings saved.');
      } catch (error) {
        showStatus(error.response?.data?.message || 'Failed to save.', 'error');
      } finally {
        setSaving(false);
      }
      return;
    }

    // ─── All other sections ────────────────────────────────────────────────────
    const fields = sectionFields[sectionId] || sectionFields.profile;
    const payload = {};

    for (const field of fields) {
      if (arrayFields.includes(field)) {
        const arr = toList(form[field]);
        if (arr.length > 0) payload[field] = arr;
      } else if (numberFields.includes(field)) {
        if (form[field] !== '' && form[field] !== null) {
          payload[field] = safeNumber(form[field]);
        }
      } else {
        if (form[field] !== '' && form[field] !== null && form[field] !== undefined) {
          payload[field] = form[field];
        }
      }
    }

    if (Object.keys(payload).length === 0) {
      showStatus('No changes to save.', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await userService.updateProfile(payload);
      updateUser(response.user);
      const freshForm = makeInitialForm(response.user);
      setForm(freshForm);
      initialFormRef.current = freshForm;
      onThemeChange?.(form.appearanceTheme);
      showStatus('Changes saved successfully.');
      onSaved?.();
    } catch (error) {
      showStatus(error.response?.data?.message || 'Failed to save changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith('image/')) {
      showStatus('Only image files are allowed.', 'error');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      showStatus('Image must be under 5MB.', 'error');
      return;
    }

    setSaving(true);
    showStatus('Uploading photo...', 'success');
    try {
      const url = await uploadService.uploadImage(f);
      const response = await userService.updateProfile({ profilePic: url });
      updateUser(response.user);
      const photoForm = makeInitialForm(response.user);
      setForm(photoForm);
      initialFormRef.current = photoForm;
      showStatus('Profile photo updated!', 'success');
    } catch (error) {
      showStatus(error.message || 'Photo upload failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await userService.deleteAccount();
      tokenManager.clearTokens();
      logout();
      onAccountClosed?.();
    } catch (error) {
      showStatus('Failed to delete account.', 'error');
    }
  };

  const MultiChoice = ({ field, options }) => {
    const values = toList(form[field]);
    const toggle = (o) => setField(
      field,
      (values.includes(o) ? values.filter((x) => x !== o) : [...values, o]).join(', ')
    );
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => toggle(o)}
            className={`flex min-h-11 items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
              values.includes(o)
                ? 'border-secondary bg-secondary-container text-on-secondary-container'
                : 'border-outline-variant/25 bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {values.includes(o) ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <span>{o}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderStatusBadge = () => status.msg ? (
    <span className={`mr-auto rounded-full px-3 py-1.5 text-xs font-bold animate-[fadeIn_0.2s] ${
      status.type === 'error'
        ? 'bg-error/10 text-error'
        : 'bg-secondary-container text-on-secondary-container'
    }`}>
      {status.msg}
    </span>
  ) : null;

  const renderSaveFooter = (sectionId) => {
    if (sectionId === 'account') return null;
    return (
      <div className="flex items-center justify-end gap-3 pt-4">
        {renderStatusBadge()}
        <Button
          variant="primary"
          size="md"
          icon="check"
          onClick={() => saveSection(sectionId)}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    );
  };

  const renderSectionWrap = (sectionId, children) => (
    <div className="space-y-6">
      {children}
      {renderSaveFooter(sectionId)}
    </div>
  );

  // ─── Section Renderers ────────────────────────────────────────────────────────

  const e = (field) => touched[field] ? errors[field] || '' : '';
  const s = (field) => !!touched[field] && !errors[field] && form[field]?.length > 0;

  const renderProfile = () => renderSectionWrap("profile", (
    <Card title="Personal Information" icon="account_circle">
      <div className="space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar
            src={form.profilePic}
            name={form.name || roleLabel}
            size="xl"
            className="rounded-2xl ring-4 ring-surface-variant!"
          />
          <div className="flex-1 space-y-2">
            <Input
              label="Profile Photo URL"
              name="profilePic"
              value={form.profilePic}
              onChange={handleChange}
              placeholder="https://..."
            />
            <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoFile} className="hidden" />
            <Button variant="outline" size="sm" icon="upload" onClick={() => photoRef.current?.click()} disabled={saving}>
              {saving ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Full Name" name="name" value={form.name} onChange={handleChange} error={e('name')} success={s('name')} onBlur={() => handleBlur('name')} />
          <Input label="Email Address" type="email" value={form.email} error={e('email')} success={s('email')} onBlur={() => handleBlur('email')} disabled />
          <Input label="Phone Number" name="phone" value={form.phone} onChange={handleChange} error={e('phone')} success={s('phone')} onBlur={() => handleBlur('phone')} />
          <Input label="Country" name="country" value={form.country} onChange={handleChange} error={e('country')} success={s('country')} onBlur={() => handleBlur('country')} />
          <Input label="City" name="city" value={form.city} onChange={handleChange} error={e('city')} success={s('city')} onBlur={() => handleBlur('city')} />
          <Input
            label="Professional Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Senior Software Engineer"
            error={e('title')}
            success={s('title')}
            onBlur={() => handleBlur('title')}
          />
          <Input label="Company / Organization" name="company" value={form.company} onChange={handleChange} error={e('company')} success={s('company')} onBlur={() => handleBlur('company')} />
          {role === 'mentor' && (
            <Input label="Industry" name="industry" value={form.industry} onChange={handleChange} placeholder="e.g. Technology, Healthcare, Finance" error={e('industry')} success={s('industry')} onBlur={() => handleBlur('industry')} />
          )}
          <Input
            label="LinkedIn Profile"
            name="linkedinUrl"
            value={form.linkedinUrl}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/your-profile"
            error={e('linkedinUrl')}
            success={s('linkedinUrl')}
            onBlur={() => handleBlur('linkedinUrl')}
          />
        </div>
        <div className="relative">
          <Textarea
            label="Short Bio"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            onBlur={() => handleBlur('bio')}
            rows={3}
            placeholder="Tell others about yourself and your background."
            error={e('bio')}
            success={s('bio')}
          />
          <span className="absolute bottom-3 right-3 text-xs text-on-surface-variant/60">{form.bio?.length || 0}/1000</span>
        </div>
      </div>
    </Card>
  ));

  const renderCareer = () => renderSectionWrap("career", (
    <Card title="Mentorship Profile" icon="psychology">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Years of Experience"
            name="experience"
            type="text"
            inputMode="numeric"
            value={form.experience}
            onChange={handleChange}
            autoComplete="off"
          />
          <Input
            label="Session Price ($/hr)"
            name="hourlyRate"
            type="text"
            inputMode="decimal"
            value={form.hourlyRate}
            onChange={handleChange}
            autoComplete="off"
          />
          <Input
            label="Expertise Areas"
            name="skills"
            value={form.skills}
            onChange={handleChange}
            placeholder="Machine Learning, Leadership, Interviews"
          />
          <Input
            label="Languages"
            name="languages"
            value={form.languages}
            onChange={handleChange}
            placeholder="English, Urdu"
          />
          <Input
            label="Certifications"
            name="certifications"
            value={form.certifications}
            onChange={handleChange}
            placeholder="AWS Solutions Architect, PMP"
          />
          <Input
            label="Available Days"
            name="availableSlots"
            value={form.availableSlots}
            onChange={handleChange}
            placeholder="Monday, Wednesday, Friday"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-on-surface-variant">Mentorship Categories</p>
          <MultiChoice
            field="preferredCategories"
            options={['Career Guidance', 'Technical Coaching', 'Interview Preparation', 'Portfolio Review', 'Startup Mentoring', 'Leadership']}
          />
        </div>
      </div>
    </Card>
  ));

  const renderLearning = () => renderSectionWrap("learning", (
    <Card title="Learning Profile" icon="school">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Education"
            name="education"
            value={form.education}
            onChange={handleChange}
            placeholder="BS Computer Science, bootcamp, self-taught"
          />
          <Input
            label="Languages"
            name="languages"
            value={form.languages}
            onChange={handleChange}
            placeholder="English, Urdu"
          />
          <Input
            label="Current Skills"
            name="skills"
            value={form.skills}
            onChange={handleChange}
            placeholder="JavaScript, React, Python"
          />
          <Input
            label="Skills to Learn"
            name="skillsToLearn"
            value={form.skillsToLearn}
            onChange={handleChange}
            placeholder="System Design, Leadership, ML"
          />
          <Input
            label="Preferred Categories"
            name="preferredCategories"
            value={form.preferredCategories}
            onChange={handleChange}
            placeholder="Career Guidance, Interview Prep"
          />
        </div>
        <div className="relative">
          <Textarea
            label="Career Goals"
            name="careerGoals"
            value={form.careerGoals}
            onChange={handleChange}
            rows={3}
            placeholder="Where are you trying to go next?"
          />
          <span className="absolute bottom-3 right-3 text-xs text-on-surface-variant/60">{form.careerGoals?.length || 0}/1000</span>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-on-surface-variant">Learning Interests</p>
          <MultiChoice
            field="learningInterests"
            options={['Career Growth', 'Technical Skills', 'Interview Prep', 'Portfolio Building', 'Leadership', 'Startup Advice']}
          />
        </div>
      </div>
    </Card>
  ));

  const renderSecurity = () => renderSectionWrap("security", (
    <>
      <Card title="Change Password" icon="lock">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
            />
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Min 8 characters"
            />
            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat new password"
            />
          </div>
          <p className="text-xs text-on-surface-variant">
            Leave password fields empty to only save privacy settings.
          </p>
        </div>
      </Card>
      <Card title="Privacy" icon="visibility">
        <Select
          label="Profile Visibility"
          value={form.profileVisibility}
          onChange={handleChange}
          name="profileVisibility"
          options={[
            { value: 'public', label: 'Public — visible to everyone' },
            { value: 'members', label: 'Members Only — visible to registered users' },
            { value: 'private', label: 'Private — hidden from search' },
          ]}
        />
      </Card>
    </>
  ));

  const renderNotifications = () => renderSectionWrap("notifications", (
    <>
      <Card title="Email Notifications" icon="mail">
        <div className="space-y-3">
          <Toggle
            label="Session Requests"
            detail="Get notified when a session is requested."
            checked={form.emailSessionRequests}
            onChange={(v) => setField('emailSessionRequests', v)}
          />
          <Toggle
            label="Booking Reminders"
            detail="Receive reminders before upcoming sessions."
            checked={form.emailReminders}
            onChange={(v) => setField('emailReminders', v)}
          />
          <Toggle
            label="Marketing Emails"
            detail="Receive tips, product updates, and promotional content."
            checked={form.emailMarketing}
            onChange={(v) => setField('emailMarketing', v)}
          />
        </div>
      </Card>
      <Card title="Appearance" icon="palette">
        <div className="flex gap-3">
          {['System', 'Light', 'Dark'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setField('appearanceTheme', t); onThemeChange?.(t); }}
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
    </>
  ));

  const renderAccount = () => (
    <div className="space-y-6">
      <Card title="Account Actions" icon="settings">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex w-full items-center justify-between rounded-xl border border-error/30 bg-error-container/50 p-4 text-left transition-colors hover:bg-error-container"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error-container">
                <span className="material-symbols-outlined text-[20px] text-on-error-container">delete</span>
              </span>
              <span>
                <span className="block text-sm font-bold text-on-error-container">Delete Account</span>
                <span className="block text-xs text-on-error-container/70">
                  Permanently remove this account and all data.
                </span>
              </span>
            </span>
            <span className="material-symbols-outlined text-xl text-on-error-container">chevron_right</span>
          </button>
          <div className="flex items-center justify-end pt-2">
            {renderStatusBadge()}
          </div>
        </div>
      </Card>
    </div>
  );

  const tabContent = {
    profile: renderProfile,
    career: renderCareer,
    learning: renderLearning,
    security: renderSecurity,
    notifications: renderNotifications,
    account: renderAccount,
  };

  return (
    <div className={`mx-auto w-full ${compact ? 'max-w-full' : 'max-w-[1200px]'}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-on-surface md:text-4xl">Settings</h1>
        <p className="mt-1.5 text-sm text-on-surface-variant">
          Manage your {roleLabel.toLowerCase()} profile, security, preferences, and account.
        </p>
      </div>

      <div className="mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide sm:overflow-visible">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
        <div className="mt-px border-b border-outline-variant/15" />
      </div>

      <div className="animate-[fadeIn_0.15s_ease-out]">
        {(tabContent[activeTab] || (() => null))()}
      </div>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} className="w-full max-w-md">
        <div className="p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-on-error-container">
            <span className="material-symbols-outlined text-3xl">delete</span>
          </span>
          <h3 className="mt-4 text-2xl font-bold text-on-surface">Delete Account?</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            This action is permanent and cannot be undone. All your data, bookings, and sessions will be removed.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <Button variant="error" size="xl" onClick={confirmDelete}>
              Yes, Delete My Account
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
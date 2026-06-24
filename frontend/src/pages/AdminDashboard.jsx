import React, { useEffect, useMemo, useState } from 'react';
import ProfileSettings from '../components/ProfileSettings';
import {
  addTestimonial,
  addUser,
  approveMentor,
  deleteNotification,
  deleteUser,
  getCurrentUser,
  getNotifications,
  getUsersByRole,
  getDB,
  logout,
  markNotificationRead,
  rejectMentor,
  updateUserProfile,
} from '../utils/db';
import { getPublishedSiteContent, savePublishedSiteContent } from '../content/siteContent';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const useTheme = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('prolign-theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('prolign-theme', next);
      return next;
    });
  };
  return { theme, toggleTheme };
};

const emptyMemberForm = {
  role: 'mentee',
  name: '',
  email: '',
  password: '',
  title: '',
  company: '',
  industry: '',
  avatar: '',
  skills: '',
  hourlyRate: '',
};

const AdminDashboard = ({ navigateTo }) => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(getCurrentUser());
  const [activeView, setActiveView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [revenueRange, setRevenueRange] = useState('year');
  const [revenueYear, setRevenueYear] = useState(String(new Date().getFullYear()));
  const [revenueMonth, setRevenueMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [customRange, setCustomRange] = useState({ from: `${new Date().getFullYear()}-01-01`, to: `${new Date().getFullYear()}-12-31` });
  const [analyticsRange, setAnalyticsRange] = useState('year');
  const [analyticsYear, setAnalyticsYear] = useState(String(new Date().getFullYear()));
  const [analyticsMonth, setAnalyticsMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [analyticsCustomRange, setAnalyticsCustomRange] = useState({ from: `${new Date().getFullYear()}-01-01`, to: `${new Date().getFullYear()}-12-31` });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', avatar: '', password: '', newPassword: '', confirmPassword: '' });
  const [profileStatus, setProfileStatus] = useState('');
  const [testimonialForm, setTestimonialForm] = useState({ name: '', role: '', company: '', quote: '', avatar: '' });
  const [testimonialSuccess, setTestimonialSuccess] = useState('');
  const [contentStatus, setContentStatus] = useState('');

  const [contentEditor, setContentEditor] = useState({
    terms: { heroTitle: '', heroSummary: '', updatedAt: '', overview: '', sectionsJson: '' },
    privacy: { heroTitle: '', heroSummary: '', updatedAt: '', overview: '', sectionsJson: '' },
    cookies: { heroTitle: '', heroSummary: '', updatedAt: '', overview: '', sectionsJson: '', cookieTypesJson: '' },
    resources: { heroTitle: '', heroSummary: '', eyebrow: '', blogPostsJson: '', resumeTemplatesJson: '' },
  });

  const refreshData = () => {
    const db = getDB();
    setMentors(getUsersByRole('mentor'));
    setMentees(getUsersByRole('mentee'));
    setBookings(db.bookings || []);
    setNotifications(getNotifications());
    setUser(getCurrentUser());
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        password: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  useEffect(() => {
    setContentEditor({
      terms: {
        heroTitle: getPublishedSiteContent('terms')?.hero?.title || '',
        heroSummary: getPublishedSiteContent('terms')?.hero?.summary || '',
        updatedAt: getPublishedSiteContent('terms')?.hero?.updatedAt || '',
        overview: getPublishedSiteContent('terms')?.overview || '',
        sectionsJson: JSON.stringify(getPublishedSiteContent('terms')?.sections || [], null, 2),
      },
      privacy: {
        heroTitle: getPublishedSiteContent('privacy')?.hero?.title || '',
        heroSummary: getPublishedSiteContent('privacy')?.hero?.summary || '',
        updatedAt: getPublishedSiteContent('privacy')?.hero?.updatedAt || '',
        overview: getPublishedSiteContent('privacy')?.overview || '',
        sectionsJson: JSON.stringify(getPublishedSiteContent('privacy')?.sections || [], null, 2),
      },
      cookies: {
        heroTitle: getPublishedSiteContent('cookies')?.hero?.title || '',
        heroSummary: getPublishedSiteContent('cookies')?.hero?.summary || '',
        updatedAt: getPublishedSiteContent('cookies')?.hero?.updatedAt || '',
        overview: getPublishedSiteContent('cookies')?.overview || '',
        sectionsJson: JSON.stringify(getPublishedSiteContent('cookies')?.sections || [], null, 2),
        cookieTypesJson: JSON.stringify(getPublishedSiteContent('cookies')?.cookieTypes || [], null, 2),
      },
      resources: {
        heroTitle: getPublishedSiteContent('resources')?.hero?.title || '',
        heroSummary: getPublishedSiteContent('resources')?.hero?.summary || '',
        eyebrow: getPublishedSiteContent('resources')?.hero?.eyebrow || '',
        blogPostsJson: JSON.stringify(getPublishedSiteContent('resources')?.blogPosts || [], null, 2),
        resumeTemplatesJson: JSON.stringify(getPublishedSiteContent('resources')?.resumeTemplates || [], null, 2),
      },
    });
  }, []);

  const activeMentors = mentors.filter((mentor) => mentor.status === 'approved');
  const pendingMentors = mentors.filter((mentor) => mentor.status === 'pending');
  const allMembers = [...mentors, ...mentees];
  const unreadNotifs = notifications.filter((notification) => !notification.read);
  const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);

  const getDateRange = (mode, year, month, range) => {
    const yearNumber = Number(year);
    if ((mode === 'year' || mode === 'month') && (!Number.isInteger(yearNumber) || yearNumber <= 2000)) {
      return { error: 'Enter a valid year above 2000.' };
    }
    if (mode === 'year') return { from: new Date(yearNumber, 0, 1), to: new Date(yearNumber, 11, 31, 23, 59, 59), error: '' };
    if (mode === 'month') return { from: new Date(yearNumber, Number(month) - 1, 1), to: new Date(yearNumber, Number(month), 0, 23, 59, 59), error: '' };
    const from = new Date(range.from);
    const to = new Date(`${range.to}T23:59:59`);
    if (!range.from || !range.to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return { error: 'Choose both custom dates.' };
    if (from > to) return { error: 'Start date must be before end date.' };
    if (from.getFullYear() <= 2000 || to.getFullYear() <= 2000) return { error: 'Custom dates must be after year 2000.' };
    return { from, to, error: '' };
  };

  const analyticsDateRange = useMemo(
    () => getDateRange(analyticsRange, analyticsYear, analyticsMonth, analyticsCustomRange),
    [analyticsCustomRange, analyticsMonth, analyticsRange, analyticsYear]
  );

  const revenueDateRange = useMemo(
    () => getDateRange(revenueRange, revenueYear, revenueMonth, customRange),
    [customRange, revenueMonth, revenueRange, revenueYear]
  );

  const registrationsByMonth = useMemo(() => {
    if (analyticsDateRange.error) return [];
    if (analyticsRange === 'year') {
      return monthLabels.map((label, index) => {
        const mentorCount = mentors.filter((member) => {
          const date = new Date(member.createdAt || 0);
          return date.getFullYear() === Number(analyticsYear) && date.getMonth() === index;
        }).length;
        const menteeCount = mentees.filter((member) => {
          const date = new Date(member.createdAt || 0);
          return date.getFullYear() === Number(analyticsYear) && date.getMonth() === index;
        }).length;
        return { label, mentors: mentorCount, mentees: menteeCount };
      });
    }
    if (analyticsRange === 'month') {
      const days = new Date(Number(analyticsYear), Number(analyticsMonth), 0).getDate();
      return Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        const inDay = (member) => {
          const date = new Date(member.createdAt || 0);
          return date.getFullYear() === Number(analyticsYear) && date.getMonth() === Number(analyticsMonth) - 1 && date.getDate() === day;
        };
        return { label: String(day), mentors: mentors.filter(inDay).length, mentees: mentees.filter(inDay).length };
      });
    }
    return monthLabels.map((label, index) => ({
      label,
      mentors: mentors.filter((member) => {
        const date = new Date(member.createdAt || 0);
        return date >= analyticsDateRange.from && date <= analyticsDateRange.to && date.getMonth() === index;
      }).length,
      mentees: mentees.filter((member) => {
        const date = new Date(member.createdAt || 0);
        return date >= analyticsDateRange.from && date <= analyticsDateRange.to && date.getMonth() === index;
      }).length,
    }));
  }, [analyticsDateRange, analyticsMonth, analyticsRange, analyticsYear, mentors, mentees]);

  const revenueData = useMemo(() => {
    if (revenueDateRange.error) return [];
    const from = revenueDateRange.from;
    const to = revenueDateRange.to;

    const filtered = bookings.filter((booking) => {
      const date = new Date(booking.createdAt || booking.date || 0);
      return date >= from && date <= to && booking.paymentStatus === 'paid';
    });

    if (revenueRange === 'month') {
      const days = new Date(Number(revenueYear), Number(revenueMonth), 0).getDate();
      return Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        return {
          label: String(day),
          value: filtered
            .filter((booking) => new Date(booking.createdAt || booking.date).getDate() === day)
            .reduce((sum, booking) => sum + Number(booking.amount || 0), 0),
        };
      });
    }

    const monthBuckets = revenueRange === 'custom'
      ? monthLabels.map((label, index) => ({ label, month: index, year: null }))
      : Array.from({ length: 12 }, (_, index) => {
          const bucketDate = new Date(from.getFullYear(), from.getMonth() + index, 1);
          return { label: `${monthLabels[bucketDate.getMonth()]} ${String(bucketDate.getFullYear()).slice(2)}`, month: bucketDate.getMonth(), year: bucketDate.getFullYear() };
        });

    return monthBuckets.map((bucket) => ({
      label: bucket.label,
      value: filtered
        .filter((booking) => {
          const date = new Date(booking.createdAt || booking.date);
          return bucket.year === null
            ? date.getMonth() === bucket.month
            : date.getMonth() === bucket.month && date.getFullYear() === bucket.year;
        })
        .reduce((sum, booking) => sum + Number(booking.amount || 0), 0),
    }));
  }, [bookings, revenueDateRange, revenueMonth, revenueRange, revenueYear]);

  const handleLogout = () => {
    logout();
    navigateTo('home');
  };

  const submitReject = (event) => {
    event.preventDefault();
    rejectMentor(showRejectModal, rejectReason);
    setShowRejectModal(null);
    setRejectReason('');
    refreshData();
  };

  const handleMemberSubmit = (event) => {
    event.preventDefault();
    addUser({
      ...memberForm,
      skills: memberForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      hourlyRate: memberForm.role === 'mentor' ? Number(memberForm.hourlyRate || 0) : undefined,
    });
    setMemberForm(emptyMemberForm);
    setIsAddingMember(false);
    refreshData();
  };

  const handleDeleteMember = (id) => {
    const member = allMembers.find((item) => item.id === id);
    if (!window.confirm(`Delete ${member?.name || 'this user'}? This action cannot be undone.`)) return;
    deleteUser(id);
    setSelectedMember(null);
    refreshData();
  };

  const downloadCsv = (name, rows) => {
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderRangeControls = (mode, setMode, year, setYear, month, setMonth, range, setRange, error, onDownload) => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['year', 'month', 'custom'].map((rangeMode) => (
          <button key={rangeMode} onClick={() => setMode(rangeMode)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition-colors ${mode === rangeMode ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-variant'}`}>{rangeMode}</button>
        ))}
        <button onClick={onDownload} className="rounded-full bg-secondary px-4 py-2 text-sm font-bold text-on-secondary">Download CSV</button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(mode === 'year' || mode === 'month') && <input type="number" min="2001" value={year} onChange={(event) => setYear(event.target.value)} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Year above 2000" />}
        {mode === 'month' && (
          <select value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-lg border border-outline-variant/30 bg-surface p-3">
            {monthLabels.map((label, index) => <option key={label} value={String(index + 1).padStart(2, '0')}>{label}</option>)}
          </select>
        )}
        {mode === 'custom' && (
          <>
            <input type="date" value={range.from} onChange={(event) => setRange({ ...range, from: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" />
            <input type="date" value={range.to} onChange={(event) => setRange({ ...range, to: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" />
          </>
        )}
      </div>
      {error && <p className="text-sm font-bold text-error">{error}</p>}
    </div>
  );

  const handleProfileSave = (event) => {
    event.preventDefault();
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      setProfileStatus('New passwords do not match.');
      return;
    }
    if (profileForm.newPassword && profileForm.password !== user.password) {
      setProfileStatus('Current password is incorrect.');
      return;
    }
    updateUserProfile(user.id, {
      name: profileForm.name,
      email: profileForm.email,
      avatar: profileForm.avatar,
      ...(profileForm.newPassword ? { password: profileForm.newPassword } : {}),
    });
    setProfileStatus('Profile updated successfully.');
    refreshData();
    setTimeout(() => setProfileStatus(''), 3000);
  };

  const handleTestimonialSubmit = (event) => {
    event.preventDefault();
    addTestimonial({ ...testimonialForm, published: true });
    setTestimonialSuccess('Testimonial added and published successfully.');
    setTestimonialForm({ name: '', role: '', company: '', quote: '', avatar: '' });
    setTimeout(() => setTestimonialSuccess(''), 3000);
  };

  const parseJsonBlock = (value, fallback) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const updateEditorField = (sectionKey, fieldKey, value) => {
    setContentEditor((previous) => ({
      ...previous,
      [sectionKey]: { ...previous[sectionKey], [fieldKey]: value },
    }));
  };

  const publishContent = (sectionKey, nextContent) => {
    savePublishedSiteContent(sectionKey, nextContent);
    setContentStatus(`${sectionKey} published successfully.`);
    setTimeout(() => setContentStatus(''), 3000);
  };

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'mentors', icon: 'groups', label: 'Mentors' },
    { id: 'mentees', icon: 'person', label: 'Mentees' },
    { id: 'applications', icon: 'assignment', label: 'Applications' },
    { id: 'content', icon: 'library_books', label: 'Content' },
    { id: 'earnings', icon: 'payments', label: 'Earnings' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];

  const renderLineChart = (data, mode = 'single') => {
    const width = 800;
    const height = 220;
    const maxValue = Math.max(1, ...data.map((item) => mode === 'stacked' ? item.mentors + item.mentees : item.value));
    const step = data.length > 1 ? width / (data.length - 1) : width;
    const yFor = (value) => height - 20 - ((value / maxValue) * 170);
    const mentorPath = data.map((item, index) => `${index === 0 ? 'M' : 'L'}${index * step},${yFor(item.mentors || 0)}`).join(' ');
    const menteePath = data.map((item, index) => `${index === 0 ? 'M' : 'L'}${index * step},${yFor(item.mentees || 0)}`).join(' ');
    const valuePath = data.map((item, index) => `${index === 0 ? 'M' : 'L'}${index * step},${yFor(item.value || 0)}`).join(' ');

    return (
      <div className="relative h-72 w-full">
        <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {[50, 100, 150].map((line) => <line key={line} x1="0" x2={width} y1={line} y2={line} stroke="#45483f" strokeOpacity="0.1" />)}
          {mode === 'stacked' ? (
            <>
              <path d={mentorPath} fill="none" stroke="#202a10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
              <path d={menteePath} fill="none" stroke="#5b6239" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" strokeDasharray="8 8" />
            </>
          ) : (
            <path d={valuePath} fill="none" stroke="#202a10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          )}
        </svg>
        <div className="mt-2 grid text-xs font-semibold text-on-surface-variant" style={{ gridTemplateColumns: `repeat(${Math.min(data.length, 12)}, minmax(0, 1fr))` }}>
          {data.filter((_, index) => data.length <= 12 || index % 3 === 0).map((item) => <span key={item.label}>{item.label}</span>)}
        </div>
      </div>
    );
  };

  const renderSidebar = ({ mobile = false } = {}) => (
    <aside className={`flex h-full w-64 shrink-0 flex-col bg-primary py-6 text-primary-fixed-dim shadow-xl ${
      mobile ? '' : 'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex'
    }`}>
      <button className="mb-8 px-6 text-left" onClick={() => { setActiveView('dashboard'); if (mobile) setMobileMenuOpen(false); }}>
        <h1 className="font-headline-md text-2xl font-bold text-on-primary">ProLign</h1>
        <p className="text-sm font-semibold text-primary-fixed-dim">Modern Mentorship Admin</p>
      </button>
      <nav className="flex-1 space-y-2 overflow-y-auto px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveView(item.id); if (mobile) setMobileMenuOpen(false); }}
            className={`group flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold transition-all ${
              activeView === item.id ? 'scale-[0.98] bg-secondary-container text-on-secondary-container' : 'text-primary-fixed-dim hover:bg-primary-fixed-variant/20 hover:text-on-primary'
            }`}
          >
            <span className="material-symbols-outlined mr-3 transition-transform group-hover:scale-110">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mx-2 border-t border-on-primary/10 pt-4 space-y-1">
        <button onClick={toggleTheme} className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold text-primary-fixed-dim transition-colors hover:bg-primary-fixed-variant/20 hover:text-on-primary">
          <span className="material-symbols-outlined mr-3">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <button onClick={handleLogout} className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold text-primary-fixed-dim transition-colors hover:bg-error/10 hover:text-error">
          <span className="material-symbols-outlined mr-3">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );

  const renderDashboard = () => (
    <section className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['school', 'Active Mentors', activeMentors.length],
          ['diversity_3', 'Total Mentees', mentees.length],
          ['assignment', 'Pending Mentors', pendingMentors.length],
          ['person_add', 'User Signups', allMembers.length],
        ].map(([icon, label, value]) => (
          <div key={label} className="rounded-xl border border-outline-variant/10 bg-surface-container-high p-6 natural-shadow">
            <span className="material-symbols-outlined mb-4 rounded-lg bg-primary-fixed p-2 text-on-primary-fixed">{icon}</span>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">{label}</h3>
            <p className="mt-1 font-headline-md text-3xl font-bold text-on-surface">{Number(value).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-8 natural-shadow">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-on-surface">Past Registration Analytics</h3>
            <p className="text-sm text-on-surface-variant">Mentor and mentee registrations by year, month, or custom date range.</p>
          </div>
          <div className="flex gap-4 text-xs font-bold text-on-surface-variant">
            <span><span className="mr-2 inline-block h-2 w-6 rounded-full bg-primary"></span>Mentors</span>
            <span><span className="mr-2 inline-block h-2 w-6 rounded-full bg-secondary"></span>Mentees</span>
          </div>
        </div>
        <div className="mb-6">
          {renderRangeControls(
            analyticsRange,
            setAnalyticsRange,
            analyticsYear,
            setAnalyticsYear,
            analyticsMonth,
            setAnalyticsMonth,
            analyticsCustomRange,
            setAnalyticsCustomRange,
            analyticsDateRange.error,
            () => downloadCsv('registration-analytics', [['Label', 'Mentors', 'Mentees'], ...registrationsByMonth.map((item) => [item.label, item.mentors, item.mentees])])
          )}
        </div>
        {renderLineChart(registrationsByMonth, 'stacked')}
      </div>
    </section>
  );

  const renderMemberList = (role) => {
    const members = role === 'mentor' ? mentors : mentees;
    return (
      <section className="rounded-xl border border-outline-variant/10 bg-surface-container p-8 natural-shadow">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-on-surface">{role === 'mentor' ? 'Mentors' : 'Mentees'}</h3>
            <p className="text-sm text-on-surface-variant">View details, delete records, or add a new {role}.</p>
          </div>
          <button onClick={() => { setMemberForm({ ...emptyMemberForm, role }); setIsAddingMember(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-transform hover:scale-[1.02]">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add {role === 'mentor' ? 'Mentor' : 'Mentee'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-on-surface/10 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                <th className="pb-4">Name</th>
                <th className="pb-4">Profile</th>
                <th className="pb-4">Joined</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-surface/5">
              {members.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-surface-container-low">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <img className="h-10 w-10 rounded-full object-cover" src={member.avatar} alt={member.name} />
                      <div>
                        <div className="text-sm font-bold text-on-surface">{member.name}</div>
                        <div className="text-xs text-on-surface-variant">{member.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-on-surface-variant">{member.title || member.industry || 'Profile pending'}</td>
                  <td className="py-4 text-sm text-on-surface-variant">{new Date(member.createdAt).toLocaleDateString()}</td>
                  <td className="py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelectedMember(member)} className="rounded-lg p-2 text-secondary transition-colors hover:bg-secondary-container" title="View details">
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button onClick={() => handleDeleteMember(member.id)} className="rounded-lg p-2 text-error transition-colors hover:bg-error-container/40" title="Delete">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderApplications = () => (
    <section className="rounded-xl border border-outline-variant/10 bg-surface-container p-8 natural-shadow">
      <h3 className="mb-6 font-headline-md text-2xl font-bold text-on-surface">All Pending Approvals</h3>
      {pendingMentors.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No pending applications at this time.</p>
      ) : (
        <div className="space-y-4">
          {pendingMentors.map((mentor) => (
            <div key={mentor.id} className="flex flex-col justify-between gap-4 rounded-xl bg-surface-container-low p-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <img className="h-12 w-12 rounded-full object-cover" src={mentor.avatar} alt={mentor.name} />
                <div>
                  <div className="font-bold text-on-surface">{mentor.name}</div>
                  <div className="text-sm text-on-surface-variant">{mentor.industry} - {mentor.skills?.join(', ')}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedMember(mentor)} className="rounded-lg bg-surface px-4 py-2 text-sm font-bold text-on-surface-variant">Preview</button>
                <button onClick={() => setShowRejectModal(mentor.id)} className="rounded-lg bg-error-container px-4 py-2 text-sm font-bold text-on-error-container">Reject</button>
                <button onClick={() => { approveMentor(mentor.id); refreshData(); }} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-on-secondary">Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderEarnings = () => (
    <section className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-primary p-6 text-on-primary natural-shadow">
          <span className="material-symbols-outlined mb-4 text-primary-fixed">payments</span>
          <p className="text-sm font-semibold text-primary-fixed-dim">Total Platform Revenue</p>
          <p className="font-headline-md text-4xl font-bold">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-high p-6 natural-shadow">
          <p className="text-sm font-semibold text-on-surface-variant">Paid Bookings</p>
          <p className="font-headline-md text-4xl font-bold text-on-surface">{bookings.filter((booking) => booking.paymentStatus === 'paid').length}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-high p-6 natural-shadow">
          <p className="text-sm font-semibold text-on-surface-variant">Average Transaction</p>
          <p className="font-headline-md text-4xl font-bold text-on-surface">${Math.round(totalRevenue / Math.max(1, bookings.length)).toLocaleString()}</p>
        </div>
      </div>
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-8 natural-shadow">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-on-surface">Revenue Analytics</h3>
            <p className="text-sm text-on-surface-variant">View last year, current month, or a custom date range.</p>
          </div>
        </div>
        <div className="mb-6">
          {renderRangeControls(
            revenueRange,
            setRevenueRange,
            revenueYear,
            setRevenueYear,
            revenueMonth,
            setRevenueMonth,
            customRange,
            setCustomRange,
            revenueDateRange.error,
            () => downloadCsv('earning-analytics', [['Label', 'Revenue'], ...revenueData.map((item) => [item.label, item.value])])
          )}
        </div>
        {revenueDateRange.error ? (
          <div className="rounded-lg bg-error-container p-4 text-sm font-bold text-on-error-container">{revenueDateRange.error}</div>
        ) : (
          renderLineChart(revenueData)
        )}
      </div>
    </section>
  );

  const renderProfileSettings = () => (
    <section className="space-y-8">
      <form onSubmit={handleProfileSave} className="rounded-xl border border-outline-variant/10 bg-surface-container p-8 natural-shadow">
        <h3 className="mb-2 font-headline-md text-2xl font-bold text-on-surface">Admin Profile</h3>
        <p className="mb-6 text-sm text-on-surface-variant">Edit your image, name, email, and password.</p>
        {profileStatus && <div className="mb-6 rounded-lg bg-secondary-container p-3 text-sm font-bold text-on-secondary-container">{profileStatus}</div>}
        <div className="mb-8 flex items-center gap-5">
          <img className="h-20 w-20 rounded-full object-cover ring-4 ring-surface-variant" src={profileForm.avatar || 'https://i.pravatar.cc/150?u=admin'} alt="Admin" />
          <div className="flex-1">
            <label className="mb-2 block text-xs font-bold uppercase text-on-surface-variant">Profile Image URL</label>
            <input value={profileForm.avatar} onChange={(event) => setProfileForm({ ...profileForm, avatar: event.target.value })} className="w-full rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="https://..." />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <input value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Full name" required />
          <input type="email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Email" required />
          <input type="password" value={profileForm.password} onChange={(event) => setProfileForm({ ...profileForm, password: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Current password" />
          <input type="password" value={profileForm.newPassword} onChange={(event) => setProfileForm({ ...profileForm, newPassword: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="New password" />
          <input type="password" value={profileForm.confirmPassword} onChange={(event) => setProfileForm({ ...profileForm, confirmPassword: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3 md:col-span-2" placeholder="Confirm new password" />
        </div>
        <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-on-primary" type="submit">
          <span className="material-symbols-outlined text-[18px]">save</span>
          Save Profile
        </button>
      </form>

      <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-8 natural-shadow">
        <h3 className="mb-2 font-headline-md text-2xl font-bold text-on-surface">Manage Testimonials</h3>
        <p className="mb-6 text-sm text-on-surface-variant">Add success stories to appear on the landing page.</p>
        {testimonialSuccess && <div className="mb-6 rounded-lg bg-primary-container p-3 text-sm font-bold text-on-primary-container">{testimonialSuccess}</div>}
        <form onSubmit={handleTestimonialSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input value={testimonialForm.name} onChange={(event) => setTestimonialForm({ ...testimonialForm, name: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Name" required />
          <input value={testimonialForm.avatar} onChange={(event) => setTestimonialForm({ ...testimonialForm, avatar: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Avatar URL" />
          <input value={testimonialForm.role} onChange={(event) => setTestimonialForm({ ...testimonialForm, role: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Role" required />
          <input value={testimonialForm.company} onChange={(event) => setTestimonialForm({ ...testimonialForm, company: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Company" required />
          <textarea value={testimonialForm.quote} onChange={(event) => setTestimonialForm({ ...testimonialForm, quote: event.target.value })} className="h-24 rounded-lg border border-outline-variant/30 bg-surface p-3 md:col-span-2" placeholder="Quote" required />
          <button className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-on-primary md:w-fit" type="submit">Publish Testimonial</button>
        </form>
      </div>
    </section>
  );

  const renderContentManager = () => (
    <section className="rounded-xl border border-outline-variant/10 bg-surface-container p-8 natural-shadow">
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface">Published Content</h3>
          <p className="text-sm text-on-surface-variant">Update legal pages and public resources.</p>
        </div>
        <span className="text-sm font-semibold text-secondary">{contentStatus || 'Changes publish immediately.'}</span>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {['terms', 'privacy', 'cookies', 'resources'].map((sectionKey) => (
          <div key={sectionKey} className="space-y-4 rounded-xl border border-outline-variant/10 bg-surface-container-low p-5">
            <h4 className="font-bold capitalize text-on-surface">{sectionKey}</h4>
            <input value={contentEditor[sectionKey].heroTitle} onChange={(event) => updateEditorField(sectionKey, 'heroTitle', event.target.value)} className="w-full rounded-lg border border-outline-variant/30 bg-surface p-3 text-sm" placeholder="Hero title" />
            <textarea value={contentEditor[sectionKey].heroSummary} onChange={(event) => updateEditorField(sectionKey, 'heroSummary', event.target.value)} className="h-24 w-full rounded-lg border border-outline-variant/30 bg-surface p-3 text-sm" placeholder="Hero summary" />
            <button
              onClick={() => publishContent(sectionKey, sectionKey === 'resources'
                ? { hero: { badge: 'Resource Hub', title: contentEditor.resources.heroTitle, summary: contentEditor.resources.heroSummary, eyebrow: contentEditor.resources.eyebrow }, blogPosts: parseJsonBlock(contentEditor.resources.blogPostsJson, []), resumeTemplates: parseJsonBlock(contentEditor.resources.resumeTemplatesJson, []) }
                : { hero: { badge: 'Legal', title: contentEditor[sectionKey].heroTitle, summary: contentEditor[sectionKey].heroSummary, updatedAt: contentEditor[sectionKey].updatedAt }, overview: contentEditor[sectionKey].overview, sections: parseJsonBlock(contentEditor[sectionKey].sectionsJson, []) })}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-on-primary"
            >
              Publish {sectionKey}
            </button>
          </div>
        ))}
      </div>
    </section>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return renderDashboard();
      case 'mentors': return renderMemberList('mentor');
      case 'mentees': return renderMemberList('mentee');
      case 'applications': return renderApplications();
      case 'earnings': return renderEarnings();
      case 'settings': return <ProfileSettings compact onSaved={refreshData} />;
      case 'content': return renderContentManager();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body-md">
      {renderSidebar()}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close dashboard menu"
          />
          <div className="relative h-full w-64">
            {renderSidebar({ mobile: true })}
          </div>
        </div>
      )}

      <main className="min-h-screen lg:pl-64 w-full bg-surface">
        <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8 pb-28">
        <header className="relative mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-on-surface lg:hidden"
              aria-label="Open dashboard menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h2 className="font-headline-lg text-2xl sm:text-4xl font-bold capitalize text-on-surface">{activeView.replace('-', ' ')}</h2>
              <p className="mt-0.5 text-sm sm:text-base text-on-surface-variant">Manage platform operations, members, and metrics.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container natural-shadow transition-colors hover:bg-surface-container-high">
                <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
                {unreadNotifs.length > 0 && <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-error">{unreadNotifs.length}</span>}
              </button>
              {showNotifications && (
                <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest natural-shadow">
                  <div className="flex items-center justify-between border-b border-outline-variant/10 p-4">
                    <h4 className="font-bold text-on-surface">Notifications</h4>
                    <button className="text-xs font-bold text-secondary" onClick={() => { notifications.forEach((item) => markNotificationRead(item.id)); refreshData(); }}>Mark all read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((item) => (
                      <div key={item.id} className={`border-b border-outline-variant/5 p-4 ${!item.read ? 'bg-primary/5' : ''}`}>
                        <div className="mb-1 flex justify-between gap-3">
                          <span className="text-sm font-bold text-on-surface">{item.title}</span>
                          <div className="flex gap-2">
                            {!item.read && <button onClick={() => { markNotificationRead(item.id); refreshData(); }} className="text-xs font-bold text-secondary">Read</button>}
                            <button onClick={() => { deleteNotification(item.id); refreshData(); }} className="text-xs font-bold text-error">Delete</button>
                          </div>
                        </div>
                        <p className="text-xs text-on-surface-variant">{item.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setActiveView('settings')} className="flex items-center gap-3 rounded-full bg-surface-container px-4 py-2 natural-shadow transition-colors hover:bg-surface-container-high">
              <img className="h-8 w-8 rounded-full object-cover" src={user?.avatar || 'https://i.pravatar.cc/150?u=admin'} alt="Admin" />
              <span className="text-sm font-semibold text-on-surface">{user?.name}</span>
            </button>
          </div>
        </header>

        {renderContent()}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/10 bg-background/95 px-2 py-2 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-7 gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`flex flex-col items-center rounded-xl px-1 py-2 text-[10px] font-semibold ${
                activeView === item.id ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${activeView === item.id ? 'fill-icon' : ''}`}>{item.icon}</span>
              <span className="leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {selectedMember && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-6 natural-shadow">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img className="h-16 w-16 rounded-full object-cover" src={selectedMember.avatar} alt={selectedMember.name} />
                <div>
                  <h3 className="text-xl font-bold text-on-surface">{selectedMember.name}</h3>
                  <p className="text-sm text-on-surface-variant">{selectedMember.role} - {selectedMember.email || 'No email'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="rounded-full p-2 hover:bg-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              {['title', 'company', 'industry', 'status', 'hourlyRate', 'createdAt'].map((key) => (
                <div key={key} className="rounded-lg bg-surface-container-low p-3">
                  <div className="text-xs font-bold uppercase text-on-surface-variant">{key}</div>
                  <div className="font-semibold text-on-surface">{key === 'createdAt' ? new Date(selectedMember[key]).toLocaleString() : selectedMember[key] || 'Not set'}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">{selectedMember.bio || 'No bio has been added yet.'}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSelectedMember(null)} className="rounded-lg bg-surface px-4 py-2 font-bold text-on-surface-variant">Close</button>
              <button onClick={() => handleDeleteMember(selectedMember.id)} className="rounded-lg bg-error px-4 py-2 font-bold text-on-error">Delete User</button>
            </div>
          </div>
        </div>
      )}

      {isAddingMember && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleMemberSubmit} className="w-full max-w-2xl rounded-2xl bg-surface-container-lowest p-6 natural-shadow">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-headline-md text-2xl font-bold text-on-surface">Add {memberForm.role === 'mentor' ? 'Mentor' : 'Mentee'}</h3>
              <button type="button" onClick={() => setIsAddingMember(false)} className="rounded-full p-2 hover:bg-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <select value={memberForm.role} onChange={(event) => setMemberForm({ ...memberForm, role: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3">
                <option value="mentee">Mentee</option>
                <option value="mentor">Mentor</option>
              </select>
              <input value={memberForm.name} onChange={(event) => setMemberForm({ ...memberForm, name: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Full name" required />
              <input type="email" value={memberForm.email} onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Email" required />
              <input type="password" value={memberForm.password} onChange={(event) => setMemberForm({ ...memberForm, password: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Password" required />
              <input value={memberForm.title} onChange={(event) => setMemberForm({ ...memberForm, title: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder={memberForm.role === 'mentor' ? 'Job title' : 'Current status'} />
              <input value={memberForm.avatar} onChange={(event) => setMemberForm({ ...memberForm, avatar: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Image URL" />
              <input value={memberForm.skills} onChange={(event) => setMemberForm({ ...memberForm, skills: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3 md:col-span-2" placeholder="Skills, comma separated" />
              {memberForm.role === 'mentor' && (
                <>
                  <input value={memberForm.company} onChange={(event) => setMemberForm({ ...memberForm, company: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Company" />
                  <input value={memberForm.industry} onChange={(event) => setMemberForm({ ...memberForm, industry: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Industry" />
                  <input type="number" value={memberForm.hourlyRate} onChange={(event) => setMemberForm({ ...memberForm, hourlyRate: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Hourly rate" />
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAddingMember(false)} className="rounded-lg bg-surface px-4 py-2 font-bold text-on-surface-variant">Cancel</button>
              <button className="rounded-lg bg-primary px-4 py-2 font-bold text-on-primary" type="submit">Add User</button>
            </div>
          </form>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 natural-shadow">
            <h3 className="mb-2 text-xl font-bold text-error">Reject Application</h3>
            <p className="mb-4 text-sm text-on-surface-variant">Provide a reason for the applicant record.</p>
            <form onSubmit={submitReject}>
              <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} required className="mb-6 w-full rounded-lg border border-outline-variant/30 bg-surface p-3 text-sm" rows={3} placeholder="Reason for rejection" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowRejectModal(null)} className="rounded-lg px-4 py-2 font-bold text-on-surface-variant hover:bg-surface-variant">Cancel</button>
                <button type="submit" className="rounded-lg bg-error px-4 py-2 font-bold text-on-error">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

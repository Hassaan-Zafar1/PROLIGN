import React, { useEffect, useMemo, useState } from 'react';
import ProfileSettings from '../components/ProfileSettings';
import { getMentorLevel, getMentorLevelStyle } from '../utils/mentorLevel';
import { useAuth } from '../context/AuthContext';
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
  logout as dbLogout,
  markNotificationRead,
  rejectMentor,
} from '../utils/db';
import { tokenManager } from '../utils/tokenManager';
import Input from '../components/common/Input';
import { getPublishedSiteContent, savePublishedSiteContent } from '../content/siteContent';
import { adminService } from '../services/adminService';
import { useTheme } from '../hooks/useTheme';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-surface-variant/50 ${className}`} />
);

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
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(getCurrentUser());
  const [activeView, setActiveView] = useState('dashboard');
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
  const [testimonialForm, setTestimonialForm] = useState({ name: '', role: '', company: '', quote: '', avatar: '' });
  const [testimonialSuccess, setTestimonialSuccess] = useState('');
  const [contentStatus, setContentStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const [contentEditor, setContentEditor] = useState({
    terms: { heroTitle: '', heroSummary: '', updatedAt: '', overview: '', sectionsJson: '' },
    privacy: { heroTitle: '', heroSummary: '', updatedAt: '', overview: '', sectionsJson: '' },
    cookies: { heroTitle: '', heroSummary: '', updatedAt: '', overview: '', sectionsJson: '', cookieTypesJson: '' },
    resources: { heroTitle: '', heroSummary: '', eyebrow: '', blogPostsJson: '', resumeTemplatesJson: '' },
  });

  const refreshData = async () => {
    setLoading(true);
    // try {
    //   // Try fetching from backend API first
    //   const response = await adminService.getUsers();
    //   const allUsers = response.users || [];
    //   setMentors(allUsers.filter(u => u.role === 'mentor'));
    //   setMentees(allUsers.filter(u => u.role === 'mentee'));
    //   setNotifications(getNotifications());
    //   setUser(getCurrentUser());
    //   const db = getDB();
    //   setBookings(db.bookings || []);
    // } catch (error) {
      // console.warn('Backend API unavailable, falling back to local data:', error.message);
      try {
        const db = getDB();
        setMentors(getUsersByRole('mentor'));
        setMentees(getUsersByRole('mentee'));
        setBookings(db.bookings || []);
        setNotifications(getNotifications());
        setUser(getCurrentUser());
      } catch (err) {
        // console.error('Failed to refresh data:', err);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

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
    dbLogout();
    tokenManager.clearTokens();
    logout();
    navigateTo('home');
  };

  const submitReject = async (event) => {
    event.preventDefault();
    try {
      await adminService.rejectMentor(showRejectModal);
    } catch (err) {
      console.warn('Backend reject failed, falling back to local:', err.message);
      rejectMentor(showRejectModal, rejectReason);
    }
    if (user?.id === showRejectModal) setUser({ ...user, status: 'rejected', rejectionReason: rejectReason });
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
        {(mode === 'year' || mode === 'month') && <input type="text" inputMode="numeric" min="2001" value={year} onChange={(event) => setYear(event.target.value)} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Year above 2000" autoComplete="off" />}
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
      // return fallback;
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-on-surface-variant">Please log in to access the admin dashboard.</p>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'mentors', icon: 'groups', label: 'Mentors' },
    { id: 'mentees', icon: 'person', label: 'Mentees' },
    { id: 'applications', icon: 'assignment', label: 'Applications' },
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
          {[50, 100, 150].map((line) => <line key={line} x1="0" x2={width} y1={line} y2={line} style={{ stroke: 'var(--color-on-surface-variant)', strokeOpacity: '0.1' }} />)}
          {mode === 'stacked' ? (
            <>
              <path d={mentorPath} fill="none" style={{ stroke: 'var(--color-primary)' }} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
              <path d={menteePath} fill="none" style={{ stroke: 'var(--color-secondary)' }} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" strokeDasharray="8 8" />
            </>
          ) : (
            <path d={valuePath} fill="none" style={{ stroke: 'var(--color-primary)' }} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          )}
        </svg>
        <div className="mt-2 grid text-xs font-semibold text-on-surface-variant" style={{ gridTemplateColumns: `repeat(${Math.min(data.length, 12)}, minmax(0, 1fr))` }}>
          {data.filter((_, index) => data.length <= 12 || index % 3 === 0).map((item) => <span key={item.label}>{item.label}</span>)}
        </div>
      </div>
    );
  };

  const renderSidebar = () => (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-primary py-6 text-on-primary shadow-xl hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex">
      <button className="mb-8 px-6 text-left" onClick={() => setActiveView('dashboard')}>
        <h1 className="font-headline-md text-2xl font-bold text-on-primary">ProLign</h1>
        <p className="text-sm font-semibold text-on-primary/80">Modern Mentorship Admin</p>
      </button>
      <nav className="flex-1 space-y-2 overflow-y-auto px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`group flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold transition-all ${
              activeView === item.id ? 'scale-[0.98] bg-secondary-container text-on-secondary-container' : 'hover:bg-primary-fixed-variant/20 hover:text-on-primary'
            }`}
          >
            <span className="material-symbols-outlined mr-3 transition-transform group-hover:scale-110">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mx-2 border-t border-on-primary/10 pt-4 space-y-1">
        <button onClick={toggleTheme} className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold text-on-primary transition-colors hover:bg-primary-fixed-variant/20">
          <span className="material-symbols-outlined mr-3">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <button onClick={handleLogout} className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold text-on-primary transition-colors hover:bg-error/10 hover:text-error">
          <span className="material-symbols-outlined mr-3">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );

  const renderDashboard = () => (
    <section className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5">
                <Skeleton className="mb-3 h-11 w-11" />
                <Skeleton className="mb-2 h-7 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          : [
              ['school', 'Active Mentors', activeMentors.length],
              ['diversity_3', 'Total Mentees', mentees.length],
              ['assignment', 'Pending Mentors', pendingMentors.length],
              ['person_add', 'User Signups', allMembers.length],
            ].map(([icon, label, value]) => (
              <div key={label} className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 transition-all hover:shadow-lg hover:scale-[1.01]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-3">
                  <span className="material-symbols-outlined text-[22px] text-primary">{icon}</span>
                </span>
                <p className="text-2xl font-bold text-on-surface">{Number(value).toLocaleString()}</p>
                <p className="mt-1 text-xs font-semibold text-on-surface-variant">{label}</p>
              </div>
            ))}
      </div>
      <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6">
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
        {loading ? <Skeleton className="h-72 w-full" /> : renderLineChart(registrationsByMonth, 'stacked')}
      </div>
    </section>
  );

  const renderMemberList = (role) => {
    const members = role === 'mentor' ? mentors : mentees;
    return (
      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6">
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
              <tr className="bg-surface-container-low border-b border-outline-variant/10 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Profile</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            {loading ? (
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-outline-variant/10">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4"><div className="flex justify-end"><Skeleton className="h-8 w-16" /></div></td>
                </tr>
              ))}
            </tbody>
          ) : members.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-on-surface-variant">No users found.</td>
              </tr>
            </tbody>
          ) : (
          <tbody className="divide-y divide-outline-variant/10">
              {members.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-surface-container-low/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img className="h-10 w-10 rounded-full object-cover" src={member.avatar} alt={member.name} />
                      <div>
                        <div className="text-sm font-bold text-on-surface">{member.name}</div>
                        <div className="text-xs text-on-surface-variant">{member.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{member.title || member.industry || 'Profile pending'}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{new Date(member.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
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
          )}
          </table>
        </div>
      </section>
    );
  };

  const renderApplications = () => (
    <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6">
      <h3 className="mb-6 font-headline-md text-2xl font-bold text-on-surface">All Pending Approvals</h3>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col justify-between gap-4 rounded-xl bg-surface-container-low p-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : pendingMentors.length === 0 ? (
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
                <button onClick={async () => { try { await adminService.approveMentor(mentor.id); } catch(err) { console.warn('Backend approve failed, falling back:', err.message); approveMentor(mentor.id); } if (user?.id === mentor.id) setUser({ ...user, status: 'approved' }); refreshData(); }} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-on-secondary">Approve</button>
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
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5">
              <Skeleton className="mb-3 h-11 w-11 rounded-xl" />
              <Skeleton className="mb-2 h-7 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))
        ) : (<>
        <div className="rounded-2xl bg-primary p-5 text-on-primary transition-all hover:shadow-lg hover:scale-[1.01]">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-on-primary/10 mb-3">
            <span className="material-symbols-outlined text-[22px] text-on-primary">payments</span>
          </span>
          <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
          <p className="mt-1 text-xs font-semibold text-primary-fixed-dim">Total Platform Revenue</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 transition-all hover:shadow-lg hover:scale-[1.01]">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-3">
            <span className="material-symbols-outlined text-[22px] text-primary">check_circle</span>
          </span>
          <p className="text-2xl font-bold text-on-surface">{bookings.filter((booking) => booking.paymentStatus === 'paid').length}</p>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">Paid Bookings</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 transition-all hover:shadow-lg hover:scale-[1.01]">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 mb-3">
            <span className="material-symbols-outlined text-[22px] text-secondary">receipt_long</span>
          </span>
          <p className="text-2xl font-bold text-on-surface">${Math.round(totalRevenue / Math.max(1, bookings.length)).toLocaleString()}</p>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">Average Transaction</p>
        </div>
        </>)}
      </div>
      <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6">
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
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : revenueDateRange.error ? (
          <div className="rounded-lg bg-error-container p-4 text-sm font-bold text-on-error-container">{revenueDateRange.error}</div>
        ) : (
          renderLineChart(revenueData)
        )}
      </div>
    </section>
  );

  const renderContentManager = () => (
    <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6">
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
      case 'settings': return <ProfileSettings compact onSaved={refreshData} user={user} onAccountClosed={() => { dbLogout(); tokenManager.clearTokens(); navigateTo('home'); }} />;
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body-md">
      {renderSidebar()}

      <main className="min-h-screen lg:pl-64 w-full bg-surface">
        <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8 pb-28">
        <header className="relative mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              {activeView !== 'settings' && (
                <>
                  <h2 className="font-headline-lg text-2xl sm:text-4xl font-bold capitalize text-on-surface">{activeView.replace('-', ' ')}</h2>
                  <p className="mt-0.5 text-sm sm:text-base text-on-surface-variant">Manage platform operations, members, and metrics.</p>
                </>
              )}
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
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-sm text-on-surface-variant">No notifications.</p>
                    ) : notifications.map((item) => (
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
              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant border border-outline-variant/30">
                {user?.avatar || user?.profilePic ? (
                  <img className="w-full h-full object-cover" src={user.avatar || user.profilePic} alt={user?.name} />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-bold text-on-surface-variant">
                    {(user?.name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold leading-none text-on-surface">{user?.name || 'Admin'}</span>
                <span className="mt-1 block text-[11px] text-on-surface-variant">Administrator</span>
              </span>
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
              {selectedMember.role === 'mentor' && (
                <div className="rounded-lg bg-surface-container-low p-3 col-span-1 md:col-span-2">
                  <div className="text-xs font-bold uppercase text-on-surface-variant">Experience Level (Auto-calculated)</div>
                  <div className="mt-1">
                    {(() => {
                      const ml = getMentorLevel(selectedMember);
                      const mlStyle = getMentorLevelStyle(ml.level);
                      return (
                        <div className={`mentor-level-badge mentor-level-${ml.level} ${mlStyle.wrapper}`}>
                          {mlStyle.icon && <span className="material-symbols-outlined text-[10px]">{mlStyle.icon}</span>}
                          {ml.label}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
            {selectedMember.rejectionReason && (
              <div className="mt-3 rounded-lg bg-error-container/20 p-3">
                <div className="text-xs font-bold uppercase text-error">Rejection Reason</div>
                <div className="text-sm font-semibold text-on-surface">{selectedMember.rejectionReason}</div>
              </div>
            )}
            <p className="mt-4 rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">{selectedMember.bio || 'No bio has been added yet.'}</p>
            {selectedMember.cv && selectedMember.cv.url && (
              <div className="mt-4 rounded-lg bg-surface-container-low p-4">
                <div className="text-xs font-bold uppercase text-on-surface-variant mb-2">CV / Resume</div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{selectedMember.cv.filename || 'Resume'}</p>
                  </div>
                  <a
                    href={selectedMember.cv.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:brightness-110 transition-all"
                  >
                    Read CV
                  </a>
                </div>
              </div>
            )}
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
              <Input label="Full name" value={memberForm.name} onChange={(event) => setMemberForm({ ...memberForm, name: event.target.value })} placeholder="Enter full name" required autoComplete="name" />
              <Input label="Email" type="email" inputMode="email" value={memberForm.email} onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })} placeholder="Enter email address" required autoComplete="email" />
              <Input label="Password" type="password" value={memberForm.password} onChange={(event) => setMemberForm({ ...memberForm, password: event.target.value })} placeholder="Enter password" required autoComplete="new-password" />
              <Input label={memberForm.role === 'mentor' ? 'Job title' : 'Current status'} value={memberForm.title} onChange={(event) => setMemberForm({ ...memberForm, title: event.target.value })} placeholder={memberForm.role === 'mentor' ? 'e.g. Senior Engineer' : 'e.g. Looking for mentor'} autoComplete="organization-title" />
              <Input label="Avatar URL" value={memberForm.avatar} onChange={(event) => setMemberForm({ ...memberForm, avatar: event.target.value })} placeholder="https://example.com/avatar.jpg" autoComplete="url" />
              <Input label="Skills" value={memberForm.skills} onChange={(event) => setMemberForm({ ...memberForm, skills: event.target.value })} span="md:col-span-2" placeholder="React, Node.js, TypeScript" autoComplete="off" />
              {memberForm.role === 'mentor' && (
                <>
                  <Input label="Company" value={memberForm.company} onChange={(event) => setMemberForm({ ...memberForm, company: event.target.value })} placeholder="e.g. Acme Corp" autoComplete="organization" />
                  <Input label="Industry" value={memberForm.industry} onChange={(event) => setMemberForm({ ...memberForm, industry: event.target.value })} placeholder="e.g. Technology" autoComplete="off" />
                  <Input label="Hourly rate" type="text" inputMode="decimal" value={memberForm.hourlyRate} onChange={(event) => setMemberForm({ ...memberForm, hourlyRate: event.target.value })} placeholder="e.g. 100" autoComplete="off" />
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

export { AdminDashboard };
export default AdminDashboard;

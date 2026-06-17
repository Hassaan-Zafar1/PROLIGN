import React, { useMemo, useState, useEffect } from 'react';
import {
  getCurrentUser,
  logout,
  getSessions,
  updateSessionStatus,
  updateUserProfile,
  getUserById,
  getNotifications,
  markNotificationRead as markStoredNotificationRead,
  deleteNotification as deleteStoredNotification,
  getReviewsForMentor,
  updateMentorAvailability,
  getDB,
  saveDB,
  deleteUser,
} from '../utils/db';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const allTimeSlots = [
  "09:00 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM",
  "06:00 PM", "07:00 PM"
];
const getAvailableSlots = (dateStr) => {
  const now = new Date();
  const selectedDate = new Date(dateStr + 'T00:00:00');
  const isToday = selectedDate.toDateString() === now.toDateString();
  const minHour = now.getHours() + 1;
  return allTimeSlots.filter(time => {
    if (!isToday) return true;
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return true;
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return hour > minHour || (hour === minHour && minute > 0);
  });
};

const useTheme = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('mentorbridge-theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('mentorbridge-theme', next);
      return next;
    });
  };
  return { theme, toggleTheme };
};

const MentorDashboard = ({ navigateTo }) => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(getCurrentUser());
  const [activeView, setActiveView] = useState('dashboard');
  
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionTab, setSessionTab] = useState('pending');
  const [metricMode, setMetricMode] = useState('year');
  const [metricYear, setMetricYear] = useState(String(new Date().getFullYear()));
  const [metricMonth, setMetricMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [metricRange, setMetricRange] = useState({ from: `${new Date().getFullYear()}-01-01`, to: `${new Date().getFullYear()}-12-31` });
  const [metricError, setMetricError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [availabilityDate, setAvailabilityDate] = useState(new Date().toISOString().split('T')[0]);
  const [availabilityTimes, setAvailabilityTimes] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', title: '', industry: '', bio: '', avatar: '' });

  const [settingsSection, setSettingsSection] = useState('personal');
  const [settingsForm, setSettingsForm] = useState({});
  const [settingsStatus, setSettingsStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');

  const addNotification = (userId, message, type = 'info') => {
    const db = getDB();
    const newNotification = {
      id: 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      userId,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications = [...(db.notifications || []), newNotification];
    saveDB(db);
  };

  const handleCancelSession = (session) => {
    if (!window.confirm(`Cancel session with ${session.mentee?.name || 'mentee'}? This will notify them.`)) return;
    updateSessionStatus(session.id, 'Cancelled');
    addNotification(session.menteeId, `Your session with ${user?.name} on ${session.dateTime || session.date} at ${session.time} has been cancelled.`, 'cancellation');
    refreshData();
  };

  const openRescheduleModal = (session) => {
    setRescheduleTarget(session);
    setProposedDate(session.date || session.dateTime?.split('T')[0] || '');
    setProposedTime(session.time || '');
    setShowRescheduleModal(true);
  };

  const handleProposeReschedule = () => {
    if (!proposedDate || !proposedTime) return;
    const session = rescheduleTarget;
    updateSessionStatus(session.id, 'Rescheduled');
    addNotification(session.menteeId, `${user?.name} proposed a new time: ${proposedDate} at ${proposedTime}. Please review and update.`, 'reschedule');
    refreshData();
    setShowRescheduleModal(false);
    setRescheduleTarget(null);
  };

  const refreshData = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    const dbSessions = getSessions()
      .filter(s => s.mentorId === currentUser?.id)
      .map((session) => ({ ...session, mentee: getUserById(session.menteeId) }));
    setSessions(dbSessions);
    setNotifications(getNotifications().filter((item) => !item.userId || item.userId === currentUser?.id));
    setReviews(currentUser ? getReviewsForMentor(currentUser.id) : []);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({ 
        name: user.name || '', 
        title: user.title || '', 
        industry: user.industry || '', 
        bio: user.bio || '', 
        avatar: user.avatar || '' 
      });
      setAvailabilityTimes(user.availabilitySlots?.[availabilityDate] || []);
    }
  }, [availabilityDate, user]);

  const handleLogout = () => {
    logout();
    navigateTo('home');
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateUserProfile(user.id, profileForm);
    setIsEditingProfile(false);
    refreshData();
  };

  const markNotificationRead = (id) => {
    markStoredNotificationRead(id);
    refreshData();
  };

  const deleteNotification = (id) => {
    deleteStoredNotification(id);
    refreshData();
  };

  const toggleAvailabilityTime = (time) => {
    setAvailabilityTimes((previous) =>
      previous.includes(time) ? previous.filter((item) => item !== time) : [...previous, time]
    );
  };

  const saveAvailability = () => {
    if (!user) return;
    updateMentorAvailability(user.id, availabilityDate, availabilityTimes);
    setAvailabilityStatus('Availability saved.');
    refreshData();
    setTimeout(() => setAvailabilityStatus(''), 2500);
  };

  useEffect(() => {
    if (!user || Object.keys(settingsForm).length > 0) return;
    setSettingsForm({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      country: user.country || '',
      city: user.city || '',
      bio: user.bio || '',
      title: user.title || '',
      company: user.company || '',
      industry: user.industry || '',
      experience: user.experience || '',
      education: user.education || '',
      certifications: Array.isArray(user.certifications) ? user.certifications.join(', ') : (user.certifications || ''),
      skills: Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || ''),
      hourlyRate: user.hourlyRate || 150,
      linkedIn: user.linkedIn || '',
      github: user.github || '',
      website: user.website || '',
      twitter: user.twitter || '',
      avatar: user.avatar || '',
      meetingLink: user.meetingLink || 'https://meet.google.com/',
      bufferMinutes: user.bufferMinutes || 15,
      maxBookingsPerWeek: user.maxBookingsPerWeek || 10,
      bookingNoticeHours: user.bookingNoticeHours || 24,
      languages: Array.isArray(user.languages) ? user.languages.join(', ') : (user.languages || 'English'),
    });
  }, [user]);

  const setSettingsField = (field, value) => {
    setSettingsStatus('');
    setSettingsForm(prev => ({ ...prev, [field]: value }));
  };

  const saveSettings = (e) => {
    e.preventDefault();
    if (!user) return;
    const db = getDB();
    const idx = db.users.findIndex(u => u.id === user.id);
    if (idx === -1) return;
    db.users[idx] = {
      ...db.users[idx],
      name: settingsForm.name,
      username: settingsForm.username,
      email: settingsForm.email,
      phone: settingsForm.phone,
      country: settingsForm.country,
      city: settingsForm.city,
      bio: settingsForm.bio,
      title: settingsForm.title,
      company: settingsForm.company,
      industry: settingsForm.industry,
      experience: settingsForm.experience,
      education: settingsForm.education,
      certifications: settingsForm.certifications.split(',').map(s => s.trim()).filter(Boolean),
      skills: settingsForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      hourlyRate: Number(settingsForm.hourlyRate),
      linkedIn: settingsForm.linkedIn,
      github: settingsForm.github,
      website: settingsForm.website,
      twitter: settingsForm.twitter,
      avatar: settingsForm.avatar,
      meetingLink: settingsForm.meetingLink,
      bufferMinutes: Number(settingsForm.bufferMinutes),
      maxBookingsPerWeek: Number(settingsForm.maxBookingsPerWeek),
      bookingNoticeHours: Number(settingsForm.bookingNoticeHours),
      languages: settingsForm.languages.split(',').map(s => s.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };
    db.currentUser = db.users[idx];
    saveDB(db);
    setUser(db.users[idx]);
    setSettingsStatus('Settings saved successfully.');
    setTimeout(() => setSettingsStatus(''), 3000);
    refreshData();
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmName !== user?.name) return;
    deleteUser(user.id);
    logout();
    navigateTo('home');
  };

  const unreadNotifs = notifications.filter(n => !n.read);
  const parseSessionDate = (session) => new Date(`${session.dateTime || session.date || session.createdAt || ''} ${session.time || ''}`);
  const getSessionDate = (session) => {
    const date = parseSessionDate(session);
    return Number.isNaN(date.getTime()) ? new Date(session.createdAt || Date.now()) : date;
  };
  const isValidYear = Number(metricYear) > 2000 && Number(metricYear) < 3000;
  const metricDates = useMemo(() => {
    if (metricMode === 'year') {
      return isValidYear
        ? { from: new Date(Number(metricYear), 0, 1), to: new Date(Number(metricYear), 11, 31, 23, 59, 59), error: '' }
        : { error: 'Enter a year above 2000.' };
    }
    if (metricMode === 'month') {
      return isValidYear
        ? { from: new Date(Number(metricYear), Number(metricMonth) - 1, 1), to: new Date(Number(metricYear), Number(metricMonth), 0, 23, 59, 59), error: '' }
        : { error: 'Enter a year above 2000.' };
    }
    const from = new Date(metricRange.from);
    const to = new Date(`${metricRange.to}T23:59:59`);
    if (!metricRange.from || !metricRange.to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return { error: 'Choose both custom dates.' };
    if (from > to) return { error: 'Start date must be before end date.' };
    if (from.getFullYear() <= 2000 || to.getFullYear() <= 2000) return { error: 'Custom dates must be after year 2000.' };
    return { from, to, error: '' };
  }, [isValidYear, metricMode, metricMonth, metricRange, metricYear]);

  // Real data calculations
  const upcomingSessions = sessions.filter(s => ['Confirmed', 'Pending', 'scheduled'].includes(s.status));
  const completedSessions = sessions.filter(s => s.status === 'Completed');
  const pastSessionsCount = completedSessions.length;
  const hourlyRate = user?.hourlyRate || 150;
  
  const paidSessions = sessions.filter((session) => ['Confirmed', 'Completed'].includes(session.status));
  const totalGrossEarnings = paidSessions.reduce((sum, session) => sum + Number(session.amount || hourlyRate), 0);
  const platformFee = totalGrossEarnings * 0.20;
  const netEarnings = totalGrossEarnings - platformFee;

  const metricSessions = useMemo(() => {
    if (metricDates.error) return [];
    return sessions.filter((session) => {
      const date = getSessionDate(session);
      return date >= metricDates.from && date <= metricDates.to;
    });
  }, [metricDates, sessions]);

  const metricData = useMemo(() => {
    if (metricMode === 'year') {
      return monthLabels.map((label, index) => ({
        label,
        sessions: metricSessions.filter((session) => getSessionDate(session).getMonth() === index).length,
        value: metricSessions
          .filter((session) => getSessionDate(session).getMonth() === index && ['Confirmed', 'Completed'].includes(session.status))
          .reduce((sum, session) => sum + Number(session.amount || hourlyRate), 0),
      }));
    }
    if (metricMode === 'month') {
      const days = new Date(Number(metricYear), Number(metricMonth), 0).getDate();
      return Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        const daySessions = metricSessions.filter((session) => getSessionDate(session).getDate() === day);
        return {
          label: String(day),
          sessions: daySessions.length,
          value: daySessions.filter((session) => ['Confirmed', 'Completed'].includes(session.status)).reduce((sum, session) => sum + Number(session.amount || hourlyRate), 0),
        };
      });
    }
    return metricSessions.map((session) => ({
      label: getSessionDate(session).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      sessions: 1,
      value: ['Confirmed', 'Completed'].includes(session.status) ? Number(session.amount || hourlyRate) : 0,
    }));
  }, [hourlyRate, metricMode, metricMonth, metricSessions, metricYear]);

  const approveSession = (session) => {
    updateSessionStatus(session.id, 'Confirmed');
    refreshData();
  };

  const rejectSession = (session) => {
    if (!window.confirm(`Reject the booking request from ${session.menteeName || session.mentee?.name || 'this mentee'}?`)) return;
    updateSessionStatus(session.id, 'Rejected');
    refreshData();
  };

  const downloadCsv = (kind) => {
    if (metricDates.error) {
      setMetricError(metricDates.error);
      return;
    }
    setMetricError('');
    const rows = kind === 'earnings'
      ? [['Label', 'Gross', 'Platform Fee', 'Net'], ...metricData.map((item) => [item.label, item.value, (item.value * 0.2).toFixed(2), (item.value * 0.8).toFixed(2)])]
      : [['Label', 'Sessions'], ...metricData.map((item) => [item.label, item.sessions])];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mentor-${kind}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderMetricFilters = (downloadKind) => (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {['year', 'month', 'custom'].map((mode) => (
          <button key={mode} onClick={() => setMetricMode(mode)} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${metricMode === mode ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant'}`}>{mode}</button>
        ))}
        <button onClick={() => downloadCsv(downloadKind)} className="ml-auto rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-on-secondary">Download CSV</button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {(metricMode === 'year' || metricMode === 'month') && (
          <input type="number" min="2001" value={metricYear} onChange={(event) => setMetricYear(event.target.value)} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Year above 2000" />
        )}
        {metricMode === 'month' && (
          <select value={metricMonth} onChange={(event) => setMetricMonth(event.target.value)} className="rounded-lg border border-outline-variant/30 bg-surface p-3">
            {monthLabels.map((label, index) => <option key={label} value={String(index + 1).padStart(2, '0')}>{label}</option>)}
          </select>
        )}
        {metricMode === 'custom' && (
          <>
            <input type="date" value={metricRange.from} onChange={(event) => setMetricRange({ ...metricRange, from: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" />
            <input type="date" value={metricRange.to} onChange={(event) => setMetricRange({ ...metricRange, to: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-3" />
          </>
        )}
      </div>
      {(metricDates.error || metricError) && <p className="mt-3 text-sm font-bold text-error">{metricDates.error || metricError}</p>}
    </div>
  );

  const renderLineChart = (data, keyName = 'value') => {
    const width = 800;
    const height = 220;
    const maxValue = Math.max(1, ...data.map((item) => item[keyName] || 0));
    const step = data.length > 1 ? width / (data.length - 1) : width;
    const yFor = (value) => height - 20 - ((value / maxValue) * 170);
    const path = data.map((item, index) => `${index === 0 ? 'M' : 'L'}${index * step},${yFor(item[keyName] || 0)}`).join(' ');
    return (
      <div className="h-72 w-full">
        <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {[50, 100, 150].map((line) => <line key={line} x1="0" x2={width} y1={line} y2={line} stroke="#45483f" strokeOpacity="0.1" />)}
          <path d={path} fill="none" stroke="#202a10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        </svg>
        <div className="grid text-xs font-semibold text-on-surface-variant" style={{ gridTemplateColumns: `repeat(${Math.min(data.length || 1, 12)}, minmax(0, 1fr))` }}>
          {data.filter((_, index) => data.length <= 12 || index % Math.ceil(data.length / 12) === 0).map((item, index) => <span key={`${item.label}-${index}`}>{item.label}</span>)}
        </div>
      </div>
    );
  };

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'sessions', icon: 'event_available', label: 'My Sessions' },
    { id: 'earnings', icon: 'payments', label: 'Earnings' },
    { id: 'ratings', icon: 'star', label: 'Ratings' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];

  const renderSidebar = () => (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-primary dark:bg-primary-container text-on-primary flex flex-col py-6 shadow-lg z-50">
      <div className="px-6 mb-8 cursor-pointer" onClick={() => setActiveView('dashboard')}>
        <h1 className="font-headline-md text-2xl font-bold text-on-primary flex items-center gap-2">
          <span className="material-symbols-outlined">school</span>
          MentorBridge
        </h1>
        <p className="font-label-sm text-sm font-semibold opacity-70 mt-1">Mentor Portal</p>
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto px-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition-all font-label-sm text-sm font-semibold cursor-pointer ${
              activeView === item.id 
                ? 'bg-secondary-container text-on-secondary-container scale-95' 
                : 'text-primary-fixed-dim hover:text-on-primary hover:bg-primary-fixed-variant/20'
            }`}
          >
            <span className="material-symbols-outlined mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="mx-2 mt-auto border-t border-on-primary/10 pt-4">
        <div className="space-y-1">
          <button onClick={toggleTheme} className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold text-primary-fixed-dim transition-colors hover:bg-primary-fixed-variant/20 hover:text-on-primary">
            <span className="material-symbols-outlined mr-3">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button onClick={handleLogout} className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold text-primary-fixed-dim transition-colors hover:bg-error/10 hover:text-error">
            <span className="material-symbols-outlined mr-3">logout</span>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );

  const renderDashboard = () => (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-primary p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm mb-8">
        <div className="relative z-10 space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-on-primary/10 px-4 py-1.5 rounded-full border border-on-primary/10">
            <span className="material-symbols-outlined text-[16px] text-primary-fixed">school</span>
            <span className="font-label-sm text-sm font-semibold text-primary-fixed">Mentor Level: Expert</span>
          </div>
          <h2 className="font-headline-lg text-3xl font-bold text-on-primary">Welcome back, {user?.name?.split(' ')[0] || 'Mentor'}!</h2>
          <p className="text-on-primary/80 max-w-md">
            You have {upcomingSessions.length} upcoming sessions. Your recent mentees have rated you {user?.rating?.toFixed(1) || '5.0'} stars!
          </p>
        </div>
        <div className="hidden lg:block relative z-10">
          <div className="w-48 h-48 bg-on-primary/5 rounded-full flex items-center justify-center p-4">
            <div className="w-full h-full bg-on-primary/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-fixed text-6xl fill-icon">dashboard</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/10 natural-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant font-label-sm">Total Sessions</span>
            <span className="material-symbols-outlined text-secondary">groups</span>
          </div>
          <h3 className="font-headline-xl text-3xl font-bold text-primary">{pastSessionsCount}</h3>
          <p className="text-sm text-secondary mt-2 flex items-center"><span className="material-symbols-outlined text-[16px] mr-1">trending_up</span> +3 this week</p>
        </div>
        <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/10 natural-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant font-label-sm">Average Rating</span>
            <span className="material-symbols-outlined text-secondary">star</span>
          </div>
          <h3 className="font-headline-xl text-3xl font-bold text-primary">{user?.rating?.toFixed(1) || '4.9'}</h3>
          <p className="text-sm text-secondary mt-2 flex items-center"><span className="material-symbols-outlined text-[16px] mr-1">trending_flat</span> Consistent</p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="font-headline-md text-2xl font-bold text-primary">Your Next Sessions</h3>
        {upcomingSessions.length === 0 ? (
          <div className="bg-surface-container-low p-8 text-center rounded-2xl border border-outline-variant/10 text-on-surface-variant">
            No upcoming sessions scheduled.
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 natural-shadow">
            <table className="w-full text-left">
              <thead className="bg-surface-container border-b border-outline-variant/10">
                <tr>
                  <th className="px-6 py-4 font-label-sm text-sm font-semibold text-on-surface-variant">Mentee</th>
                  <th className="px-6 py-4 font-label-sm text-sm font-semibold text-on-surface-variant">Date & Time</th>
                  <th className="px-6 py-4 font-label-sm text-sm font-semibold text-on-surface-variant">Topic</th>
                  <th className="px-6 py-4 font-label-sm text-sm font-semibold text-on-surface-variant text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {upcomingSessions.map(session => (
                  <tr key={session.id} className="hover:bg-surface-container-highest/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <img src={session.menteeAvatar || `https://ui-avatars.com/api/?name=${session.menteeName || 'Mentee'}`} className="w-8 h-8 rounded-full object-cover" alt="Mentee" />
                        <span className="font-label-sm text-sm font-semibold text-on-surface">{session.menteeName || 'Mentee'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-on-surface text-sm font-bold">{session.dateTime}</div>
                      <div className="text-xs text-on-surface-variant">{session.time}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-on-surface-variant">{session.type || session.topic}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {session.status === 'Confirmed' ? (
                          <button onClick={() => navigateTo('video-interview', { sessionId: session.id })} className="bg-primary text-on-primary px-5 py-2 rounded-lg font-label-sm text-sm font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer">Start Session</button>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold uppercase tracking-wider">Pending</span>
                        )}
                        {(session.status === 'Confirmed' || session.status === 'Pending') && (
                          <>
                            <button onClick={() => openRescheduleModal(session)} className="text-secondary hover:text-on-secondary p-2 rounded-lg hover:bg-secondary/20 transition-colors cursor-pointer" title="Propose New Timing">
                              <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                            </button>
                            <button onClick={() => handleCancelSession(session)} className="text-error hover:text-on-error p-2 rounded-lg hover:bg-error/20 transition-colors cursor-pointer" title="Cancel Session">
                              <span className="material-symbols-outlined text-[20px]">cancel</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );

  const renderEarnings = () => (
    <section className="space-y-6">
      <h3 className="font-headline-md text-2xl font-bold text-primary mb-6">Earnings & Deductions</h3>
      {renderMetricFilters('earnings')}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-high p-6 rounded-xl natural-shadow">
          <p className="text-sm font-bold text-on-surface-variant uppercase mb-2">Gross Earnings</p>
          <h4 className="text-3xl font-bold text-on-surface">${totalGrossEarnings.toLocaleString()}</h4>
          <p className="text-xs text-on-surface-variant mt-2">Before system fees</p>
        </div>
        <div className="bg-error-container p-6 rounded-xl natural-shadow">
          <p className="text-sm font-bold text-on-error-container uppercase mb-2">System Deductions</p>
          <h4 className="text-3xl font-bold text-on-error-container">-${platformFee.toLocaleString()}</h4>
          <p className="text-xs text-on-error-container/80 mt-2">20% Platform Fee</p>
        </div>
        <div className="bg-primary-container p-6 rounded-xl natural-shadow">
          <p className="text-sm font-bold text-on-primary-container uppercase mb-2">Net Payout</p>
          <h4 className="text-3xl font-bold text-on-primary-container">${netEarnings.toLocaleString()}</h4>
          <p className="text-xs text-on-primary-container/80 mt-2">Available for withdrawal</p>
        </div>
      </div>

      <div className="bg-surface-container p-8 rounded-xl natural-shadow border border-outline-variant/10">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-bold text-on-surface text-lg">Earnings Graph</h4>
        </div>
        {renderLineChart(metricData, 'value')}
      </div>

      <div className="bg-surface-container p-8 rounded-xl natural-shadow border border-outline-variant/10">
        <h4 className="font-bold text-on-surface text-lg mb-6">Recent Transactions</h4>
        <table className="w-full text-left">
          <thead className="border-b border-outline-variant/20">
            <tr>
              <th className="pb-3 text-xs uppercase text-on-surface-variant">Date</th>
              <th className="pb-3 text-xs uppercase text-on-surface-variant">Description</th>
              <th className="pb-3 text-xs uppercase text-on-surface-variant">Amount</th>
              <th className="pb-3 text-xs uppercase text-on-surface-variant">Fee</th>
              <th className="pb-3 text-xs uppercase text-on-surface-variant">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {paidSessions.map((session) => {
              const gross = Number(session.amount || hourlyRate);
              return (
                <tr key={session.id}>
                  <td className="py-4 text-sm font-semibold">{getSessionDate(session).toLocaleDateString()}</td>
                  <td className="py-4 text-sm">Session with {session.menteeName || session.mentee?.name || 'Mentee'}</td>
                  <td className="py-4 text-sm text-primary font-bold">${gross.toFixed(2)}</td>
                  <td className="py-4 text-sm text-error">-${(gross * 0.2).toFixed(2)}</td>
                  <td className="py-4 text-sm font-bold">${(gross * 0.8).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderRatings = () => (
    <section className="space-y-6">
      <h3 className="font-headline-md text-2xl font-bold text-primary">Ratings From Mentees</h3>
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-8 text-center text-on-surface-variant">No ratings submitted yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-outline-variant/10 bg-surface-container p-6 natural-shadow">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-on-surface">{review.menteeName || 'Mentee'}</p>
                  <p className="text-xs text-on-surface-variant">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-on-secondary">{review.score}.0</span>
              </div>
              <p className="text-sm text-on-surface-variant">{review.reviewText || 'No written feedback.'}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const renderProfile = () => (
    <section className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-headline-md text-2xl font-bold text-primary">My Profile</h3>
        {!isEditingProfile && (
          <button onClick={() => setIsEditingProfile(true)} className="bg-secondary text-on-secondary px-4 py-2 rounded-lg font-bold text-sm shadow-sm cursor-pointer">Edit Profile</button>
        )}
      </div>

      <div className="bg-surface-container p-8 rounded-xl natural-shadow border border-outline-variant/10">
        {isEditingProfile ? (
          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="flex items-center gap-6 mb-6">
              <img src={profileForm.avatar || 'https://i.pravatar.cc/150'} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-surface-variant" />
              <div className="flex-1">
                <label className="block text-xs font-bold text-on-surface uppercase mb-2">Avatar URL</label>
                <input type="text" value={profileForm.avatar} onChange={e => setProfileForm({...profileForm, avatar: e.target.value})} className="w-full p-3 bg-surface border border-outline-variant/30 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-2">Full Name</label>
                <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full p-3 bg-surface border border-outline-variant/30 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-2">Professional Title</label>
                <input type="text" value={profileForm.title} onChange={e => setProfileForm({...profileForm, title: e.target.value})} className="w-full p-3 bg-surface border border-outline-variant/30 rounded-lg text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase mb-2">Industry / Domain</label>
              <input type="text" value={profileForm.industry} onChange={e => setProfileForm({...profileForm, industry: e.target.value})} className="w-full p-3 bg-surface border border-outline-variant/30 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase mb-2">Biography</label>
              <textarea value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} className="w-full p-3 bg-surface border border-outline-variant/30 rounded-lg text-sm h-32 resize-none" required />
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t border-outline-variant/10">
              <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2 font-bold text-on-surface-variant hover:bg-surface-variant rounded-lg cursor-pointer transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg shadow-sm cursor-pointer hover:opacity-90">Save Profile</button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <img src={user?.avatar || 'https://i.pravatar.cc/150'} alt="Profile" className="w-40 h-40 rounded-2xl object-cover shadow-sm" />
            <div className="space-y-4 flex-1">
              <div>
                <h4 className="text-3xl font-bold text-on-surface">{user?.name}</h4>
                <p className="text-lg text-secondary font-semibold">{user?.title}</p>
              </div>
              <div>
                <span className="inline-block px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold uppercase tracking-wider">{user?.industry}</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">{user?.bio}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const settingsSections = [
    { id: 'personal', icon: 'account_circle', label: 'Personal Information' },
    { id: 'security', icon: 'lock', label: 'Account & Security' },
    { id: 'about', icon: 'article', label: 'About Me' },
    { id: 'professional', icon: 'badge', label: 'Professional Profile' },
    { id: 'preferences', icon: 'psychology', label: 'Mentorship Preferences' },
    { id: 'availability', icon: 'event_available', label: 'Availability' },
    { id: 'social', icon: 'link', label: 'Social Links' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
    { id: 'meetings', icon: 'calendar_month', label: 'Meetings & Calendar' },
    { id: 'achievements', icon: 'workspace_premium', label: 'Achievements' },
    { id: 'appearance', icon: 'palette', label: 'Appearance' },
    { id: 'danger', icon: 'warning', label: 'Danger Zone' },
  ];

  const SField = ({ label, field, type = 'text', placeholder = '', span = '' }) => (
    <label className={`space-y-1.5 ${span}`}>
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <input
        type={type}
        value={settingsForm[field] ?? ''}
        onChange={(e) => setSettingsField(field, e.target.value)}
        className="w-full rounded-lg border border-outline-variant/25 bg-surface px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/30"
        placeholder={placeholder}
      />
    </label>
  );

  const STextArea = ({ label, field, rows = 4, span = '' }) => (
    <label className={`space-y-1.5 ${span}`}>
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <textarea
        rows={rows}
        value={settingsForm[field] || ''}
        onChange={(e) => setSettingsField(field, e.target.value)}
        className="w-full resize-none rounded-lg border border-outline-variant/25 bg-surface px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/30"
      />
    </label>
  );

  const SToggle = ({ label, detail, field }) => {
    const enabled = settingsForm[field] ?? false;
    return (
      <button type="button" onClick={() => setSettingsField(field, !enabled)} className="flex min-h-16 items-center justify-between gap-4 rounded-lg bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container">
        <span>
          <span className="block font-semibold text-sm text-on-surface">{label}</span>
          {detail && <span className="mt-0.5 block text-xs text-on-surface-variant">{detail}</span>}
        </span>
        <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? 'bg-secondary' : 'bg-outline-variant'}`}>
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </span>
      </button>
    );
  };

  const renderSettingsSection = () => {
    switch (settingsSection) {
      case 'personal':
        return (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <img src={settingsForm.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(settingsForm.name || 'Mentor')}`} alt="" className="h-20 w-20 rounded-full object-cover ring-4 ring-surface-variant" />
              <SField label="Avatar URL" field="avatar" placeholder="https://..." span="flex-1" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SField label="Full Name" field="name" />
              <SField label="Username" field="username" />
              <SField label="Email Address" field="email" type="email" />
              <SField label="Phone Number" field="phone" />
              <SField label="Country" field="country" />
              <SField label="City" field="city" />
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-5">
            <p className="text-sm text-on-surface-variant">Password and security settings are managed through your account credentials.</p>
            <SField label="Current Password" field="currentPassword" type="password" placeholder="Enter current password" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SField label="New Password" field="newPassword" type="password" placeholder="Min 6 characters" />
              <SField label="Confirm Password" field="confirmPassword" type="password" />
            </div>
          </div>
        );
      case 'about':
        return <STextArea label="Bio" field="bio" rows={7} />;
      case 'professional':
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SField label="Professional Title" field="title" placeholder="Senior AI Researcher and Career Mentor" span="md:col-span-2" />
            <SField label="Company" field="company" />
            <SField label="Industry" field="industry" />
            <SField label="Years of Experience" field="experience" type="number" />
            <SField label="Education" field="education" />
            <SField label="Certifications" field="certifications" placeholder="AWS, PMP, ... (comma separated)" />
            <SField label="Skills / Expertise" field="skills" placeholder="Machine Learning, Leadership, ... (comma separated)" />
          </div>
        );
      case 'preferences':
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SField label="Languages" field="languages" placeholder="English, Urdu (comma separated)" />
            <SField label="Hourly Rate ($)" field="hourlyRate" type="number" />
            <SField label="Buffer Between Sessions (min)" field="bufferMinutes" type="number" />
            <SField label="Max Bookings Per Week" field="maxBookingsPerWeek" type="number" />
            <SField label="Min Booking Notice (hours)" field="bookingNoticeHours" type="number" span="md:col-span-2" />
          </div>
        );
      case 'availability':
        return (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-on-surface-variant">Available Date</label>
                <input type="date" min={new Date().toISOString().split('T')[0]} value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} className="rounded-lg border border-outline-variant/30 bg-surface p-3" />
              </div>
              <button onClick={saveAvailability} className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary cursor-pointer">Save Availability</button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {getAvailableSlots(availabilityDate).map((time) => (
                <button key={time} onClick={() => toggleAvailabilityTime(time)} className={`rounded-lg px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${availabilityTimes.includes(time) ? 'bg-secondary text-on-secondary' : 'bg-surface text-on-surface-variant hover:bg-surface-container-high'}`}>{time}</button>
              ))}
            </div>
            <p className="text-xs text-on-surface-variant">
              {availabilityDate === new Date().toISOString().split('T')[0] ? 'Only slots at least 1 hour from now are shown.' : 'All slots are available for future dates.'} Selected slots are visible to mentees on the booking calendar.
            </p>
            {availabilityStatus && <p className="text-sm font-bold text-secondary">{availabilityStatus}</p>}
          </div>
        );
      case 'social':
        return (
          <div className="grid grid-cols-1 gap-4">
            <SField label="LinkedIn URL" field="linkedIn" placeholder="https://linkedin.com/in/..." />
            <SField label="GitHub URL" field="github" placeholder="https://github.com/..." />
            <SField label="Website URL" field="website" placeholder="https://..." />
            <SField label="Twitter / X URL" field="twitter" placeholder="https://twitter.com/..." />
          </div>
        );
      case 'notifications':
        return (
          <div className="grid grid-cols-1 gap-3">
            <SToggle label="Session Requests" detail="Notify when a mentee requests a session" field="notifySessionRequests" />
            <SToggle label="Session Reminders" detail="Get reminded before upcoming sessions" field="notifyReminders" />
            <SToggle label="Platform Announcements" detail="Receive product and feature updates" field="notifyAnnouncements" />
            <SToggle label="Email Notifications" detail="Receive notifications via email" field="notifyEmail" />
          </div>
        );
      case 'meetings':
        return (
          <div className="space-y-4">
            <SField label="Meeting Link" field="meetingLink" placeholder="https://meet.google.com/..." />
            <p className="text-xs text-on-surface-variant">This link will be shared with mentees when a session is confirmed.</p>
          </div>
        );
      case 'achievements':
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-surface-container-low p-5">
              <span className="material-symbols-outlined mb-3 text-[28px] text-secondary">star</span>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Rating</p>
              <p className="mt-1 font-headline-md text-3xl font-bold text-primary">{user?.rating ? user.rating.toFixed(1) : '0.0'}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-5">
              <span className="material-symbols-outlined mb-3 text-[28px] text-secondary">groups</span>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Completed Sessions</p>
              <p className="mt-1 font-headline-md text-3xl font-bold text-primary">{completedSessions.length}</p>
              <p className="mt-1 text-xs text-on-surface-variant">Finished sessions</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-5">
              <span className="material-symbols-outlined mb-3 text-[28px] text-secondary">workspace_premium</span>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Status</p>
              <p className="mt-1 font-headline-md text-3xl font-bold text-primary">{user?.status === 'approved' ? 'Active' : user?.status || 'Active'}</p>
              <p className="mt-1 text-xs text-on-surface-variant">Account status</p>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-4">
              <div>
                <p className="font-semibold text-sm text-on-surface">Theme</p>
                <p className="text-xs text-on-surface-variant">Toggle between light and dark mode</p>
              </div>
              <button onClick={toggleTheme} className="rounded-lg bg-surface px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
            <SField label="Preferred Theme" field="appearanceTheme" placeholder="system / light / dark" />
          </div>
        );
      case 'danger':
        return (
          <div className="space-y-4">
            <button type="button" onClick={() => setShowDeleteModal(true)} className="flex w-full items-center justify-between rounded-lg bg-error-container p-4 text-left text-on-error-container transition-opacity hover:opacity-90 cursor-pointer">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined">delete</span>
                <span>
                  <span className="block font-bold">Delete Account</span>
                  <span className="text-sm opacity-80">Permanently remove this account, sessions, and all data.</span>
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
                    <h3 className="mt-4 font-headline-md text-2xl font-bold text-on-surface">Delete Account?</h3>
                    <p className="mt-2 text-sm text-on-surface-variant">This is permanent. All your data will be removed.</p>
                  </div>
                  <div className="mb-6 space-y-3">
                    <p className="text-sm font-semibold text-on-surface">Type <strong className="text-error">{user?.name}</strong> to confirm:</p>
                    <input value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)} className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3.5 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-error/30" placeholder="Enter your full name" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <button type="button" onClick={handleDeleteAccount} disabled={deleteConfirmName !== user?.name} className="w-full rounded-2xl bg-error py-3.5 font-bold text-on-error shadow-md transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">Yes, Delete My Account</button>
                    <button type="button" onClick={() => setShowDeleteModal(false)} className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container py-3.5 font-bold text-on-surface transition-colors hover:bg-surface-container-high cursor-pointer">Cancel</button>
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

  const renderSettings = () => (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <h1 className="font-headline-lg text-3xl font-bold text-primary">Settings</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Manage your mentor profile, availability, preferences, and account.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-2 natural-shadow xl:sticky xl:top-6 xl:self-start">
          {settingsSections.map((section) => (
            <button key={section.id} onClick={() => setSettingsSection(section.id)} type="button" className={`mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-bold transition-all cursor-pointer ${settingsSection === section.id ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'}`}>
              <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </aside>
        <form onSubmit={saveSettings} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 natural-shadow md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-3 border-b border-outline-variant/20 pb-5 md:flex-row md:items-center">
            <div>
              <h2 className="font-headline-md text-xl font-bold text-on-surface">{settingsSections.find(s => s.id === settingsSection)?.label || 'Settings'}</h2>
              <p className="text-xs text-on-surface-variant">Mentor account settings</p>
            </div>
            {settingsStatus && <span className="rounded-full bg-secondary-container px-4 py-1.5 text-xs font-bold text-on-secondary-container">{settingsStatus}</span>}
          </div>
          {renderSettingsSection()}
          {settingsSection !== 'achievements' && settingsSection !== 'availability' && (
            <div className="mt-6 flex justify-end border-t border-outline-variant/20 pt-5">
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-md transition-transform hover:scale-[1.02] cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return renderDashboard();
      case 'earnings': return renderEarnings();
      case 'ratings': return renderRatings();
      case 'profile': return renderProfile();
      case 'settings': return renderSettings();
      case 'sessions': {
        const groups = {
          pending: sessions.filter((session) => session.status === 'Pending'),
          scheduled: sessions.filter((session) => ['Confirmed', 'scheduled'].includes(session.status)),
          past: sessions.filter((session) => ['Completed', 'Rejected', 'Cancelled', 'Canceled'].includes(session.status)),
        };
        const visibleSessions = groups[sessionTab] || [];
        return (
          <>
          <section className="bg-surface-container p-8 rounded-xl natural-shadow border border-outline-variant/10">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="font-headline-md text-2xl font-bold text-primary">My Sessions</h3>
                <p className="text-sm text-on-surface-variant">View pending, past, and scheduled sessions.</p>
              </div>
              <div className="flex rounded-lg bg-surface-container-low p-1">
                {[
                  ['pending', 'Pending'],
                  ['scheduled', 'Scheduled'],
                  ['past', 'Past'],
                ].map(([id, label]) => (
                  <button key={id} onClick={() => setSessionTab(id)} className={`rounded-md px-4 py-2 text-sm font-bold ${sessionTab === id ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'}`}>{label} ({groups[id].length})</button>
                ))}
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant/10">
                <tr>
                  <th className="px-4 py-3 text-xs uppercase font-bold text-on-surface-variant">Mentee</th>
                  <th className="px-4 py-3 text-xs uppercase font-bold text-on-surface-variant">Date & Time</th>
                  <th className="px-4 py-3 text-xs uppercase font-bold text-on-surface-variant">Status</th>
                  <th className="px-4 py-3 text-right text-xs uppercase font-bold text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {visibleSessions.map(s => (
                  <tr key={s.id}>
                    <td className="px-4 py-4 text-sm font-bold text-on-surface">{s.menteeName || s.mentee?.name || 'Mentee'}</td>
                    <td className="px-4 py-4 text-sm">{s.dateTime} <span className="text-xs text-on-surface-variant ml-2">{s.time}</span></td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${s.status === 'Confirmed' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedSession(s)} className="rounded-lg bg-surface-container-high px-3 py-2 text-xs font-bold text-on-surface-variant">Preview</button>
                        {s.status === 'Pending' && (
                          <>
                            <button onClick={() => rejectSession(s)} className="rounded-lg bg-error-container px-3 py-2 text-xs font-bold text-on-error-container">Reject</button>
                            <button onClick={() => approveSession(s)} className="rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-on-secondary">Approve</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
             {visibleSessions.length === 0 && <p className="py-8 text-center text-sm text-on-surface-variant">No {sessionTab} sessions.</p>}
          </section>

          <section className="bg-surface-container p-8 rounded-xl natural-shadow border border-outline-variant/10">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h4 className="font-headline-md text-xl font-bold text-primary">Session Analytics</h4>
                <p className="text-sm text-on-surface-variant">Track your session volume over time.</p>
              </div>
            </div>
            {renderMetricFilters('analytics')}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 text-center">
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Pending</p>
                <p className="text-2xl font-bold text-primary">{sessions.filter((session) => session.status === 'Pending').length}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 text-center">
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Scheduled</p>
                <p className="text-2xl font-bold text-primary">{sessions.filter((session) => session.status === 'Confirmed').length}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 text-center">
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Completed</p>
                <p className="text-2xl font-bold text-primary">{completedSessions.length}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 text-center">
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">In Range</p>
                <p className="text-2xl font-bold text-primary">{metricSessions.length}</p>
              </div>
            </div>
            <div className="bg-surface-container-low p-6 rounded-xl">
              <h5 className="font-bold text-on-surface mb-4">Session Volume</h5>
              {renderLineChart(metricData, 'sessions')}
            </div>
          </section>
          </>
        );
      }
      default: return renderDashboard();
    }
  };

  return (
    <div className="flex bg-surface min-h-screen font-body-md w-full">
      {renderSidebar()}
      
      <main className="ml-64 w-full bg-surface">
        <div className="mx-auto w-full max-w-[1440px] p-6 lg:p-8">
        <header className="flex justify-between items-center mb-8 relative">
          <div>
            <h2 className="font-headline-lg text-4xl font-bold text-on-surface capitalize">{activeView.replace('-', ' ')}</h2>
            <p className="text-on-surface-variant text-base mt-1">Manage your mentorship practice and impact.</p>
          </div>
          <div className="flex items-center gap-4">
            
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="bg-surface-container h-12 w-12 rounded-full flex items-center justify-center natural-shadow hover:bg-surface-container-high transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-error text-on-error rounded-full text-[10px] font-bold flex items-center justify-center">{unreadNotifs.length}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-xl natural-shadow border border-outline-variant/10 z-50 overflow-hidden">
                  <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center">
                    <h4 className="font-bold text-on-surface">Notifications</h4>
                    <span className="text-xs text-secondary cursor-pointer hover:underline" onClick={() => notifications.forEach(n => markNotificationRead(n.id))}>Mark all read</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-sm text-on-surface-variant">No notifications.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-on-surface">{n.title}</span>
                            <div className="flex gap-2">
                              {!n.read && <button onClick={() => markNotificationRead(n.id)} className="text-[10px] text-secondary cursor-pointer hover:underline">Read</button>}
                              <button onClick={() => deleteNotification(n.id)} className="text-[10px] text-error cursor-pointer hover:underline">Delete</button>
                            </div>
                          </div>
                          <p className="text-xs text-on-surface-variant">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div onClick={() => setActiveView('profile')} className="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-full natural-shadow cursor-pointer hover:bg-surface-container-high transition-colors">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant border border-outline-variant/30">
                <img className="w-full h-full object-cover" src={user?.avatar || "https://i.pravatar.cc/150"} alt="Mentor" />
              </div>
              <span className="font-label-sm text-sm font-semibold text-on-surface">{user?.name}</span>
            </div>
          </div>
        </header>

        {renderContent()}
        </div>
      </main>
      {showRescheduleModal && rescheduleTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 natural-shadow">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Propose New Timing</h3>
                <p className="text-sm text-on-surface-variant">For session with {rescheduleTarget.menteeName || rescheduleTarget.mentee?.name || 'Mentee'}</p>
              </div>
              <button onClick={() => setShowRescheduleModal(false)} className="rounded-full p-2 hover:bg-surface-variant cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">New Date</label>
                <input type="date" value={proposedDate} onChange={(e) => setProposedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="form-input w-full rounded-lg bg-surface px-4 py-3 text-sm text-on-surface border border-outline focus:outline-none focus:border-secondary" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">New Time</label>
                <select value={proposedTime} onChange={(e) => setProposedTime(e.target.value)} className="form-input w-full rounded-lg bg-surface px-4 py-3 text-sm text-on-surface border border-outline focus:outline-none focus:border-secondary">
                  <option value="">Select time</option>
                  {getAvailableSlots(proposedDate || new Date().toISOString().split('T')[0]).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowRescheduleModal(false)} className="rounded-lg bg-surface px-4 py-2 font-bold text-on-surface-variant cursor-pointer">Cancel</button>
                <button onClick={handleProposeReschedule} className="rounded-lg bg-secondary px-4 py-2 font-bold text-on-secondary cursor-pointer">Propose New Timing</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedSession && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-6 natural-shadow">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-on-surface">{selectedSession.type || selectedSession.topic || 'Mentorship Session'}</h3>
                <p className="text-sm text-on-surface-variant">With {selectedSession.menteeName || selectedSession.mentee?.name || 'Mentee'}</p>
              </div>
              <button onClick={() => setSelectedSession(null)} className="rounded-full p-2 hover:bg-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div className="rounded-lg bg-surface-container-low p-3"><span className="block text-xs font-bold uppercase text-on-surface-variant">Date</span>{selectedSession.dateTime}</div>
              <div className="rounded-lg bg-surface-container-low p-3"><span className="block text-xs font-bold uppercase text-on-surface-variant">Time</span>{selectedSession.time}</div>
              <div className="rounded-lg bg-surface-container-low p-3"><span className="block text-xs font-bold uppercase text-on-surface-variant">Status</span>{selectedSession.status}</div>
              <div className="rounded-lg bg-surface-container-low p-3"><span className="block text-xs font-bold uppercase text-on-surface-variant">Amount</span>${Number(selectedSession.amount || hourlyRate).toFixed(2)}</div>
            </div>
            <p className="mt-4 rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">{selectedSession.notes || 'No notes were added.'}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSelectedSession(null)} className="rounded-lg bg-surface px-4 py-2 font-bold text-on-surface-variant">Close</button>
              {selectedSession.status === 'Pending' && <button onClick={() => { approveSession(selectedSession); setSelectedSession(null); }} className="rounded-lg bg-secondary px-4 py-2 font-bold text-on-secondary">Approve</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;

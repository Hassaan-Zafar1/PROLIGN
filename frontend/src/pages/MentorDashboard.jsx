import { useMemo, useState, useEffect } from 'react';
import {
  getCurrentUser,
  logout as dbLogout,
  updateSessionStatus,
  getUserById,
  getNotifications,
  markNotificationRead as markStoredNotificationRead,
  deleteNotification as deleteStoredNotification,
  updateMentorAvailability,
  getDB,
  saveDB,
  deleteUser,
} from '../utils/db';
import { tokenManager } from '../utils/tokenManager';
import ProfileSettings from '../components/ProfileSettings';
import AvailabilityScheduler from '../components/AvailabilityScheduler';
import { EmptyState } from '../components/common';
import { getMentorLevel, getMentorLevelStyle } from '../utils/mentorLevel';
import { getMentorProfileCompletion } from '../utils/profileCompletion';
import { authService } from '../services/authService';
import { sessionService } from '../services/sessionService';
import { reviewService } from '../services/reviewService';
import { flattenUserProfile } from '../utils/flattenProfile';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

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

const MentorDashboard = ({ navigateTo, initialView = 'dashboard' }) => {
  const { theme, toggleTheme } = useTheme();
  const { user: authUser, updateUser, logout } = useAuth();
  const [user, setUser] = useState(authUser || getCurrentUser());
  const [activeView, setActiveView] = useState(initialView);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const setView = (view) => {
    setActiveView(view);
    navigateTo(view);
  };
  
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionTab, setSessionTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [metricMode, setMetricMode] = useState('year');
  const [metricYear, setMetricYear] = useState(String(new Date().getFullYear()));
  const [metricMonth, setMetricMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [metricRange, setMetricRange] = useState({ from: `${new Date().getFullYear()}-01-01`, to: `${new Date().getFullYear()}-12-31` });
  const [metricWeek, setMetricWeek] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  });
  const [metricError, setMetricError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [availabilityDate, setAvailabilityDate] = useState(new Date().toISOString().split('T')[0]);
  const [availabilityTimes, setAvailabilityTimes] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [settingsTab, setSettingsTab] = useState('profile');

  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');



  const addNotification = (userId, message, type = 'info') => {
    try {
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
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  };

  const handleCancelSession = async (session) => {
    if (!window.confirm(`Cancel session with ${session.menteeName || 'mentee'}? This will notify them.`)) return;
    try {
      setLoading(true);
      await sessionService.deleteSession(session.id);
      refreshData();
    } catch (err) {
      console.error('Failed to cancel session:', err);
      alert('Failed to cancel session.');
    } finally {
      setLoading(false);
    }
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

  const refreshData = async () => {
    setLoading(true);
    try {
      // Profile is now backend-driven (source of truth) via /auth/me — this
      // reflects the structured profile built from the CV (Task 4). Falls back
      // to the cached user when offline.
      let currentUser;
      try {
        // The CV-built profile lives on the populated mentorProfile now —
        // flatten it up so the profile-completion card / header read it.
        currentUser = flattenUserProfile(await authService.getCurrentUser());
        updateUser(currentUser);
      } catch {
        currentUser = flattenUserProfile(authUser || getCurrentUser());
      }
      setUser(currentUser);

      const response = await sessionService.getSessions({ as: 'mentor' });
      const backendSessions = response.data || [];
      const dbSessions = backendSessions.map((s) => {
        const mentee = s.menteeId || {};
        const slot = s.slotId || {};
        
        let timeLabel = '';
        if (slot && slot.startTime && slot.endTime) {
          const format12h = (t24) => {
            const [hStr, mStr] = t24.split(':');
            const h = parseInt(hStr, 10);
            const period = h >= 12 ? 'PM' : 'AM';
            const hr12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
            return `${String(hr12).padStart(2, '0')}:${mStr} ${period}`;
          };
          timeLabel = `${format12h(slot.startTime)} - ${format12h(slot.endTime)}`;
        }
        
        return {
          id: s._id,
          mentorId: s.mentorId?._id || s.mentorId,
          menteeId: mentee._id || mentee,
          menteeName: mentee.name || 'Mentee',
          menteeAvatar: mentee.profilePic || '',
          date: new Date(s.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          time: timeLabel,
          sessionType: s.sessionType === 'mock_interview' ? 'Mock Interview' : s.sessionType,
          status: (() => {
            const d = new Date(s.scheduledDate);
            const hasPassed = d && d.getTime() < Date.now();
            const rawLower = (s.status || '').toLowerCase();
            if (['confirmed', 'pending', 'scheduled'].includes(rawLower) && hasPassed) {
              return 'Completed';
            }
            return s.status === 'confirmed' || s.status === 'scheduled' ? 'Confirmed' : s.status === 'pending' ? 'Pending' : s.status === 'completed' ? 'Completed' : s.status;
          })(),
          amount: s.priceCharged,
          agenda: s.agenda,
          notes: s.agenda,
          dateTime: s.scheduledDate,
          mentee: {
            name: mentee.name || 'Mentee',
            avatar: mentee.profilePic || ''
          }
        };
      });
      setSessions(dbSessions);
      setNotifications(getNotifications().filter((item) => !item.userId || item.userId === currentUser?.id));
      if (currentUser) {
        try {
          const revsResponse = await reviewService.getReviews({ mentorId: currentUser.id });
          const revs = (revsResponse.data || []).map((r) => ({
            id: r._id,
            menteeName: r.menteeId?.name || 'Mentee',
            createdAt: r.createdAt,
            score: r.rating,
            reviewText: r.reviewText,
          }));
          setReviews(revs);
        } catch (err) {
          console.error('Failed to load reviews from backend:', err);
          setReviews([]);
        }
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Failed to refresh dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (user) {
      setAvailabilityTimes(user.availabilitySlots?.[availabilityDate] || []);
    }
  }, [availabilityDate, user]);

  const handleLogout = () => {
    logout();
    navigateTo('home');
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
    try {
      updateMentorAvailability(user.id, availabilityDate, availabilityTimes);
      setAvailabilityStatus('Availability saved.');
      refreshData();
      setTimeout(() => setAvailabilityStatus(''), 2500);
    } catch (err) {
      console.error('Failed to save availability:', err);
      setAvailabilityStatus('Failed to save. Please try again.');
      setTimeout(() => setAvailabilityStatus(''), 5000);
    }
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
    if (metricMode === 'week') {
      if (!metricWeek) return { error: 'Select a week.' };
      const from = new Date(metricWeek + 'T00:00:00');
      const to = new Date(from);
      to.setDate(to.getDate() + 6);
      to.setHours(23, 59, 59, 0);
      return Number.isNaN(from.getTime()) ? { error: 'Invalid week date.' } : { from, to, error: '' };
    }
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
  }, [isValidYear, metricMode, metricMonth, metricRange, metricWeek, metricYear]);

  // Real data calculations
  const upcomingSessions = sessions.filter(s => ['Confirmed', 'Pending', 'scheduled'].includes(s.status));
  const completedSessions = sessions.filter(s => s.status === 'Completed');
  const hourlyRate = user?.hourlyRate || 0;
  
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

  const approveSession = async (session) => {
    try {
      setLoading(true);
      await sessionService.updateSession(session.id, { status: 'confirmed' });
      try {
        addNotification(session.menteeId, `${user?.name} has approved your session booking request.`, 'info');
      } catch (nErr) {
        console.warn('Failed to send local notification:', nErr);
      }
      await refreshData();
    } catch (err) {
      console.error('Failed to approve session:', err);
      alert(err.response?.data?.message || 'Failed to approve session.');
    } finally {
      setLoading(false);
    }
  };

  const rejectSession = async (session) => {
    if (!window.confirm(`Reject the booking request from ${session.menteeName || session.mentee?.name || 'this mentee'}?`)) return;
    try {
      setLoading(true);
      await sessionService.updateSession(session.id, { status: 'cancelled_by_mentor' });
      try {
        addNotification(session.menteeId, `${user?.name} has rejected your session booking request.`, 'info');
      } catch (nErr) {
        console.warn('Failed to send local notification:', nErr);
      }
      await refreshData();
    } catch (err) {
      console.error('Failed to reject session:', err);
      alert(err.response?.data?.message || 'Failed to reject session.');
    } finally {
      setLoading(false);
    }
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
        {['week', 'month', 'year', 'custom'].map((mode) => (
          <button key={mode} onClick={() => setMetricMode(mode)} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${metricMode === mode ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant'}`}>{mode === 'week' ? 'Weekly' : mode}</button>
        ))}
        <button onClick={() => downloadCsv(downloadKind)} className="ml-auto rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-on-secondary">Download CSV</button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {metricMode === 'week' && (
          <input type="date" value={metricWeek} onChange={(event) => setMetricWeek(event.target.value)} className="rounded-lg border border-outline-variant/30 bg-surface p-3" />
        )}
        {(metricMode === 'year' || metricMode === 'month') && (
          <input type="text" inputMode="numeric" min="2001" value={metricYear} onChange={(event) => setMetricYear(event.target.value)} className="rounded-lg border border-outline-variant/30 bg-surface p-3" placeholder="Year above 2000" autoComplete="off" />
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
          {[50, 100, 150].map((line) => <line key={line} x1="0" x2={width} y1={line} y2={line} style={{ stroke: 'var(--color-on-surface-variant)', strokeOpacity: '0.1' }} />)}
          <path d={path} fill="none" style={{ stroke: 'var(--color-primary)' }} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
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
    { id: 'availability', icon: 'calendar_month', label: 'Availability' },
    { id: 'earnings', icon: 'payments', label: 'Earnings' },
    { id: 'ratings', icon: 'star', label: 'Ratings' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];

  const renderSidebar = () => (
    <aside className="brand-olive-surface flex h-full w-64 shrink-0 flex-col py-6 text-on-primary shadow-xl hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex">
      <div className="px-6 mb-8 cursor-pointer" onClick={() => setView('dashboard')}>
        <h1 className="font-headline-md text-2xl font-bold text-on-primary flex items-center gap-2">
          <span className="material-symbols-outlined">school</span>
          ProLign
        </h1>
        <p className="font-label-sm text-sm font-semibold text-on-primary/80 mt-1">Mentor Portal</p>
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto px-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition-all font-label-sm text-sm font-semibold cursor-pointer ${
              activeView === item.id 
                ? 'brand-olive-menu-active scale-95' 
                : 'hover:text-on-primary hover:bg-primary-fixed-variant/20'
            }`}
          >
            <span className="material-symbols-outlined mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="mx-2 mt-auto border-t border-on-primary/10 pt-4">
        <div className="space-y-1">
          <button onClick={toggleTheme} className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold text-on-primary transition-colors hover:bg-primary-fixed-variant/20">
            <span className="material-symbols-outlined mr-3">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button onClick={handleLogout} className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold text-on-primary transition-colors hover:bg-error/10 hover:text-error">
            <span className="material-symbols-outlined mr-3">logout</span>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );

  const renderDashboard = () => {
    const ml = getMentorLevel(user);
    const mlStyle = getMentorLevelStyle(ml.level);
    const completion = getMentorProfileCompletion(user);
    return (
      <>
        <section className="brand-olive-surface relative overflow-hidden rounded-3xl p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm mb-8">
          <div className="relative z-10 space-y-4 text-center md:text-left">
            {ml.level && (
              <div className="brand-chip inline-flex items-center gap-2 px-4 py-1.5 rounded-full border">
                {mlStyle.icon && <span className="material-symbols-outlined text-[16px]">{mlStyle.icon}</span>}
                <span className="font-label-sm text-sm font-semibold">Mentor Level: {ml.label}</span>
              </div>
            )}
            <h2 className="font-headline-lg text-3xl font-bold text-on-primary">Welcome back{user?.name?.split(' ')[0] ? `, ${user.name.split(' ')[0]}!` : '!'}</h2>
            <p className="brand-muted-text max-w-md">
            You have {upcomingSessions.length} upcoming sessions.{' '}
            {user?.totalReviews > 0
              ? `Your recent mentees have rated you ${Number(user.averageRating || 0).toFixed(1)} stars!`
              : 'Complete a few sessions to start earning reviews.'}
          </p>
        </div>
          {/* Profile image with rings — matches Mentee Dashboard style */}
          <div className="relative z-10 hidden lg:flex h-48 w-48 items-center justify-center">
            {/* Concentric decorative rings */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-on-primary/15 to-on-primary/5 animate-pulse-soft" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-on-primary/20 to-on-primary/8 backdrop-blur-sm" />
            <div className="absolute inset-8 rounded-full bg-on-primary/10 backdrop-blur-sm border border-on-primary/15" />
            {/* Profile photo */}
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full overflow-hidden ring-[3px] ring-on-primary/30 shadow-xl">
                <img
                  src={user?.avatar || user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Mentor')}&background=4a5a2a&color=fff&size=200`}
                  alt={`${user?.name || 'Mentor'}'s profile photo`}
                  className="w-full h-full object-cover opacity-0 transition-opacity duration-500"
                  onLoad={(e) => e.target.classList.remove('opacity-0')}
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Mentor')}&background=4a5a2a&color=fff&size=200`; e.target.onError = null; }}
                  loading="lazy"
                />
              </div>
            </div>
            {/* Floating accent icons */}
            <span className="absolute -top-2 -right-2 material-symbols-outlined text-lg text-on-primary/70 animate-float" style={{ animationDelay: '0.5s' }}>trending_up</span>
            <span className="absolute -bottom-1 -left-1 material-symbols-outlined text-lg text-on-primary/70 animate-float" style={{ animationDelay: '1s' }}>star</span>
            <span className="absolute top-1/2 -right-6 material-symbols-outlined text-sm text-on-primary/50 animate-float" style={{ animationDelay: '1.5s' }}>school</span>
          </div>
      </section>

      {/* Profile Completion — driven by backend profile fields (/auth/me) */}
      <section className="mb-8">
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 natural-shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-2xl ${completion.percent === 100 ? 'text-success' : 'text-primary'}`}>
                {completion.percent === 100 ? 'verified' : 'account_circle'}
              </span>
              <div>
                <h3 className="font-headline-md text-lg font-bold text-on-surface">Profile Completion</h3>
                <p className="text-sm text-on-surface-variant">
                  {completion.percent === 100
                    ? 'Your profile is complete — great job!'
                    : `${completion.completedCount} of ${completion.total} sections complete`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary tabular-nums">{completion.percent}%</span>
              {completion.percent < 100 && (
                <button
                  onClick={() => { setSettingsTab('profile'); setActiveView('settings'); }}
                  className="min-h-[44px] px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm whitespace-nowrap"
                >
                  Complete profile
                </button>
              )}
            </div>
          </div>
          <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${completion.percent === 100 ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${completion.percent}%` }}
            />
          </div>
          {completion.missing.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {completion.missing.map((label) => (
                <span key={label} className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant text-xs font-medium px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Profile — schema-backed fields only (MentorProfile), relevant to
          mentor-mentee matching rather than exhaustive. Each field only
          renders when set, so an incomplete profile doesn't show empty rows. */}
      <section className="mb-8">
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 natural-shadow p-6">
          <h3 className="font-headline-md text-lg font-bold text-on-surface mb-4">Your Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {user?.title && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">Title</p>
                <p className="text-on-surface font-medium">{user.title}</p>
              </div>
            )}
            {user?.company && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">Company</p>
                <p className="text-on-surface font-medium">{user.company}</p>
              </div>
            )}
            {user?.industry && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">Industry</p>
                <p className="text-on-surface font-medium">{user.industry}</p>
              </div>
            )}
            {user?.experience > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">Experience</p>
                <p className="text-on-surface font-medium">{user.experience} {user.experience === 1 ? 'year' : 'years'}</p>
              </div>
            )}
            {user?.hourlyRate > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">Hourly Rate</p>
                <p className="text-on-surface font-medium">${user.hourlyRate}/hr</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">Rating</p>
              <p className="text-on-surface font-medium">
                {user?.totalReviews > 0
                  ? `${Number(user.averageRating || 0).toFixed(1)} ⭐ (${user.totalReviews} review${user.totalReviews === 1 ? '' : 's'})`
                  : 'No reviews yet'}
                {user?.totalSessions > 0 && ` · ${user.totalSessions} session${user.totalSessions === 1 ? '' : 's'}`}
              </p>
            </div>
            {user?.linkedinUrl && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">LinkedIn</p>
                <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline truncate block">
                  {user.linkedinUrl}
                </a>
              </div>
            )}
          </div>
          {user?.headline && <p className="mt-4 text-sm italic text-on-surface-variant">{user.headline}</p>}
          {user?.bio && <p className="mt-4 text-sm text-on-surface leading-relaxed">{user.bio}</p>}
          {user?.skills?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {user?.languages?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-2">Languages</p>
              <div className="flex flex-wrap gap-2">
                {user.languages.map((lang) => (
                  <span key={lang} className="inline-flex items-center bg-surface-container-high text-on-surface-variant text-xs font-medium px-2.5 py-1 rounded-full">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
          {user?.certifications?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-2">Certifications</p>
              <div className="flex flex-wrap gap-2">
                {user.certifications.map((cert) => (
                  <span key={cert} className="inline-flex items-center gap-1 bg-secondary/10 text-secondary text-xs font-medium px-2.5 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-headline-md text-2xl font-bold text-primary">Your Next Sessions</h3>
        {upcomingSessions.length === 0 ? (
          <EmptyState icon="calendar_month" title="No upcoming sessions" description="When mentees book sessions, they will appear here." />
        ) : (
          <div className="bg-surface-container-low rounded-2xl overflow-x-auto border border-outline-variant/10 natural-shadow">
            <table className="w-full text-left min-w-[600px]">
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
  };

  const renderEarnings = () => {
    const monthlyEarnings = (() => {
      const counts = new Array(12).fill(0);
      const revenue = new Array(12).fill(0);
      paidSessions.forEach((s) => {
        const m = new Date(s.createdAt || s.date).getMonth();
        counts[m]++;
        revenue[m] += Number(s.amount || hourlyRate) * 0.8;
      });
      return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((name, i) => ({
        name, sessions: counts[i], revenue: Math.round(revenue[i]),
      }));
    })();
    const maxRev = Math.max(...monthlyEarnings.map((d) => d.revenue), 1);

    return (
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-on-surface">Earnings</h3>
            <p className="text-sm text-on-surface-variant">Track your revenue, payouts, and transactions.</p>
          </div>
          {renderMetricFilters('earnings')}
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="group rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 transition-all hover:shadow-lg hover:scale-[1.01]">
            <div className="flex items-start justify-between mb-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <span className="material-symbols-outlined text-[22px] text-primary">account_balance_wallet</span>
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary-container px-2 py-1 text-[11px] font-bold text-on-secondary-container">
                <span className="material-symbols-outlined text-[12px]">trending_up</span>+12%
              </span>
            </div>
            <p className="text-2xl font-bold text-on-surface">${totalGrossEarnings.toLocaleString()}</p>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">Gross Earnings</p>
            <p className="mt-0.5 text-[11px] text-on-surface-variant/70">Before platform fees</p>
          </div>
          <div className="group rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 transition-all hover:shadow-lg hover:scale-[1.01]">
            <div className="flex items-start justify-between mb-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-error/10">
                <span className="material-symbols-outlined text-[22px] text-error">remove_circle</span>
              </span>
            </div>
            <p className="text-2xl font-bold text-on-surface">-${platformFee.toLocaleString()}</p>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">Platform Fees</p>
            <p className="mt-0.5 text-[11px] text-on-surface-variant/70">20% commission</p>
          </div>
          <div className="group rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 transition-all hover:shadow-lg hover:scale-[1.01]">
            <div className="flex items-start justify-between mb-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10">
                <span className="material-symbols-outlined text-[22px] text-secondary">savings</span>
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary-container px-2 py-1 text-[11px] font-bold text-on-secondary-container">
                <span className="material-symbols-outlined text-[12px]">trending_up</span>+8%
              </span>
            </div>
            <p className="text-2xl font-bold text-on-surface">${netEarnings.toLocaleString()}</p>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">Net Earnings</p>
            <p className="mt-0.5 text-[11px] text-on-surface-variant/70">Available for withdrawal</p>
          </div>
          <div className="group rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 transition-all hover:shadow-lg hover:scale-[1.01]">
            <div className="flex items-start justify-between mb-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-tertiary/10">
                <span className="material-symbols-outlined text-[22px] text-tertiary">receipt_long</span>
              </span>
            </div>
            <p className="text-2xl font-bold text-on-surface">{paidSessions.length}</p>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">Paid Sessions</p>
            <p className="mt-0.5 text-[11px] text-on-surface-variant/70">All time transactions</p>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
          <div className="border-b border-outline-variant/10 px-6 py-4">
            <h4 className="text-base font-bold text-on-surface">Revenue Trend</h4>
            <p className="mt-0.5 text-xs text-on-surface-variant">Monthly earnings over time</p>
          </div>
          <div className="p-6">
            {renderLineChart(metricData, 'value')}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
          <div className="border-b border-outline-variant/10 px-6 py-4">
            <h4 className="text-base font-bold text-on-surface">Monthly Breakdown</h4>
            <p className="mt-0.5 text-xs text-on-surface-variant">Earnings by month</p>
          </div>
          <div className="p-6">
            <div className="flex items-end gap-2" style={{ height: 140 }}>
              {monthlyEarnings.map((d, i) => {
                const pct = Math.max((d.revenue / maxRev) * 100, 2);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                    <span className="text-[10px] font-bold text-on-surface-variant opacity-0 group-hover/bar:opacity-100 transition-opacity">
                      ${d.revenue}
                    </span>
                    <div className="w-full rounded-t-lg bg-primary/80 transition-all duration-500 group-hover/bar:bg-primary"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              {monthlyEarnings.map((d, i) => (
                <div key={i} className="flex-1 text-center text-[10px] font-semibold text-on-surface-variant truncate">{d.name}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
          <div className="border-b border-outline-variant/10 px-6 py-4">
            <h4 className="text-base font-bold text-on-surface">Recent Transactions</h4>
            <p className="mt-0.5 text-xs text-on-surface-variant">Your latest session payments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Session</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Amount</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Fee</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Net</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {paidSessions.map((session) => {
                  const gross = Number(session.amount || hourlyRate);
                  const fee = gross * 0.2;
                  const net = gross * 0.8;
                  const status = String(session.status).toLowerCase();
                  const isCompleted = status === 'completed';
                  return (
                    <tr key={session.id} className="transition-colors hover:bg-surface-container-low/50">
                      <td className="px-6 py-4 text-sm font-semibold text-on-surface">{getSessionDate(session).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-on-surface">Session with {session.menteeName || session.mentee?.name || 'Mentee'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">${gross.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-error">-${fee.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-on-surface">${net.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          isCompleted ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container text-on-tertiary-container'
                        }`}>
                          {isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {paidSessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-on-surface-variant">No transactions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  };

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

  const renderSettings = () => <ProfileSettings compact onSaved={refreshData} user={user} onAccountClosed={() => { dbLogout(); tokenManager.clearTokens(); navigateTo('home'); }} initialTab={settingsTab} />;

  const renderSkeleton = () => (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-primary/30 p-10 mb-8 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 w-40 bg-on-surface/10 rounded-full" />
          <div className="h-10 w-72 bg-on-surface/10 rounded-lg" />
          <div className="h-4 w-96 bg-on-surface/10 rounded" />
        </div>
      </section>
      <section className="space-y-4">
        <div className="h-8 w-48 bg-on-surface/10 rounded-lg animate-pulse" />
        <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 p-6 space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-14 bg-on-surface/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    </>
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    switch (activeView) {
      case 'dashboard': return renderDashboard();
      case 'earnings': return renderEarnings();
      case 'ratings': return renderRatings();
      case 'settings': return renderSettings();
      case 'availability': return <AvailabilityScheduler mentorId={user?.id} />;
      case 'sessions': {
        const groups = {
          pending: sessions.filter((session) => (session.status || '').toLowerCase() === 'pending'),
          scheduled: sessions.filter((session) => ['confirmed', 'scheduled'].includes((session.status || '').toLowerCase())),
          completed: sessions.filter((session) => (session.status || '').toLowerCase() === 'completed'),
          cancelled: sessions.filter((session) => {
            const st = (session.status || '').toLowerCase();
            return st.includes('cancel') || st.includes('reject');
          }),
        };
        const visibleSessions = groups[sessionTab] || groups.pending;
        const today = new Date();
        const todaySessions = sessions.filter(s => {
          const d = new Date(s.dateTime || s.date || s.createdAt);
          const st = (s.status || '').toLowerCase();
          return d.toDateString() === today.toDateString() && ['confirmed', 'pending', 'scheduled'].includes(st);
        });
        const weekSessions = sessions.filter(s => {
          const d = new Date(s.dateTime || s.date || s.createdAt);
          const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
          const st = (s.status || '').toLowerCase();
          return d >= today && d <= weekEnd && ['confirmed', 'pending', 'scheduled'].includes(st);
        });
        const nextSession = groups.scheduled[0] || groups.pending[0];

        const renderNextSessionCard = () => {
          if (!nextSession) return (
            <div className="rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-lowest p-8 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">calendar_month</span>
              <h3 className="text-lg font-bold text-on-surface mb-1">No upcoming sessions</h3>
              <p className="text-sm text-on-surface-variant mb-4">Update your availability so mentees can start booking.</p>
              <button onClick={() => { setSettingsTab('career'); setActiveView('settings'); }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm hover:shadow-md transition-all">
                <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                Manage Availability
              </button>
            </div>
          );
          const menteeName = nextSession.menteeName || nextSession.mentee?.name || 'Mentee';
          const sessionDate = new Date(nextSession.dateTime || nextSession.date || nextSession.createdAt);
          const sessionTime = nextSession.time || '';
          const diffMs = sessionDate.getTime() - Date.now();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const countdownText = diffDays > 0 ? `${diffDays}d ${diffHrs}h` : diffHrs > 0 ? `${diffHrs}h` : 'Today';

          return (
            <div className="rounded-2xl bg-gradient-to-br from-primary via-primary-container to-surface-dim overflow-hidden shadow-md">
              <div className="p-6 text-on-primary">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-3">Next Session</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-on-primary/30 flex-shrink-0 bg-on-primary/10">
                    <img src={nextSession.menteeAvatar || `https://ui-avatars.com/api/?name=${menteeName}&background=ffffff&color=202a10`} alt={menteeName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold truncate">{menteeName}</h3>
                    <p className="text-sm opacity-80 truncate">{nextSession.type || nextSession.topic || 'Mentorship Session'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold">{countdownText}</p>
                    <p className="text-xs opacity-70">until session</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm opacity-85">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span>{sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span>{sessionTime || '—'}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">hourglass_top</span>{nextSession.duration || 60} min</span>
                </div>
              </div>
              <div className="bg-on-primary/5 backdrop-blur-sm px-6 py-3 flex flex-wrap gap-2">
                <button onClick={() => navigateTo('video-interview', { sessionId: nextSession.id })} className="inline-flex items-center gap-1.5 rounded-lg bg-on-primary text-primary px-4 py-2 text-xs font-bold hover:bg-on-primary/90 transition-all shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">videocam</span>Join Session
                </button>
                <button onClick={() => setSelectedSession(nextSession)} className="inline-flex items-center gap-1.5 rounded-lg bg-on-primary/15 text-on-primary px-4 py-2 text-xs font-bold hover:bg-on-primary/25 transition-all">
                  <span className="material-symbols-outlined text-[14px]">info</span>View Details
                </button>
                <button onClick={() => openRescheduleModal(nextSession)} className="inline-flex items-center gap-1.5 rounded-lg bg-on-primary/15 text-on-primary px-4 py-2 text-xs font-bold hover:bg-on-primary/25 transition-all">
                  <span className="material-symbols-outlined text-[14px]">edit_calendar</span>Reschedule
                </button>
              </div>
            </div>
          );
        };

        const renderKpiCards = () => (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: 'today', label: "Today's Sessions", value: todaySessions.length, accent: 'primary' },
              { icon: 'date_range', label: 'Upcoming (7d)', value: weekSessions.length, accent: 'secondary' },
              { icon: 'check_circle', label: 'Completed', value: completedSessions.length, accent: 'tertiary' },
            ].map((kpi) => (
              <div key={kpi.label} className="group rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
                <div className="flex items-start justify-between mb-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.accent === 'primary' ? 'bg-primary/10' : kpi.accent === 'secondary' ? 'bg-secondary/10' : 'bg-tertiary/10'}`}>
                    <span className={`material-symbols-outlined text-[18px] ${kpi.accent === 'primary' ? 'text-primary' : kpi.accent === 'secondary' ? 'text-secondary' : 'text-tertiary'}`}>{kpi.icon}</span>
                  </span>
                </div>
                <p className="text-xl font-bold text-on-surface">{kpi.value}</p>
                <p className="text-[11px] font-semibold text-on-surface-variant mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>
        );

        const renderTimeline = () => {
          const timelineSessions = sessions
            .filter(s => new Date(s.dateTime || s.date || s.createdAt).toDateString() === today.toDateString())
            .sort((a, b) => new Date(a.dateTime || a.date) - new Date(b.dateTime || b.date))
            .slice(0, 5);
          if (timelineSessions.length === 0) return null;
          return (
            <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/10">
                <h4 className="text-sm font-bold text-on-surface">Today's Schedule</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="p-6">
                <div className="space-y-0">
                  {timelineSessions.map((s, i) => {
                    const statusColors = { Pending: 'bg-tertiary', Confirmed: 'bg-primary', Completed: 'bg-secondary', Cancelled: 'bg-error', Canceled: 'bg-error', Rejected: 'bg-error' };
                    const dotColor = statusColors[s.status] || 'bg-outline-variant';
                    return (
                      <div key={s.id} className="flex gap-4 pb-6 last:pb-0 relative">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${dotColor} ring-2 ring-surface-container-lowest z-10`} />
                          {i < timelineSessions.length - 1 && <div className="w-0.5 flex-1 bg-outline-variant/30 -mt-1" />}
                        </div>
                        <div className="flex-1 min-w-0 -mt-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-bold text-on-surface-variant flex-shrink-0 w-14">{s.time || '—'}</span>
                              <span className="text-sm font-semibold text-on-surface truncate">{s.menteeName || s.mentee?.name || 'Mentee'}</span>
                            </div>
                            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              s.status === 'Confirmed' ? 'bg-primary/10 text-primary' :
                              s.status === 'Completed' ? 'bg-secondary/10 text-secondary' :
                              s.status === 'Pending' ? 'bg-tertiary/15 text-tertiary' :
                              'bg-error/10 text-error'
                            }`}>{s.status}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant truncate mt-0.5 ml-14">{s.type || s.topic || 'Mentorship Session'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        };

        const statusBadge = (status) => {
          const map = {
            Pending: 'bg-tertiary/15 text-tertiary border-tertiary/20',
            Confirmed: 'bg-primary/10 text-primary border-primary/20',
            Completed: 'bg-secondary/10 text-secondary border-secondary/20',
            scheduled: 'bg-primary/10 text-primary border-primary/20',
            Cancelled: 'bg-error/10 text-error border-error/20',
            Canceled: 'bg-error/10 text-error border-error/20',
            Rejected: 'bg-error/10 text-error border-error/20',
          };
          return `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border ${map[status] || 'bg-surface-variant text-on-surface-variant border-outline-variant/20'}`;
        };

        return (
          <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
            {/* Segment Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'pending', label: 'Pending' },
                { id: 'scheduled', label: 'Scheduled' },
                { id: 'completed', label: 'Completed' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setSessionTab(tab.id)}
                  className={`relative flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    sessionTab === tab.id ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    sessionTab === tab.id ? 'bg-on-primary/20 text-on-primary' : 'bg-outline-variant/30 text-on-surface-variant'
                  }`}>
                    {groups[tab.id]?.length || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* KPI Statistics */}
            {renderKpiCards()}

            {/* Next Session Hero Card */}
            {renderNextSessionCard()}

            {/* Today's Timeline */}
            {renderTimeline()}

            {/* Sessions Table */}
            <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/10">
                <h4 className="text-sm font-bold text-on-surface capitalize">{sessionTab} Sessions</h4>
              </div>
              {visibleSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">event_upcoming</span>
                  <h3 className="text-lg font-bold text-on-surface mb-1">No sessions scheduled yet</h3>
                  <p className="text-sm text-on-surface-variant mb-6 max-w-sm">Update your availability so mentees can start booking sessions.</p>
                  <button onClick={() => { setSettingsTab('career'); setActiveView('settings'); }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                    Manage Availability
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/10">
                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Mentee</th>
                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Topic</th>
                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Time</th>
                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Duration</th>
                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Platform</th>
                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {visibleSessions.map((s) => (
                        <tr key={s.id} className="hover:bg-surface-container/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-variant flex-shrink-0">
                                <img src={s.menteeAvatar || `https://ui-avatars.com/api/?name=${s.menteeName || 'M'}&background=202a10&color=fff`} alt={s.menteeName} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-sm font-semibold text-on-surface">{s.menteeName || s.mentee?.name || 'Mentee'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant">{s.type || s.topic || '—'}</td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">{s.dateTime || s.date || '—'}</td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">{s.time || '—'}</td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant">{s.duration ? `${s.duration} min` : '—'}</td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant">{s.platform || '—'}</td>
                          <td className="px-6 py-4">
                            <span className={statusBadge(s.status)}>{s.status}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setSelectedSession(s)} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors" title="View Details">
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                              {['Confirmed', 'scheduled'].includes(s.status) && (
                                <button onClick={() => navigateTo('video-interview', { sessionId: s.id })} className="p-2 rounded-lg text-secondary hover:bg-secondary/10 transition-colors" title="Join">
                                  <span className="material-symbols-outlined text-[18px]">videocam</span>
                                </button>
                              )}
                              {['Confirmed', 'Pending', 'scheduled'].includes(s.status) && (
                                <>
                                  <button onClick={() => openRescheduleModal(s)} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors" title="Reschedule">
                                    <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                                  </button>
                                  <button onClick={() => handleCancelSession(s)} className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors" title="Cancel">
                                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                                  </button>
                                </>
                              )}
                              {s.status === 'Pending' && (
                                <>
                                  <button onClick={() => approveSession(s)} className="p-2 rounded-lg text-secondary hover:bg-secondary/10 transition-colors" title="Approve">
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                  </button>
                                  <button onClick={() => rejectSession(s)} className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors" title="Reject">
                                    <span className="material-symbols-outlined text-[18px]">block</span>
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
            </div>

            {/* Analytics Section */}
            <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Session Analytics</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">Track session volume and status distribution</p>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Status KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Pending', count: groups.pending.length, color: 'bg-tertiary', icon: 'pending_actions' },
                    { label: 'Scheduled', count: groups.scheduled.length, color: 'bg-primary', icon: 'checklist' },
                    { label: 'Completed', count: groups.completed.length, color: 'bg-secondary', icon: 'task_alt' },
                    { label: 'Cancelled', count: groups.cancelled.length, color: 'bg-error', icon: 'cancel_schedule_send' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-3 rounded-xl bg-surface-container-low p-4">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.label === 'Pending' ? 'bg-tertiary/10' : stat.label === 'Scheduled' ? 'bg-primary/10' : stat.label === 'Completed' ? 'bg-secondary/10' : 'bg-error/10'}`}>
                        <span className={`material-symbols-outlined text-[20px] ${stat.label === 'Pending' ? 'text-tertiary' : stat.label === 'Scheduled' ? 'text-primary' : stat.label === 'Completed' ? 'text-secondary' : 'text-error'}`}>{stat.icon}</span>
                      </span>
                      <div>
                        <p className="text-xl font-bold text-on-surface">{stat.count}</p>
                        <p className="text-[11px] font-semibold text-on-surface-variant">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="relative h-3 rounded-full bg-surface-container-low overflow-hidden">
                  {(() => {
                    const total = sessions.length || 1;
                    const p1 = (groups.pending.length / total) * 100;
                    const p2 = (groups.scheduled.length / total) * 100;
                    const p3 = (groups.completed.length / total) * 100;
                    return (
                      <>
                        <div className="absolute inset-y-0 left-0 bg-tertiary rounded-full transition-all duration-500" style={{ width: `${p1}%` }} />
                        <div className="absolute inset-y-0 rounded-full bg-primary transition-all duration-500" style={{ left: `${p1}%`, width: `${p2}%` }} />
                        <div className="absolute inset-y-0 rounded-full bg-secondary transition-all duration-500" style={{ left: `${p1 + p2}%`, width: `${p3}%` }} />
                      </>
                    );
                  })()}
                </div>

                {/* Analytics Filters + Charts */}
                {renderMetricFilters('analytics')}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-surface-container-low p-4 rounded-xl">
                    <p className="text-xs font-bold text-on-surface-variant mb-3 uppercase tracking-wider">Volume Trend ({metricMode})</p>
                    {metricData.length > 0 ? renderLineChart(metricData, 'sessions') : (
                      <div className="h-40 flex items-center justify-center text-sm text-on-surface-variant">No data for selected period</div>
                    )}
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl">
                    <p className="text-xs font-bold text-on-surface-variant mb-3 uppercase tracking-wider">Session Volume</p>
                    {metricData.length > 0 ? (
                      <div className="flex items-end gap-1.5" style={{ height: 140 }}>
                        {metricData.slice(-12).map((d, i) => {
                          const max = Math.max(...metricData.map(x => x.sessions || 0), 1);
                          const pct = Math.max(((d.sessions || 0) / max) * 100, 2);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                              <span className="text-[9px] font-bold text-on-surface-variant opacity-0 group-hover/bar:opacity-100 transition-opacity">{d.sessions}</span>
                              <div className="w-full rounded-t-lg bg-primary/70 transition-all duration-500 group-hover/bar:bg-primary" style={{ height: `${pct}%` }} />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center text-sm text-on-surface-variant">No data for selected period</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      default: return renderDashboard();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 mb-4">account_circle</span>
          <h2 className="text-2xl font-bold text-on-surface mb-2">Session Expired</h2>
          <p className="text-on-surface-variant mb-6">Please log in to access your mentor dashboard.</p>
          <button onClick={() => navigateTo('home')} className="rounded-lg bg-primary px-6 py-3 font-bold text-on-primary shadow-sm hover:shadow-md transition-all">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body-md">
      {renderSidebar()}

      <main className="min-h-screen lg:pl-64 bg-surface">
        <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8 pb-28">
        <header className="flex justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div>
              {activeView !== 'settings' && activeView !== 'earnings' && (
                <>
                  <h2 className="font-headline-lg text-2xl sm:text-4xl font-bold text-on-surface capitalize">{activeView.replace('-', ' ')}</h2>
                  <p className="text-on-surface-variant text-sm sm:text-base mt-0.5">Manage your mentorship practice and impact.</p>
                </>
              )}
            </div>
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

            <div onClick={() => setActiveView('settings')} className="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-full natural-shadow cursor-pointer hover:bg-surface-container-high transition-colors">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant border border-outline-variant/30">
                {user?.avatar || user?.profilePic ? (
                  <img className="w-full h-full object-cover" src={user.avatar || user.profilePic} alt={user?.name} />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-bold text-on-surface-variant">
                    {(user?.name || 'M').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold leading-none text-on-surface">{user?.name || 'Mentor'}</span>
                <span className="mt-1 block text-[11px] text-on-surface-variant">Mentor Account</span>
              </span>
            </div>
          </div>
        </header>

        {renderContent()}
        </div>
      </main>
      <nav className="brand-olive-surface fixed inset-x-0 bottom-0 z-40 border-t border-on-primary/10 px-2 py-2 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`flex flex-col items-center rounded-xl px-1 py-2 text-[11px] font-semibold ${
                activeView === item.id ? 'brand-olive-menu-active' : 'text-on-primary/75'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeView === item.id ? 'fill-icon' : ''}`}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

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
export { MentorDashboard };

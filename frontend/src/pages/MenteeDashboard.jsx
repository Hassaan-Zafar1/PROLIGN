import React, { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/common/EmptyState';
import ProfileSettings from '../components/ProfileSettings';
import { tokenManager } from '../utils/tokenManager';
import {
  addReview,
  cancelSession,
  getBookingsForUser,
  getCurrentUser,
  getSessions,
  getUserById,
  logout as dbLogout,
  saveSessions,
  updateBookingStatus,
  updateSessionStatus,
  getDB,
  saveDB,
  getNotifications,
  markNotificationRead,
  deleteNotification,
} from '../utils/db';
import { getMentorLevel, getMentorLevelStyle } from '../utils/mentorLevel';
import { recommendationService } from '../services/recommendationService';
import { sessionService } from '../services/sessionService';
import { authService } from '../services/authService';
import { flattenUserProfile } from '../utils/flattenProfile';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

// Python AI interviewer/matcher backend (uvicorn api:app --port 8000) —
// separate from the Node API `authService`/`recommendationService` call.
const INTERVIEWER_API_BASE = import.meta.env?.VITE_INTERVIEWER_API_URL || 'http://localhost:8000';

const normalizeView = (view) => {
  return view || 'dashboard';
};

const navItems = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { id: 'sessions', icon: 'event_available', label: 'Sessions' },
  { id: 'analytics', icon: 'bar_chart', label: 'Analytics' },
  { id: 'payments', icon: 'payments', label: 'Payments' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
];

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const cardClass = 'rounded-2xl border border-outline-variant/10 bg-surface-container shadow-sm';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98]';

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded bg-surface-container-high ${className}`} />;
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close modal" />
      <div className="relative w-full max-w-lg rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-2xl sm:p-8">
        {children}
      </div>
    </div>
  );
}

export default function MenteeDashboard({ navigateTo, initialView = 'dashboard' }) {
  const { theme, toggleTheme, applyTheme } = useTheme();
  const { user: authUser, updateUser, logout } = useAuth();
  const [user, setUser] = useState(authUser || getCurrentUser());
  const [activeView, setActiveView] = useState(normalizeView(initialView));
  const [mentors, setMentors] = useState([]);
  const [matchedMentors, setMatchedMentors] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sessionTab, setSessionTab] = useState('upcoming');
  const [ratingSession, setRatingSession] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingText, setRatingText] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);
  const [notesSession, setNotesSession] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [analyticsMode, setAnalyticsMode] = useState('year');
  const [analyticsYear, setAnalyticsYear] = useState(String(new Date().getFullYear()));
  const [analyticsMonth, setAnalyticsMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [analyticsRange, setAnalyticsRange] = useState({ from: `${new Date().getFullYear()}-01-01`, to: `${new Date().getFullYear()}-12-31` });
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  // Recommended mentors via the recommendation SEAM (all mentors for now; AI
  // model plugs in later). Forwards the mentee's interview-derived profile so
  // a real matching model can use it once enabled.
  const loadRecommendedMentors = (forUser) => {
    recommendationService.getRecommendedMentors({
      limit: 100,
      menteeId: forUser?.id,
      skills: forUser?.skills,
      preferredCategories: forUser?.preferredCategories,
      careerGoals: forUser?.careerGoals,
    })
      .then(({ mentors: list }) => setMentors(list))
      .catch(() => setMentors([]));
  };

  // Ayla's AI-matching engine (Python/matcher.py) — separate from the generic
  // "all mentors" recommendation SEAM above. Keyed on the mentee's real
  // MenteeProfile _id, so it works any time after the interview, not just
  // right when it completes.
  const loadMatchedMentors = (menteeProfileId) => {
    if (!menteeProfileId) return;
    setMatchLoading(true);
    fetch(`${INTERVIEWER_API_BASE}/match/${menteeProfileId}?top_k=5`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const mapped = (data.top_mentors || []).map((m) => ({
          id: m.mentor_id,
          name: m.full_name || 'Mentor',
          avatar: m.profile_pic || null,
          title: m.current_role,
          industry: m.industry,
          rating: m.avg_rating,
          hourlyRate: m.hourly_rate,
          matchScore: m.final_score,
        }));
        setMatchedMentors(mapped);
      })
      .catch(() => setMatchedMentors([]))
      .finally(() => setMatchLoading(false));
  };

  const loadData = async () => {
    try {
      let mergedUser;
      try {
        const backendUser = await authService.getCurrentUser();
        mergedUser = flattenUserProfile(backendUser);
        updateUser(mergedUser);
        setUser(mergedUser);
        loadRecommendedMentors(mergedUser);
        loadMatchedMentors(backendUser?.menteeProfile?._id || backendUser?.menteeProfile?.id);
      } catch (err) {
        mergedUser = authUser || getCurrentUser();
        setUser(mergedUser);
        loadRecommendedMentors(mergedUser);
      }

      if (!mergedUser) return;

      // Fetch sessions from real backend
      try {
        const response = await sessionService.getSessions({ as: 'mentee' });
        const backendSessions = response.data || [];
        const dbSessions = backendSessions.map((s) => {
          const mentor = s.mentorId || {};
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
            menteeId: s.menteeId?._id || s.menteeId,
            mentorName: mentor.name || 'Mentor',
            mentorAvatar: mentor.profilePic || '',
            mentorTitle: mentor.title || mentor.industry || 'Mentor',
            date: new Date(s.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            time: timeLabel,
            sessionType: s.sessionType === 'mock_interview' ? 'Mock Interview' : s.sessionType,
            status: s.status === 'confirmed' || s.status === 'scheduled' ? 'Confirmed' : s.status === 'pending' ? 'Pending' : s.status === 'completed' ? 'Completed' : s.status,
            amount: s.priceCharged,
            agenda: s.agenda,
            dateTime: s.scheduledDate,
            mentor: {
              name: mentor.name || 'Mentor',
              avatar: mentor.profilePic || '',
              title: mentor.title || mentor.industry || 'Mentor',
            }
          };
        });
        setSessions(dbSessions);
      } catch (err) {
        console.error('Failed to load sessions from backend:', err);
      }

      setBookings(
        getBookingsForUser(mergedUser.id).map((booking) => ({
          ...booking,
          mentor: getUserById(booking.mentorId),
        }))
      );

      setNotifications(getNotifications().filter((item) => !item.userId || item.userId === mergedUser.id));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setActiveView(normalizeView(initialView));
  }, [initialView]);

  const parseSessionDate = (session) => {
    const parsedDate = new Date(session?.dateTime || session?.date);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const sessionGroups = useMemo(() => {
    const normalized = sessions.map((session) => ({
      ...session,
      statusLabel: (session.status || '').toLowerCase(),
    }));

    const bySoonest = (left, right) => {
      const leftTime = parseSessionDate(left)?.getTime() || 0;
      const rightTime = parseSessionDate(right)?.getTime() || 0;
      return leftTime - rightTime;
    };

    return {
      upcoming: normalized
        .filter((session) => ['confirmed', 'pending', 'scheduled'].includes(session.statusLabel))
        .sort(bySoonest),
      past: normalized
        .filter((session) => ['completed', 'done'].includes(session.statusLabel))
        .sort((left, right) => bySoonest(right, left)),
      cancelled: normalized
        .filter((session) => session.statusLabel.includes('cancel') || session.statusLabel.includes('reject'))
        .sort((left, right) => bySoonest(right, left)),
    };
  }, [sessions]);

  const featuredSession =
    sessionGroups.upcoming.find((session) => {
      const date = parseSessionDate(session);
      return date ? date.getTime() >= Date.now() : true;
    }) || sessionGroups.upcoming[0] || null;

  const recommendedMentors = mentors.slice(0, 4);
  const completedSessions = sessionGroups.past.length;
  const mentorshipHours = [...sessionGroups.past, ...sessionGroups.upcoming].reduce((sum, s) => sum + (s.duration || 1.5), 0);

  const analyticsDateRange = useMemo(() => {
    const year = Number(analyticsYear);
    if ((analyticsMode === 'year' || analyticsMode === 'month') && (!Number.isInteger(year) || year <= 2000)) {
      return { error: 'Enter a valid year above 2000.' };
    }
    if (analyticsMode === 'year') {
      return { from: new Date(year, 0, 1), to: new Date(year, 11, 31, 23, 59, 59), error: '' };
    }
    if (analyticsMode === 'month') {
      return { from: new Date(year, Number(analyticsMonth) - 1, 1), to: new Date(year, Number(analyticsMonth), 0, 23, 59, 59), error: '' };
    }
    const from = new Date(analyticsRange.from);
    const to = new Date(`${analyticsRange.to}T23:59:59`);
    if (!analyticsRange.from || !analyticsRange.to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return { error: 'Choose both custom dates.' };
    }
    if (from > to) return { error: 'Start date must be before end date.' };
    if (from.getFullYear() <= 2000 || to.getFullYear() <= 2000) return { error: 'Custom dates must be after year 2000.' };
    return { from, to, error: '' };
  }, [analyticsMode, analyticsMonth, analyticsRange, analyticsYear]);

  const analyticsData = useMemo(() => {
    if (analyticsDateRange.error) return [];
    const pastSessions = sessionGroups.past.filter((session) => {
      const date = parseSessionDate(session);
      return date && date >= analyticsDateRange.from && date <= analyticsDateRange.to;
    });

    if (analyticsMode === 'year') {
      return monthLabels.map((label, index) => ({
        label,
        value: pastSessions.filter((session) => parseSessionDate(session)?.getMonth() === index).length,
      }));
    }

    if (analyticsMode === 'month') {
      const days = new Date(Number(analyticsYear), Number(analyticsMonth), 0).getDate();
      return Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        return {
          label: String(day),
          value: pastSessions.filter((session) => parseSessionDate(session)?.getDate() === day).length,
        };
      });
    }

    return monthLabels.map((label, index) => ({
      label,
      value: pastSessions.filter((session) => parseSessionDate(session)?.getMonth() === index).length,
    }));
  }, [analyticsDateRange, analyticsMode, analyticsMonth, analyticsYear, sessionGroups.past]);

  const countdown = useMemo(() => {
    const date = featuredSession ? parseSessionDate(featuredSession) : null;
    if (!date) return { days: '00', hours: '00', minutes: '00' };

    const difference = Math.max(date.getTime() - Date.now(), 0);
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / (1000 * 60)) % 60);

    return {
      days: String(days).padStart(2, '0'),
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
    };
  }, [featuredSession]);

  const setView = (view) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    navigateTo('home');
  };

  const handleBookMentor = (mentorId) => {
    if (!mentorId) {
      navigateTo('find-mentors');
      return;
    }
    navigateTo('booking', { mentorId });
  };

  const handleViewMentor = (mentorId) => {
    navigateTo('mentorProfile', { mentorId });
  };

  const handleJoinSession = (session) => {
    if (!session) return;
    navigateTo('video-interview', { sessionId: session.id });
  };

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
    if (!session) return;
    const confirmed = window.confirm(`Cancel your session with ${session.mentor?.name || 'this mentor'}?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await sessionService.deleteSession(session.id);
      loadData();
    } catch (err) {
      console.error('Failed to cancel session:', err);
      alert('Failed to cancel session.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptNewTiming = (session) => {
    try {
      updateSessionStatus(session.id, 'Confirmed');
      addNotification(session.mentorId, `${user?.name} accepted your proposed timing. The session is confirmed.`, 'info');
      loadData();
    } catch (err) {
      console.error('Failed to accept timing:', err);
    }
  };

  const handleProposeNewTimeMentee = (session) => {
    const newDate = prompt('Enter new date (YYYY-MM-DD):', session.dateTime?.split('T')[0] || session.date || '');
    if (!newDate) return;
    const newTime = prompt('Enter new time (e.g. 02:00 PM):', session.time || '');
    if (!newTime) return;
    try {
      const db = getDB();
      const found = (db.sessions || []).find(s => s.id === session.id);
      if (found) {
        found.dateTime = newDate;
        found.date = newDate;
        found.time = newTime;
        found.status = 'Rescheduled';
      }
      saveDB(db);
      addNotification(session.mentorId, `${user?.name} proposed an alternative time: ${newDate} at ${newTime}.`, 'reschedule');
      loadData();
    } catch (err) {
      console.error('Failed to propose new time:', err);
    }
  };

  const openRatingModal = (session) => {
    setRatingSession(session);
    setRatingScore(session.rating || 5);
    setRatingText(session.reviewText || '');
  };

  const handleRatingSubmit = (event) => {
    event.preventDefault();
    if (!ratingSession || ratingSession.isRated || !user) return;

    setRatingSaving(true);
    try {
      const result = addReview(
        ratingSession.mentorId,
        user.id,
        user.name,
        ratingScore,
        ratingText,
        ratingSession.id
      );

      if (result.success) {
        loadData();
        setRatingSession({ ...ratingSession, isRated: true, rating: ratingScore, reviewText: ratingText });
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setRatingSaving(false);
    }
  };

  const openNotesModal = (session) => {
    if (!session) return;
    setNotesSession(session);
    setNotesDraft(session.notes || '');
  };

  const saveNotes = (event) => {
    event.preventDefault();
    if (!notesSession) return;

    setSavingNotes(true);
    try {
      const updatedSessions = getSessions().map((session) =>
        session.id === notesSession.id ? { ...session, notes: notesDraft } : session
      );
      saveSessions(updatedSessions);
      setNotesSession(null);
      loadData();
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const getStatusClass = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'confirmed' || normalized === 'scheduled') {
      return 'bg-secondary-container text-on-secondary-container';
    }
    if (normalized === 'pending') return 'bg-surface-dim text-on-surface-variant';
    if (normalized === 'completed') return 'bg-primary-fixed text-on-primary-fixed';
    if (normalized === 'rescheduled') return 'bg-tertiary-container text-on-tertiary-container';
    return 'bg-error-container text-on-error-container';
  };

  const renderStars = (rating = 5) => (
    <div className="flex items-center gap-0.5 text-secondary">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`material-symbols-outlined text-[18px] ${star <= Math.round(rating) ? 'fill-icon' : ''}`}>
          star
        </span>
      ))}
      <span className="ml-1 text-xs font-semibold text-on-surface-variant">{Number(rating || 5).toFixed(1)}</span>
    </div>
  );

  const renderLineChart = (data) => {
    const width = 800;
    const height = 220;
    const maxValue = Math.max(1, ...data.map((item) => item.value || 0));
    const step = data.length > 1 ? width / (data.length - 1) : width;
    const yFor = (value) => height - 20 - ((value / maxValue) * 170);
    const path = data.map((item, index) => `${index === 0 ? 'M' : 'L'}${index * step},${yFor(item.value || 0)}`).join(' ');

    return (
      <div className="h-72 w-full">
        <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {[50, 100, 150].map((line) => <line key={line} x1="0" x2={width} y1={line} y2={line} style={{ stroke: 'var(--color-on-surface-variant)', strokeOpacity: '0.1' }} />)}
          <path d={path} fill="none" style={{ stroke: 'var(--color-primary)' }} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          {data.map((item, index) => (
            <circle key={`${item.label}-${index}`} cx={index * step} cy={yFor(item.value || 0)} r="4" style={{ fill: 'var(--color-primary)' }} />
          ))}
        </svg>
        <div className="grid text-xs font-semibold text-on-surface-variant" style={{ gridTemplateColumns: `repeat(${Math.min(data.length || 1, 12)}, minmax(0, 1fr))` }}>
          {data.filter((_, index) => data.length <= 12 || index % Math.ceil(data.length / 12) === 0).map((item, index) => <span key={`${item.label}-${index}`}>{item.label}</span>)}
        </div>
      </div>
    );
  };

  const renderSidebar = () => (
    <aside
      className="brand-olive-surface flex h-full w-64 shrink-0 flex-col py-6 text-on-primary shadow-xl hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex"
    >
      <button
        onClick={() => setView('dashboard')}
        className="mb-8 flex items-center gap-3 px-6 text-left"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
          <span className="material-symbols-outlined fill-icon">architecture</span>
        </span>
        <span>
          <span className="block font-headline-md text-xl font-bold leading-none text-on-primary">ProLign</span>
          <span className="mt-1 block text-xs font-semibold text-on-primary/80">Modern Mentorship</span>
        </span>
      </button>

      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors ${
              activeView === item.id
                ? 'brand-olive-menu-active'
                : 'hover:bg-primary-fixed-variant/20 hover:text-on-primary'
            }`}
          >
            <span className={`material-symbols-outlined mr-3 ${activeView === item.id ? 'fill-icon' : ''}`}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-4 py-4">
        <button
          onClick={() => handleBookMentor()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary-fixed py-3 text-sm font-bold text-on-secondary-fixed transition-opacity hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Book New Session
        </button>
      </div>

      <div className="space-y-1 border-t border-on-primary/10 pt-4 px-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-primary-fixed-variant/20 hover:text-on-primary"
        >
          <span className="material-symbols-outlined mr-3">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-error/10 hover:text-error"
        >
          <span className="material-symbols-outlined mr-3">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );

  const renderHeader = () => (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-outline-variant/10 bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6">
      <h1 className="text-lg font-bold text-on-background">Dashboard</h1>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-error text-[10px] font-bold text-on-error flex items-center justify-center">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <button className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} aria-label="Close notifications" />
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-outline-variant/10 px-4 py-3">
                  <h4 className="text-sm font-bold text-on-surface">Notifications</h4>
                  {notifications.some((n) => !n.read) && (
                    <button
                      className="text-xs font-bold text-secondary hover:underline"
                      onClick={() => { notifications.forEach((n) => markNotificationRead(n.id)); loadData(); }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-6 text-center text-sm text-on-surface-variant">No notifications.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`border-b border-outline-variant/5 px-4 py-3 transition-colors hover:bg-surface-container-low ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="mb-1 flex items-start justify-between">
                          <p className="text-xs font-semibold text-on-surface">{n.message}</p>
                          <div className="ml-2 flex gap-1.5 flex-shrink-0">
                            {!n.read && (
                              <button
                                onClick={() => { markNotificationRead(n.id); loadData(); }}
                                className="text-[10px] font-bold text-secondary hover:underline"
                              >
                                Read
                              </button>
                            )}
                            <button
                              onClick={() => { deleteNotification(n.id); loadData(); }}
                              className="text-[10px] font-bold text-error hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-on-surface-variant">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => setView('settings')}
          className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-container sm:border-l sm:border-outline-variant/20 sm:pl-5"
        >
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-semibold leading-none text-on-surface">{user?.name || 'Mentee'}</span>
            <span className="mt-1 block text-[11px] text-on-surface-variant">Mentee Account</span>
          </span>
          <img
            alt="User profile"
            className="h-10 w-10 rounded-full border-2 border-surface-container-highest object-cover"
            src={user?.avatar || user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Mentee')}&background=4a5a2a&color=fff`}
          />
        </button>
      </div>
    </header>
  );

  const renderMentorCard = (mentor) => {
    const ml = getMentorLevel(mentor);
    const mlStyle = getMentorLevelStyle(ml.level);
    return (
      <article className={`${cardClass} min-w-[280px] snap-start p-6 transition-shadow hover:shadow-md`}>
        <div className="flex flex-col items-center space-y-4 text-center">
          <img
            alt={mentor.name}
            className="h-20 w-20 rounded-full border-4 border-background object-cover"
            src={mentor.avatar || `https://ui-avatars.com/api/?name=${mentor.name}`}
          />
          <div>
            <h4 className="font-headline-md text-xl font-bold text-on-background">{mentor.name}</h4>
            <p className="text-sm font-semibold text-on-surface-variant">{mentor.title || mentor.industry}</p>
            <div className={`mt-1.5 mentor-level-badge mentor-level-${ml.level} ${mlStyle.wrapper}`}>
              {mlStyle.icon && <span className="material-symbols-outlined text-[10px]">{mlStyle.icon}</span>}
              {ml.label}
            </div>
          </div>
          {renderStars(mentor.rating || 5)}
          <div className="flex w-full items-center justify-between border-t border-outline-variant/20 pt-4">
            <span className="font-headline-md text-lg font-bold text-on-background">{mentor.hourlyRate ? `$${mentor.hourlyRate}/hr` : '—'}</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleViewMentor(mentor.id)}
                className={`${buttonClass} bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest`}
              >
                Profile
              </button>
              <button
                onClick={() => handleBookMentor(mentor.id)}
                className={`${buttonClass} bg-primary text-on-primary hover:opacity-90`}
              >
                Book
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const renderSessionRow = (session, compact = false) => {
    const isConfirmed = ['confirmed', 'scheduled'].includes(session.statusLabel);
    const isPending = session.statusLabel === 'pending';
    const isCompleted = session.statusLabel === 'completed';
    const isCancelled = session.statusLabel.includes('cancel') || session.statusLabel.includes('reject');
    const isRescheduled = session.statusLabel === 'rescheduled';

    return (
      <div className={`grid gap-4 border-b border-outline-variant/10 px-4 py-5 last:border-0 md:grid-cols-[1.3fr_1fr_auto_auto] md:items-center ${compact ? 'rounded-xl border bg-background' : ''}`}>
        <div className="flex items-center gap-3">
          <img
            alt={session.mentor?.name || 'Mentor'}
            className="h-10 w-10 rounded-full object-cover"
            src={session.mentor?.avatar || `https://ui-avatars.com/api/?name=${session.mentor?.name || 'Mentor'}`}
          />
          <div>
            <p className="font-semibold text-on-surface">{session.mentor?.name || 'Mentor'}</p>
            <p className="text-xs text-on-surface-variant">{session.type || session.mentor?.title || 'Mentorship'}</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-on-surface">{session.dateTime || 'Date pending'}</p>
          <p className="text-xs text-on-surface-variant">{session.time || 'Time pending'}</p>
        </div>
        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(session.status)}`}>
          {session.status || 'Scheduled'}
        </span>
        <div className="flex flex-wrap justify-start gap-2 md:justify-end">
          {isConfirmed && (
            <>
              <button onClick={() => handleJoinSession(session)} className={`${buttonClass} bg-primary text-on-primary hover:opacity-90`}>
                Join
              </button>
              <button onClick={() => openNotesModal(session)} className={`${buttonClass} bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest`}>
                Notes
              </button>
              <button onClick={() => handleCancelSession(session)} className={`${buttonClass} text-error hover:bg-error/10`}>
                Cancel
              </button>
            </>
          )}
          {isPending && (
            <>
              <button onClick={() => handleBookMentor(session.mentorId)} className={`${buttonClass} bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest`}>
                Reschedule
              </button>
              <button onClick={() => handleCancelSession(session)} className={`${buttonClass} text-error hover:bg-error/10`}>
                Cancel
              </button>
            </>
          )}
          {isCompleted && (
            <button onClick={() => openRatingModal(session)} className={`${buttonClass} bg-secondary text-on-secondary hover:opacity-90`}>
              {session.isRated ? 'View Rating' : 'Rate'}
            </button>
          )}
          {isRescheduled && (
            <>
              <button onClick={() => handleAcceptNewTiming(session)} className={`${buttonClass} bg-secondary text-on-secondary hover:opacity-90`}>
                Accept
              </button>
              <button onClick={() => handleProposeNewTimeMentee(session)} className={`${buttonClass} bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest`}>
                Propose New Time
              </button>
            </>
          )}
          {isCancelled && (
            <button onClick={() => handleBookMentor(session.mentorId)} className={`${buttonClass} bg-primary text-on-primary hover:opacity-90`}>
              Book Again
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <section className="brand-olive-surface relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-3xl p-6 text-center shadow-sm md:flex-row md:p-10 md:text-left">
        <div className="relative z-10 space-y-4">
          <div className="brand-chip inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold">
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            Skill Profile: {user?.skills?.[0] || 'Career Growth'}
          </div>
          <h2 className="font-headline-lg text-4xl font-bold text-on-primary sm:text-5xl">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="brand-muted-text max-w-xl">
            You have {sessionGroups.upcoming.length} upcoming sessions. Keep your momentum with focused calls, notes, and clear next steps.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={() => setView('sessions')} className={`${buttonClass} brand-olive-primary-action hover:opacity-90`}>
              View Sessions
            </button>
            <button onClick={() => handleBookMentor()} className={`${buttonClass} brand-olive-secondary-action hover:opacity-90`}>
              Book Mentor
            </button>
          </div>
        </div>
        {/* Profile image with rings */}
        <div className="relative z-10 hidden lg:flex h-48 w-48 items-center justify-center">
          {/* Concentric decorative rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary-container/40 to-primary-container/20 animate-pulse-soft" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-secondary-container/60 to-primary-container/30 backdrop-blur-sm" />
          <div className="absolute inset-8 rounded-full bg-surface/10 backdrop-blur-sm border border-outline-variant/10" />
          {/* Profile photo */}
          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-[3px] ring-on-surface/15 shadow-xl bg-surface/10">
              <img
                src={user?.avatar || user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4a5a2a&color=fff&size=200`}
                alt={`${user?.name || 'User'}'s profile photo`}
                className="w-full h-full object-cover opacity-0 transition-opacity duration-500"
                onLoad={(e) => e.target.classList.remove('opacity-0')}
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4a5a2a&color=fff&size=200`; e.target.onError = null; }}
                loading="lazy"
              />
            </div>
          </div>
          {/* Floating accent icons */}
          <span className="absolute -top-2 -right-2 material-symbols-outlined text-lg text-secondary-container/70 animate-float" style={{ animationDelay: '0.5s' }}>trending_up</span>
          <span className="absolute -bottom-1 -left-1 material-symbols-outlined text-lg text-primary-container/70 animate-float" style={{ animationDelay: '1s' }}>school</span>
          <span className="absolute top-1/2 -right-6 material-symbols-outlined text-sm text-tertiary-container/60 animate-float" style={{ animationDelay: '1.5s' }}>star</span>
        </div>
      </section>

      {(matchLoading || matchedMentors.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-headline-md text-2xl font-bold text-on-background">Matched For You</h3>
            <span className="material-symbols-outlined text-secondary text-lg">auto_awesome</span>
          </div>
          {matchLoading ? (
            <p className="text-sm text-on-surface-variant">Finding your best mentor matches…</p>
          ) : (
            <div className="-mx-2 flex snap-x gap-6 overflow-x-auto px-2 pb-4">
              {matchedMentors.map((mentor) => (
                <React.Fragment key={mentor.id}>{renderMentorCard(mentor)}</React.Fragment>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-headline-md text-2xl font-bold text-on-background">Recommended Mentors</h3>
          <button onClick={() => handleBookMentor()} className="text-sm font-semibold text-secondary hover:underline">
            View All
          </button>
        </div>
        <div className="-mx-2 flex snap-x gap-6 overflow-x-auto px-2 pb-4">
          {recommendedMentors.map((mentor) => (
            <React.Fragment key={mentor.id}>{renderMentorCard(mentor)}</React.Fragment>
          ))}
        </div>
      </section>

      {/* Learning Goals — driven by the mentee's backend profile (Task 7 interview) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-headline-md text-2xl font-bold text-on-background">Your Learning Goals</h3>
          <button onClick={() => navigateTo('interview')} className="text-sm font-semibold text-secondary hover:underline">
            Update
          </button>
        </div>
        <div className={`${cardClass} p-5`}>
          {(user?.careerGoals || user?.learningInterests?.length || user?.skillsToLearn?.length) ? (
            <div className="space-y-5">
              {user?.careerGoals && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1.5">Career Goal</p>
                  <p className="text-sm text-on-surface leading-relaxed">{user.careerGoals}</p>
                </div>
              )}
              {user?.learningInterests?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-2">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {user.learningInterests.map((item) => (
                      <span key={item} className="inline-flex items-center gap-1 bg-secondary/10 text-secondary text-xs font-medium px-2.5 py-1 rounded-full">
                        <span className="material-symbols-outlined text-[14px]">interests</span>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {user?.skillsToLearn?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-2">Skills to Learn</p>
                  <div className="flex flex-wrap gap-2">
                    {user.skillsToLearn.map((item) => (
                      <span key={item} className="bg-surface-container-high text-on-surface-variant text-xs font-medium px-2.5 py-1 rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon="target"
              title="No learning goals yet"
              description="Complete your onboarding interview so we can tailor your mentor matches."
              actionLabel="Start interview"
              onAction={() => navigateTo('interview')}
            />
          )}
        </div>
      </section>

      {/* Profile — schema-backed fields only (MenteeProfileFlat), relevant to
          mentor-mentee matching rather than exhaustive. Skills/interests are
          already shown above under Learning Goals, so this covers the rest.
          Each field only renders when set, so an incomplete profile doesn't
          show empty rows. */}
      {(user?.university || user?.degree || user?.bio || user?.domainInterest ||
        user?.targetIndustry || user?.targetCompanyTier || user?.experienceLevel || user?.linkedinUrl) && (
        <section className="space-y-4">
          <h3 className="font-headline-md text-2xl font-bold text-on-background">Your Profile</h3>
          <div className={`${cardClass} p-5`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {user?.university && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">University</p>
                  <p className="text-on-surface font-medium">{user.university}</p>
                </div>
              )}
              {user?.degree && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">Degree</p>
                  <p className="text-on-surface font-medium">{user.degree}</p>
                </div>
              )}
              {user?.domainInterest && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">Domain Interest</p>
                  <p className="text-on-surface font-medium">{user.domainInterest}</p>
                </div>
              )}
              {user?.experienceLevel && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">Experience Level</p>
                  <p className="text-on-surface font-medium capitalize">{user.experienceLevel}</p>
                </div>
              )}
              {user?.targetIndustry && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">Target Industry</p>
                  <p className="text-on-surface font-medium">{user.targetIndustry}</p>
                </div>
              )}
              {user?.targetCompanyTier && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">Target Company Tier</p>
                  <p className="text-on-surface font-medium">{user.targetCompanyTier}</p>
                </div>
              )}
              {user?.linkedinUrl && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70 mb-1">LinkedIn</p>
                  <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline truncate block">
                    {user.linkedinUrl}
                  </a>
                </div>
              )}
            </div>
            {user?.bio && <p className="mt-4 text-sm text-on-surface leading-relaxed">{user.bio}</p>}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="space-y-4 xl:col-span-2">
          <h3 className="font-headline-md text-2xl font-bold text-on-background">Upcoming Sessions</h3>
          <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low">
            {sessionGroups.upcoming.length > 0 ? (
              sessionGroups.upcoming.slice(0, 3).map((session) => <React.Fragment key={session.id}>{renderSessionRow(session)}</React.Fragment>)
            ) : (
              <EmptyState title="No upcoming sessions" actionLabel="Browse Mentors" onAction={() => handleBookMentor()} />
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-headline-md text-2xl font-bold text-on-background">Past Sessions</h3>
          <div className={`${cardClass} space-y-3 p-4`}>
            {sessionGroups.past.length > 0 ? (
              sessionGroups.past.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-xl border border-outline-variant/5 bg-background p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-variant">
                      <span className="material-symbols-outlined text-[20px]">history</span>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{session.mentor?.name || 'Mentor'}</p>
                      <p className="text-xs text-on-surface-variant">{session.type}</p>
                    </div>
                  </div>
                  {session.isRated ? (
                    <span className="flex items-center gap-1 text-sm font-semibold text-on-tertiary-container">
                      <span className="material-symbols-outlined fill-icon text-sm">star</span>
                      {session.rating || 5}.0
                    </span>
                  ) : (
                    <button onClick={() => openRatingModal(session)} className="text-sm font-semibold text-secondary hover:underline">
                      Rate
                    </button>
                  )}
                </div>
              ))
            ) : (
              <EmptyState title="No completed sessions yet" actionLabel="Book Session" onAction={() => handleBookMentor()} />
            )}
            <button onClick={() => setView('sessions')} className="w-full rounded-lg border border-outline-variant/10 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-highest">
              View History
            </button>
          </div>
        </section>
      </div>
    </div>
  );

  const renderSessions = () => {
    const tabs = [
      { id: 'upcoming', label: 'Upcoming', count: sessionGroups.upcoming.length },
      { id: 'past', label: 'Past', count: sessionGroups.past.length },
      { id: 'cancelled', label: 'Cancelled', count: sessionGroups.cancelled.length },
    ];
    const visibleSessions = sessionGroups[sessionTab] || [];
    const activeMentors = new Set(sessionGroups.past.map(s => s.mentorId).concat(sessionGroups.upcoming.map(s => s.mentorId))).size;
    const avgRating = sessionGroups.past.filter(s => s.isRated && s.rating).length > 0
      ? (sessionGroups.past.filter(s => s.isRated && s.rating).reduce((sum, s) => sum + s.rating, 0) / sessionGroups.past.filter(s => s.isRated && s.rating).length).toFixed(1)
      : '—';

    const renderKpiCard = (icon, value, label, color) => (
      <div className={`rounded-2xl border border-outline-variant/10 bg-surface p-5 transition-all hover:shadow-md hover:-translate-y-0.5`}>
        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <p className="font-headline-xl text-3xl font-bold text-on-surface">{value}</p>
        <p className="mt-1 text-xs font-semibold text-on-surface-variant">{label}</p>
      </div>
    );

    const renderUpcomingCard = (session, isHero = false) => {
      const sessionDate = parseSessionDate(session);
      const isLive = sessionDate && (sessionDate.getTime() - Date.now()) < 15 * 60 * 1000 && (sessionDate.getTime() - Date.now()) > -60 * 60 * 1000;
      return (
        <div className={`rounded-2xl border border-outline-variant/10 bg-surface p-5 transition-all hover:shadow-md ${isHero ? 'ring-2 ring-primary/20' : ''}`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="relative">
                <img
                  alt={session.mentor?.name}
                  className="h-12 w-12 rounded-xl object-cover"
                  src={session.mentor?.avatar || `https://ui-avatars.com/api/?name=${session.mentor?.name}`}
                />
                {isLive && <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-secondary ring-2 ring-surface animate-pulse" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-on-surface">{session.mentor?.name}</p>
                  <p className="text-xs text-on-surface-variant">{session.mentor?.title || 'Mentor'}</p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusClass(session.status)}`}>
                  {isLive ? 'LIVE NOW' : session.status || 'Scheduled'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                  {sessionDate ? sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  {session.time || 'TBD'}
                </span>
                {session.type && (
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">laptop</span>
                    {session.type}
                  </span>
                )}
              </div>
              {session.topic && (
                <p className="mt-2 truncate text-xs text-on-surface-variant/70">"{session.topic}"</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {session.status === 'Pending' ? (
              <button
                onClick={() => navigateTo('booking', { mentorId: session.mentorId, sessionId: session.id })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-on-secondary shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[14px]">payments</span>
                Complete Payment
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleJoinSession(session)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[14px]">videocam</span>
                  Join Session
                </button>
                <button
                  onClick={() => openNotesModal(session)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/20 bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-highest"
                >
                  Prepare Notes
                </button>
              </>
            )}
            <button
              onClick={() => handleCancelSession(session)}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-error transition-colors hover:bg-error/10"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    };

    const renderPastCard = (session) => {
      const sessionDate = parseSessionDate(session);
      return (
        <div className="rounded-2xl border border-outline-variant/10 bg-surface p-4 transition-all hover:shadow-md">
          <div className="flex items-start gap-3">
            <img
              alt={session.mentor?.name}
              className="h-10 w-10 rounded-xl object-cover"
              src={session.mentor?.avatar || `https://ui-avatars.com/api/?name=${session.mentor?.name}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-on-surface">{session.mentor?.name}</p>
                {session.isRated && session.rating && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-warning">
                    <span className="material-symbols-outlined text-[12px]">star</span>
                    {session.rating}
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant">{session.type || 'Mentorship Session'}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-on-surface-variant">
                <span>{sessionDate ? sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                <span>{session.time || ''}</span>
              </div>
              {session.notes && (
                <p className="mt-2 line-clamp-2 rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant italic">"{session.notes}"</p>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => openNotesModal(session)}
              className="inline-flex items-center gap-1 rounded-lg bg-surface-container-high px-3 py-1.5 text-[11px] font-bold text-on-surface transition-colors hover:bg-surface-container-highest"
            >
              <span className="material-symbols-outlined text-[12px]">edit_note</span>
              View Notes
            </button>
            {!session.isRated && (
              <button
                onClick={() => openRatingModal(session)}
                className="inline-flex items-center gap-1 rounded-lg bg-secondary-container px-3 py-1.5 text-[11px] font-bold text-on-secondary-container transition-colors hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[12px]">star</span>
                Rate
              </button>
            )}
          </div>
        </div>
      );
    };

    const renderCancelledCard = (session) => {
      const sessionDate = parseSessionDate(session);
      return (
        <div className="rounded-2xl border border-outline-variant/10 bg-surface p-4 opacity-70 transition-all hover:opacity-100">
          <div className="flex items-center gap-3">
            <img
              alt={session.mentor?.name}
              className="h-9 w-9 rounded-xl object-cover grayscale"
              src={session.mentor?.avatar || `https://ui-avatars.com/api/?name=${session.mentor?.name}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface">{session.mentor?.name}</p>
              <p className="text-xs text-on-surface-variant">{sessionDate ? sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} · {session.time || ''}</p>
            </div>
            <button
              onClick={() => handleBookMentor(session.mentorId)}
              className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-on-primary transition-all hover:scale-[1.02]"
            >
              Rebook
            </button>
          </div>
        </div>
      );
    };

    const renderSessionList = () => {
      if (sessionTab === 'upcoming') {
        if (visibleSessions.length === 0) {
          return <EmptyState icon="event_available" title="No upcoming sessions" description="Book a mentor to start your journey." actionLabel="Book New Session" onAction={() => handleBookMentor()} />;
        }
        return (
          <div className="space-y-3">
            {visibleSessions.map((session) => renderUpcomingCard(session))}
          </div>
        );
      }
      if (sessionTab === 'past') {
        if (visibleSessions.length === 0) {
          return <EmptyState icon="history" title="No past sessions yet" description="Complete your first session to see it here." />;
        }
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleSessions.map((session) => renderPastCard(session))}
          </div>
        );
      }
      if (visibleSessions.length === 0) {
        return <EmptyState icon="cancel" title="No cancelled sessions" description="All your sessions are on track." />;
      }
      return (
        <div className="space-y-2">
          {visibleSessions.map((session) => renderCancelledCard(session))}
        </div>
      );
    };

    const quickActions = [
      { icon: 'calendar_month', label: 'Book Session', action: () => handleBookMentor(), color: 'bg-primary-container text-on-primary-container' },
      { icon: 'people', label: 'Browse Mentors', action: () => handleBookMentor(), color: 'bg-secondary-container text-on-secondary-container' },
    ];

    return (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-on-background">My Sessions</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Manage your mentorship sessions, prepare for meetings, and review your learning journey.</p>
          </div>
          <div className="flex overflow-x-auto rounded-xl bg-surface-container-high p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSessionTab(tab.id)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  sessionTab === tab.id ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 min-w-0 space-y-6">
            {sessionTab === 'upcoming' && sessionGroups.upcoming.length > 0 && (
              <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-on-primary shadow-lg">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary-fixed-dim">Next Session</p>
                    <div className="flex items-end gap-3">
                      {[
                        ['Days', countdown.days],
                        ['Hrs', countdown.hours],
                        ['Min', countdown.minutes],
                      ].map(([label, value], index) => (
                        <React.Fragment key={label}>
                          {index > 0 && <span className="mb-4 text-2xl text-primary-fixed-dim/50">:</span>}
                          <div className="text-center">
                            <span className="block font-headline-xl text-4xl font-bold tabular-nums">{value}</span>
                            <span className="text-[10px] font-bold text-primary-fixed-dim">{label}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleJoinSession(featuredSession)}
                        disabled={!featuredSession}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary-fixed px-5 py-2.5 text-xs font-bold text-on-primary-fixed shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">videocam</span>
                        Join Session
                      </button>
                      <button
                        onClick={() => openNotesModal(featuredSession)}
                        disabled={!featuredSession}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-on-primary/20 px-5 py-2.5 text-xs font-bold text-on-primary transition-all hover:bg-on-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Prepare Notes
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <img
                      alt={featuredSession?.mentor?.name || 'Mentor'}
                      className="h-20 w-20 rounded-2xl border-2 border-primary-fixed object-cover"
                      src={featuredSession?.mentor?.avatar || 'https://ui-avatars.com/api/?name=Mentor'}
                    />
                    <p className="mt-3 text-sm font-bold text-primary-fixed">{featuredSession?.mentor?.name || 'No session yet'}</p>
                    <p className="text-[11px] text-primary-fixed-dim">{featuredSession?.mentor?.title || 'Book a mentor to begin'}</p>
                    {featuredSession?.type && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-fixed/20 px-2.5 py-0.5 text-[10px] font-bold text-primary-fixed">
                        <span className="material-symbols-outlined text-[10px]">laptop</span>
                        {featuredSession.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {sessionTab === 'upcoming' && sessionGroups.upcoming.length === 0 && (
              <EmptyState
                icon="event_available"
                title="No upcoming sessions scheduled"
                description="Start your mentorship journey today. Find a mentor and book your first session."
                actionLabel="Find Mentors"
                onAction={() => handleBookMentor()}
              />
            )}

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-on-surface">
                  {sessionTab === 'upcoming' ? 'Upcoming Appointments' : sessionTab === 'past' ? 'Session History' : 'Cancelled Sessions'}
                </h3>
                <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider">
                  {visibleSessions.length} session{visibleSessions.length !== 1 ? 's' : ''}
                </span>
              </div>
              {renderSessionList()}
            </div>
          </div>

          <div className="w-full space-y-4 lg:w-[300px] flex-shrink-0">
            <div className="grid grid-cols-2 gap-3">
              {renderKpiCard('check_circle', completedSessions, 'Sessions Done', 'bg-primary-container text-on-primary-container')}
              {renderKpiCard('schedule', mentorshipHours.toFixed(1), 'Mentorship Hours', 'bg-secondary-container text-on-secondary-container')}
              {renderKpiCard('people', activeMentors, 'Active Mentors', 'bg-tertiary-container text-on-tertiary-container')}
              {renderKpiCard('star', avgRating, 'Avg Rating', 'bg-tertiary/15 text-tertiary')}
            </div>

            <div className="rounded-2xl border border-outline-variant/10 bg-surface p-4">
              <h4 className="mb-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className="flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all hover:shadow-sm hover:-translate-y-0.5"
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}>
                      <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
                    </span>
                    <span className="text-[11px] font-bold text-on-surface">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/10 bg-surface p-4">
              <h4 className="mb-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">This Month</h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Sessions Completed</span>
                  <span className="font-bold text-on-surface">{sessionGroups.past.filter(s => { const d = parseSessionDate(s); return d && d.getMonth() === new Date().getMonth(); }).length}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (sessionGroups.past.filter(s => { const d = parseSessionDate(s); return d && d.getMonth() === new Date().getMonth(); }).length / 8) * 100)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Upcoming</span>
                  <span className="font-bold text-on-surface">{sessionGroups.upcoming.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Hours Invested</span>
                  <span className="font-bold text-on-surface">{mentorshipHours.toFixed(1)}h</span>
                </div>
              </div>
            </div>

            {sessionGroups.past.length > 0 && sessionGroups.past.some(s => s.isRated && s.rating) && (
              <div className="rounded-2xl border border-outline-variant/10 bg-surface p-4">
                <h4 className="mb-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Recent Feedback</h4>
                {sessionGroups.past.filter(s => s.isRated && s.rating).slice(0, 2).map((session) => (
                  <div key={session.id} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2">
                      <img
                        alt={session.mentor?.name}
                        className="h-7 w-7 rounded-lg object-cover"
                        src={session.mentor?.avatar || `https://ui-avatars.com/api/?name=${session.mentor?.name}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{session.mentor?.name}</p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`material-symbols-outlined text-[10px] ${i < session.rating ? 'text-warning' : 'text-on-surface/15'}`}>star</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {session.feedback && (
                      <p className="mt-1.5 line-clamp-2 rounded-lg bg-surface-container-low px-2.5 py-1.5 text-[11px] text-on-surface-variant italic">"{session.feedback}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderAnalytics = () => (
    <section className="space-y-6">
      <div>
        <h2 className="font-headline-lg text-4xl font-bold text-on-background">Analytics</h2>
        <p className="mt-2 text-on-surface-variant">Past session activity by year, month, or custom date range.</p>
      </div>

      <div className={`${cardClass} space-y-6 p-6`}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-on-background">Past Sessions Graph</h3>
            <p className="text-sm text-on-surface-variant">Only completed sessions are counted.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['year', 'month', 'custom'].map((mode) => (
              <button
                key={mode}
                onClick={() => setAnalyticsMode(mode)}
                className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${analyticsMode === mode ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(analyticsMode === 'year' || analyticsMode === 'month') && (
            <input
              type="text"
              inputMode="numeric"
              min="2001"
              value={analyticsYear}
              onChange={(event) => setAnalyticsYear(event.target.value)}
              className="rounded-lg border border-outline-variant/30 bg-surface p-3"
              autoComplete="off"
              placeholder="Year above 2000"
            />
          )}
          {analyticsMode === 'month' && (
            <select
              value={analyticsMonth}
              onChange={(event) => setAnalyticsMonth(event.target.value)}
              className="rounded-lg border border-outline-variant/30 bg-surface p-3"
            >
              {monthLabels.map((label, index) => <option key={label} value={String(index + 1).padStart(2, '0')}>{label}</option>)}
            </select>
          )}
          {analyticsMode === 'custom' && (
            <>
              <input
                type="date"
                value={analyticsRange.from}
                onChange={(event) => setAnalyticsRange({ ...analyticsRange, from: event.target.value })}
                className="rounded-lg border border-outline-variant/30 bg-surface p-3"
              />
              <input
                type="date"
                value={analyticsRange.to}
                onChange={(event) => setAnalyticsRange({ ...analyticsRange, to: event.target.value })}
                className="rounded-lg border border-outline-variant/30 bg-surface p-3"
              />
            </>
          )}
        </div>

        {analyticsDateRange.error ? (
          <div className="rounded-lg bg-error-container p-4 text-sm font-bold text-on-error-container">{analyticsDateRange.error}</div>
        ) : (
          renderLineChart(analyticsData)
        )}
      </div>
    </section>
  );

  const renderSettings = () => (
    <ProfileSettings
      compact
      onSaved={loadData}
      user={user}
      onAccountClosed={() => { dbLogout(); tokenManager.clearTokens(); navigateTo('home'); }}
      onThemeChange={applyTheme}
    />
  );

  const renderPayments = () => {
    const paidBookings = bookings.filter((b) => b.paymentStatus === 'paid' || String(b.status).toLowerCase() === 'completed');
    const pendingBookings = bookings.filter((b) => String(b.status).toLowerCase() === 'pending');
    const totalSpent = paidBookings.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const sessionsPurchased = paidBookings.length;

    const monthlySpending = (() => {
      const rev = new Array(12).fill(0);
      paidBookings.forEach((b) => {
        const m = new Date(b.createdAt).getMonth();
        rev[m] += Number(b.amount || 0);
      });
      return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((name, i) => ({
        name, value: Math.round(rev[i]),
      }));
    })();
    const maxSpending = Math.max(...monthlySpending.map((d) => d.value), 1);

    const transactions = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (bookings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined mb-4 text-6xl text-on-surface/15">receipt_long</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">No payment history yet</h3>
          <p className="text-sm text-on-surface-variant max-w-sm mb-6">Book your first mentorship session to start building your payment history.</p>
          <button onClick={() => handleBookMentor()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
            <span className="material-symbols-outlined text-[18px]">search</span>
            Browse Mentors
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 transition-all hover:shadow-lg hover:scale-[1.01]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-3">
              <span className="material-symbols-outlined text-[22px] text-primary">account_balance_wallet</span>
            </span>
            <p className="text-2xl font-bold text-on-surface">${totalSpent.toLocaleString()}</p>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">Total Spent</p>
            <p className="mt-0.5 text-[11px] text-on-surface-variant/70">Across all sessions</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 transition-all hover:shadow-lg hover:scale-[1.01]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 mb-3">
              <span className="material-symbols-outlined text-[22px] text-secondary">school</span>
            </span>
            <p className="text-2xl font-bold text-on-surface">{sessionsPurchased}</p>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">Sessions Purchased</p>
            <p className="mt-0.5 text-[11px] text-on-surface-variant/70">All time</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 transition-all hover:shadow-lg hover:scale-[1.01]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-tertiary/10 mb-3">
              <span className="material-symbols-outlined text-[22px] text-tertiary">pending</span>
            </span>
            <p className="text-2xl font-bold text-on-surface">{pendingBookings.length}</p>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">Pending Payments</p>
            <p className="mt-0.5 text-[11px] text-on-surface-variant/70">Awaiting confirmation</p>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
          <div className="border-b border-outline-variant/10 px-6 py-4">
            <h3 className="text-base font-bold text-on-surface">Spending Overview</h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">Monthly spending on mentorship</p>
          </div>
          <div className="p-6">
            <div className="flex items-end gap-2" style={{ height: 140 }}>
              {monthlySpending.map((d, i) => {
                const pct = Math.max((d.value / maxSpending) * 100, d.value > 0 ? 4 : 0);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                    <span className="text-[10px] font-bold text-on-surface-variant opacity-0 group-hover/bar:opacity-100 transition-opacity">
                      ${d.value}
                    </span>
                    <div className="w-full rounded-t-lg bg-primary/80 transition-all duration-500 group-hover/bar:bg-primary"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              {monthlySpending.map((d, i) => (
                <div key={i} className="flex-1 text-center text-[10px] font-semibold text-on-surface-variant truncate">{d.name}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
          <div className="border-b border-outline-variant/10 px-6 py-4">
            <h3 className="text-base font-bold text-on-surface">Payment History</h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">All your transactions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Mentor</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Amount</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {transactions.map((booking) => {
                  const status = String(booking.status).toLowerCase();
                  const isPaid = booking.paymentStatus === 'paid' || status === 'completed';
                  const isPending = status === 'pending';
                  const mentor = mentors.find((m) => m.id === booking.mentorId);
                  return (
                    <tr key={booking.id} className="transition-colors hover:bg-surface-container-low/50">
                      <td className="px-6 py-4 text-sm font-semibold text-on-surface">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface">{mentor?.name || 'Mentor'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">${Number(booking.amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          isPaid ? 'bg-secondary-container text-on-secondary-container'
                            : isPending ? 'bg-tertiary-container text-on-tertiary-container'
                            : 'bg-error-container text-on-error-container'
                        }`}>
                          {isPaid ? 'Paid' : isPending ? 'Pending' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-[11px] font-bold text-on-surface transition-colors hover:bg-surface-container-high">
                          <span className="material-symbols-outlined text-[14px]">download</span>
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {pendingBookings.length > 0 && (
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
            <div className="border-b border-outline-variant/10 px-6 py-4">
              <h3 className="text-base font-bold text-on-surface">Upcoming Payments</h3>
              <p className="mt-0.5 text-xs text-on-surface-variant">Sessions awaiting payment confirmation</p>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {pendingBookings.map((booking) => {
                const mentor = mentors.find((m) => m.id === booking.mentorId);
                return (
                  <div key={booking.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-container-low/50">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10">
                        <span className="material-symbols-outlined text-[20px] text-tertiary">schedule</span>
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">Session with {mentor?.name || 'Mentor'}</p>
                        <p className="text-xs text-on-surface-variant">{booking.date || 'Date TBD'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-on-surface">${Number(booking.amount || 0).toFixed(2)}</p>
                      <p className="text-[11px] text-tertiary font-semibold">Pending</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSkeletonDashboard = () => (
    <div className="space-y-8">
      <SkeletonBlock className="h-48 w-full rounded-3xl" />
      <div className="space-y-4">
        <SkeletonBlock className="h-6 w-64" />
        <div className="flex gap-6 overflow-x-auto">
          {[1, 2, 3, 4].map(i => <SkeletonBlock key={i} className="h-80 w-[280px] shrink-0 rounded-2xl" />)}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SkeletonBlock className="h-6 w-48" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => <SkeletonBlock key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="h-6 w-32" />
          <SkeletonBlock className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) return renderSkeletonDashboard();
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface/20 mb-4">person_off</span>
          <h2 className="text-2xl font-bold text-on-surface mb-2">Not Logged In</h2>
          <p className="text-on-surface-variant mb-6 max-w-md">Please sign in to access your mentee dashboard.</p>
          <button onClick={() => navigateTo('home')} className={`${buttonClass} bg-primary text-on-primary hover:opacity-90`}>
            Go to Home
          </button>
        </div>
      );
    }
    if (activeView === 'sessions') return renderSessions();
    if (activeView === 'analytics') return renderAnalytics();
    if (activeView === 'payments') return renderPayments();
    if (activeView === 'settings') return renderSettings();
    return renderDashboard();
  };

  return (
    <div className="min-h-screen bg-surface font-body-md">
      {renderSidebar()}

      <main className="min-h-screen lg:pl-64 bg-surface">
        {renderHeader()}
        <div className="mx-auto w-full max-w-[1440px] space-y-8 p-4 pb-28 sm:p-6 lg:p-8">
          {renderContent()}
        </div>


      </main>

      <nav className="brand-olive-surface fixed inset-x-0 bottom-0 z-40 border-t border-on-primary/10 px-2 py-2 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
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

      {ratingSession && (
        <Modal onClose={() => !ratingSaving && setRatingSession(null)}>
          <form onSubmit={handleRatingSubmit} className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Session rating</p>
                <h3 className="mt-2 font-headline-md text-2xl font-bold text-on-surface">
                  {ratingSession.isRated ? 'Your submitted rating' : 'Rate your mentor'}
                </h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {ratingSession.mentor?.name || 'Mentor'} - {ratingSession.type || 'Completed session'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !ratingSaving && setRatingSession(null)}
                className="material-symbols-outlined rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              >
                close
              </button>
            </div>

            <div className="text-center">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={ratingSession.isRated}
                    onClick={() => setRatingScore(star)}
                    className="transition-transform hover:scale-105 disabled:cursor-default disabled:hover:scale-100"
                  >
                    <span className={`material-symbols-outlined text-5xl ${star <= ratingScore ? 'fill-icon text-secondary' : 'text-on-surface-variant/30'}`}>
                      star
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-on-surface-variant">
                {ratingSession.isRated ? 'This rating is locked and cannot be changed.' : 'Pick a score for the completed session.'}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Review</label>
              <textarea
                value={ratingText}
                onChange={(event) => setRatingText(event.target.value)}
                disabled={ratingSession.isRated}
                rows={5}
                className="w-full resize-none rounded-2xl border border-outline-variant/20 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none disabled:opacity-70"
                placeholder="Share what was useful or worth improving..."
              />
            </div>

            {ratingSession.isRated ? (
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-on-surface-variant">
                Submitted ratings are final so mentor feedback stays trustworthy.
              </div>
            ) : (
              <button
                type="submit"
                disabled={ratingSaving}
                className={`${buttonClass} w-full bg-primary py-3 text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {ratingSaving ? 'Submitting...' : 'Submit Rating'}
              </button>
            )}
          </form>
        </Modal>
      )}

      {notesSession && (
        <Modal onClose={() => setNotesSession(null)}>
          <form onSubmit={saveNotes} className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Session notes</p>
                <h3 className="mt-2 font-headline-md text-2xl font-bold text-on-surface">{notesSession.mentor?.name || 'Mentor'}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{notesSession.dateTime} - {notesSession.time}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotesSession(null)}
                className="material-symbols-outlined rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              >
                close
              </button>
            </div>
            <textarea
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              rows={7}
              className="w-full resize-none rounded-2xl border border-outline-variant/20 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary/30"
              placeholder="Add agenda items, questions, and follow-up notes..."
            />
            <button type="submit" disabled={savingNotes} className={`${buttonClass} w-full bg-primary py-3 text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60`}>
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          </form>
        </Modal>
      )}

    </div>
  );
}
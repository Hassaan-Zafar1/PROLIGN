import React, { useEffect, useMemo, useState } from 'react';
import ProfileSettings from '../components/ProfileSettings';
import {
  addReview,
  cancelSession,
  getBookingsForUser,
  getCurrentUser,
  getSessions,
  getUserById,
  getUsersByRole,
  logout,
  saveSessions,
  updateBookingStatus,
} from '../utils/db';

const normalizeView = (view) => {
  if (view === 'mentors') return 'discovery';
  if (view === 'goals') return 'analytics';
  return view || 'dashboard';
};

const navItems = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { id: 'discovery', icon: 'search', label: 'Discovery' },
  { id: 'sessions', icon: 'event_available', label: 'Sessions' },
  { id: 'analytics', icon: 'bar_chart', label: 'Analytics' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
];

const goals = [
  { title: 'Data Science Career', detail: 'Build a confident portfolio and interview rhythm.', progress: 85, icon: 'psychology' },
  { title: 'System Design', detail: 'Practice architecture tradeoffs with mentors weekly.', progress: 64, icon: 'schema' },
  { title: 'Communication', detail: 'Turn project work into crisp stories and examples.', progress: 72, icon: 'record_voice_over' },
];

const cardClass = 'rounded-2xl border border-outline-variant/10 bg-surface-container shadow-sm';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98]';

export default function MenteeDashboard({ navigateTo, initialView = 'dashboard' }) {
  const [user, setUser] = useState(getCurrentUser());
  const [activeView, setActiveView] = useState(normalizeView(initialView));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sessionTab, setSessionTab] = useState('upcoming');
  const [ratingSession, setRatingSession] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingText, setRatingText] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);
  const [notesSession, setNotesSession] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');

  const loadData = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setMentors(getUsersByRole('mentor').filter((mentor) => mentor.status === 'approved'));

    if (!currentUser) return;

    setSessions(
      getSessions()
        .filter((session) => session.menteeId === currentUser.id)
        .map((session) => ({ ...session, mentor: getUserById(session.mentorId) }))
    );

    setBookings(
      getBookingsForUser(currentUser.id).map((booking) => ({
        ...booking,
        mentor: getUserById(booking.mentorId),
      }))
    );
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
        .filter((session) => ['cancelled', 'canceled'].includes(session.statusLabel))
        .sort((left, right) => bySoonest(right, left)),
    };
  }, [sessions]);

  const featuredSession =
    sessionGroups.upcoming.find((session) => {
      const date = parseSessionDate(session);
      return date ? date.getTime() >= Date.now() : true;
    }) || sessionGroups.upcoming[0] || null;

  const filteredMentors = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return mentors;

    return mentors.filter((mentor) => {
      const searchable = [
        mentor.name,
        mentor.title,
        mentor.company,
        mentor.industry,
        ...(mentor.skills || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [mentors, searchTerm]);

  const recommendedMentors = filteredMentors.slice(0, 4);
  const progressAverage = Math.round(goals.reduce((total, goal) => total + goal.progress, 0) / goals.length);
  const completedSessions = sessionGroups.past.length;
  const mentorshipHours = Math.max(0, completedSessions * 1.5 + sessionGroups.upcoming.length);

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
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    navigateTo('home');
  };

  const handleBookMentor = (mentorId) => {
    navigateTo('booking', mentorId ? { mentorId } : null);
  };

  const handleJoinSession = (session) => {
    if (!session) return;
    navigateTo('video-interview', { sessionId: session.id });
  };

  const handleCancelSession = (session) => {
    if (!session) return;
    const confirmed = window.confirm(`Cancel your session with ${session.mentor?.name || 'this mentor'}?`);
    if (!confirmed) return;

    cancelSession(session.id);

    const matchingBooking = bookings.find(
      (booking) => booking.mentorId === session.mentorId && booking.menteeId === user?.id
    );
    if (matchingBooking) {
      updateBookingStatus(matchingBooking.id, 'Cancelled');
    }

    loadData();
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

    setRatingSaving(false);
  };

  const openNotesModal = (session) => {
    if (!session) return;
    setNotesSession(session);
    setNotesDraft(session.notes || '');
  };

  const saveNotes = (event) => {
    event.preventDefault();
    if (!notesSession) return;

    const updatedSessions = getSessions().map((session) =>
      session.id === notesSession.id ? { ...session, notes: notesDraft } : session
    );
    saveSessions(updatedSessions);
    setNotesSession(null);
    loadData();
  };

  const getStatusClass = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'confirmed' || normalized === 'scheduled') {
      return 'bg-secondary-container text-on-secondary-container';
    }
    if (normalized === 'pending') return 'bg-surface-dim text-on-surface-variant';
    if (normalized === 'completed') return 'bg-primary-fixed text-on-primary-fixed';
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

  const Sidebar = ({ mobile = false }) => (
    <aside
      className={`flex h-full w-64 shrink-0 flex-col bg-primary py-6 text-primary-fixed-dim shadow-xl ${
        mobile ? '' : 'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex'
      }`}
    >
      <button
        onClick={() => setView('dashboard')}
        className="mb-8 flex items-center gap-3 px-6 text-left"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-primary">
          <span className="material-symbols-outlined fill-icon">architecture</span>
        </span>
        <span>
          <span className="block font-headline-md text-xl font-bold leading-none text-on-primary">MentorBridge</span>
          <span className="mt-1 block text-xs font-semibold text-primary-fixed-dim opacity-80">Modern Mentorship</span>
        </span>
      </button>

      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors ${
              activeView === item.id
                ? 'bg-secondary-container text-on-secondary-container'
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

      <div className="space-y-1 border-t border-on-primary/10 pt-4">
        <button
          onClick={() => navigateTo('help-center')}
          className="mx-2 flex w-[calc(100%-1rem)] items-center rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-primary-fixed-variant/20 hover:text-on-primary"
        >
          <span className="material-symbols-outlined mr-3">help</span>
          Help Center
        </button>
        <button
          onClick={handleLogout}
          className="mx-2 flex w-[calc(100%-1rem)] items-center rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-error/10 hover:text-error"
        >
          <span className="material-symbols-outlined mr-3">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );

  const Header = () => (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-outline-variant/10 bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6">
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-on-surface lg:hidden"
        aria-label="Open dashboard menu"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <div className="hidden flex-1 sm:block">
        <div className="relative max-w-xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-full border-none bg-surface-container py-3 pl-12 pr-4 text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/30"
            placeholder="Search mentors, skills, or resources..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button
          onClick={() => setView('sessions')}
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
        </button>
        <button
          onClick={() => setView('settings')}
          className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-container sm:border-l sm:border-outline-variant/20 sm:pl-5"
        >
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-semibold leading-none text-on-surface">{user?.name || 'Mentee'}</span>
            <span className="mt-1 block text-xs text-on-surface-variant">Mentee Account</span>
          </span>
          <img
            alt="User profile"
            className="h-10 w-10 rounded-full border-2 border-surface-container-highest object-cover"
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Mentee'}`}
          />
        </button>
      </div>
    </header>
  );

  const MentorCard = ({ mentor }) => (
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
        </div>
        {renderStars(mentor.rating || 5)}
        <div className="flex w-full items-center justify-between border-t border-outline-variant/20 pt-4">
          <span className="font-headline-md text-lg font-bold text-on-background">${mentor.hourlyRate || 120}/hr</span>
          <button
            onClick={() => handleBookMentor(mentor.id)}
            className={`${buttonClass} bg-primary text-on-primary hover:opacity-90`}
          >
            Book
          </button>
        </div>
      </div>
    </article>
  );

  const SessionRow = ({ session, compact = false }) => {
    const isConfirmed = ['confirmed', 'scheduled'].includes(session.statusLabel);
    const isPending = session.statusLabel === 'pending';
    const isCompleted = session.statusLabel === 'completed';
    const isCancelled = ['cancelled', 'canceled'].includes(session.statusLabel);

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
      <section className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-3xl bg-secondary p-6 text-center shadow-sm md:flex-row md:p-10 md:text-left">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-on-secondary/10 bg-on-secondary-container/20 px-4 py-1.5 text-sm font-semibold text-on-primary">
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            Skill Profile: {user?.skills?.[0] || 'Career Growth'}
          </div>
          <h2 className="font-headline-lg text-4xl font-bold text-on-primary sm:text-5xl">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="max-w-xl text-primary-fixed-dim">
            You have {sessionGroups.upcoming.length} upcoming sessions. Keep your momentum with focused calls, notes, and clear next steps.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={() => setView('sessions')} className={`${buttonClass} bg-primary text-on-primary hover:opacity-90`}>
              View Sessions
            </button>
            <button onClick={() => handleBookMentor()} className={`${buttonClass} bg-primary-fixed text-on-primary-fixed hover:opacity-90`}>
              Book Mentor
            </button>
          </div>
        </div>
        <div className="relative z-10 hidden lg:flex h-48 w-48 items-center justify-center rounded-full bg-secondary-container/30 p-4">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary-container/50">
            <span className="material-symbols-outlined fill-icon text-6xl text-on-secondary-container">psychology</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-headline-md text-2xl font-bold text-on-background">Recommended Mentors</h3>
          <button onClick={() => setView('discovery')} className="text-sm font-semibold text-secondary hover:underline">
            View All
          </button>
        </div>
        <div className="-mx-2 flex snap-x gap-6 overflow-x-auto px-2 pb-4">
          {recommendedMentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="space-y-4 xl:col-span-2">
          <h3 className="font-headline-md text-2xl font-bold text-on-background">Upcoming Sessions</h3>
          <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low">
            {sessionGroups.upcoming.length > 0 ? (
              sessionGroups.upcoming.slice(0, 3).map((session) => <SessionRow key={session.id} session={session} />)
            ) : (
              <EmptyState title="No upcoming sessions" action="Browse Mentors" onAction={() => setView('discovery')} />
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
                      {session.rating || ratingScore}.0
                    </span>
                  ) : (
                    <button onClick={() => openRatingModal(session)} className="text-sm font-semibold text-secondary hover:underline">
                      Rate
                    </button>
                  )}
                </div>
              ))
            ) : (
              <EmptyState title="No completed sessions yet" action="Book Session" onAction={() => setView('discovery')} />
            )}
            <button onClick={() => setView('sessions')} className="w-full rounded-lg border border-outline-variant/10 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-highest">
              View History
            </button>
          </div>
        </section>
      </div>
    </div>
  );

  const renderDiscovery = () => (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline-lg text-4xl font-bold text-on-background">Discovery</h2>
          <p className="mt-2 text-on-surface-variant">Find mentors matched to your goals, skills, and pace.</p>
        </div>
        <button onClick={() => handleBookMentor()} className={`${buttonClass} bg-primary text-on-primary hover:opacity-90`}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          Book New Session
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {filteredMentors.map((mentor) => (
          <MentorCard key={mentor.id} mentor={mentor} />
        ))}
      </div>
    </section>
  );

  const renderSessions = () => {
    const tabs = [
      { id: 'upcoming', label: 'Upcoming', count: sessionGroups.upcoming.length },
      { id: 'past', label: 'Past', count: sessionGroups.past.length },
      { id: 'cancelled', label: 'Cancelled', count: sessionGroups.cancelled.length },
    ];
    const visibleSessions = sessionGroups[sessionTab] || [];

    return (
      <section className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-headline-lg text-4xl font-bold text-on-background sm:text-5xl">My Sessions</h2>
            <p className="mt-2 max-w-2xl text-on-surface-variant">
              Manage your mentorship calls, join rooms, prepare notes, and review past growth milestones.
            </p>
          </div>
          <div className="flex overflow-x-auto rounded-2xl bg-surface-container-high p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSessionTab(tab.id)}
                className={`min-w-28 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  sessionTab === tab.id ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-2xl bg-primary p-6 text-on-primary shadow-sm md:p-8 xl:col-span-2">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-fixed-dim">Next session starts in</p>
                <div className="flex items-end gap-4">
                  {[
                    ['Days', countdown.days],
                    ['Hrs', countdown.hours],
                    ['Min', countdown.minutes],
                  ].map(([label, value], index) => (
                    <React.Fragment key={label}>
                      {index > 0 && <span className="mb-5 text-3xl text-primary-fixed-dim/60">:</span>}
                      <div className="text-center">
                        <span className="block font-headline-xl text-5xl font-bold">{value}</span>
                        <span className="text-sm text-primary-fixed-dim">{label}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleJoinSession(featuredSession)}
                    disabled={!featuredSession}
                    className={`${buttonClass} bg-primary-fixed text-on-primary-fixed hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <span className="material-symbols-outlined text-[18px]">videocam</span>
                    Join Room
                  </button>
                  <button
                    onClick={() => openNotesModal(featuredSession)}
                    disabled={!featuredSession}
                    className={`${buttonClass} border border-on-primary/20 text-on-primary hover:bg-on-primary/10 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Prepare Notes
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <img
                  alt={featuredSession?.mentor?.name || 'Mentor'}
                  className="h-32 w-32 rounded-full border-4 border-primary-fixed object-cover"
                  src={featuredSession?.mentor?.avatar || 'https://ui-avatars.com/api/?name=Mentor'}
                />
                <p className="mt-4 font-headline-md text-2xl font-bold text-primary-fixed">{featuredSession?.mentor?.name || 'No session yet'}</p>
                <p className="text-sm text-primary-fixed-dim">{featuredSession?.mentor?.title || 'Book a mentor to begin'}</p>
              </div>
            </div>
          </section>

          <div className="grid gap-6">
            <div className={`${cardClass} p-6`}>
              <div className="mb-4 flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                  <span className="material-symbols-outlined">trending_up</span>
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-surface-variant">Growth Progress</p>
                  <p className="font-headline-md text-2xl font-bold text-primary">{progressAverage}% Achieved</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progressAverage}%` }} />
              </div>
            </div>

            <div className="rounded-2xl bg-tertiary-container p-6 text-on-tertiary-container shadow-sm">
              <p className="text-sm font-semibold opacity-80">Mentorship Hours</p>
              <p className="font-headline-xl mt-2 text-5xl font-bold">{mentorshipHours.toFixed(1)}</p>
              <p className="mt-2 text-sm opacity-70">Total focus time this quarter</p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-2xl font-bold text-on-background">
              {sessionTab === 'upcoming' ? 'Upcoming Appointments' : sessionTab === 'past' ? 'Past Sessions' : 'Cancelled Sessions'}
            </h3>
            <button onClick={() => handleBookMentor()} className="text-sm font-semibold text-secondary hover:underline">
              Browse Mentors
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low">
            {visibleSessions.length > 0 ? (
              visibleSessions.map((session) => <SessionRow key={session.id} session={session} />)
            ) : (
              <EmptyState title="Need more guidance?" detail="Your network of mentors is growing. Schedule a follow-up." action="Browse Mentors" onAction={() => setView('discovery')} />
            )}
          </div>
        </section>
      </section>
    );
  };

  const renderAnalytics = () => (
    <section className="space-y-6">
      <div>
        <h2 className="font-headline-lg text-4xl font-bold text-on-background">Analytics</h2>
        <p className="mt-2 text-on-surface-variant">Track your growth signals across sessions, goals, and mentor feedback.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {goals.map((goal) => (
          <article key={goal.title} className={`${cardClass} p-6`}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined">{goal.icon}</span>
              </span>
              <div>
                <h3 className="font-semibold text-on-surface">{goal.title}</h3>
                <p className="text-xs text-on-surface-variant">{goal.progress}% complete</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-on-surface-variant">{goal.detail}</p>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
              <div className="h-full rounded-full bg-primary" style={{ width: `${goal.progress}%` }} />
            </div>
          </article>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          ['Upcoming', sessionGroups.upcoming.length, 'Scheduled mentor calls'],
          ['Completed', sessionGroups.past.length, 'Finished growth milestones'],
          ['Mentors', mentors.length, 'Approved mentors available'],
        ].map(([label, value, detail]) => (
          <div key={label} className={`${cardClass} p-6`}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
            <p className="mt-3 font-headline-xl text-4xl font-bold text-primary">{value}</p>
            <p className="mt-2 text-sm text-on-surface-variant">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );

  const renderSettings = () => <ProfileSettings compact onSaved={loadData} />;

  const renderContent = () => {
    if (activeView === 'discovery') return renderDiscovery();
    if (activeView === 'sessions') return renderSessions();
    if (activeView === 'analytics') return renderAnalytics();
    if (activeView === 'settings') return renderSettings();
    return renderDashboard();
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <Sidebar />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close dashboard menu"
          />
          <div className="relative h-full w-64">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <main className="min-h-screen lg:pl-64">
        <Header />
        <div className="mx-auto w-full max-w-[1440px] space-y-8 p-4 pb-28 sm:p-6 lg:p-8">
          <div className="block sm:hidden">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-full border-none bg-surface-container py-3 pl-12 pr-4 text-on-surface outline-none focus:ring-2 focus:ring-secondary/30"
                placeholder="Search mentors..."
                type="text"
              />
            </div>
          </div>
          {renderContent()}
        </div>

        <footer className="border-t border-outline-variant/10 bg-inverse-surface py-8 text-surface-dim lg:ml-0">
          <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-6 md:flex-row">
            <div className="text-center md:text-left">
              <span className="font-headline-md text-2xl font-bold text-surface-container-lowest">MentorBridge</span>
              <p className="mt-2 text-sm">(c) 2024 MentorBridge. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-5 text-sm font-semibold">
              <button onClick={() => navigateTo('privacy')} className="hover:text-primary-fixed">Privacy Policy</button>
              <button onClick={() => navigateTo('terms')} className="hover:text-primary-fixed">Terms of Service</button>
              <button onClick={() => navigateTo('help-center')} className="hover:text-primary-fixed">Contact Support</button>
              <button onClick={() => navigateTo('resources')} className="hover:text-primary-fixed">Careers</button>
            </div>
          </div>
        </footer>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/10 bg-background/95 px-2 py-2 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center rounded-xl px-1 py-2 text-[11px] font-semibold ${
                activeView === item.id ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'
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
                    <span className={`material-symbols-outlined text-5xl ${star <= ratingScore ? 'fill-icon text-secondary' : 'text-outline-variant'}`}>
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
            <button type="submit" className={`${buttonClass} w-full bg-primary py-3 text-on-primary hover:opacity-90`}>
              Save Notes
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function EmptyState({ title, detail, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <span className="material-symbols-outlined mb-3 text-4xl text-secondary">add_circle</span>
      <p className="font-headline-md text-xl font-bold text-on-background">{title}</p>
      {detail && <p className="mt-2 max-w-md text-sm text-on-surface-variant">{detail}</p>}
      {action && (
        <button onClick={onAction} className="mt-4 text-sm font-semibold text-secondary hover:underline">
          {action}
        </button>
      )}
    </div>
  );
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

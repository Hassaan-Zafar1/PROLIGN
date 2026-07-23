import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { sessionService } from '../services/sessionService';
import Button from '../components/common/Button';
import { useTheme } from '../hooks/useTheme';

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
    <div className="flex flex-col items-center gap-3">
      <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
      <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Loading video session...</p>
    </div>
  </div>
);

export default function VideoInterview({ navigateTo, params }) {
  const sessionId = params?.sessionId;
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  // Fetch session details on mount
  useEffect(() => {
    if (!sessionId) {
      setError('Invalid session identifier.');
      setLoading(false);
      return;
    }

    sessionService.getSessionById(sessionId)
      .then((data) => {
        // Verify user participation
        const isParticipant =
          user.role === 'admin' ||
          String(data.menteeId?._id || data.menteeId) === String(user.id) ||
          String(data.mentorId?._id || data.mentorId) === String(user.id);

        if (!isParticipant) {
          setError('You are not authorized to join this session.');
        } else {
          setSession(data);
          calculateTimeRemaining(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load session details:', err);
        setError('Failed to load session details. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId, user]);

  // Calculate session timer
  const calculateTimeRemaining = (sessionData) => {
    const scheduledDate = new Date(sessionData.scheduledDate);
    const duration = (sessionData.durationHours || 1) * 60 * 60 * 1000; // default 1 hour
    const endTime = new Date(scheduledDate.getTime() + duration);

    const updateTimer = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeRemaining(0);
      } else {
        setTimeRemaining(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  };

  // Timer countdown hook
  useEffect(() => {
    if (session) {
      const scheduledDate = new Date(session.scheduledDate);
      const duration = (session.durationHours || 1) * 60 * 60 * 1000;
      const endTime = new Date(scheduledDate.getTime() + duration);

      const interval = setInterval(() => {
        const diff = endTime.getTime() - Date.now();
        if (diff <= 0) {
          setTimeRemaining(0);
          clearInterval(interval);
        } else {
          setTimeRemaining(diff);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session]);

  // Dynamically load Jitsi script
  const loadJitsiScript = () => {
    return new Promise((resolve) => {
      if (window.JitsiMeetExternalAPI) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => resolve(true);
      document.body.appendChild(script);
    });
  };

  // Initialize Jitsi Conference
  const startConference = async () => {
    setJoined(true);
    await loadJitsiScript();

    if (!jitsiContainerRef.current) return;

    const domain = 'meet.jit.si';
    const roomName = `prolign-session-${sessionId}`;

    // Determine target display name
    const displayName = user.name || 'ProLign User';

    const options = {
      roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName,
        email: user.email || '',
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        welcomePageEnabled: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'settings',
          'raisehand', 'videoquality', 'filmstrip', 'tileview', 'shortcuts'
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: isDark ? '#1C1D18' : '#F4F5EF',
      }
    };

    const apiInstance = new window.JitsiMeetExternalAPI(domain, options);
    jitsiApiRef.current = apiInstance;

    // Listen for conference end/hangup
    apiInstance.addEventListener('videoConferenceLeft', () => {
      handleExit();
    });
  };

  // Cleanup on exit
  const handleExit = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    // Redirect back to dashboard based on role
    if (user.role === 'mentor') {
      navigateTo('mentor-dashboard');
    } else {
      navigateTo('mentee-dashboard');
    }
  };

  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, []);

  const formatTimer = (ms) => {
    if (ms === null) return '—:—';
    if (ms <= 0) return 'Session Ended';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
        <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
        <h2 className="text-2xl font-bold text-on-surface mb-2">Access Denied</h2>
        <p className="text-on-surface-variant max-w-md mb-6">{error}</p>
        <Button variant="primary" onClick={() => navigateTo('dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const otherParticipant = user.role === 'mentor'
    ? (session.menteeId?.name || 'Mentee')
    : (session.mentorId?.name || 'Mentor');

  return (
    <div className="flex h-screen w-screen flex-col bg-surface text-on-surface overflow-hidden">
      {/* Top Header/Status bar */}
      <header className="flex h-16 items-center justify-between border-b border-outline-variant/10 bg-surface-container px-4 md:px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary fill-icon">video_camera_back</span>
          <div>
            <h1 className="text-sm font-bold leading-none text-on-surface">{session.title || 'Mentorship Session'}</h1>
            <p className="mt-1 text-xs text-on-surface-variant">Call with {otherParticipant}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {timeRemaining !== null && (
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
              timeRemaining < 5 * 60 * 1000 ? 'bg-error-container text-on-error-container animate-pulse' : 'bg-surface-container-high text-primary'
            }`}>
              <span className="material-symbols-outlined text-[14px]">timer</span>
              <span>{formatTimer(timeRemaining)}</span>
            </div>
          )}
          <button
            onClick={handleExit}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-error px-4 text-xs font-bold text-on-error hover:bg-error/90 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-base">call_end</span>
            <span>Leave</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 relative w-full h-full bg-surface-container-low">
        {!joined ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl border border-outline-variant/10 bg-surface-container p-6 text-center shadow-2xl space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-3xl">videocam</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-on-surface">Session Lobby</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  You are about to join the secure video conference. Please make sure your camera and microphone are connected and allowed by the browser.
                </p>
              </div>

              <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 space-y-2.5 text-left text-xs">
                <div className="flex justify-between"><span className="text-on-surface-variant">Scheduled time:</span><span className="font-semibold text-on-surface">{new Date(session.scheduledDate).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Session duration:</span><span className="font-semibold text-on-surface">{session.durationHours || 1} hour (60 min)</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Host/Mentor:</span><span className="font-semibold text-on-surface">{session.mentorId?.name || 'Mentor'}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Mentee:</span><span className="font-semibold text-on-surface">{session.menteeId?.name || 'Mentee'}</span></div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full h-12 text-sm font-bold uppercase tracking-wider"
                  onClick={startConference}
                >
                  Join Video Call
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div ref={jitsiContainerRef} className="absolute inset-0 w-full h-full" />
        )}
      </main>
    </div>
  );
}

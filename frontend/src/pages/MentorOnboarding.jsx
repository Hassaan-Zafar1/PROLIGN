import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mentorProfileService } from '../services/mentorProfileService';

/**
 * Mentor profile-building experience (Tasks 3, 4 & 5).
 *
 * Flow (Task 3):   Signup → OTP → Verified → *Profile Building* → Dashboard
 * Real work (T4):  calls the backend to auto-build a structured profile from CV.
 * Polished UX (T5): animated illustration, staged timeline, live progress bar,
 *                   estimated remaining time, and a success animation — the user
 *                   never sees a blank screen while extraction runs.
 *
 * It is deliberately NON-BLOCKING: a failed build still lets the mentor into
 * their dashboard (they can finish details in Settings).
 */

const BUILD_STAGES = [
  { key: 'cv', label: 'Checking your CV', hint: 'Reading your uploaded document', icon: 'description' },
  { key: 'skills', label: 'Extracting skills & experience', hint: 'Identifying your expertise', icon: 'psychology' },
  { key: 'profile', label: 'Building your profile', hint: 'Structuring your background', icon: 'badge' },
  { key: 'interests', label: 'Generating mentorship focus areas', hint: 'Matching what you can offer', icon: 'interests' },
  { key: 'dashboard', label: 'Preparing your dashboard', hint: 'Almost there', icon: 'dashboard' },
];

// Visual pacing (ms/stage) and rough total for the countdown. Independent of the
// actual build duration — completion is gated on the real backend response AND
// a minimum on-screen time so the experience never flashes by.
const STAGE_DURATION = 2000;
const MIN_DISPLAY_MS = 10000; // keep the build screen up ≥10s for a calmer UX
const EST_SECONDS = Math.round(MIN_DISPLAY_MS / 1000);

export default function MentorOnboarding({ navigateTo }) {
  const { user, updateUser } = useAuth();
  const [activeStage, setActiveStage] = useState(0);
  const [buildDone, setBuildDone] = useState(false);
  const [buildError, setBuildError] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Animate the timeline through to the last stage (which keeps spinning until
  // the real build resolves below).
  useEffect(() => {
    const timers = BUILD_STAGES.slice(0, -1).map((_, i) =>
      setTimeout(() => setActiveStage(i + 1), STAGE_DURATION * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Tick the elapsed counter (for the estimated-remaining display).
  useEffect(() => {
    if (buildDone) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [buildDone]);

  // Kick off the real profile build.
  //
  // IMPORTANT: no `started`/"run once" ref guard here. In React 18 StrictMode
  // (see main.jsx), every effect runs mount → cleanup → mount again in dev.
  // A "run once" ref combined with a cleanup that flips `cancelled = true`
  // means the *first* (immediately-cleaned-up) run is the only one that ever
  // actually fires the request, and its own cleanup permanently disables its
  // `finish()` before the response arrives — the UI then hangs at 80% forever,
  // regardless of any network timeout, because the state update itself is
  // suppressed. The `cancelled` flag alone already handles StrictMode's
  // double-invoke correctly: the aborted first run's completion safely no-ops,
  // and the second, real run's `cancelled` starts fresh and DOES complete.
  // (This does mean the backend POST fires twice in dev under StrictMode —
  // harmless here since building the profile is idempotent.)
  useEffect(() => {
    let cancelled = false;
    let doneTimer;
    const start = Date.now();

    const complete = () => {
      if (cancelled) return;
      cancelled = true;
      setActiveStage(BUILD_STAGES.length);
      setBuildDone(true);
    };
    // Once the real work has settled, still hold the screen until the minimum
    // display time has passed — so a fast (~1s) build doesn't flash by.
    const finish = () => {
      const remaining = Math.max(0, MIN_DISPLAY_MS - (Date.now() - start));
      doneTimer = setTimeout(complete, remaining);
    };

    // The axios client already times out (see config/api.js), so this call
    // settles on its own within ~20s even if the backend hangs. This watchdog
    // is a second, independent safety net — onboarding must NEVER be able to
    // spin forever, whatever goes wrong on the network/server side.
    const watchdog = setTimeout(() => {
      setBuildError(true);
      finish();
    }, 25000);

    mentorProfileService.buildProfile()
      .then((res) => {
        if (res?.user) updateUser(res.user);
      })
      .catch(() => {
        setBuildError(true); // non-blocking — still proceed
      })
      .finally(() => {
        clearTimeout(watchdog);
        finish();
      });

    return () => { cancelled = true; clearTimeout(watchdog); clearTimeout(doneTimer); };
  }, [updateUser]);

  // Auto-continue to the dashboard shortly after completion (no approval gate).
  useEffect(() => {
    if (!buildDone) return undefined;
    const t = setTimeout(() => navigateTo('mentor-dashboard'), 2200);
    return () => clearTimeout(t);
  }, [buildDone, navigateTo]);

  const progress = buildDone
    ? 100
    : Math.min(95, Math.round((activeStage / BUILD_STAGES.length) * 100));
  const remaining = buildDone ? 0 : Math.max(1, EST_SECONDS - elapsed);
  const firstName = (user?.name || '').split(' ')[0];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-10">
      <div className="w-full max-w-xl animate-scale-in">
        <div className="bg-surface rounded-3xl border border-outline-variant/10 shadow-2xl shadow-primary/5 overflow-hidden">
          {/* Illustration band */}
          <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 px-6 pt-10 pb-8 text-center overflow-hidden">
            <div className="absolute top-6 left-8 w-24 h-24 bg-secondary/10 rounded-full blur-2xl" aria-hidden="true" />
            <div className="absolute bottom-4 right-10 w-28 h-28 bg-primary/10 rounded-full blur-2xl" aria-hidden="true" />

            <div className="relative">
              {buildDone ? (
                <div className="w-20 h-20 mx-auto rounded-2xl bg-success/15 text-success flex items-center justify-center animate-[successPop_0.4s_ease-out]">
                  <span className="material-symbols-outlined text-5xl fill-icon">check_circle</span>
                </div>
              ) : (
                <div className="animate-float">
                  <ProfileBuildIllustration />
                </div>
              )}
            </div>

            <h1 className="relative mt-6 text-2xl font-bold text-primary">
              {buildDone ? 'Your profile is ready!' : 'Building your mentor profile'}
            </h1>
            <p className="relative text-on-surface-variant mt-2 text-sm max-w-sm mx-auto">
              {buildDone
                ? `Welcome aboard${firstName ? `, ${firstName}` : ''}. Taking you to your dashboard…`
                : `Hang tight${firstName ? `, ${firstName}` : ''} — we're assembling everything from your CV.`}
            </p>
          </div>

          {/* Body */}
          <div className="px-6 sm:px-10 py-8">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-2">
                <span className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-[16px] ${buildDone ? 'text-success' : 'text-primary'}`}>
                    {buildDone ? 'task_alt' : 'schedule'}
                  </span>
                  {buildDone ? 'Complete' : `About ${remaining}s remaining`}
                </span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${buildDone ? 'bg-success' : 'bg-primary'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stage timeline */}
            <ol className="space-y-3">
              {BUILD_STAGES.map((stage, i) => {
                const isComplete = i < activeStage;
                const isActive = i === activeStage && !buildDone;
                return (
                  <li
                    key={stage.key}
                    className={`flex items-center gap-4 rounded-xl px-3 py-2.5 transition-colors duration-300 animate-fade-in-up ${
                      isActive ? 'bg-primary/5' : ''
                    }`}
                    style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isComplete
                        ? 'bg-success/15 text-success'
                        : isActive
                        ? 'bg-primary/15 text-primary'
                        : 'bg-surface-container-high text-on-surface-variant/40'
                    }`}>
                      {isComplete ? (
                        <span className="material-symbols-outlined text-[20px]">check</span>
                      ) : isActive ? (
                        <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-[20px]">{stage.icon}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold transition-colors ${
                        isComplete || isActive ? 'text-on-surface' : 'text-on-surface-variant/40'
                      }`}>
                        {stage.label}
                      </p>
                      {isActive && (
                        <p className="text-xs text-on-surface-variant mt-0.5">{stage.hint}…</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* Non-blocking notice if extraction couldn't complete */}
            {buildDone && buildError && (
              <p className="mt-6 text-xs text-on-surface-variant text-center">
                We couldn't finish auto-filling everything — you can complete your profile anytime in Settings.
              </p>
            )}

            {/* Continue button (available once done) */}
            {buildDone && (
              <button
                onClick={() => navigateTo('mentor-dashboard')}
                className="mt-8 w-full min-h-[44px] py-3 bg-primary text-on-primary font-bold rounded-xl hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2 animate-fade-in-up"
              >
                Go to Dashboard
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-on-surface-variant/60 mt-4">
          Your information is processed securely.
        </p>
      </div>
    </div>
  );
}

/**
 * Self-contained inline illustration (no external assets — CSP-safe).
 * A document with a profile card emerging + sparkle, tinted with theme colors.
 */
function ProfileBuildIllustration() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="mx-auto">
      {/* Document */}
      <rect x="20" y="14" width="44" height="58" rx="6" className="fill-surface stroke-primary/30" strokeWidth="2" />
      <line x1="28" y1="28" x2="52" y2="28" className="stroke-on-surface-variant/40" strokeWidth="3" strokeLinecap="round" />
      <line x1="28" y1="38" x2="56" y2="38" className="stroke-on-surface-variant/30" strokeWidth="3" strokeLinecap="round" />
      <line x1="28" y1="48" x2="48" y2="48" className="stroke-on-surface-variant/30" strokeWidth="3" strokeLinecap="round" />
      {/* Profile card emerging */}
      <rect x="46" y="44" width="34" height="34" rx="8" className="fill-primary/10 stroke-primary" strokeWidth="2" />
      <circle cx="63" cy="56" r="6" className="fill-primary" />
      <path d="M52 72c0-6 5-9 11-9s11 3 11 9" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Sparkles */}
      <path d="M74 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" className="fill-secondary" />
      <circle cx="18" cy="60" r="2.5" className="fill-secondary/70" />
    </svg>
  );
}

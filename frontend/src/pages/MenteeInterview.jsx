import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { tokenManager } from '../utils/tokenManager';

// FastAPI backend (uvicorn main:app --port 8001) — NOT the Node backend.
const API_BASE = import.meta.env?.VITE_INTERVIEWER_API_URL || 'http://localhost:8001';
// Your Node/Express backend — where a copy of the profile lands for the dashboard.
const NODE_API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

/**
 * MenteeInterview — Ayla, the conversational AI interviewer.
 *
 * - Ayla's replies are shown as text AND spoken aloud (browser SpeechSynthesis).
 * - The mentee picks Type or Record per turn. Recordings are uploaded to
 *   /sessions/{id}/transcribe (Groq Whisper) and the transcript is shown back
 *   for confirmation/edit before being sent.
 * - Every raw answer is stored server-side (MongoDB `interview_sessions`).
 *   On completion, the cleaned profile lands in Mentee_Profiles and mentor
 *   matches are fetched directly against that same record via session_id -
 *   no separate linking step. Syncing a copy to Node (for the dashboard)
 *   happens in parallel and never blocks match results, but DOES gate the
 *   "Go to my dashboard" button so any route guard sees fresh state first.
 * - The mentee can exit early at any point; nothing is lost, they can just
 *   restart later from their dashboard.
 */
export default function MenteeInterview({ navigateTo }) {
  const { user, refreshUser } = useAuth();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]); // { role: 'ayla' | 'user', text, mode? }
  const [progress, setProgress] = useState({ current_question: 0, total_questions: 10, percent: 0, phase_label: '' });
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'voice'
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState(null); // { top_mentors, skill_recommendations } | null
  const [isMatching, setIsMatching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // Node dashboard sync in flight
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isExited, setIsExited] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    startSession();
    return () => window.speechSynthesis?.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = useCallback((text) => {
    if (muted || !text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [muted]);

  const startSession = async () => {
    setError('');
    setIsExited(false);
    setIsComplete(false);
    setMatches(null);
    try {
      const res = await fetch(`${API_BASE}/sessions`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSession(data.session_id);
      setProgress(data.progress);
      setMessages([{ role: 'ayla', text: data.opening_message }]);
      setTimeout(() => speak(data.opening_message), 400);
    } catch {
      setError("Could not reach Ayla. Make sure the interviewer API (uvicorn main:app --port 8001) is running.");
    }
  };

  const submitAnswer = async (text, mode) => {
    if (!text.trim() || !session || isSending) return;
    setIsSending(true);
    setError('');
    setMessages((prev) => [...prev, { role: 'user', text, mode }]);
    setInput('');

    try {
      const res = await fetch(`${API_BASE}/sessions/${session}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, input_mode: mode }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProgress(data.progress);
      setMessages((prev) => [...prev, { role: 'ayla', text: data.reply }]);
      speak(data.reply);

      if (data.is_complete) {
        setIsComplete(true);

        // Matches come straight from our own backend, keyed on session_id -
        // no Node round-trip required, so this never has to wait on anything else.
        setIsMatching(true);
        fetch(`${API_BASE}/sessions/${session}/matches?top_k=5`)
          .then((r) => (r.ok ? r.json() : null))
          .then((m) => m && setMatches(m))
          .catch(() => {})
          .finally(() => setIsMatching(false));

        // Sync to Node so the dashboard has a copy too. This does NOT gate
        // match results above, but DOES gate the "Go to my dashboard" button
        // via isSyncing, so a route guard checking "has completed interview"
        // sees fresh state before we navigate there.
        setIsSyncing(true);
        (async () => {
          try {
            const recordRes = await fetch(`${API_BASE}/sessions/${session}/profile`);
            if (!recordRes.ok) return;
            const menteeRecord = await recordRes.json();
            const token = tokenManager.getAccessToken?.() || tokenManager.getToken?.();
            const completeRes = await fetch(`${NODE_API_BASE}/api/interview/complete-ai`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify({
                menteeRecord,
                conversation: [...messages, { role: 'user', text }],
                mode: mode === 'record' ? 'voice' : 'text',
              }),
            });
            if (completeRes.ok) {
              await refreshUser?.();
            }
          } catch {
            setError('Your matches are ready below. Your dashboard is still catching up — try again in a moment.');
          } finally {
            setIsSyncing(false);
          }
        })();
      }
    } catch {
      setError('Something went wrong sending your answer. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // ── Exit mid-interview ─────────────────────────────────────────────────

  const confirmExit = async () => {
    setShowExitConfirm(false);
    setIsExiting(true);
    window.speechSynthesis?.cancel();
    try {
      if (session) await fetch(`${API_BASE}/sessions/${session}/exit`, { method: 'POST' });
    } catch {
      // Best-effort — let them leave locally either way.
    } finally {
      setIsExiting(false);
      setIsExited(true);
    }
  };

  // ── Voice recording → Groq Whisper transcription ──────────────────────────

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribe(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setError('Microphone access was denied or is unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribe = async (blob) => {
    if (!session) return;
    setIsTranscribing(true);
    setError('');
    try {
      const form = new FormData();
      form.append('audio', blob, 'answer.webm');
      const res = await fetch(`${API_BASE}/sessions/${session}/transcribe`, { method: 'POST', body: form });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInput(data.text); // shown for confirmation before sending
    } catch {
      setError('Could not transcribe that recording. Try again or switch to typing.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSend = () => submitAnswer(input, inputMode === 'record' ? 'voice' : 'text');

  const percent = progress.percent || 0;
  const totalQuestions = progress.total_questions || 10;
  const firstName = (user?.name || '').split(' ')[0];

  const questionLabel =
    progress.current_question > totalQuestions
      ? 'Just a few more details…'
      : progress.current_question > 0
      ? `Question ${progress.current_question} of ${totalQuestions}`
      : 'Getting started…';

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center px-4 py-6">
      <style>{`
        @keyframes ayla-msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ayla-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
        .ayla-msg { animation: ayla-msg-in 0.25s ease-out both; }
        .ayla-dot { animation: ayla-dot 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ayla-msg { animation: none; }
          .ayla-dot { animation: none; opacity: 0.7; }
        }
      `}</style>

      <div className="w-full max-w-2xl flex flex-col h-[85vh] bg-surface-container rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 shrink-0">
              {isSpeaking && (
                <span className="motion-safe:animate-ping absolute inset-0 rounded-full bg-secondary/30" />
              )}
              <div className="relative w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-lg">graphic_eq</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">Ayla{firstName ? ` — talking with ${firstName}` : ''}</p>
              <p className="text-[11px] text-on-surface-variant">{questionLabel} · {progress.phase_label || 'Starting'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isComplete && !isExited && (
              <button
                onClick={() => setShowExitConfirm(true)}
                className="px-2.5 h-9 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Exit
              </button>
            )}
            <button
              onClick={() => { setMuted((m) => !m); window.speechSynthesis?.cancel(); }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
              aria-label={muted ? 'Unmute Ayla' : 'Mute Ayla'}
            >
              <span className="material-symbols-outlined text-lg">{muted ? 'volume_off' : 'volume_up'}</span>
            </button>
          </div>
        </div>

        <div className="h-1 bg-surface-container-high shrink-0">
          <div className="h-full bg-secondary transition-all duration-500 rounded-r-full" style={{ width: `${percent}%` }} />
        </div>

        {isExited ? (
          /* ── Exited mid-interview ─────────────────────────────────────── */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">pause_circle</span>
            <p className="text-sm font-bold text-on-surface">No worries — you can pick this up anytime.</p>
            <p className="text-xs text-on-surface-variant max-w-xs">
              Nothing you shared is lost. Come back whenever you're ready to keep going, or start fresh.
            </p>
            <div className="flex gap-2 mt-2 w-full max-w-xs">
              <button
                onClick={startSession}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-surface-container-high text-on-surface"
              >
                Start over
              </button>
              <button
                onClick={() => navigateTo?.('mentee-dashboard')}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-on-secondary"
              >
                Go to dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Transcript */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-end gap-2 ayla-msg ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'ayla' && (
                    <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mb-0.5">
                      <span className="material-symbols-outlined text-secondary text-xs">graphic_eq</span>
                    </div>
                  )}
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-secondary text-on-secondary rounded-br-sm' : 'bg-surface-container-high text-on-surface rounded-bl-sm'
                  }`}>
                    {m.text}
                    {m.mode === 'voice' && (
                      <span className="ml-1.5 inline-flex align-middle opacity-70">
                        <span className="material-symbols-outlined text-xs">mic</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex items-end gap-2 justify-start ayla-msg">
                  <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mb-0.5">
                    <span className="material-symbols-outlined text-secondary text-xs">graphic_eq</span>
                  </div>
                  <div className="bg-surface-container-high rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/60 ayla-dot" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/60 ayla-dot" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/60 ayla-dot" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {error && <div className="mx-5 mb-2 px-3 py-2 rounded-lg bg-error/10 text-error text-xs">{error}</div>}

            {isComplete ? (
              <div className="p-5 border-t border-outline-variant/15 shrink-0 max-h-[50vh] overflow-y-auto space-y-4">
                <div className="text-center space-y-1">
                  <span className="material-symbols-outlined text-3xl text-secondary">check_circle</span>
                  <p className="text-sm font-bold text-on-surface">Interview complete!</p>
                  <p className="text-xs text-on-surface-variant">Thanks for sharing all that, {firstName || 'friend'}.</p>
                </div>

                {isMatching && (
                  <p className="text-xs text-on-surface-variant text-center italic">Finding your best mentor matches…</p>
                )}

                {matches?.top_mentors?.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Your top mentor matches</p>
                    {matches.top_mentors.map((m) => (
                      <div key={m.mentor_id} className="rounded-xl bg-surface-container-high p-3 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-xs font-bold shrink-0">
                          {m.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{m.full_name || 'Mentor'}</p>
                          <p className="text-xs text-on-surface-variant">
                            {m.current_role || '—'} · {m.industry || '—'} · {m.experience_years || 0} yrs
                          </p>
                          <p className="text-[10px] text-on-surface-variant/70 mt-0.5">
                            ⭐ {Number(m.avg_rating || 0).toFixed(1)} · {m.total_sessions || 0} sessions · match score {(Number(m.final_score || 0) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {matches?.skill_recommendations && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Skills your top mentors have that you don't yet</p>
                    {['tech_skills', 'domain_skills', 'soft_skills'].map((cat) => {
                      const recs = matches.skill_recommendations[cat] || [];
                      if (!recs.length) return null;
                      return (
                        <p key={cat} className="text-xs text-on-surface-variant">
                          <span className="font-semibold capitalize">{cat.replace('_', ' ')}:</span>{' '}
                          {recs.slice(0, 5).map((r) => r.skill).join(', ')}
                        </p>
                      );
                    })}
                  </div>
                )}

                {!isMatching && !matches?.top_mentors?.length && (
                  <p className="text-xs text-on-surface-variant text-center">
                    No mentor matches yet — check back once more mentors join.
                  </p>
                )}

                <button
                  onClick={() => navigateTo?.('mentee-dashboard')}
                  disabled={isSyncing}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-secondary text-on-secondary disabled:opacity-50"
                >
                  {isSyncing ? 'Saving to your dashboard…' : 'Go to my dashboard'}
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-outline-variant/15 shrink-0 space-y-2.5">
                <div className="flex gap-1.5 justify-center">
                  <button
                    onClick={() => setInputMode('text')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${inputMode === 'text' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'}`}
                  >
                    Type
                  </button>
                  <button
                    onClick={() => setInputMode('record')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${inputMode === 'record' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'}`}
                  >
                    Record
                  </button>
                </div>

                {inputMode === 'text' ? (
                  <div className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      rows={1}
                      placeholder="Type your answer…"
                      className="flex-1 bg-surface-dim border border-outline-variant/20 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary/40 resize-none max-h-28"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isSending}
                      className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center disabled:opacity-40 shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">send</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-1">
                    {isTranscribing ? (
                      <p className="text-xs text-on-surface-variant italic">Transcribing your answer…</p>
                    ) : input ? (
                      <>
                        <div className="w-full bg-surface-dim rounded-xl px-3.5 py-2.5 text-sm text-on-surface">{input}</div>
                        <div className="flex gap-2 w-full">
                          <button onClick={() => setInput('')} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface-variant">
                            Re-record
                          </button>
                          <button onClick={handleSend} disabled={isSending} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-secondary text-on-secondary disabled:opacity-40">
                            Send answer
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-all ${isRecording ? 'bg-error text-on-error motion-safe:animate-pulse' : 'bg-secondary text-on-secondary'}`}
                        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                      >
                        <span className="material-symbols-outlined text-2xl">{isRecording ? 'stop' : 'mic'}</span>
                      </button>
                    )}
                    {!isTranscribing && !input && (
                      <p className="text-[10px] text-on-surface-variant/60">{isRecording ? 'Recording… tap to stop' : 'Tap to record your answer'}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Exit confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-sm bg-surface-container rounded-2xl shadow-lg p-5 space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-on-surface">Exit this interview?</p>
              <p className="text-xs text-on-surface-variant">
                Everything you've shared so far is saved. You can pick up right where you left off, or start fresh, whenever you're ready.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-surface-container-high text-on-surface"
              >
                Keep going
              </button>
              <button
                onClick={confirmExit}
                disabled={isExiting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-error text-on-error disabled:opacity-50"
              >
                {isExiting ? 'Exiting…' : 'Exit interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
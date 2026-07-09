import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { tokenManager } from '../utils/tokenManager';

// FastAPI backend (uvicorn api:app --port 8000) — NOT the Node backend.
const API_BASE = import.meta.env?.VITE_INTERVIEWER_API_URL || 'http://localhost:8000';
// Your Node/Express backend — where the profile ultimately needs to land.
const NODE_API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

/**
 * MenteeInterview — Ayla, the conversational AI interviewer.
 *
 * - Ayla's replies are shown as text AND spoken aloud (browser SpeechSynthesis).
 * - The mentee picks Type or Record per turn. Recordings are uploaded to
 *   /sessions/{id}/transcribe (Groq Whisper) and the transcript is shown back
 *   for confirmation/edit before being sent.
 * - Every raw answer is stored server-side (MongoDB `interview_sessions`); on
 *   completion the cleaned profile is handed to Node's `menteeprofiles`
 *   collection, then matched against `mentorprofiles` and shown right here.
 */
export default function MenteeInterview({ navigateTo }) {
  const { user } = useAuth();

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
    try {
      const res = await fetch(`${API_BASE}/sessions`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSession(data.session_id);
      setProgress(data.progress);
      setMessages([{ role: 'ayla', text: data.opening_message }]);
      setTimeout(() => speak(data.opening_message), 400);
    } catch {
      setError('Could not reach Ayla. Make sure the interviewer API (uvicorn api:app --port 8000) is running.');
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
        try {
          const recordRes = await fetch(`${API_BASE}/sessions/${session}/mentee-record`);
          if (recordRes.ok) {
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
              const { menteeProfile } = await completeRes.json();
              if (menteeProfile?._id) {
                // Link Node's MenteeProfile _id back to the Ayla session so
                // /sessions/{id}/matches (mentor matching) can look this
                // mentee up directly in `menteeprofiles`.
                await fetch(`${API_BASE}/sessions/${session}/link-mentee-profile`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mentee_profile_id: menteeProfile._id }),
                });

                setIsMatching(true);
                try {
                  const matchRes = await fetch(`${API_BASE}/sessions/${session}/matches?top_k=5`);
                  if (matchRes.ok) {
                    setMatches(await matchRes.json());
                  }
                } catch {
                  // Non-fatal — matching is a bonus on this screen, dashboard will
                  // still show the mentee's profile regardless.
                } finally {
                  setIsMatching(false);
                }
              }
            }
          }
        } catch {
          // Non-fatal: Ayla's own record is already saved server-side (Mongo);
          // this just means the Node-side MenteeProfile/dashboard sync failed.
          setError('Interview saved, but syncing your profile to the dashboard failed. Refresh in a moment.');
        }
        // No auto-navigate — the mentee stays here to see their matched mentors.
      }
    } catch {
      setError('Something went wrong sending your answer. Please try again.');
    } finally {
      setIsSending(false);
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
  const firstName = (user?.name || '').split(' ')[0];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-2xl flex flex-col h-[85vh] bg-surface-container rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={`material-symbols-outlined text-secondary ${isSpeaking ? 'animate-pulse' : ''}`}>graphic_eq</span>
            <div>
              <p className="text-sm font-bold text-on-surface">Ayla{firstName ? ` — talking with ${firstName}` : ''}</p>
              <p className="text-[11px] text-on-surface-variant">
                Question {progress.current_question || 0} of {progress.total_questions || 10} · {progress.phase_label || 'Starting'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setMuted((m) => !m); window.speechSynthesis?.cancel(); }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label={muted ? 'Unmute Ayla' : 'Mute Ayla'}
          >
            <span className="material-symbols-outlined text-lg">{muted ? 'volume_off' : 'volume_up'}</span>
          </button>
        </div>

        <div className="h-1 bg-surface-container-high shrink-0">
          <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
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
            <div className="flex justify-start">
              <div className="bg-surface-container-high rounded-2xl rounded-bl-sm px-4 py-2 text-xs text-on-surface-variant italic">
                Ayla is thinking…
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
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-secondary text-on-secondary"
            >
              Go to my dashboard
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
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-all ${isRecording ? 'bg-error text-on-error animate-pulse' : 'bg-secondary text-on-secondary'}`}
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
      </div>
    </div>
  );
}
import { useState, useEffect, useRef, useCallback } from 'react';

// Point this at your FastAPI backend (uvicorn api:app --port 8000)
const API_BASE = import.meta.env?.VITE_INTERVIEWER_API_URL || 'http://localhost:8000';

/**
 * VoiceInterviewer
 *
 * Runs the ProLign AI Interviewer (Ayla) end-to-end:
 *  - Ayla's questions are shown as text AND spoken aloud (browser SpeechSynthesis)
 *  - The mentee chooses per-turn whether to TYPE or RECORD their answer
 *  - Recorded audio is uploaded to /sessions/{id}/transcribe (Groq Whisper) and the
 *    transcript is shown back to the mentee to confirm/edit before sending
 *  - Every raw answer (typed or transcribed) is stored server-side in MongoDB via
 *    /sessions/{id}/messages; on completion the flat mentee profile is fetched from
 *    /sessions/{id}/profile
 *  - After completion, ranked mentor matches + skill-gap recommendations are
 *    fetched from /sessions/{id}/matches and shown to the mentee
 */
const VoiceInterviewer = ({ onComplete }) => {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]); // { role: 'ayla' | 'user', text, mode? }
  const [progress, setProgress] = useState({ current_question: 0, total_questions: 10, percent: 0 });
  const [inputMode, setInputMode] = useState('type'); // 'type' | 'record'
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState(null);       // { mentee, top_mentors, skill_recommendations }
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    startSession();
    return () => window.speechSynthesis?.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = useCallback((text) => {
    if (muted || !text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [muted]);

  const startSession = async () => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/sessions`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start session');
      const data = await res.json();
      setSession(data.session_id);
      setProgress(data.progress);
      setMessages([{ role: 'ayla', text: data.opening_message }]);
      setTimeout(() => speak(data.opening_message), 400);
    } catch (e) {
      setError('Could not reach the interview server. Is api.py running?');
    }
  };

  // ── Mentor matching (runs after the interview completes) ─────────────────

  const fetchMatches = async (sessionId) => {
    setIsMatching(true);
    setMatchError('');
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/matches?top_k=5`);
      if (!res.ok) {
        const detail = (await res.json().catch(() => null))?.detail;
        throw new Error(detail || 'Matching failed');
      }
      const data = await res.json();
      setMatches(data);
      return data;
    } catch (e) {
      setMatchError('Your profile was saved, but mentor matching hit a snag. You can retry.');
      return null;
    } finally {
      setIsMatching(false);
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
      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();
      setProgress(data.progress);
      setMessages((prev) => [...prev, { role: 'ayla', text: data.reply }]);
      speak(data.reply);

      if (data.is_complete) {
        setIsComplete(true);
        let profData = null;
        const profRes = await fetch(`${API_BASE}/sessions/${session}/profile`);
        if (profRes.ok) {
          profData = await profRes.json();
          setProfile(profData);
        }
        // Profile is now cleaned + stored in the `mentees` collection server-side;
        // immediately run mentor matching on the cleaned record.
        const matchData = await fetchMatches(session);
        onComplete?.(profData, matchData);
      }
    } catch (e) {
      setError('Something went wrong sending your answer. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // ── Recording (voice input → Groq Whisper transcription) ─────────────────

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAndFill(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (e) {
      setError('Microphone access was denied or is unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAndFill = async (blob) => {
    if (!session) return;
    setIsTranscribing(true);
    setError('');
    try {
      const form = new FormData();
      form.append('audio', blob, 'answer.webm');
      const res = await fetch(`${API_BASE}/sessions/${session}/transcribe`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error('Transcription failed');
      const data = await res.json();
      // Show the transcript for the mentee to confirm/edit before it's sent.
      setInput(data.text);
    } catch (e) {
      setError('Could not transcribe that recording. Try again or switch to typing.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSend = () => {
    submitAnswer(input, inputMode === 'record' ? 'voice' : 'text');
  };

  const percent = progress.percent || 0;

  const formatScore = (v) => `${Math.round((Number(v) || 0) * 100)}%`;

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-outline-variant/15 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-primary ${isSpeaking ? 'animate-pulse' : ''}`}>
            graphic_eq
          </span>
          <div>
            <p className="text-sm font-bold text-on-surface">Ayla — ProLign Interviewer</p>
            <p className="text-[10px] text-on-surface-variant">
              Q{progress.current_question || 0}/{progress.total_questions || 10} · {progress.phase_label || 'Starting'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setMuted((m) => !m); window.speechSynthesis?.cancel(); }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label={muted ? 'Unmute Ayla' : 'Mute Ayla'}
        >
          <span className="material-symbols-outlined text-lg">{muted ? 'volume_off' : 'volume_up'}</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-container-high shrink-0">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-primary text-on-primary rounded-br-sm'
                  : 'bg-surface-container-high text-on-surface rounded-bl-sm'
              }`}
            >
              {m.text}
              {m.mode === 'voice' && (
                <span className="ml-1.5 inline-flex items-center align-middle opacity-70">
                  <span className="material-symbols-outlined text-xs">mic</span>
                </span>
              )}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-surface-container-high rounded-2xl rounded-bl-sm px-3.5 py-2 text-xs text-on-surface-variant italic">
              Ayla is thinking…
            </div>
          </div>
        )}

        {/* Mentor matches (shown inline in the transcript area after completion) */}
        {isComplete && (
          <div className="pt-2 space-y-3">
            {isMatching && (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-2xl text-primary animate-spin">progress_activity</span>
                <p className="text-xs text-on-surface-variant mt-1.5">
                  Analyzing your profile and finding your best mentor matches…
                </p>
              </div>
            )}

            {matchError && (
              <div className="px-3 py-2 rounded-lg bg-error/10 text-error text-xs flex items-center justify-between gap-2">
                <span>{matchError}</span>
                <button
                  onClick={() => fetchMatches(session)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-error text-on-error text-[10px] font-bold"
                >
                  Retry
                </button>
              </div>
            )}

            {matches?.top_mentors?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-on-surface uppercase tracking-wide">
                  Your Top Mentor Matches
                </p>
                {matches.top_mentors.map((mentor) => (
                  <div
                    key={mentor.mentor_id || mentor.rank}
                    className="bg-surface-container-high rounded-2xl px-3.5 py-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                          {mentor.rank}
                        </span>
                        <p className="text-sm font-bold text-on-surface truncate">{mentor.full_name}</p>
                      </div>
                      <span className="text-[10px] font-bold text-primary bg-primary-container/60 px-2 py-0.5 rounded-full shrink-0">
                        {formatScore(mentor.final_score)} match
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">
                      {mentor.current_role}{mentor.industry ? ` · ${mentor.industry}` : ''}
                      {mentor.experience_years ? ` · ${mentor.experience_years} yrs` : ''}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-on-surface-variant/80">
                      {mentor.avg_rating ? (
                        <span className="inline-flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs text-primary fill-icon">star</span>
                          {Number(mentor.avg_rating).toFixed(1)}
                        </span>
                      ) : null}
                      {mentor.total_sessions ? <span>{mentor.total_sessions} sessions</span> : null}
                      {mentor.domain_tag ? <span className="uppercase tracking-wide">{mentor.domain_tag}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {matches?.skill_recommendations && (
              (() => {
                const recs = [
                  ...(matches.skill_recommendations.tech_skills || []).slice(0, 3),
                  ...(matches.skill_recommendations.domain_skills || []).slice(0, 2),
                  ...(matches.skill_recommendations.soft_skills || []).slice(0, 2),
                ];
                if (!recs.length) return null;
                return (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-on-surface uppercase tracking-wide">
                      Skills to Grow Into
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {recs.map((r, i) => (
                        <span
                          key={`${r.skill}-${i}`}
                          className="px-2.5 py-1 rounded-full bg-secondary-container/60 text-on-secondary-container text-[11px] font-medium capitalize"
                          title={`Found in ${r.count}/${r.out_of} of your matched mentors`}
                        >
                          {r.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        <div ref={transcriptEndRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-error/10 text-error text-xs">{error}</div>
      )}

      {/* Completion state */}
      {isComplete ? (
        <div className="p-4 border-t border-outline-variant/15 shrink-0 text-center space-y-2">
          <span className="material-symbols-outlined text-3xl text-primary">check_circle</span>
          <p className="text-sm font-bold text-on-surface">Interview complete!</p>
          <p className="text-xs text-on-surface-variant">
            {profile ? `Profile saved for ${profile.full_name || 'you'}.` : 'Saving your profile…'}
            {matches?.top_mentors?.length
              ? ` We found ${matches.top_mentors.length} mentors for you — see above.`
              : ''}
          </p>
        </div>
      ) : (
        <div className="p-3 border-t border-outline-variant/15 shrink-0 space-y-2">
          {/* Mode toggle */}
          <div className="flex gap-1.5 justify-center">
            <button
              onClick={() => setInputMode('type')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                inputMode === 'type' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              Type
            </button>
            <button
              onClick={() => setInputMode('record')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                inputMode === 'record' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              Record
            </button>
          </div>

          {inputMode === 'type' ? (
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                rows={1}
                placeholder="Type your answer…"
                className="flex-1 bg-surface-container-high border border-outline-variant/20 rounded-2xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none max-h-24"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-40 shrink-0"
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
                  <div className="w-full bg-surface-container-high rounded-xl px-3 py-2 text-sm text-on-surface">
                    {input}
                  </div>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => setInput('')}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface-variant"
                    >
                      Re-record
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={isSending}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary disabled:opacity-40"
                    >
                      Send answer
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
                    isRecording ? 'bg-error text-on-error animate-pulse' : 'bg-primary text-on-primary'
                  }`}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  <span className="material-symbols-outlined text-2xl">{isRecording ? 'stop' : 'mic'}</span>
                </button>
              )}
              {!isTranscribing && !input && (
                <p className="text-[10px] text-on-surface-variant/60">
                  {isRecording ? 'Recording… tap to stop' : 'Tap to record your answer'}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceInterviewer;
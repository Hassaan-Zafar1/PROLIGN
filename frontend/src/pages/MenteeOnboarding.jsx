import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentUser, getDB, saveDB } from '../utils/db';
import { useAuth } from '../context/AuthContext';

const steps = [
  { id: 1, label: 'Skills' },
  { id: 2, label: 'Goals' },
  { id: 3, label: 'Profile' },
];

const MenteeOnboarding = ({ navigateTo }) => {
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [goals, setGoals] = useState('');
  const [input, setInput] = useState('');
  const [transcript, setTranscript] = useState([
    { role: 'ai', text: "Welcome! I'm here to help translate your goals into a perfect mentor match. To start, what motivated you to seek mentorship today?", timestamp: new Date() }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showMobileTranscript, setShowMobileTranscript] = useState(false);

  const user = getCurrentUser();
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(null);
  const inputRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const lastAiTextRef = useRef('');
  const utteranceRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) setSpeechSupported(false);
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    if (step === 2 && transcript.length === 1 && !isAiSpeaking && !muted) {
      const timer = setTimeout(() => speakText(transcript[0].text), 600);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    // No "run once" ref guard — under React 18 StrictMode's dev-only double
    // effect invocation, a guard here would let the immediately-cleaned-up
    // first run "claim" the auto-redirect while its own cleanup cancels the
    // timer, silently preventing the real (second) run from ever redirecting.
    // The dependency array already ensures this only re-fires when `step`
    // actually changes to 3.
    if (step === 3) {
      const timer = setTimeout(finishOnboarding, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [step]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        stopSpeaking();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const speakText = useCallback((text) => {
    if (muted || !text) return;
    window.speechSynthesis?.cancel();
    setIsPaused(false);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => { setIsAiSpeaking(false); setIsPaused(false); };
    utterance.onerror = () => { setIsAiSpeaking(false); setIsPaused(false); };
    utteranceRef.current = utterance;
    window.speechSynthesis?.speak(utterance);
  }, [muted]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsAiSpeaking(false);
    setIsPaused(false);
  }, []);

  const pauseSpeaking = useCallback(() => {
    if (isAiSpeaking && window.speechSynthesis?.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsAiSpeaking(false);
    }
  }, [isAiSpeaking]);

  const resumeSpeaking = useCallback(() => {
    if (isPaused && window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsAiSpeaking(true);
    }
  }, [isPaused]);

  const replayLast = useCallback(() => {
    if (lastAiTextRef.current) {
      speakText(lastAiTextRef.current);
    }
  }, [speakText]);

  const startListening = useCallback(() => {
    if (isListening || !speechSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    try {
      finalTranscriptRef.current = '';
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInput((finalTranscriptRef.current + interim).trim());
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => {
        setInput(finalTranscriptRef.current.trim());
        finalTranscriptRef.current = '';
        setIsListening(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [isListening, speechSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  const handleSend = useCallback((text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    stopSpeaking();
    if (isListening) stopListening();
    setGoals(msg);
    setTranscript(prev => [...prev, { role: 'user', text: msg, timestamp: new Date() }]);
    setInput('');
    const aiReply = "That's great insight! Leadership often requires a mindset shift from \"doing\" to \"empowering.\" How would you describe your ideal career path in five years?";
    lastAiTextRef.current = aiReply;
    setTimeout(() => {
      setTranscript(prev => [...prev, { role: 'ai', text: aiReply, timestamp: new Date() }]);
      if (!muted) speakText(aiReply);
    }, 400);
  }, [input, stopSpeaking, isListening, stopListening, muted, speakText]);

  const finishOnboarding = () => {
    const db = getDB();
    if (user) {
      const dbUser = db.users.find(u => u.id === user.id);
      if (dbUser) {
        dbUser.skills = skills;
        dbUser.goals = goals;
        dbUser.isProfileComplete = true;
        db.currentUser = dbUser;
        saveDB(db);
        updateUser(dbUser);
      }
    }
    navigateTo('dashboard');
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const formatTime = (d) => {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) handleSend();
    }
  };

  const handleTextareaInput = (e) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    setInput(el.value);
  };

  const autoResizeTextarea = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const hasAiReplied = transcript.length >= 3;

  const ProgressDots = () => (
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <div className={`rounded-full transition-all duration-500 ${
            s.id === step
              ? 'w-2.5 h-2.5 bg-primary shadow-sm'
              : s.id < step
              ? 'w-2 h-2 bg-secondary-container'
              : 'w-2 h-2 bg-outline-variant/30'
          }`} />
          {i < steps.length - 1 && (
            <div className={`w-5 h-[2px] rounded transition-all duration-500 ${s.id < step ? 'bg-secondary-container' : 'bg-outline-variant/20'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const step2Layout = (
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      {/* ── Fixed Header: 60px ── */}
      <div className="shrink-0 h-[60px] bg-surface border-b border-outline-variant/10 flex items-center justify-between px-3 md:px-5">
        <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors shrink-0" aria-label="Go back">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex flex-col items-center min-w-0 px-2">
          <h2 className="text-xs md:text-sm font-bold text-on-surface leading-tight truncate max-w-full">AI Career Assessment</h2>
          <p className="text-[9px] md:text-[10px] text-on-surface-variant truncate max-w-full">Complete your personalized career assessment.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] md:text-[10px] font-semibold text-on-surface-variant/60 bg-surface-container-high px-2 py-0.5 rounded-full">Step 2 of 3</span>
          <button onClick={() => setShowMobileTranscript(!showMobileTranscript)} className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">{showMobileTranscript ? 'mic' : 'chat'}</span>
          </button>
        </div>
      </div>

      {/* ── Compact Progress ── */}
      <div className="shrink-0 flex justify-center pt-2 pb-2.5 border-b border-outline-variant/10">
        <ProgressDots />
      </div>

      {/* ── Main Content (flex:1, 35/65 split) ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 max-w-6xl mx-auto w-full">
        {/* Left Panel — 35% */}
        <div className={`${showMobileTranscript ? 'hidden' : 'flex'} md:flex flex-col items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-4 md:w-[35%] shrink-0`}>
          <div className="relative">
            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg relative transition-all duration-500 ${isAiSpeaking ? 'scale-105' : 'scale-100'}`}>
              <div className={`absolute inset-0 rounded-full border-[3px] transition-all duration-700 ${isAiSpeaking ? 'border-secondary border-opacity-60 voice-active-ring' : 'border-primary/20'}`} />
              {isAiSpeaking && <div className="absolute inset-0 rounded-full bg-secondary/10 animate-ping opacity-30" />}
              <span className="material-symbols-outlined text-surface-bright text-3xl md:text-4xl fill-icon relative z-10">psychology</span>
            </div>
            {isAiSpeaking && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-[3px]">
                {[0.1, 0.3, 0.5].map((d, i) => (
                  <div key={i} className="w-[3px] h-3 md:h-3.5 bg-secondary rounded-full" style={{ animation: `waveform-pulse 1.2s ease-in-out infinite`, animationDelay: `${d}s` }} />
                ))}
              </div>
            )}
            {isListening && (
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 md:w-7 md:h-7 bg-error/10 rounded-full flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-error text-[11px] md:text-xs fill-icon">mic</span>
              </div>
            )}
          </div>

              <p className="text-xs md:text-sm font-bold text-on-surface text-center px-2 leading-snug max-w-[180px] sm:max-w-[220px]">
            {transcript.length <= 1
              ? "Tell me what motivated you to seek mentorship today."
              : "How would you describe your ideal career path in five years?"}
          </p>

          <div className="flex items-center gap-1.5">
          <button
            onClick={toggleListening}
            disabled={!speechSupported}
            className={`relative w-10 h-10 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                isListening
                  ? 'bg-error text-on-error scale-110 shadow-md shadow-error/30'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-primary-container'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
              title={speechSupported ? (isListening ? 'Stop listening' : 'Start listening') : 'Speech not available'}
            >
              <span className="material-symbols-outlined text-lg md:text-xl fill-icon">{isListening ? 'mic_off' : 'mic'}</span>
              {isListening && <span className="absolute inset-0 rounded-full border-2 border-error animate-ping opacity-40" />}
            </button>

            <div className="flex items-center gap-1 px-2 py-1 bg-surface-container-high rounded-full">
              <button
                onClick={() => setMuted(!muted)}
                className={`w-9 h-9 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-colors ${muted ? 'text-on-surface-variant' : 'text-primary bg-primary-container'}`}
                aria-label={muted ? 'Unmute AI voice' : 'Mute AI voice'}
                title={muted ? 'Unmute' : 'Mute'}
              >
                <span className="material-symbols-outlined text-sm md:text-base fill-icon">{muted ? 'volume_off' : 'volume_up'}</span>
              </button>
              {(isAiSpeaking || isPaused) && (
                <button onClick={isPaused ? resumeSpeaking : pauseSpeaking} className="w-9 h-9 md:w-8 md:h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-container transition-colors" aria-label={isPaused ? 'Resume' : 'Pause'} title={isPaused ? 'Resume' : 'Pause'}>
                  <span className="material-symbols-outlined text-sm md:text-base fill-icon">{isPaused ? 'play_arrow' : 'pause'}</span>
                </button>
              )}
              {lastAiTextRef.current && !isAiSpeaking && !isPaused && (
                <button onClick={replayLast} className="w-9 h-9 md:w-8 md:h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-container transition-colors" aria-label="Replay" title="Replay">
                  <span className="material-symbols-outlined text-sm md:text-base fill-icon">replay</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
            <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-error animate-pulse' : isAiSpeaking ? 'bg-secondary animate-pulse' : isPaused ? 'bg-warning' : 'bg-on-surface-variant/30'}`} />
            <span>{isListening ? 'Listening' : isAiSpeaking ? 'Speaking' : isPaused ? 'Paused' : 'Idle'}</span>
          </div>
        </div>

        {/* Right Panel — 65% */}
        <div className={`${showMobileTranscript ? 'flex' : 'hidden'} md:flex flex-col md:w-[65%] border-l border-outline-variant/10 bg-surface-container-lowest overflow-hidden min-h-0`}>
          <div className="shrink-0 flex items-center justify-between px-3 md:px-4 py-2 border-b border-outline-variant/10">
            <h3 className="text-[9px] md:text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">chat</span>
              Conversation
            </h3>
            <span className="text-[9px] md:text-[10px] text-on-surface-variant/50 font-medium">{transcript.length} messages</span>
          </div>

          <div ref={transcriptRef} className="flex-1 overflow-y-auto px-2 md:px-3 py-3 space-y-3 chat-scroll min-h-0">
            {transcript.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-1 animate-[fadeIn_0.25s_ease-out] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-semibold tracking-wide uppercase">{msg.role === 'user' ? <span className="text-on-surface-variant/50">You</span> : <span className="text-secondary">ProLign AI</span>}</span>
                  {msg.role === 'ai' && i === transcript.length - 1 && isAiSpeaking && (
                    <span className="flex items-center gap-[2px]">
                      <span className="w-[3px] h-[3px] bg-secondary rounded-full animate-bounce" style={{animationDelay: '0s'}} />
                      <span className="w-[3px] h-[3px] bg-secondary rounded-full animate-bounce" style={{animationDelay: '0.15s'}} />
                      <span className="w-[3px] h-[3px] bg-secondary rounded-full animate-bounce" style={{animationDelay: '0.3s'}} />
                    </span>
                  )}
                  <span className="text-[9px] text-on-surface-variant/30">{formatTime(msg.timestamp)}</span>
                </div>
                <div className={`px-3 py-2 text-xs md:text-sm leading-relaxed max-w-[70%] break-words shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-on-primary rounded-[16px] rounded-br-[4px]'
                    : 'bg-secondary-container/70 text-on-secondary-container rounded-[16px] rounded-bl-[4px]'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div className="h-[2px]" />
          </div>
        </div>
      </div>

      {/* ── Fixed Input Bar (70px) + Nav Footer (60px) ── */}
      <div className="shrink-0 bg-surface border-t border-outline-variant/10">
        {/* Input */}
        <div className="flex items-end gap-2 px-3 md:px-5 pt-2.5 pb-2 max-w-6xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={(el) => { inputRef.current = el; autoResizeTextarea(el); }}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleTextareaKeyDown}
              rows={1}
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-[18px] px-3.5 py-2 pr-10 text-xs md:text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/40 resize-none overflow-hidden leading-relaxed max-h-[80px]"
              placeholder={isListening ? 'Listening...' : 'Type your response or speak using the microphone...'}
              disabled={isListening}
              aria-label="Message input"
            />
            {input && !isListening && (
              <button onClick={() => setInput('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-on-surface-variant transition-colors" aria-label="Clear input">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
          <button
            onClick={toggleListening}
            disabled={!speechSupported}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${isListening ? 'bg-error text-on-error shadow-md animate-pulse' : 'bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-primary-container'} disabled:opacity-40 disabled:cursor-not-allowed`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            title="Ctrl+M to toggle"
          >
            <span className="material-symbols-outlined text-base fill-icon">{isListening ? 'mic_off' : 'mic'}</span>
          </button>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isListening}
            className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-sm"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-base fill-icon">send</span>
          </button>
        </div>

        {/* Nav Footer (60px) */}
        <div className="flex items-center justify-between px-3 md:px-5 py-2 border-t border-outline-variant/10 max-w-6xl mx-auto h-[44px]">
          <div className="flex items-center gap-2">
            <button onClick={() => navigateTo('dashboard')} className="text-[10px] text-on-surface-variant/40 hover:text-on-surface-variant transition-colors font-medium min-h-[44px] flex items-center">Exit</button>
            {typeof window !== 'undefined' && !speechSupported && (
              <span className="text-[9px] text-on-surface-variant/30 italic">Voice not available</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasAiReplied ? (
              <button onClick={() => setStep(3)} className="text-[10px] md:text-xs font-bold bg-secondary/10 text-secondary hover:bg-secondary/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                Continue
              </button>
            ) : (
                <button onClick={() => setStep(3)} className="text-[10px] text-on-surface-variant/40 hover:text-on-surface-variant transition-colors font-medium flex items-center gap-1 min-h-[44px]">
                Skip
                <span className="material-symbols-outlined text-xs">skip_next</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {step === 1 && (
        <div className="h-full overflow-y-auto flex items-start justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-[20px] border border-outline-variant/10 shadow-sm overflow-hidden mt-4 md:mt-8">
            <div className="brand-panel-horizontal px-5 py-5 text-on-primary text-center">
              <span className="material-symbols-outlined text-3xl mb-2 fill-icon">psychology</span>
              <h1 className="text-xl font-bold mb-1">AI Career Assessment</h1>
              <p className="text-on-primary/80 text-xs">Let's tailor your ProLign experience to your goals.</p>
              <div className="mt-4">
                <ProgressDots />
              </div>
            </div>

            <div className="p-5 flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-on-surface mb-1">What are your current skills?</h2>
                <p className="text-xs text-on-surface-variant">Add the technical and soft skills you currently possess.</p>
              </div>

              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  placeholder="e.g. React, Python, Leadership"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface-bright text-sm"
                />
                <button type="submit" className="px-5 py-2.5 bg-secondary text-on-secondary rounded-xl font-medium text-sm hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm shrink-0">Add</button>
              </form>

              <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-gradient-to-br from-surface-container-low to-surface-variant/20 rounded-[18px] border-2 border-secondary/15 overflow-y-auto">
                {skills.length === 0 && <span className="text-on-surface-variant/50 italic self-center mx-auto text-xs">No skills added yet</span>}
                {skills.map(skill => (
                  <span key={skill} className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-xl text-xs font-semibold border border-secondary/20 shadow-sm hover:shadow-md hover:border-secondary/40 transition-all duration-200">
                    <span className="text-primary">{skill}</span>
                    <button onClick={() => handleRemoveSkill(skill)} className="text-on-surface-variant/60 group-hover:text-error transition-colors flex items-center">
                      <span className="material-symbols-outlined text-sm fill-icon">cancel</span>
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-outline-variant/20">
                <button onClick={() => navigateTo('dashboard')} className="text-on-surface-variant hover:text-primary transition-colors font-medium flex items-center gap-1.5 text-xs">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back to Home
                </button>
                <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:bg-primary-container hover:shadow-lg transition-all shadow-md flex items-center gap-1.5 min-h-[44px]">
                  Next Step
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && step2Layout}

      {step === 3 && (
        <div className="h-full flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-[20px] border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="px-6 py-5 text-center flex flex-col items-center gap-5">
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 bg-primary-container text-primary rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 voice-active-ring" />
                  <span className="material-symbols-outlined text-4xl fill-icon">auto_awesome</span>
                </div>
                <div className="absolute top-0 -right-6 w-8 h-8 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <span className="material-symbols-outlined text-sm fill-icon">mic</span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-on-surface mb-2">Generating Your Profile...</h2>
                <p className="text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                  Our AI is analyzing your skills and goals to create a personalized growth roadmap and match you with ideal mentors.
                </p>
              </div>
              <div className="flex justify-between w-full pt-4 border-t border-outline-variant/20">
                <button onClick={() => setStep(2)} className="text-on-surface-variant hover:text-primary transition-colors font-medium flex items-center gap-1.5 text-xs min-h-[44px]">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back
                </button>
                <button onClick={finishOnboarding} className="px-6 py-2.5 bg-secondary text-on-secondary rounded-xl font-bold text-sm hover:bg-secondary-container hover:text-on-secondary-container hover:shadow-lg transition-all shadow-md flex items-center gap-1.5 min-h-[44px]">
                  Go to Dashboard
                  <span className="material-symbols-outlined text-sm">check</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenteeOnboarding;

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { interviewService } from '../services/interviewService';

/**
 * Mentee onboarding — text-based AI interview (Task 7).
 *
 * Flow: Signup → OTP → *Interview* → Dashboard.
 *
 * This is the interview FRAMEWORK only — NO LLM. Questions are a static, easily
 * swappable config; answers are collected one at a time (chat style) and stored
 * via the interview service. When the platform's AI model is ready it can (a)
 * generate/adapt these questions and (b) process the stored responses — no UI
 * change required here.
 */

// ── Question framework ─────────────────────────────────────────────────────────
// `id`s are the contract with the backend mapping. Types: text | textarea | choice | tags.
const INTERVIEW_QUESTIONS = [
  { id: 'career_goal', type: 'textarea', prompt: "What's your primary career goal right now?", placeholder: 'e.g. Become a senior backend engineer within 2 years', icon: 'flag' },
  { id: 'current_skills', type: 'tags', prompt: 'Which skills do you already have?', placeholder: 'Type a skill and press Enter', icon: 'psychology' },
  { id: 'experience_level', type: 'choice', prompt: 'How would you describe your experience level?', options: ['Beginner', 'Junior', 'Mid-level', 'Senior'], icon: 'stairs' },
  { id: 'learning_style', type: 'choice', prompt: 'How do you prefer to learn?', options: ['1:1 mentoring', 'Hands-on projects', 'Structured curriculum', 'Peer discussion'], icon: 'school' },
  { id: 'interests', type: 'tags', prompt: 'What areas are you most interested in?', placeholder: 'e.g. Machine Learning, Product', icon: 'interests' },
  { id: 'available_time', type: 'choice', prompt: 'How much time can you commit weekly?', options: ['1–2 hours', '3–5 hours', '5–10 hours', '10+ hours'], icon: 'schedule' },
  { id: 'challenges', type: 'textarea', prompt: "What's the biggest challenge you're facing?", placeholder: 'Tell us what you’re struggling with', icon: 'lightbulb' },
];

const hasAnswer = (q, value) =>
  q.type === 'tags' ? Array.isArray(value) && value.length > 0 : Boolean(value && String(value).trim());

export default function MenteeInterview({ navigateTo }) {
  const { user, updateUser } = useAuth();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [tagDraft, setTagDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const question = INTERVIEW_QUESTIONS[index];
  const total = INTERVIEW_QUESTIONS.length;
  const isLast = index === total - 1;
  const value = answers[question.id];
  const progress = Math.round((index / total) * 100);
  const firstName = (user?.name || '').split(' ')[0];

  // Focus the input when the question changes (not a setState-in-effect).
  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  const setAnswer = (val) => setAnswers((prev) => ({ ...prev, [question.id]: val }));

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    const current = Array.isArray(value) ? value : [];
    if (!current.includes(t)) setAnswer([...current, t]);
    setTagDraft('');
  };

  const removeTag = (t) => setAnswer((Array.isArray(value) ? value : []).filter((x) => x !== t));

  const goNext = () => {
    setError('');
    if (isLast) return submit();
    setIndex((i) => Math.min(i + 1, total - 1));
    return undefined;
  };

  const goBack = () => {
    setError('');
    setIndex((i) => Math.max(i - 1, 0));
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    const payload = INTERVIEW_QUESTIONS.map((q) => ({
      id: q.id,
      question: q.prompt,
      answer: answers[q.id] ?? '',
    }));
    try {
      const res = await interviewService.submitInterview(payload, 'text');
      if (res?.user) updateUser(res.user);
      navigateTo('mentee-dashboard');
    } catch {
      setError("We couldn't save your responses. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/5 via-background to-primary/5 px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">forum</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Let's get to know you{firstName ? `, ${firstName}` : ''}</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            A few quick questions so we can match you with the right mentors.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-2">
            <span>Question {index + 1} of {total}</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question card */}
        <div key={index} className="bg-surface rounded-3xl border border-outline-variant/10 shadow-lg p-6 sm:p-8 animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">{question.icon}</span>
            </div>
            <h2 className="text-lg font-bold text-on-surface pt-1.5">{question.prompt}</h2>
          </div>

          {/* Input by type */}
          {question.type === 'textarea' && (
            <textarea
              ref={inputRef}
              rows={4}
              value={value || ''}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={question.placeholder}
              className="w-full bg-surface-dim border border-outline-variant/20 rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none resize-none transition-all placeholder:text-on-surface-variant/50"
            />
          )}

          {question.type === 'text' && (
            <input
              ref={inputRef}
              type="text"
              value={value || ''}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={question.placeholder}
              className="w-full bg-surface-dim border border-outline-variant/20 rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none transition-all placeholder:text-on-surface-variant/50"
            />
          )}

          {question.type === 'choice' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map((opt) => {
                const selected = value === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswer(opt)}
                    className={`min-h-[44px] px-4 py-3 rounded-xl text-sm font-semibold text-left border transition-all ${
                      selected
                        ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
                        : 'bg-surface-dim text-on-surface border-outline-variant/20 hover:border-secondary/40'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[18px] ${selected ? '' : 'text-on-surface-variant/40'}`}>
                        {selected ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {question.type === 'tags' && (
            <div>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder={question.placeholder}
                  className="flex-1 bg-surface-dim border border-outline-variant/20 rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none transition-all placeholder:text-on-surface-variant/50"
                />
                <button
                  onClick={addTag}
                  className="min-h-[44px] px-4 rounded-xl bg-secondary/15 text-secondary font-semibold hover:bg-secondary/25 transition-colors"
                >
                  Add
                </button>
              </div>
              {Array.isArray(value) && value.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {value.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 bg-secondary/10 text-secondary text-sm font-medium px-3 py-1.5 rounded-full">
                      {t}
                      <button onClick={() => removeTag(t)} className="hover:text-error" aria-label={`Remove ${t}`}>
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-error text-sm font-semibold mt-4">{error}</p>}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 gap-3">
            <button
              onClick={goBack}
              disabled={index === 0 || submitting}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-outline-variant/20 text-on-surface font-semibold text-sm hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={goNext}
              disabled={!hasAnswer(question, value) || submitting}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:brightness-110 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Saving…
                </>
              ) : isLast ? (
                <>Finish<span className="material-symbols-outlined text-[18px]">check</span></>
              ) : (
                <>Next<span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-on-surface-variant/60 mt-4">
          Your answers help us personalize your mentor recommendations.
        </p>
      </div>
    </div>
  );
}

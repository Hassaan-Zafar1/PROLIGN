import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, getDB, saveDB } from '../utils/db';

const steps = [
  { id: 1, label: 'Skills' },
  { id: 2, label: 'Goals' },
  { id: 3, label: 'Profile' },
];

const StepIndicator = ({ currentStep }) => (
  <div className="mb-8">
    <div className="flex justify-between items-center mb-4">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              currentStep === s.id ? 'bg-primary text-on-primary shadow-md' :
              currentStep > s.id ? 'bg-secondary-container text-on-secondary-container' :
              'bg-surface-container-high text-on-surface-variant'
            }`}>
              {currentStep > s.id ? <span className="material-symbols-outlined text-lg fill-icon">check</span> : s.id}
            </div>
            <span className={`mt-2 text-xs font-semibold ${currentStep >= s.id ? 'text-primary' : 'text-on-surface-variant'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 mt-[-1.5rem] ${currentStep > s.id ? 'bg-secondary-container' : 'bg-surface-container-high'}`} />
          )}
        </div>
      ))}
    </div>
  </div>
);

const MenteeOnboarding = ({ navigateTo }) => {
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [goals, setGoals] = useState('');

  const user = getCurrentUser();
  const hasAutoRedirected = useRef(false);

  const finishOnboarding = () => {
    const db = getDB();
    if (user) {
      const dbUser = db.users.find(u => u.id === user.id);
      if (dbUser) {
        dbUser.skills = skills;
        dbUser.goals = goals;
        db.currentUser = dbUser;
        saveDB(db);
      }
    }
    navigateTo('dashboard');
  };

  useEffect(() => {
    if (step === 3 && !hasAutoRedirected.current) {
      hasAutoRedirected.current = true;
      const timer = setTimeout(finishOnboarding, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, finishOnboarding]);

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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="mx-auto w-full max-w-3xl bg-surface-container-lowest rounded-3xl natural-shadow overflow-hidden border border-outline-variant flex flex-col">
        {/* Header */}
        <div className="bg-primary px-8 py-8 text-on-primary text-center">
          <span className="material-symbols-outlined text-5xl mb-4 fill-icon">psychology</span>
          <h1 className="text-3xl font-bold mb-2">AI Career Assessment</h1>
          <p className="text-on-primary/80">Let's tailor your ProLign experience to your goals.</p>
          <div className="mt-6">
            <StepIndicator currentStep={step} />
          </div>
        </div>

        <div className="p-8 flex flex-col">
          {/* Step 1: Skills */}
          {step === 1 && (
            <div className="animate-fade-in flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold text-on-surface mb-2">What are your current skills?</h2>
                <p className="text-on-surface-variant">Add the technical and soft skills you currently possess.</p>
              </div>

              <form onSubmit={handleAddSkill} className="flex gap-4">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  placeholder="e.g. React, Python, Leadership"
                  className="flex-1 px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface-bright"
                />
                <button type="submit" className="px-6 py-3 bg-secondary text-on-secondary rounded-xl font-medium hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm">Add</button>
              </form>

              <div className="flex flex-wrap gap-3 min-h-[120px] p-5 bg-gradient-to-br from-surface-container-low to-surface-variant/20 rounded-xl border-2 border-secondary/15">
                {skills.length === 0 && <span className="text-on-surface-variant/50 italic self-center mx-auto text-sm">No skills added yet</span>}
                {skills.map(skill => (
                  <span key={skill} className="group inline-flex items-center gap-2 px-4 py-2 bg-surface rounded-xl text-sm font-semibold border border-secondary/20 shadow-sm hover:shadow-md hover:border-secondary/40 transition-all duration-200">
                    <span className="text-primary">{skill}</span>
                    <button onClick={() => handleRemoveSkill(skill)} className="text-on-surface-variant/60 group-hover:text-error transition-colors flex items-center">
                      <span className="material-symbols-outlined text-lg fill-icon">cancel</span>
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20">
                <button onClick={() => navigateTo('dashboard')} className="text-on-surface-variant hover:text-primary transition-colors font-medium flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Back to Home
                </button>
                <button onClick={() => setStep(2)} className="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container hover:shadow-lg transition-all shadow-md flex items-center gap-2">
                  Next Step
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Goals / AI Chat */}
          {step === 2 && (
            <div className="animate-fade-in flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold text-on-surface mb-2">Tell us about your goals</h2>
                <p className="text-on-surface-variant">Describe your ideal career path and what you're looking for in a mentor.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative flex flex-col items-center justify-center bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden py-12 natural-shadow">
                  <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg relative">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20 voice-active-ring"></div>
                      <span className="material-symbols-outlined text-surface-bright text-5xl fill-icon">psychology</span>
                    </div>
                    <div className="flex items-center gap-1.5 h-16">
                      {[0.1, 0.3, 0.5, 0.2, 0.4, 0.6, 0.8].map((d, i) => (
                        <div key={i} className="waveform-bar w-1.5 bg-primary rounded-full" style={{ animationDelay: `${d}s` }} />
                      ))}
                    </div>
                    <p className="text-xl font-bold text-primary text-center px-4 leading-relaxed">"How would you describe your ideal career path in five years?"</p>
                  </div>
                </div>

                <div className="flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low">
                    <h2 className="text-sm font-semibold text-on-surface-variant flex items-center gap-2 uppercase tracking-wider">
                      <span className="material-symbols-outlined text-sm">history</span>
                      Interview Transcript
                    </h2>
                  </div>
                  <div className="chat-scroll flex-grow overflow-y-auto p-5 space-y-5" style={{ maxHeight: '400px' }}>
                    <div className="flex flex-col gap-1 max-w-[85%]">
                      <span className="text-xs text-primary font-bold">ProLign AI</span>
                      <div className="bg-surface-container p-4 rounded-tr-xl rounded-br-xl rounded-bl-xl text-on-surface text-sm leading-relaxed">
                        Welcome! I'm here to help translate your goals into a perfect mentor match. To start, what motivated you to seek mentorship today?
                      </div>
                    </div>
                    {goals && (
                      <div className="flex flex-col gap-1 max-w-[85%] ml-auto items-end">
                        <span className="text-xs text-secondary font-bold">You</span>
                        <div className="bg-primary text-on-primary p-4 rounded-tl-xl rounded-br-xl rounded-bl-xl text-sm leading-relaxed">{goals}</div>
                      </div>
                    )}
                    <div className="flex flex-col gap-1 max-w-[85%]">
                      <span className="text-xs text-primary font-bold">ProLign AI</span>
                      <div className="bg-surface-container p-4 rounded-tr-xl rounded-br-xl rounded-bl-xl text-on-surface text-sm leading-relaxed">
                        That's great insight! Leadership often requires a mindset shift from "doing" to "empowering." How would you describe your ideal career path in five years?
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant opacity-60 italic text-sm font-semibold px-5 py-3 border-t border-outline-variant/10">
                    <span className="material-symbols-outlined text-sm animate-pulse">settings_voice</span>
                    Listening...
                  </div>
                </div>
              </div>

              <div className="relative">
                <input
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-full px-6 py-4 pr-24 text-sm focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none"
                  placeholder="Type your response here..."
                  type="text"
                  onKeyDown={(e) => { if (e.key === 'Enter' && goals.trim()) setStep(3); }}
                />
                {goals && (
                  <button onClick={() => setGoals('')} className="absolute right-14 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors p-1">
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                )}
                <button onClick={() => goals.trim() && setStep(3)} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-secondary transition-colors bg-surface-container-highest rounded-full p-2">
                  <span className="material-symbols-outlined text-2xl">send</span>
                </button>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20">
                <button onClick={() => setStep(1)} className="text-on-surface-variant hover:text-primary transition-colors font-medium flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Back
                </button>
                <button onClick={() => setStep(3)} className="text-secondary hover:text-primary transition-colors font-bold flex items-center gap-1 text-sm">
                  Skip to next step
                  <span className="material-symbols-outlined text-base">skip_next</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Generating Profile */}
          {step === 3 && (
            <div className="animate-fade-in text-center py-8 flex flex-col items-center gap-6">
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 bg-primary-container text-primary rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 voice-active-ring"></div>
                  <span className="material-symbols-outlined text-5xl fill-icon">auto_awesome</span>
                </div>
                <div className="absolute top-0 -right-8 w-10 h-10 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <span className="material-symbols-outlined text-lg fill-icon">mic</span>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-on-surface mb-4">Generating Your Profile...</h2>
                <p className="text-on-surface-variant max-w-md mx-auto leading-relaxed">
                  Our AI is analyzing your skills and goals to create a personalized growth roadmap and match you with ideal mentors.
                </p>
              </div>

              <div className="flex justify-between w-full pt-8 border-t border-outline-variant/20">
                <button onClick={() => setStep(2)} className="text-on-surface-variant hover:text-primary transition-colors font-medium flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Back
                </button>
                <button onClick={finishOnboarding} className="px-8 py-3 bg-secondary text-on-secondary rounded-xl font-bold hover:bg-secondary-container hover:text-on-secondary-container hover:shadow-lg transition-all shadow-md flex items-center gap-2">
                  Go to Dashboard
                  <span className="material-symbols-outlined text-lg">check</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenteeOnboarding;

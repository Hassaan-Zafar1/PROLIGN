import React, { useState } from 'react';
import { getCurrentUser, getDB, saveDB } from '../utils/db';

const MenteeOnboarding = ({ navigateTo }) => {
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [goals, setGoals] = useState('');
  
  const user = getCurrentUser();

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

  const finishOnboarding = () => {
    // Save to DB
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

  const renderStep2 = () => (
    <div className="animate-fade-in flex flex-col flex-grow w-full h-full">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <h1 className="font-headline-md text-2xl text-primary font-bold">Step 2: AI Profile Analysis</h1>
          <span className="font-label-sm text-sm font-semibold text-on-surface-variant">66% complete</span>
        </div>
        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
          <div className="h-full bg-primary w-[66%] transition-all duration-700 ease-out"></div>
        </div>
      </div>

      {/* Split Screen Main Area */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left Column: AI Avatar / Waveform */}
        <div className="relative flex flex-col items-center justify-center bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden py-16 natural-shadow">
          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg relative">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 voice-active-ring"></div>
              <span className="material-symbols-outlined text-surface-bright text-6xl fill-icon">psychology</span>
            </div>
            {/* Waveform Visualization */}
            <div className="flex items-center gap-1.5 h-24">
              <div className="waveform-bar w-1.5 bg-primary rounded-full" style={{animationDelay: '0.1s'}}></div>
              <div className="waveform-bar w-1.5 bg-secondary rounded-full" style={{animationDelay: '0.3s'}}></div>
              <div className="waveform-bar w-1.5 bg-primary rounded-full" style={{animationDelay: '0.5s'}}></div>
              <div className="waveform-bar w-1.5 bg-secondary rounded-full" style={{animationDelay: '0.2s'}}></div>
              <div className="waveform-bar w-1.5 bg-primary rounded-full" style={{animationDelay: '0.4s'}}></div>
              <div className="waveform-bar w-1.5 bg-secondary rounded-full" style={{animationDelay: '0.6s'}}></div>
              <div className="waveform-bar w-1.5 bg-primary rounded-full" style={{animationDelay: '0.8s'}}></div>
            </div>
            <p className="font-headline-md text-2xl font-bold text-primary text-center px-6 leading-relaxed">"How would you describe your ideal career path in five years?"</p>
          </div>
        </div>

        {/* Right Column: Chat Transcript */}
        <div className="flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden h-[500px]">
          <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low">
            <h2 className="font-label-sm text-sm font-semibold text-on-surface-variant flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">history</span>
              Interview Transcript
            </h2>
          </div>
          <div className="chat-scroll flex-grow overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col gap-1 max-w-[85%]">
              <span className="font-label-sm text-sm text-primary font-bold">MentorBridge AI</span>
              <div className="bg-surface-container p-4 rounded-tr-xl rounded-br-xl rounded-bl-xl text-on-surface text-sm leading-relaxed">
                Welcome! I'm here to help translate your goals into a perfect mentor match. To start, what motivated you to seek mentorship today?
              </div>
            </div>
            
            {goals && (
              <div className="flex flex-col gap-1 max-w-[85%] ml-auto items-end">
                <span className="font-label-sm text-sm text-secondary font-bold">You</span>
                <div className="bg-primary text-on-primary p-4 rounded-tl-xl rounded-br-xl rounded-bl-xl text-sm leading-relaxed">
                  {goals}
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-1 max-w-[85%]">
              <span className="font-label-sm text-sm text-primary font-bold">MentorBridge AI</span>
              <div className="bg-surface-container p-4 rounded-tr-xl rounded-br-xl rounded-bl-xl text-on-surface text-sm leading-relaxed">
                That's a very common but crucial transition. Leadership often requires a mindset shift from "doing" to "empowering." How would you describe your ideal career path in five years?
              </div>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant opacity-60 italic text-sm font-semibold">
              <span className="material-symbols-outlined text-sm animate-pulse">settings_voice</span>
              Listening...
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/10 rounded-full scale-125 group-hover:scale-150 transition-transform duration-500 blur-xl"></div>
          <button className="relative w-20 h-20 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-10">
            <span className="material-symbols-outlined text-4xl fill-icon">mic</span>
          </button>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 font-label-sm text-xs font-bold text-primary bg-surface-bright px-2 py-0.5 rounded border border-primary/20 shadow-sm whitespace-nowrap">Speak</div>
        </div>
        
        <div className="w-full max-w-xl relative group mt-2">
          <input 
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none" 
            placeholder="Type your response instead..." 
            type="text"
            onKeyDown={(e) => { if(e.key === 'Enter') setStep(3) }}
          />
          <button onClick={() => setStep(3)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-secondary transition-colors bg-surface-container-highest rounded-full p-1">
            <span className="material-symbols-outlined text-2xl">send</span>
          </button>
        </div>
        
        <div className="flex justify-between w-full max-w-xl mt-2 px-2">
           <button 
            onClick={() => setStep(1)}
            className="text-on-surface-variant hover:text-primary transition-colors font-medium flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back
          </button>
          <button 
            onClick={() => setStep(3)}
            className="text-secondary hover:text-primary transition-colors font-bold flex items-center gap-1 text-sm"
          >
            Skip to next step
            <span className="material-symbols-outlined text-[16px]">skip_next</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className={`mx-auto w-full transition-all duration-500 flex flex-col flex-grow ${step === 2 ? 'max-w-5xl' : 'max-w-3xl bg-surface-container-lowest rounded-3xl natural-shadow overflow-hidden border border-outline-variant'}`}>
        
        {step !== 2 && (
          <div className="bg-primary px-8 py-10 text-on-primary text-center">
            <span className="material-symbols-outlined text-5xl mb-4 fill-icon">psychology</span>
            <h1 className="text-3xl font-headline-md font-bold mb-2">AI Career Assessment</h1>
            <p className="text-on-primary/80">Let's tailor your MentorBridge experience to your goals.</p>
            
            <div className="flex justify-center mt-8 space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-2 rounded-full transition-all ${step >= i ? 'w-12 bg-secondary-container' : 'w-4 bg-on-primary/30'}`}></div>
              ))}
            </div>
          </div>
        )}

        <div className={`flex-grow flex flex-col ${step === 2 ? '' : 'p-8'}`}>
          {step === 1 && (
            <div className="animate-fade-in flex flex-col h-full">
              <h2 className="text-2xl font-bold text-on-surface mb-6">What are your current skills?</h2>
              <p className="text-on-surface-variant mb-6">Add the technical and soft skills you currently possess.</p>
              
              <form onSubmit={handleAddSkill} className="flex space-x-4 mb-6">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  placeholder="e.g. React, Python, Leadership"
                  className="flex-1 px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface-bright"
                />
                <button type="submit" className="px-6 py-3 bg-secondary text-on-secondary rounded-xl font-medium hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm">
                  Add
                </button>
              </form>
              
              <div className="flex flex-wrap gap-2 mb-8 min-h-[120px] p-4 bg-surface-variant/30 rounded-xl border border-dashed border-outline-variant">
                {skills.length === 0 && <span className="text-on-surface-variant/60 italic self-center mx-auto text-sm">No skills added yet</span>}
                {skills.map(skill => (
                  <span key={skill} className="inline-flex items-center space-x-1 px-3 py-1.5 bg-surface-container-high text-on-surface rounded-full text-sm font-semibold border border-outline-variant/30 natural-shadow">
                    <span>{skill}</span>
                    <button onClick={() => handleRemoveSkill(skill)} className="text-on-surface-variant hover:text-error transition-colors flex items-center">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex justify-end mt-auto">
                <button 
                  onClick={() => setStep(2)}
                  className="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container hover:shadow-lg transition-all shadow-md flex items-center space-x-2"
                >
                  <span>Next Step</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && renderStep2()}

          {step === 3 && (
            <div className="animate-fade-in text-center py-12 flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-primary-container text-primary rounded-full flex items-center justify-center mx-auto mb-8 relative">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 voice-active-ring"></div>
                <span className="material-symbols-outlined text-5xl fill-icon">auto_awesome</span>
              </div>
              <h2 className="text-3xl font-headline-md font-bold text-on-surface mb-4">Generating Your Profile...</h2>
              <p className="text-on-surface-variant max-w-md mx-auto mb-12 leading-relaxed">
                Our AI is analyzing your skills and goals to create a personalized growth roadmap and match you with ideal mentors.
              </p>
              
              <div className="flex justify-between w-full mt-auto pt-8 border-t border-outline-variant/20">
                 <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-3 text-on-surface-variant hover:text-primary transition-colors font-medium flex items-center space-x-2"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Back</span>
                </button>
                <button 
                  onClick={finishOnboarding}
                  className="px-8 py-3 bg-secondary text-on-secondary rounded-xl font-bold hover:bg-secondary-container hover:text-on-secondary-container hover:shadow-lg transition-all shadow-md flex items-center space-x-2"
                >
                  <span>Go to Dashboard</span>
                  <span className="material-symbols-outlined text-[18px]">check</span>
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

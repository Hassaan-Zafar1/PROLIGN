import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, getSessions, getMentors, completeSession } from '../utils/db';
import { errorHandler } from '../utils/errorHandler';

export default function VideoInterview({ onNavigate, sessionId }) {
  const user = getCurrentUser();
  const [session, setSession] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Real-time states
  const [notes, setNotes] = useState('');
  const [transcript, setTranscript] = useState([
    { sender: "Mentor", text: "Focus on the hierarchy of the landing page. The user needs to understand the value prop in 3 seconds.", time: "14:20" }
  ]);
  const [aiSuggestions, setAiSuggestions] = useState([
    { id: 1, text: "Aris mentioned 'Typography Scales'. Would you like me to bookmark the Type Systems Guide for later?", bookmarkLabel: "Type Systems Guide" }
  ]);

  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  useEffect(() => {
    if (!user) {
      onNavigate('login');
      return;
    }
    const sessions = getSessions();
    const currentSession = sessions.find(s => s.id === sessionId) || sessions[0];
    setSession(currentSession);

    const mentors = getMentors();
    const targetMentor = mentors.find(m => m.id === currentSession?.mentorId);
    setMentor(targetMentor);

    // Dynamic transcript/AI simulation timer
    const transcriptTimer = setTimeout(() => {
      setTranscript(prev => [...prev, {
        sender: "Mentor",
        text: "Make sure you include Google fonts like Playfair Display and Source Sans 3 inside your global CSS.",
        time: "14:25"
      }]);
      setAiSuggestions(prev => [...prev, {
        id: 2,
        text: "Aris mentioned 'Google Fonts'. Should I bookmark the Web Fonts Optimization Guide?",
        bookmarkLabel: "Web Fonts Guide"
      }]);
    }, 12000);

    return () => {
      clearTimeout(transcriptTimer);
    };
  }, [sessionId, user, onNavigate]);

  const handleLeaveCall = () => {
    if (session) {
      // Mark session Completed in db
      completeSession(session.id);
    }
    // Route user to sessions page and trigger rating modal
    errorHandler.handleSuccess("Session complete! Please take a moment to rate your experience with the mentor.");
    onNavigate('dashboard');
  };

  const handleBookmark = (label) => {
    errorHandler.handleSuccess(`Resource bookmarked: "${label}". Saved to your profile bookmarks.`);
    setAiSuggestions(prev => prev.filter(item => item.bookmarkLabel !== label));
  };

  return (
    <div className="bg-[#1a1a1a] text-bone font-body-md min-h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-6 h-16 bg-[#1a1a1a] border-b border-white/10 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <h1 onClick={() => onNavigate('dashboard')} className="font-headline-md text-2xl text-bone cursor-pointer hover:text-white transition-colors">ProLign</h1>
          <div className="h-4 w-[1px] bg-white/20"></div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-error rounded-full animate-pulse"></span>
            <span className="font-label-sm text-sm text-white/70 font-semibold">LIVE: {session?.type || 'Session'}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-label-sm text-sm text-white font-bold">{mentor?.name || 'Mentor'}</p>
            <p className="text-[10px] uppercase tracking-wider text-white/50">{mentor?.title || 'Mentor'}</p>
          </div>
          <img
            src={mentor?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor?.name || 'Mentor')}&background=354024&color=fff`}
            alt={mentor?.name}
            className="w-10 h-10 rounded-full border border-white/20 object-cover"
          />
        </div>
      </header>

      {/* Main Conference Screen */}
      <main className="flex flex-1 relative overflow-hidden h-[calc(100vh-64px)]">
        {/* Main Video Container */}
        <div className="flex-1 relative bg-black flex items-center justify-center transition-all duration-500 ease-in-out">
          
          {/* Mentor Main View */}
          <div className="absolute inset-0 w-full h-full">
             <img alt="Mentor Video Stream" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVVktxwhRXHYtpW5pn-VwlyNrGl7nKgHDhUXruHwiYvCYnWCkczkzeX4gZfSrqV6IFCdG8p7s9QHHbrOPTdATz7qlnnMG4nq2CNltugiV837RcW4DlhxOCyM0GWo2R3ERvRK2AS7DPgevCSfLQ-qCisEduPxDo9lyX9Q80TTL20yr8K0j6pBGSqCAa376NshAtN_XGPbvs57ruTxxS9xdPT8n8Bl3H8GoYnTmAf24GBzzOUcf7WKU75vZtGYEiPV4dpu3kNPiDGdPc"/>
             <div className="absolute inset-0 video-gradient pointer-events-none"></div>
          </div>

          {/* Self View (PiP) */}
          <div className="absolute top-6 right-6 w-48 aspect-video md:w-64 rounded-xl overflow-hidden shadow-2xl border border-white/10 z-20 group">
             <img alt="Self View" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4vfJhSinOmnlCnI-H6faY0YfHMxmcfLzj1CQ_bSm2Niu2tv4a49uTo9_4EGbMVV8CbiRTgEZ-MbWh2aLP9-kxxX4M-HL6JspoodoJN9MbQUAZQyPHtEkMRIbH89SIaq7gYlY8aJzXsPnIFQ_BytekV4a8XKq-Yg9rkeDDuJh4KT6Z_rsBWH2Uh1se2b9vfch0fcA3MJLo_8trE9AAqeLhRoAUr1jZwWB_tBCOKCHa9vJ4B_8LHhoPjGpZxEIIsNBOmodr_1uYclyE"/>
             <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-[10px] text-white">You</div>
             <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined !text-white fill-icon text-3xl">drag_indicator</span>
             </div>
          </div>

          {/* Floating Status/Timer */}
          <div className="absolute top-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-3 z-20">
             <span className="text-white font-label-sm text-sm font-bold tracking-wider">42:15</span>
             <div className="w-[1px] h-3 bg-white/20"></div>
             <div className="flex items-center gap-1">
                <span className="material-symbols-outlined !text-white text-sm fill-icon">signal_cellular_alt</span>
                <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Excellent</span>
             </div>
          </div>

          {/* Tool Bar */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#1a1a1a]/80 backdrop-blur-xl px-6 py-4 rounded-full border border-white/10 shadow-2xl z-30">
             <button className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group">
                <span className="material-symbols-outlined !text-white text-[22px]">mic</span>
             </button>
             <button className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group">
                <span className="material-symbols-outlined !text-white text-[22px]">videocam</span>
             </button>
             <button className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group">
                <span className="material-symbols-outlined !text-white text-[22px]">present_to_all</span>
             </button>
             <div className="w-[1px] h-8 bg-white/10 mx-2"></div>
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group ${sidebarOpen ? 'bg-on-tertiary-container text-white' : 'bg-white/5 hover:bg-white/10 text-white'}`}>
                <span className="material-symbols-outlined !text-current text-[22px]">chat</span>
             </button>
             <button className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group">
                <span className="material-symbols-outlined !text-white text-[22px]">group</span>
             </button>
             <button onClick={handleLeaveCall} className="h-12 rounded-full bg-error hover:opacity-90 flex items-center justify-center transition-all ml-4 px-6 gap-2 w-auto shadow-lg">
                <span className="material-symbols-outlined !text-white text-[22px]">call_end</span>
                <span className="font-label-sm text-sm font-bold text-white">Leave Call</span>
             </button>
          </div>
        </div>

        {/* Collapsible Sidebar */}
        <aside
          className={`bg-[#1a1a1a] border-l border-white/10 flex flex-col transition-all duration-300 relative shrink-0 ${
            sidebarOpen ? 'w-96 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'
          }`}
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#222]">
            <h2 className="font-headline-md text-xl font-bold text-bone">Session Workspace</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined !text-white">close</span>
            </button>
          </div>

          <div className="flex border-b border-white/10">
            <button className="flex-1 py-3 text-center border-b-2 border-on-tertiary-container font-label-sm text-sm font-bold text-white">Notes</button>
            <button className="flex-1 py-3 text-center border-b-2 border-transparent text-white/40 font-label-sm text-sm font-bold hover:text-white transition-colors">Resources</button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex flex-col">
            <div className="mb-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Live Transcript Snippets</p>
              <div className="space-y-3">
                {transcript.map((t, idx) => (
                   <div key={idx} className="bg-white/5 p-4 rounded-xl border-l-2 border-secondary shadow-sm">
                      <p className="text-xs text-white/60 mb-1.5 font-bold">{t.sender} ({t.time})</p>
                      <p className="text-sm text-bone leading-relaxed">"{t.text}"</p>
                   </div>
                ))}
              </div>
            </div>
            
            <div className="h-px bg-white/10 my-6"></div>
            
            <div className="flex flex-col h-full min-h-[300px]">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Your Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 text-bone placeholder-white/20 resize-none font-body-md text-sm leading-relaxed outline-none" 
                placeholder="Start typing your takeaways here..."
              ></textarea>
            </div>
          </div>

          {/* AI Suggestions Bar */}
          {aiSuggestions.length > 0 && (
             <div className="bg-[#cfbb99] p-4 m-4 rounded-xl shadow-inner mt-auto">
                {aiSuggestions.map((item) => (
                  <div key={item.id} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="material-symbols-outlined !text-tertiary !text-sm fill-icon">auto_awesome</span>
                       <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">AI Real-time Suggestion</span>
                    </div>
                    <p className="text-sm text-tertiary leading-relaxed font-medium" dangerouslySetInnerHTML={{__html: item.text}}></p>
                    <div className="flex gap-2 mt-4">
                       <button onClick={() => handleBookmark(item.bookmarkLabel)} className="flex-1 py-2 bg-tertiary text-bone text-xs rounded-lg font-bold hover:opacity-90 transition-opacity shadow-sm">Bookmark Resource</button>
                       <button onClick={() => setAiSuggestions(prev => prev.filter(t => t.id !== item.id))} className="flex-1 py-2 border border-tertiary/20 text-tertiary text-xs rounded-lg font-bold hover:bg-tertiary/5 transition-colors">Ignore</button>
                    </div>
                  </div>
                ))}
             </div>
          )}
        </aside>
      </main>
    </div>
  );
}

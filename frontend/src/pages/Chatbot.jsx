import React, { useState, useRef, useEffect } from 'react';

const Chatbot = ({ navigateTo }) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm your ProLign AI assistant. I can help you refine your resume, practice for interviews, or explore new career paths. What's on your mind today?",
      time: "10:00 AM"
    },
    {
      id: 2,
      sender: 'user',
      text: "I have a big interview tomorrow for a Senior Product Design role. Can we practice some behavioral questions?",
      time: "10:02 AM"
    },
    {
      id: 3,
      sender: 'ai',
      text: "Absolutely. That's a great step. Let's start with a classic: \n\n**\"Tell me about a time you had a significant conflict with a stakeholder and how you resolved it.\"**\n\nWhen you're ready, try to use the STAR method (Situation, Task, Action, Result) in your response.",
      time: "10:03 AM"
    }
  ]);
  const messagesEndRef = useRef(null);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    setMessages([
      ...messages,
      {
        id: Date.now(),
        sender: 'user',
        text: inputText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden w-full bg-background">
      {/* Conversation History Sidebar */}
      <aside className="w-80 bg-inverse-surface text-surface-container-lowest hidden lg:flex flex-col border-r border-outline/10">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline-md text-2xl text-surface-container-low">History</h2>
            <button className="material-symbols-outlined text-surface-container-low hover:text-primary-fixed transition-colors">edit_square</button>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
            <div className="p-3 rounded-lg bg-surface-container-highest/10 border border-surface-container-highest/5 cursor-pointer">
              <p className="font-label-sm text-surface-bright line-clamp-1">Resume review for Senior Product Designer</p>
              <p className="text-xs text-surface-dim mt-1">2 hours ago</p>
            </div>
            <div className="p-3 rounded-lg hover:bg-surface-container-highest/5 cursor-pointer transition-colors">
              <p className="font-label-sm text-surface-dim line-clamp-1">Interview prep: Behavioral questions</p>
              <p className="text-xs text-surface-dim/60 mt-1">Yesterday</p>
            </div>
            <div className="p-3 rounded-lg hover:bg-surface-container-highest/5 cursor-pointer transition-colors">
              <p className="font-label-sm text-surface-dim line-clamp-1">Networking strategies on LinkedIn</p>
              <p className="text-xs text-surface-dim/60 mt-1">Oct 24, 2023</p>
            </div>
            <div className="p-3 rounded-lg hover:bg-surface-container-highest/5 cursor-pointer transition-colors">
              <p className="font-label-sm text-surface-dim line-clamp-1">Portfolio storytelling tips</p>
              <p className="text-xs text-surface-dim/60 mt-1">Oct 20, 2023</p>
            </div>
          </div>
        </div>
        <div className="mt-auto p-6 border-t border-surface-container-highest/10">
          <div className="flex items-center gap-3 p-3 bg-primary-container rounded-xl cursor-pointer hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary">bolt</span>
            </div>
            <div>
              <p className="font-label-sm text-on-primary-fixed font-bold">Upgrade to Pro</p>
              <p className="text-xs text-on-primary-fixed-variant">Unlock expert AI insights</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-background overflow-hidden">
        {/* Header Title */}
        <div className="px-6 py-4 border-b border-outline-variant/10 bg-background/80 backdrop-blur-md z-10 w-full">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[20px] fill-icon">smart_toy</span>
              </div>
              <h1 className="font-headline-md text-2xl text-primary font-bold">ProLign AI</h1>
            </div>
            <button className="material-symbols-outlined text-outline hover:text-primary transition-colors">info</button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 items-start ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border ${msg.sender === 'user' ? 'bg-primary-fixed border-primary/10' : 'bg-surface-container border-outline-variant/30'}`}>
                  {msg.sender === 'user' ? (
                    <img alt="User" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJTYiReUNmlq29Bg77qjaQgSuBEP6we5JkAwxEgrL_g26FspoAQ7mpLxMduCGpmyOI4TMypxKqm6bVP9esfl4PJAKHRSBStra_VbJkt2ekEdmRsdiNq1iBSRQhvUDHDZrcVTA1iMP77LVJTjgKTbftqX0zabzWfj52t01mL_EduT5XrR3oWoUcD2wRdnQ6xKFEwpsyoX3x_VfnsctxADIesBu7SkoKarUgYSyyhfEIDstauuSOwyS7nKVUfpSARuYL8u6yGj9z_SCW"/>
                  ) : (
                    <span className="material-symbols-outlined text-secondary text-[22px]">auto_awesome</span>
                  )}
                </div>
                <div className={`flex flex-col gap-2 max-w-[80%] ${msg.sender === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-5 rounded-2xl shadow-sm ${msg.sender === 'user' ? 'bg-primary text-on-primary rounded-tr-none' : 'bg-surface-variant/50 text-on-surface rounded-tl-none border border-outline-variant/10'}`}>
                    <p className="font-body-md whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></p>
                  </div>
                  <span className="text-xs text-on-surface-variant px-1">{msg.time}</span>
                </div>
              </div>
            ))}

            {/* Additional AI Insights (Decorative) */}
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 flex gap-6 items-center shadow-sm mt-4">
              <div className="hidden sm:block w-32 h-24 rounded-xl overflow-hidden bg-surface-dim">
                <img alt="Study concept" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAH_HvQeHxvg-hu2crjT_VDPOCrjONCrnbL8U1AMJnCAaMdr6fCHS8dRSaZWT3Kb_0pnPydDMO_1Ht-xM3k1S0fY0M9lg5XdMvksbM75FimMXuvTYXEm-xtpgvkJWFslVLw5QqQ6cGL3gw0Rx9OUoWlELfKxTJ4uqEGL9m_CSmNEEPBRmZdVEAVJIFbsF9LfEw6-Ukgbhr4-EZXSwwGHeQ9eFVylnvdgmEizlndIVICwuD2VjanJ7pj2fWCCTysYCA2vNKpfCxF_OB_"/>
              </div>
              <div className="flex-1">
                <h4 className="font-headline-md text-sm text-primary mb-1 font-bold">Recommended Resource</h4>
                <p className="font-body-md text-sm text-on-surface-variant">Check out our "Mastering the STAR Method" guide to polish your storytelling.</p>
                <button className="mt-2 text-secondary font-bold text-xs flex items-center gap-1 hover:underline">Read Article <span className="material-symbols-outlined text-[14px]">arrow_outward</span></button>
              </div>
            </div>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 pt-0 bg-background w-full">
          <div className="max-w-3xl mx-auto">
            {/* Suggestion Chips */}
            <div className="flex gap-3 mb-4 overflow-x-auto pb-2 custom-scrollbar">
              {['Help with resume', 'Interview prep', 'Career advice', 'Portfolio review'].map(suggestion => (
                <button 
                  key={suggestion}
                  onClick={() => setInputText(suggestion)}
                  className="flex-shrink-0 px-4 py-2 rounded-full border border-secondary text-secondary text-sm font-semibold hover:bg-secondary-container transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            {/* Chat Input Field */}
            <div className="relative flex items-end gap-3 bg-surface-container p-3 rounded-2xl border border-outline-variant/10 shadow-lg focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
              <button className="material-symbols-outlined p-2 text-secondary hover:bg-surface-dim rounded-lg transition-colors">attach_file</button>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/50 py-2 custom-scrollbar resize-none font-body-md outline-none" 
                placeholder="Message ProLign AI..." 
                rows="1"
                style={{ height: 'auto', maxHeight: '150px' }}
              ></textarea>
              <div className="flex items-center gap-1">
                <button className="material-symbols-outlined p-2 text-secondary hover:bg-surface-dim rounded-lg transition-colors" title="Voice Input">mic</button>
                <button 
                  onClick={handleSend}
                  className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-white">send</span>
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-on-surface-variant/40 mt-3 uppercase tracking-widest font-bold">Powered by ProLign Wisdom Engine</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chatbot;

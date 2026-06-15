import { useState, useRef, useEffect } from 'react';

const AIChatWidget = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [view, setView] = useState('chat'); // 'chat' or 'history'
  
  // Real dynamic history state
  const [history, setHistory] = useState([]);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm your MentorBridge AI assistant. I can help you refine your resume, practice for interviews, or explore new career paths. What's on your mind today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, view]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const aiMsg = {
      id: Date.now() + 1,
      sender: 'ai',
      text: "I'm a mock AI assistant. I've noted your request: **\"" + inputText + "\"**. Since I'm not connected to a real LLM yet, I can't provide a customized response, but this is exactly how I would interact with you!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg, aiMsg]);
    
    // Create a new history entry if this is the first interaction of a new session
    if (messages.length === 1) {
      setHistory(prev => [
        { 
          id: Date.now(), 
          title: inputText.length > 40 ? inputText.slice(0, 40) + '...' : inputText,
          time: 'Just now'
        },
        ...prev
      ]);
    }
    
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewSession = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        text: "Starting a new session. How can I assist you?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setView('chat');
  };

  // If not open, we still render it but translate it off-screen for animation
  return (
    <>
      {/* Backdrop overlay for smaller screens, optional, but let's keep it clean as a side panel */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-on-background/20 backdrop-blur-[1px] z-[90] lg:hidden transition-opacity" 
          onClick={onClose}
        ></div>
      )}

      {/* Slide-out Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-[100] w-full sm:w-[450px] bg-background shadow-2xl flex flex-col border-l border-outline/10 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/10 bg-surface-container flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden">
              <img src="/chatbot-icon.svg" alt="MentorBridge AI" className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="font-headline-md text-lg text-primary font-bold leading-tight">MentorBridge AI</h2>
              <p className="text-[11px] text-on-surface-variant font-semibold">Wisdom Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
              className={`p-2 rounded-full transition-colors flex items-center justify-center ${view === 'history' ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
              title="Chat History"
            >
              <span className="material-symbols-outlined text-[20px]">history</span>
            </button>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-colors flex items-center justify-center"
              title="Minimize"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Chat vs History */}
        {view === 'chat' ? (
          <>
            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto px-5 py-6 custom-scrollbar bg-surface-container-lowest">
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 items-start ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border ${msg.sender === 'user' ? 'bg-primary-fixed border-primary/10' : 'bg-surface-container border-outline-variant/30'}`}>
                      {msg.sender === 'user' ? (
                        <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                      ) : (
                        <img src="/chatbot-icon.svg" alt="MentorBridge AI" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className={`flex flex-col gap-1.5 max-w-[85%] ${msg.sender === 'user' ? 'items-end' : ''}`}>
                      <div className={`p-4 rounded-2xl shadow-sm ${msg.sender === 'user' ? 'bg-primary text-on-primary rounded-tr-none' : 'bg-surface-variant/50 text-on-surface rounded-tl-none border border-outline-variant/10'}`}>
                        <p className="font-body-md text-[15px] whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{__html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></p>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/60 font-semibold px-1">{msg.time}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background border-t border-outline-variant/10 w-full shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              {/* Suggestion Chips */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 custom-scrollbar">
                {['Help with resume', 'Interview prep', 'Career advice'].map(suggestion => (
                  <button 
                    key={suggestion}
                    onClick={() => setInputText(suggestion)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full border border-secondary text-secondary text-xs font-semibold hover:bg-secondary-container transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              
              {/* Chat Input Field */}
              <div className="relative flex items-end gap-2 bg-surface-container p-2 rounded-2xl border border-outline-variant/10 focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/50 py-2 pl-2 custom-scrollbar resize-none font-body-md text-sm outline-none" 
                  placeholder="Message MentorBridge AI..." 
                  rows="1"
                  style={{ height: 'auto', maxHeight: '120px' }}
                ></textarea>
                <div className="flex items-center pb-1 pr-1">
                  <button 
                    onClick={handleSend}
                    className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* History View */
          <div className="flex-1 overflow-y-auto bg-surface-container-lowest flex flex-col">
            <div className="p-5 flex justify-between items-center border-b border-outline-variant/5">
              <h3 className="font-headline-md text-lg font-bold text-on-surface">Past Sessions</h3>
              <button 
                onClick={startNewSession}
                className="text-secondary font-label-sm text-sm font-bold flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> New
              </button>
            </div>
            <div className="p-3 space-y-2 flex-1 custom-scrollbar">
              {history.length > 0 ? (
                history.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      // In a real app, this would load the chat history for this ID
                      setView('chat');
                    }}
                    className="p-4 rounded-xl hover:bg-surface-container-highest/30 border border-transparent hover:border-outline-variant/10 cursor-pointer transition-all group"
                  >
                    <p className="font-label-sm text-[15px] text-on-surface font-semibold group-hover:text-primary transition-colors line-clamp-1">{item.title}</p>
                    <p className="text-xs text-on-surface-variant/70 mt-1">{item.time}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3 pt-12">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">history_toggle_off</span>
                  <p className="text-sm font-semibold">No history yet.</p>
                  <p className="text-xs text-on-surface-variant">Your conversations will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AIChatWidget;

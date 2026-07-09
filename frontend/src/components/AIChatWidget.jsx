import { useState, useRef, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8000/chat';
const HISTORY_URL = API_URL.replace('/chat', '/history');

function getSessionId() {
  const existing = localStorage.getItem('prolign_session_id');
  if (existing) return existing;
  const newId = crypto.randomUUID();
  localStorage.setItem('prolign_session_id', newId);
  return newId;
}

function formatTime(isoString) {
  if (!isoString) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

const WELCOME_MSG = {
  id: 'welcome',
  sender: 'ai',
  text: "Hello! I'm your ProLign AI assistant. I can help you refine your resume, practice for interviews, or explore new career paths. What's on your mind today?",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  created_at: new Date().toISOString(),
};

const AIChatWidget = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [view, setView] = useState('chat');
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [sidebarHistory, setSidebarHistory] = useState([]);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const messagesEndRef = useRef(null);

  // ── Load last 7 days of conversation history on open ──────────────────
  const loadHistory = useCallback(async () => {
    if (historyLoaded) return;
    const sessionId = getSessionId();
    try {
      const response = await fetch(`${HISTORY_URL}/${sessionId}`);
      if (!response.ok) return;
      const data = await response.json();
      const msgs = data.messages || [];

      if (msgs.length === 0) {
        setHistoryLoaded(true);
        return;
      }

      const restored = msgs.map((m, idx) => ({
        id: `history-${idx}`,
        sender: m.role === 'user' ? 'user' : 'ai',
        text: m.message,
        time: formatTime(m.created_at),
        created_at: m.created_at,
      }));

      setMessages([WELCOME_MSG, ...restored]);

      // Build sidebar entry from first user message
      const firstUser = msgs.find(m => m.role === 'user');
      if (firstUser) {
        setSidebarHistory([{
          id: sessionId,
          title: firstUser.message.length > 40
            ? firstUser.message.slice(0, 40) + '...'
            : firstUser.message,
          time: formatDateLabel(firstUser.created_at),
          count: msgs.filter(m => m.role === 'user').length,
        }]);
      }
    } catch (_) {
      // Silently fail — widget still works without history
    } finally {
      setHistoryLoaded(true);
    }
  }, [historyLoaded]);

  useEffect(() => {
    if (isOpen) loadHistory();
  }, [isOpen, loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, view, isTyping]);

  // ── Send message ───────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toISOString(),
    };

    const query = inputText;
    setMessages(prev => [...prev, userMsg]);

    const isFirstMessage = messages.filter(m => m.sender === 'user').length === 0;
    if (isFirstMessage) {
      setSidebarHistory(prev => [{
        id: Date.now(),
        title: query.length > 40 ? query.slice(0, 40) + '...' : query,
        time: 'Just now',
        count: 1,
      }, ...prev]);
    }

    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: getSessionId(), message: query }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.reply || 'No response received.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_at: new Date().toISOString(),
      }]);
    } catch (_) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: "Sorry, I couldn't connect to the assistant. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewSession = () => {
    localStorage.removeItem('prolign_session_id');
    setHistoryLoaded(false);
    setMessages([{
      ...WELCOME_MSG,
      id: Date.now(),
      text: 'Starting a new session. How can I assist you?',
    }]);
    setView('chat');
  };

  // ── Date separator rendering ───────────────────────────────────────────
  const renderMessages = () => {
    const items = [];
    let lastDateLabel = '';

    messages.forEach((msg) => {
      const dateLabel = formatDateLabel(msg.created_at);
      if (dateLabel && dateLabel !== lastDateLabel && msg.id !== 'welcome') {
        lastDateLabel = dateLabel;
        items.push(
          <div key={`sep-${msg.id}`} className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-outline-variant/20" />
            <span className="text-[10px] font-semibold text-on-surface-variant/50 whitespace-nowrap">
              {dateLabel}
            </span>
            <div className="flex-1 h-px bg-outline-variant/20" />
          </div>
        );
      }

      items.push(
        <div key={msg.id} className={`flex gap-3 items-start ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border
            ${msg.sender === 'user'
              ? 'bg-primary-fixed border-primary/10'
              : 'bg-surface-container border-outline-variant/30'}`}>
            {msg.sender === 'user' ? (
              <span className="material-symbols-outlined text-primary text-[18px]">person</span>
            ) : (
              <img src="/chatbot-icon.svg" alt="ProLign AI" className="h-full w-full object-cover" />
            )}
          </div>
          <div className={`flex flex-col gap-1.5 max-w-[85%] ${msg.sender === 'user' ? 'items-end' : ''}`}>
            <div className={`p-4 rounded-2xl shadow-sm
              ${msg.sender === 'user'
                ? 'bg-primary text-on-primary rounded-tr-none'
                : 'bg-surface-variant/50 text-on-surface rounded-tl-none border border-outline-variant/10'}`}>
              <p
                className="font-body-md text-[15px] whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
              />
            </div>
            <span className="text-[10px] text-on-surface-variant/60 font-semibold px-1">{msg.time}</span>
          </div>
        </div>
      );
    });

    return items;
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-on-background/20 backdrop-blur-[1px] z-[90] lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={`fixed inset-y-0 right-0 z-[100] w-full sm:w-[450px] bg-background shadow-2xl flex flex-col border-l border-outline/10 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/10 bg-surface-container flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden">
              <img src="/chatbot-icon.svg" alt="ProLign AI" className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="font-headline-md text-lg text-primary font-bold leading-tight">ProLign AI</h2>
              <p className="text-[11px] text-on-surface-variant font-semibold">Wisdom Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
              className={`p-2 rounded-full transition-colors flex items-center justify-center
                ${view === 'history'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-variant'}`}
              title="Chat History"
            >
              <span className="material-symbols-outlined text-[20px]">history</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-colors"
              title="Close"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {view === 'chat' ? (
          <>
            {/* 7-day history banner */}
            {historyLoaded && messages.length > 1 && (
              <div className="px-4 py-1.5 bg-secondary-container/20 border-b border-outline-variant/10">
                <p className="text-[10px] text-on-surface-variant/70 text-center">
                  Showing last 7 days of conversation
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar bg-surface-container-lowest">
              <div className="space-y-4">
                {renderMessages()}
                {isTyping && (
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border bg-surface-container border-outline-variant/30">
                      <img src="/chatbot-icon.svg" alt="ProLign AI" className="h-full w-full object-cover" />
                    </div>
                    <div className="bg-surface-variant/50 p-4 rounded-2xl rounded-tl-none border border-outline-variant/10 shadow-sm">
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-background border-t border-outline-variant/10 w-full shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 custom-scrollbar">
                {['Help with resume', 'Interview prep', 'Career advice', 'Summarise our chat'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setInputText(suggestion)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full border border-secondary text-secondary text-xs font-semibold hover:bg-secondary-container transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <div className="relative flex items-end gap-2 bg-surface-container p-2 rounded-2xl border border-outline-variant/10 focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/50 py-2 pl-2 custom-scrollbar resize-none font-body-md text-sm outline-none"
                  placeholder="Message ProLign AI..."
                  rows="1"
                  style={{ height: 'auto', maxHeight: '120px' }}
                />
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
          /* History sidebar */
          <div className="flex-1 overflow-y-auto bg-surface-container-lowest flex flex-col">
            <div className="p-5 flex justify-between items-center border-b border-outline-variant/5">
              <div>
                <h3 className="font-headline-md text-lg font-bold text-on-surface">Past Sessions</h3>
                <p className="text-[10px] text-on-surface-variant/60 mt-0.5">Last 7 days</p>
              </div>
              <button
                onClick={startNewSession}
                className="text-secondary font-label-sm text-sm font-bold flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> New
              </button>
            </div>
            <div className="p-3 space-y-2 flex-1 custom-scrollbar">
              {sidebarHistory.length > 0 ? (
                sidebarHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setView('chat')}
                    className="p-4 rounded-xl hover:bg-surface-container-highest/30 border border-transparent hover:border-outline-variant/10 cursor-pointer transition-all group"
                  >
                    <p className="font-label-sm text-[15px] text-on-surface font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-on-surface-variant/70">{item.time}</p>
                      {item.count && (
                        <span className="text-[10px] text-on-surface-variant/50 bg-surface-container px-2 py-0.5 rounded-full">
                          {item.count} message{item.count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
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
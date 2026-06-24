import React, { useState, useEffect, useRef } from 'react';
import { getCurrentUser } from '../utils/db';

const KNOWLEDGE_BASE = [
  {
    topic: "Resume Checklist",
    content: "Make sure you include: Professional Profile summary at the top, clear Single-Column layout, Work experience ordered chronologically, Education background, and Technical skills. Use metrics: 'Increased server loading speed by 40% using PyTorch models.'"
  },
  {
    topic: "Behavioral Conflict",
    content: "When asked about stakeholder conflict, use the STAR format. Example: 'In my last internship (Situation), I had to deliver a feature while a designer wanted changes (Task). I scheduled a 15 min whiteboard alignment session to review metrics (Action), resulting in a 20% increase in layout conversion rate (Result).'"
  },
  {
    topic: "Whiteboard coding strategy",
    content: "1. Clarify requirements & edge cases (inputs, null values).\n2. Plan out load complexities (time/space Big O).\n3. Write pseudo code before typing.\n4. Write the code cleanly.\n5. Walk through the code with test arrays out loud."
  }
];

export default function ChatbotPage({ onNavigate }) {
  const user = getCurrentUser();
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! I am your ProLign AI Career Assistant. Ask me anything about placement prep, resumes, system design, or platform usage!", time: "Now" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    const query = input.toLowerCase();
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let bestMatch = null;
      let highestScore = 0;

      KNOWLEDGE_BASE.forEach(doc => {
        const keywords = doc.topic.toLowerCase().split(" ");
        let score = 0;
        keywords.forEach(kw => {
          if (query.includes(kw)) score += 5;
        });

        if (query.includes(doc.topic.toLowerCase())) score += 10;

        if (score > highestScore) {
          highestScore = score;
          bestMatch = doc;
        }
      });

      let responseText = "";
      if (bestMatch) {
        responseText = `Retrieved context on [${bestMatch.topic}]:\n\n${bestMatch.content}\n\nHope this helps your preparation! Let me know if you need more details.`;
      } else {
        responseText = "I couldn't locate a precise match in our local repository. But don't worry! You can book a 1-on-1 session with our Principal Engineering and Design mentors who can conduct real-time portfolio reviews and mock sessions. Head over to the 'Find Mentors' tab!";
      }

      setMessages(prev => [...prev, {
        sender: "ai",
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col h-[calc(100vh-140px)]">
      <div className="bg-surface-container-low flex flex-col h-full rounded-2xl border border-outline-variant/10 shadow-xl overflow-hidden">
        {/* Chat Header */}
        <div className="bg-primary text-on-primary p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl font-bold bg-white/10 p-2 rounded-xl !text-white">
              smart_toy
            </span>
            <div>
              <h2 className="font-headline-md text-base font-bold text-on-primary">ProLign AI Assistant</h2>
              <p className="text-[10px] text-primary-fixed-dim uppercase tracking-widest mt-1">RAG Career preparedness bot online</p>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-4 items-start ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm ${
                m.sender === 'user' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container border border-outline-variant/30'
              }`}>
                <span className={`material-symbols-outlined text-[20px] ${m.sender === 'user' ? 'text-on-primary-fixed' : 'text-secondary'}`}>
                  {m.sender === 'user' ? 'person' : 'auto_awesome'}
                </span>
              </div>
              <div className={`flex flex-col gap-1 max-w-[80%] ${m.sender === 'user' ? 'items-end' : ''}`}>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-line ${
                  m.sender === 'user' 
                    ? 'bg-primary text-on-primary rounded-tr-none' 
                    : 'bg-surface-variant text-on-surface rounded-tl-none border border-outline-variant/10'
                }`}>
                  <p>{m.text}</p>
                </div>
                <span className="text-[10px] text-on-surface-variant/60 px-1">{m.time}</span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 items-start animate-pulse">
              <div className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-secondary">auto_awesome</span>
              </div>
              <div className="bg-surface-variant text-on-surface p-4 rounded-2xl rounded-tl-none border border-outline-variant/10 shadow-sm max-w-[80%]">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-outline-variant/10 bg-surface-container-low shrink-0 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 select-none">
            <button 
              onClick={() => setInput("Resume Checklist")}
              className="text-xs bg-surface-container-high border border-outline/10 text-primary font-bold px-3 py-1 rounded-full whitespace-nowrap hover:bg-surface-container-highest cursor-pointer"
            >
              Resume metrics
            </button>
            <button 
              onClick={() => setInput("Behavioral Conflict")}
              className="text-xs bg-surface-container-high border border-outline/10 text-primary font-bold px-3 py-1 rounded-full whitespace-nowrap hover:bg-surface-container-highest cursor-pointer"
            >
              Conflict (STAR)
            </button>
            <button 
              onClick={() => setInput("Whiteboard coding strategy")}
              className="text-xs bg-surface-container-high border border-outline/10 text-primary font-bold px-3 py-1 rounded-full whitespace-nowrap hover:bg-surface-container-highest cursor-pointer"
            >
              Coding strategy
            </button>
          </div>
          
          <div className="flex gap-3 items-end">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask a placement or resume question..."
              className="flex-1 bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary"
            />
            <button
              onClick={handleSend}
              className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
            >
              <span className="material-symbols-outlined !text-white text-base">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

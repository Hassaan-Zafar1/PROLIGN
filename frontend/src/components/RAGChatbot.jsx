import React, { useState, useEffect, useRef } from 'react';
import { getCurrentUser } from '../utils/db';

const KNOWLEDGE_BASE = [
  {
    topic: "resume building",
    content: "When building your resume/CV, focus on quantifiable impact. Use the Google X-Y-Z formula: 'Accomplished [X] as measured by [Y], by doing [Z]'. Keep your resume to exactly one page, use a clean single-column layout, and list your technical skills (like Python, SQL, React) clearly at the top. Avoid progress bars for skills."
  },
  {
    topic: "interview preparation",
    content: "For behavioral interviews, always use the STAR method: Situation, Task, Action, Result. Focus 60% of your time on the Actions you personally took. For technical coding interviews, speak out loud as you solve the problem. Explain your trade-offs, space and time complexity (Big O notation), and write edge cases."
  },
  {
    topic: "placement preparation",
    content: "Placement prep requires a balanced mix of Data Structures & Algorithms (DSA), System Design, and projects. Master arrays, hash maps, and two-pointer techniques first. Build 2-3 solid projects where you solved a real problem, hosted it online, and wrote a clean README file."
  },
  {
    topic: "platform booking and payments",
    content: "To book a session on ProLign: Go to the 'Find Mentors' tab, filter by domain/rate, select a mentor, choose a date/time from their calendar, write your session goals, and enter card details on the secure Stripe payment modal. A 5% platform fee is added automatically."
  },
  {
    topic: "video sessions and rating",
    content: "ProLign sessions are conducted in real-time via Jitsi Meet. To join, click the 'Join Call' button on your dashboard. Ensure camera and microphone permissions are enabled. After the call concludes, you will automatically see a pop-up prompting you to rate your mentor from 1 to 5 stars and add reviews."
  }
];

export default function RAGChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! I am your ProLign AI Career Assistant. Ask me anything about placement prep, resumes, system design, or platform usage!", time: "Now" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const user = getCurrentUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMessage]);
    const query = input.toLowerCase();
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      // Simulate RAG Search
      let bestMatch = null;
      let highestScore = 0;

      KNOWLEDGE_BASE.forEach(doc => {
        const keywords = doc.topic.split(" ");
        let score = 0;
        keywords.forEach(kw => {
          if (query.includes(kw)) score += 5;
        });
        // check standard substrings
        const words = query.split(" ");
        words.forEach(w => {
          if (w.length > 3 && doc.content.toLowerCase().includes(w)) score += 1;
        });

        if (score > highestScore) {
          highestScore = score;
          bestMatch = doc;
        }
      });

      let aiResponse = "";
      if (bestMatch) {
        aiResponse = `Based on my knowledge assistant module:\n\n${bestMatch.content}\n\nIs there anything else regarding ${bestMatch.topic} you would like to clarify?`;
      } else {
        aiResponse = "I couldn't find a direct match in my knowledge base. However, for career advice, I highly recommend booking a 1-on-1 session with our industry professionals. You can find mentors in Engineering, Design, or Marketing directly under the 'Find Mentors' tab!";
      }

      setMessages(prev => [...prev, {
        sender: "ai",
        text: aiResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-secondary text-on-primary rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform z-50 flex items-center justify-center group cursor-pointer"
        aria-label="Toggle Career Assistant Chatbot"
      >
        <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform !text-white">chat</span>
        <div className="absolute -top-12 right-0 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
          Need Career Guidance?
          <div className="absolute -bottom-1 right-6 w-2 h-2 bg-primary rotate-45"></div>
        </div>
      </button>

      {/* Chat Drawers */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-96 max-w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl z-50 flex flex-col h-[500px] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-200">
          {/* Header */}
          <div className="bg-primary text-on-primary p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined !text-white text-2xl">smart_toy</span>
              <div>
                <h3 className="font-headline-md text-sm font-bold text-on-primary">Virtual Assistant</h3>
                <p className="text-[10px] text-primary-fixed-dim tracking-wider uppercase">RAG Career Knowledge Base</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full cursor-pointer text-white"
            >
              <span className="material-symbols-outlined !text-white">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex gap-3 items-start ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  m.sender === 'user' ? 'bg-secondary text-white' : 'bg-surface-container border border-outline-variant/30'
                }`}>
                  <span className={`material-symbols-outlined text-[18px] ${m.sender === 'user' ? '!text-white' : 'text-secondary'}`}>
                    {m.sender === 'user' ? 'person' : 'auto_awesome'}
                  </span>
                </div>
                <div className={`flex flex-col gap-1 max-w-[75%] ${m.sender === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-3 rounded-2xl text-sm ${
                    m.sender === 'user' 
                      ? 'bg-primary text-on-primary rounded-tr-none' 
                      : 'bg-surface-variant text-on-surface rounded-tl-none border border-outline-variant/10 shadow-sm'
                  }`}>
                    <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant/60 px-1">{m.time}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px] text-secondary">auto_awesome</span>
                </div>
                <div className="bg-surface-variant text-on-surface p-3 rounded-2xl rounded-tl-none border border-outline-variant/10 shadow-sm max-w-[75%]">
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

          {/* Quick Reply Prompts */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto select-none">
            <button 
              onClick={() => setInput("How to improve my resume?")}
              className="text-xs bg-surface-container-high border border-outline/10 text-primary font-bold px-3 py-1 rounded-full whitespace-nowrap hover:bg-surface-container-highest cursor-pointer"
            >
              Resume metrics
            </button>
            <button 
              onClick={() => setInput("Help with interview prep")}
              className="text-xs bg-surface-container-high border border-outline/10 text-primary font-bold px-3 py-1 rounded-full whitespace-nowrap hover:bg-surface-container-highest cursor-pointer"
            >
              Interview STAR
            </button>
            <button 
              onClick={() => setInput("How to book a mentor session?")}
              className="text-xs bg-surface-container-high border border-outline/10 text-primary font-bold px-3 py-1 rounded-full whitespace-nowrap hover:bg-surface-container-highest cursor-pointer"
            >
              Booking & payment
            </button>
          </div>

          {/* Input field */}
          <div className="p-3 border-t border-outline-variant/10 bg-surface-container-low flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask a career question..."
              className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-secondary/50 focus:outline-none"
            />
            <button
              onClick={handleSend}
              className="w-8 h-8 bg-primary text-on-primary rounded-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined !text-white text-[16px]">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

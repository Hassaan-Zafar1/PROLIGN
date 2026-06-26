import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'prolign-chatbot-visited';

const ChatbotFab = ({ isOpen, onOpen }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);

  useEffect(() => {
    const visited = localStorage.getItem(STORAGE_KEY);
    if (!visited) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
        setHasNotification(true);
        const hideTimer = setTimeout(() => {
          setShowOnboarding(false);
        }, 4000);
        return () => clearTimeout(hideTimer);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setHasNotification(true);
      const timer = setTimeout(() => setHasNotification(false), 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClick = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowOnboarding(false);
    setHasNotification(false);
    onOpen();
  }, [onOpen]);

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[60]">
      {/* Onboarding Tooltip */}
      {showOnboarding && (
        <div className="absolute bottom-full right-0 mb-3 w-64 animate-chatbot-fade-in">
          <div className="relative rounded-2xl bg-surface-container-lowest px-5 py-3.5 shadow-xl border border-outline-variant/10">
            <p className="text-sm font-semibold text-on-surface">Hi! I'm your AI Assistant.</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Need help? Click the button below.</p>
            <div className="absolute -bottom-2 right-6 h-0 w-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-surface-container-lowest" />
          </div>
        </div>
      )}

      {/* Hover Tooltip (desktop only) */}
      {isHovered && !showOnboarding && (
        <div className="hidden md:block absolute bottom-full right-0 mb-3 animate-chatbot-fade-in">
          <div className="rounded-xl bg-inverse-surface px-4 py-2 shadow-lg">
            <p className="text-sm font-medium text-inverse-on-surface whitespace-nowrap">Need Help? Chat with AI Assistant</p>
            <div className="absolute -bottom-1.5 right-6 h-0 w-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-inverse-surface" />
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative flex items-center justify-center rounded-full
          bg-secondary text-on-secondary
          shadow-lg
          w-14 h-14 sm:w-16 sm:h-16
          transition-all duration-300 ease-out
          chatbot-fab
          ${isHovered ? 'chatbot-fab-hover' : ''}
        `}
        title="Chat with ProLign AI"
        aria-label="Open AI chat assistant"
      >
        {/* Pulse glow ring */}
        <span className="absolute inset-0 rounded-full bg-secondary/20 chatbot-fab-pulse" />

        {/* Ping animation */}
        <span className="absolute inset-0 rounded-full bg-secondary/30 animate-ping [animation-duration:3s]" />

        {/* Notification badge */}
        {hasNotification && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error border-2 border-background">
            <span className="h-2 w-2 rounded-full bg-on-error animate-chatbot-badge-pulse" />
          </span>
        )}

        {/* AI badge */}
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-error text-[10px] font-bold text-on-error">
          AI
        </span>

        {/* Icon */}
        <img
          src="/chatbot-icon.svg"
          alt="ProLign AI"
          className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
        />
      </button>
    </div>
  );
};

export default ChatbotFab;

import { useEffect, useRef } from 'react';

const Modal = ({ open, onClose, labelledBy, children, className = '' }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Trap focus inside modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while modal open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className={`relative bg-surface border border-outline-variant/20 rounded-3xl shadow-2xl animate-[scaleIn_0.2s_ease-out] ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;

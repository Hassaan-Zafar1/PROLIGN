/**
 * SuccessModal Component
 * Display success message after application submission
 * Props:
 *   - isOpen: boolean
 *   - title: string
 *   - message: string
 *   - onHome: callback to go home
 *   - onBrowse: callback to browse marketplace
 */

import React, { useEffect } from 'react';

export default function SuccessModal({
  isOpen,
  title = "Application Submitted — Under Review",
  message = "Thank you for your interest in MentorBridge. Our curation team will review your credentials and get back to you within 3-5 business days via email.",
  onHome,
  onBrowse
}) {
  useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-gutter bg-surface">
      <div className="text-center max-w-lg">
        {/* Success Icon Animation */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-secondary/10 rounded-full animate-ping"></div>
          <div className="relative bg-secondary text-on-primary w-48 h-48 rounded-full flex items-center justify-center shadow-xl">
            <span
              className="material-symbols-outlined text-6xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              assignment_turned_in
            </span>
          </div>
        </div>

        {/* Title */}
        <h2 className="font-headline-xl text-headline-xl text-primary mb-4">
          {title}
        </h2>

        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <span className="bg-surface-dim text-on-surface px-6 py-2 rounded-full font-bold flex items-center gap-2 border border-outline-variant">
            <span className="w-2 h-2 bg-on-tertiary-container rounded-full animate-pulse"></span>
            Pending Review
          </span>
        </div>

        {/* Message */}
        <p className="text-on-surface-variant font-body-md mb-8 leading-relaxed px-gutter">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            onClick={onHome}
            className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold shadow-md hover:scale-[1.02] transition-transform"
          >
            Back to Home
          </button>
          <button
            onClick={onBrowse}
            className="px-8 py-3 border-2 border-secondary text-secondary rounded-lg font-bold hover:bg-secondary/5 transition-colors"
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    </div>
  );
}

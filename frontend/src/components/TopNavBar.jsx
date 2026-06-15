/**
 * TopNavBar Component
 * Reusable navigation header for all pages
 * Props: isHome (boolean) - determines active nav state
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopNavBar({ isHome = false }) {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-outline-variant/10 shadow-sm h-16">
      <div className="flex justify-between items-center px-gutter w-full max-w-container-max mx-auto h-full">
        {/* Brand Logo */}
        <div 
          className="font-headline-md text-headline-md font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
        >
          MentorBridge
        </div>

        {/* Navigation Links - Hidden on mobile */}
        <div className="hidden md:flex items-center space-x-8">
          <a
            onClick={() => navigate('/')}
            className={`text-label-sm font-label-sm cursor-pointer transition-colors duration-200 ${
              isHome
                ? 'text-primary font-bold border-b-2 border-primary pb-1'
                : 'text-on-surface-variant font-medium hover:text-primary'
            }`}
          >
            Home
          </a>
          <a href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-label-sm text-label-sm">
            How it Works
          </a>
          <a href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-label-sm text-label-sm">
            Mentors
          </a>
          <a href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-label-sm text-label-sm">
            Pricing
          </a>
        </div>

        {/* Trailing Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="hidden sm:block text-primary font-bold font-label-sm text-label-sm hover:opacity-80 transition-opacity"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-sm text-label-sm hover:opacity-90 transition-opacity"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

/**
 * Footer Component
 * Reusable footer for all pages
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-inverse-surface text-surface-container-lowest w-full py-12">
      <div className="flex flex-col md:flex-row justify-between items-center px-gutter max-w-container-max mx-auto gap-8">
        <div className="flex flex-col items-center md:items-start">
          <div className="font-headline-md text-headline-md font-bold text-surface-container-lowest mb-2">
            MentorBridge
          </div>
          <p className="font-body-md text-body-md text-surface-dim max-w-xs text-center md:text-left">
            Cultivating meaningful connections for professional growth and wisdom.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          <a href="#" className="font-label-sm text-label-sm text-surface-dim hover:text-primary-fixed transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="font-label-sm text-label-sm text-surface-dim hover:text-primary-fixed transition-colors">
            Terms of Service
          </a>
          <a href="#" className="font-label-sm text-label-sm text-surface-dim hover:text-primary-fixed transition-colors">
            Contact Support
          </a>
          <a href="#" className="font-label-sm text-label-sm text-surface-dim hover:text-primary-fixed transition-colors">
            Careers
          </a>
        </div>

        <div className="font-label-sm text-label-sm text-surface-dim">
          © 2024 MentorBridge. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

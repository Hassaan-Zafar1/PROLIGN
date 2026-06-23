import React from 'react';

export default function Footer({ onNavigate }) {
  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/',
      path: 'M24 12.073C24 5.446 18.627.073 12 .073S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/',
      path: 'M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723 10.016 10.016 0 0 1-3.127 1.184A4.92 4.92 0 0 0 11.78 8.288 13.978 13.978 0 0 1 1.64 3.15a4.822 4.822 0 0 0-.665 2.475 4.92 4.92 0 0 0 2.188 4.096 4.904 4.904 0 0 1-2.228-.616v.06a4.923 4.923 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.224.085 4.936 4.936 0 0 0 4.6 3.42A9.868 9.868 0 0 1 0 19.54a13.94 13.94 0 0 0 7.548 2.209c9.142 0 14.307-7.721 13.995-14.646a10.002 10.002 0 0 0 2.41-2.534z',
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/',
      path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.06-1.28.074-1.688.074-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
    },
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/',
      path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.85-3.037-1.853 0-2.136 1.447-2.136 2.942v5.664H9.353V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.602 0 4.267 2.371 4.267 5.455v6.286zM5.337 7.433a2.063 2.063 0 1 1 0-4.126 2.063 2.063 0 0 1 0 4.126zM7.114 20.452H3.556V9h3.558v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    },
  ];

  return (
    <footer className="bg-inverse-surface text-surface-container-lowest w-full py-12">
      <div className="flex flex-col md:flex-row justify-between items-center px-6 max-w-7xl mx-auto gap-8">
        <div className="flex flex-col items-center md:items-start">
          <div 
            onClick={() => onNavigate('home')}
            className="font-headline-md text-xl font-bold text-surface-container-lowest mb-2 cursor-pointer hover:opacity-80"
          >
            ProLign
          </div>
          <p className="font-body-md text-sm text-surface-dim max-w-xs text-center md:text-left">
            Cultivating meaningful connections for professional growth and wisdom.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <button onClick={() => onNavigate('home')} className="font-label-sm text-sm text-surface-dim hover:text-primary-fixed transition-colors cursor-pointer">
            Home
          </button>
          <button onClick={() => onNavigate('discovery')} className="font-label-sm text-sm text-surface-dim hover:text-primary-fixed transition-colors cursor-pointer">
            Find Mentors
          </button>
          <button onClick={() => onNavigate('discovery')} className="font-label-sm text-sm text-surface-dim hover:text-primary-fixed transition-colors cursor-pointer">
            Find Mentors
          </button>
          <button onClick={() => onNavigate('privacy')} className="font-label-sm text-sm text-surface-dim hover:text-primary-fixed transition-colors cursor-pointer">
            Privacy Policy
          </button>
          <button onClick={() => onNavigate('terms')} className="font-label-sm text-sm text-surface-dim hover:text-primary-fixed transition-colors cursor-pointer">
            Terms of Service
          </button>
        </div>
        <div className="flex flex-col items-center md:items-end gap-4">
          <div className="flex gap-4" aria-label="Social media links">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                title={social.name}
                className="text-surface-dim hover:text-primary-fixed transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
          <div className="font-label-sm text-sm text-surface-dim">
            &copy; 2026 ProLign. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

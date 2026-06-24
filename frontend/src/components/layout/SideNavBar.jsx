import React from 'react';
import { getCurrentUser } from '../../utils/db';

const SideNavBar = ({ navigateTo, currentPage, isOpen, onClose, theme, toggleTheme }) => {
  const user = getCurrentUser();
  if (!user) return null;

  const getLinks = () => {
    if (user.role === 'mentor') {
      return [
        { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
        { id: 'sessions', icon: 'calendar_month', label: 'My Sessions' },
        { id: 'earnings', icon: 'payments', label: 'Earnings' },
        { id: 'analytics', icon: 'analytics', label: 'Analytics' },
        { id: 'profile', icon: 'person', label: 'My Profile' },
        { id: 'settings', icon: 'settings', label: 'Settings' },
      ];
    } else if (user.role === 'admin') {
      return [
        { id: 'admindashboard', icon: 'admin_panel_settings', label: 'Admin Panel' },
        { id: 'approvals', icon: 'how_to_reg', label: 'Mentor Approvals' },
        { id: 'finances', icon: 'account_balance', label: 'Finances' },
        { id: 'analytics', icon: 'analytics', label: 'Analytics' },
        { id: 'settings', icon: 'settings', label: 'Settings' },
      ];
    } else {
      return [
        { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
        { id: 'discovery', icon: 'search', label: 'Find Mentors' },
        { id: 'sessions', icon: 'calendar_month', label: 'My Sessions' },
        { id: 'goals', icon: 'track_changes', label: 'Career Goals' },
        { id: 'analytics', icon: 'analytics', label: 'Analytics' },
        { id: 'settings', icon: 'settings', label: 'Settings' },
      ];
    }
  };

  const links = getLinks();

  const NavContent = () => (
    <div className="flex h-full flex-col p-6">
      <div className="flex-1">
        <p className="text-xs font-semibold text-outline tracking-wider uppercase mb-4">Menu</p>
        <nav className="space-y-1">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                navigateTo(link.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                currentPage === link.id
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface hover:bg-surface-variant'
              }`}
            >
              <span className={`material-symbols-outlined ${currentPage === link.id ? 'fill-icon text-primary' : 'text-on-surface-variant'}`}>
                {link.icon}
              </span>
              <span>{link.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-outline-variant/10 pt-4">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-on-surface transition-colors hover:bg-surface-variant"
        >
          <span className="material-symbols-outlined text-on-surface-variant">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile scrim overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile slide-in drawer (hidden on md+) */}
      <aside className={`
        fixed top-16 left-0 z-50 h-[calc(100vh-64px)]
        w-64 bg-surface-container-lowest border-r border-outline-variant overflow-y-auto
        transition-transform duration-300 ease-in-out
        md:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <NavContent />
      </aside>

      {/* Desktop static sidebar (hidden on mobile) */}
      <aside className="hidden md:block w-64 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant min-h-[calc(100vh-64px)] sticky top-16 self-start">
        <NavContent />
      </aside>
    </>
  );
};

export default SideNavBar;

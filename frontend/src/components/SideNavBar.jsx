import React from 'react';
import { getCurrentUser } from '../utils/db';

export default function SideNavBar({ currentTab, onNavigate, onLogout }) {
  const user = getCurrentUser();

  if (!user) return null;

  const getLinks = () => {
    if (user.role === 'admin') {
      return [
        { tab: 'admindashboard', icon: 'dashboard', label: 'Admin Panel' },
        { tab: 'discovery', icon: 'search', label: 'Discovery' },
        { tab: 'home', icon: 'home', label: 'Home Page' }
      ];
    } else if (user.role === 'mentor') {
      return [
        { tab: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
        { tab: 'discovery', icon: 'search', label: 'Browse Mentors' },
        { tab: 'home', icon: 'home', label: 'Home Page' }
      ];
    } else {
      // Mentee role
      return [
        { tab: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
        { tab: 'discovery', icon: 'search', label: 'Discovery' },
        { tab: 'sessions', icon: 'event_available', label: 'My Sessions' },
        { tab: 'chatbot', icon: 'forum', label: 'AI Virtual Assistant' },
      ];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-primary text-primary-fixed-dim h-full flex flex-col py-6 border-r border-outline-variant/10 shadow-lg shrink-0">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-primary font-bold">architecture</span>
          </div>
          <div>
            <h1 className="font-headline-md text-sm font-bold text-on-primary leading-none">ProLign</h1>
            <p className="font-label-sm text-[10px] text-primary-fixed-dim opacity-80 mt-1 uppercase tracking-wider">{user.role} Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => (
          <button
            key={link.tab}
            onClick={() => onNavigate(link.tab)}
            className={`w-full flex items-center px-6 py-3 transition-all cursor-pointer text-left ${
              currentTab === link.tab
                ? 'bg-secondary-container text-on-secondary-container font-bold border-l-4 border-secondary'
                : 'text-primary-fixed-dim hover:text-on-primary hover:bg-primary-fixed-variant/10'
            }`}
          >
            <span className="material-symbols-outlined mr-3 text-current">
              {link.icon}
            </span>
            <span className="font-label-sm text-sm">{link.label}</span>
          </button>
        ))}
      </nav>

      {user.role === 'mentee' && (
        <div className="px-4 mb-4">
          <button
            onClick={() => onNavigate('discovery')}
            className="w-full py-3 bg-secondary-fixed text-on-secondary-fixed rounded-xl font-label-sm text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95 cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Book New Session
          </button>
        </div>
      )}

      <div className="pt-4 border-t border-on-primary/10 space-y-1">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-6 py-3 text-primary-fixed-dim hover:text-on-primary hover:bg-error/10 hover:text-error transition-colors text-left cursor-pointer"
        >
          <span className="material-symbols-outlined mr-3">logout</span>
          <span className="font-label-sm text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}

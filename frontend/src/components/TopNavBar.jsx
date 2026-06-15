import React from 'react';
import { getCurrentUser } from '../utils/db';
// Dashboard Nav bars
export default function TopNavBar({ currentTab, onNavigate, onLogout }) {
  const user = getCurrentUser();
  const goToDashboard = () => {
    if (!user) {
      onNavigate('login');
      return;
    }
    onNavigate('dashboard');
  };

  return (
    <header className="bg-background border-b border-outline-variant/10 shadow-sm sticky top-0 full-width z-50">
      <div className="flex justify-between items-center px-6 w-full max-w-7xl mx-auto h-16">
        <div className="flex items-center gap-8">
          <span 
            onClick={() => onNavigate('home')}
            className="font-headline-md text-2xl font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
            id="nav-logo"
          >
            MentorBridge
          </span>
          
          <nav className="hidden md:flex gap-6 items-center">
            <button
              onClick={() => onNavigate('discovery')}
              className={`font-label-sm text-sm transition-colors cursor-pointer ${
                currentTab === 'discovery' 
                  ? 'text-primary font-bold border-b-2 border-primary pb-1' 
                  : 'text-on-surface-variant hover:text-primary font-medium'
              }`}
            >
              Find Mentors
            </button>
            <button
              onClick={() => {
                if (user) {
                  goToDashboard();
                } else {
                  onNavigate('login');
                }
              }}
              className={`font-label-sm text-sm transition-colors cursor-pointer ${
                ['dashboard', 'admin', 'mentor-dashboard', 'mentee-dashboard'].includes(currentTab)
                  ? 'text-primary font-bold border-b-2 border-primary pb-1' 
                  : 'text-on-surface-variant hover:text-primary font-medium'
              }`}
            >
              Dashboard
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button 
            className="material-symbols-outlined p-2 hover:bg-surface-container rounded-full transition-colors relative"
            id="nav-notifications"
          >
            notifications
            {user && <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>}
          </button>

          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
              <div className="text-right hidden sm:block">
                <p className="font-label-sm text-sm text-on-surface leading-none font-semibold">{user.name}</p>
                <p className="text-[11px] text-on-surface-variant uppercase tracking-wider">{user.role}</p>
              </div>
              <img 
                src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"} 
                alt="Profile Avatar" 
                className="w-10 h-10 rounded-full object-cover border-2 border-surface-container-highest cursor-pointer"
                onClick={goToDashboard}
              />
              <button 
                onClick={onLogout}
                className="text-on-surface-variant hover:text-error text-xs font-semibold ml-2"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('login')}
                className="text-primary font-bold font-label-sm text-sm hover:opacity-80 transition-opacity"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

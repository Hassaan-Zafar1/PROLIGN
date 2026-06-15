import React, { useState } from 'react';
import { getCurrentUser, logout } from '../../utils/db';
//landing page navbar
const TopNavBar = ({ navigateTo, currentPage, toggleMobileMenu, isMobileMenuOpen }) => {
  const user = getCurrentUser();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'discovery', label: 'Find Mentors' },
    { id: 'how-it-works', label: 'How it Works' },
    { id: 'resources', label: 'Resources' },
    
  ];

  const handleNavigate = (page) => {
    navigateTo(page);
    setIsNavMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    handleNavigate('home');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => handleNavigate('home')}>
            {user && (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleMobileMenu(); }}
                className="md:hidden mr-2 p-1 text-on-surface hover:bg-surface-variant rounded-md transition-colors"
                aria-label="Toggle dashboard menu"
              >
                <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            )}
            <span className="material-symbols-outlined text-primary text-3xl mr-2">school</span>
            <span className="font-headline-md font-bold text-2xl text-primary tracking-tight">MentorBridge</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigate(link.id)}
                className={`text-sm font-medium hover:text-primary transition-colors ${currentPage === link.id ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'}`}
              >
                {link.label}
              </button>
            ))}
            
            {user ? (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-outline-variant">
                <button 
                  onClick={() => handleNavigate('dashboard')} 
                  className="flex items-center space-x-2 text-sm font-medium text-on-surface hover:text-primary transition-colors"
                >
                  <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="Profile" className="w-8 h-8 rounded-full" />
                  <span>{user.name}</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-error hover:bg-error-container rounded-full transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-outline-variant">
                <button 
                  onClick={() => navigateTo('login')}
                  className="text-sm font-medium text-primary hover:text-primary-container transition-colors cursor-pointer"
                >
                  Log In
                </button>
              </div>
            )}
          </div>

          <div className="relative md:hidden">
            <button
              type="button"
              onClick={() => setIsNavMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-variant transition-colors"
              aria-label="Open navigation menu"
              aria-expanded={isNavMenuOpen}
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>

            {isNavMenuOpen && (
              <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl">
                <div className="py-2">
                  {navLinks.map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => handleNavigate(link.id)}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors ${
                        currentPage === link.id
                          ? 'bg-primary-container text-on-primary-container'
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span>{link.label}</span>
                      {currentPage === link.id && (
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-outline-variant p-2">
                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleNavigate('dashboard')}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="Profile" className="h-8 w-8 rounded-full" />
                        <span>{user.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-medium text-error hover:bg-error-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleNavigate('login')}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-medium text-primary hover:bg-primary-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      Log In
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavBar;

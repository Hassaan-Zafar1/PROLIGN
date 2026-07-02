import { useState, useEffect, useRef, useCallback } from 'react';
import { logout } from '../../utils/db';

const TopNavBar = ({ navigateTo, currentPage, theme, toggleTheme, user, logout }) => {
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const navLinks = [
    { id: 'home',         label: 'Home' },
    { id: 'find-mentors', label: 'Find Mentors' },
    { id: 'how-it-works', label: 'How it Works' },
  ];

  const handleNavigate = (page) => {
    navigateTo(page);
    setIsNavMenuOpen(false);
  };

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      dbLogout();
    }
    handleNavigate('home');
  };

  // Close mobile menu on outside click
  const handleClickOutside = useCallback((e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setIsNavMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isNavMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isNavMenuOpen, handleClickOutside]);

  return (
    <nav
      className="sticky top-0 z-50 bg-background/70 backdrop-blur-lg border-b border-outline-variant/15 w-full"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <div
            className="flex-shrink-0 flex items-center cursor-pointer gap-2"
            onClick={() => handleNavigate('home')}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate('home')}
            aria-label="ProLign home"
          >
            <span className="material-symbols-outlined text-primary text-3xl" aria-hidden="true">school</span>
            <span className="font-headline-md font-bold text-2xl text-primary tracking-tight">ProLign</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigate(link.id)}
                aria-current={currentPage === link.id ? 'page' : undefined}
                className={`text-sm font-medium transition-colors ${
                  currentPage === link.id
                    ? 'text-primary border-b-2 border-primary pb-0.5'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {link.label}
              </button>
            ))}

            <button
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            {user ? (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-outline-variant/30">
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className="flex items-center space-x-2 text-sm font-medium text-on-surface hover:text-primary transition-colors"
                >
                  <img
                    src={user.avatar || user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=4a5a2a&color=ffffff&size=64&bold=true`}
                    alt={`${user.name || 'User'}'s avatar`}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-variant"
                  />
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
              <div className="flex items-center ml-4 pl-4 border-l border-outline-variant/30">
                <button
                  onClick={() => navigateTo('login')}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-on-primary rounded-full hover:brightness-110 transition-all shadow-sm"
                >
                  Log In
                </button>
              </div>
            )}
          </div>

          {/* Mobile nav */}
          <div className="flex items-center gap-1 md:hidden" ref={menuRef}>
            <button
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsNavMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-variant transition-colors"
              aria-label="Open navigation menu"
              aria-expanded={isNavMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {isNavMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            {isNavMenuOpen && (
              <div
                id="mobile-nav-menu"
                className="absolute right-4 top-16 w-64 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest/95 backdrop-blur-xl shadow-xl z-50"
              >
                <div className="py-2">
                  {navLinks.map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => handleNavigate(link.id)}
                      aria-current={currentPage === link.id ? 'page' : undefined}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors ${
                        currentPage === link.id
                          ? 'bg-primary-container text-on-primary-container'
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span>{link.label}</span>
                      {currentPage === link.id && (
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-outline-variant/20 p-2">
                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleNavigate('dashboard')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <img
                          src={user.avatar || user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=4a5a2a&color=ffffff&size=64&bold=true`}
                          alt={`${user.name || 'User'}'s avatar`}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <span>{user.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium text-error hover:bg-error-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">logout</span>
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleNavigate('login')}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium text-primary hover:bg-primary-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">login</span>
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

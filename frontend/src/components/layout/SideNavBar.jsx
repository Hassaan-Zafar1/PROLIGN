import { getCurrentUser } from '../../utils/db';

const SideNavBar = ({ navigateTo, currentPage, theme, toggleTheme }) => {
  const user = getCurrentUser();
  if (!user) return null;

  const getLinks = () => {
    if (user.role === 'mentor') {
      return [
        { id: 'dashboard',  icon: 'dashboard',         label: 'Dashboard' },
        { id: 'sessions',   icon: 'calendar_month',    label: 'My Sessions' },
        { id: 'analytics',  icon: 'analytics',         label: 'Analytics' },
        { id: 'settings',   icon: 'settings',          label: 'Settings' },
      ];
    } else if (user.role === 'admin') {
      return [
        { id: 'admindashboard', icon: 'admin_panel_settings', label: 'Admin Panel' },
        { id: 'analytics',      icon: 'analytics',            label: 'Analytics' },
        { id: 'settings',       icon: 'settings',             label: 'Settings' },
      ];
    } else {
      return [
        { id: 'dashboard',   icon: 'dashboard',      label: 'Dashboard' },
        { id: 'find-mentors',icon: 'search',         label: 'Find Mentors' },
        { id: 'sessions',    icon: 'calendar_month', label: 'My Sessions' },
        { id: 'analytics',   icon: 'analytics',      label: 'Analytics' },
        { id: 'settings',    icon: 'settings',       label: 'Settings' },
      ];
    }
  };

  const links = getLinks();

  return (
    <aside
      className="hidden md:block w-64 flex-shrink-0 min-h-[calc(100vh-64px)] sticky top-16 self-start"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
      aria-label="Sidebar navigation"
    >
      <div className="flex h-full flex-col p-5">

        {/* User info at top */}
        <div
          className="flex items-center gap-3 mb-6 pb-4 cursor-pointer rounded-xl p-2 -mx-2 transition-colors hover:bg-[var(--sidebar-hover-bg)]"
          onClick={() => navigateTo('settings')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigateTo('settings')}
          aria-label="Go to settings"
        >
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=4a5a2a&color=ffffff&size=64&bold=true`}
            alt={`${user.name || 'User'}'s avatar`}
            className="w-9 h-9 rounded-full object-cover border border-[var(--sidebar-border)] flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--sidebar-text)' }}>
              {user.name}
            </p>
            <p className="text-[11px] truncate capitalize" style={{ color: 'var(--sidebar-text-secondary)' }}>
              {user.role}
            </p>
          </div>
        </div>

        <div className="flex-1">
          <p className="sidebar-section-label">
            Menu
          </p>
          <nav className="space-y-1" aria-label="Main menu">
            {links.map((link) => {
              const active = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => navigateTo(link.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`sidebar-nav-btn${active ? ' active' : ''}`}
                >
                  <span
                    className="material-symbols-outlined sidebar-nav-icon"
                    aria-hidden="true"
                    style={{
                      fontVariationSettings: active ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 300",
                    }}
                  >
                    {link.icon}
                  </span>
                  <span className="sidebar-nav-label">{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div
          className="sidebar-divider"
        />

        <div>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="sidebar-nav-btn sidebar-theme-toggle"
          >
            <span
              className="material-symbols-outlined sidebar-nav-icon"
              aria-hidden="true"
            >
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
            <span className="sidebar-nav-label">
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </button>
        </div>

      </div>
    </aside>
  );
};

export default SideNavBar;

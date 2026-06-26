import { getCurrentUser } from '../../utils/db';

const SideNavBar = ({ navigateTo, currentPage, theme, toggleTheme }) => {
  const user = getCurrentUser();
  if (!user) return null;

  const getLinks = () => {
    if (user.role === 'mentor') {
      return [
        { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
        { id: 'sessions', icon: 'calendar_month', label: 'My Sessions' },
        { id: 'analytics', icon: 'analytics', label: 'Analytics' },
        { id: 'settings', icon: 'settings', label: 'Settings' },
      ];
    } else if (user.role === 'admin') {
      return [
        { id: 'admindashboard', icon: 'admin_panel_settings', label: 'Admin Panel' },
        { id: 'analytics', icon: 'analytics', label: 'Analytics' },
        { id: 'settings', icon: 'settings', label: 'Settings' },
      ];
    } else {
      return [
        { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
        { id: 'discovery', icon: 'search', label: 'Find Mentors' },
        { id: 'sessions', icon: 'calendar_month', label: 'My Sessions' },
        { id: 'analytics', icon: 'analytics', label: 'Analytics' },
        { id: 'settings', icon: 'settings', label: 'Settings' },
      ];
    }
  };

  const links = getLinks();

  return (
    <aside className="hidden md:block w-64 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant min-h-[calc(100vh-64px)] sticky top-16 self-start">
      <div className="flex h-full flex-col p-6">
        <div className="flex-1">
          <p className="text-xs font-semibold text-outline tracking-wider uppercase mb-4">Menu</p>
          <nav className="space-y-1">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => navigateTo(link.id)}
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
    </aside>
  );
};

export default SideNavBar;

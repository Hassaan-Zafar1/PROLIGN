import { useState, useEffect, useCallback } from 'react';

/**
 * Shared light/dark theme hook — was previously copy-pasted (with tiny drift)
 * across AdminDashboard, MentorDashboard, and MenteeDashboard. Single source
 * of truth now; `applyTheme` accepts the Settings page's "Light"/"Dark" labels
 * directly so callers don't each re-derive the mapping.
 */
export const useTheme = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('prolign-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('prolign-theme', next);
      return next;
    });
  }, []);

  const applyTheme = useCallback((preference) => {
    const next = preference === 'Dark' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('prolign-theme', next);
  }, []);

  return { theme, toggleTheme, applyTheme };
};

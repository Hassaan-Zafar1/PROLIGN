import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { tokenManager } from '../utils/tokenManager';
import { authService } from '../services/authService';
import { getDB, saveDB, logout as dbLogout } from '../utils/db';

// Not exported — only used internally and via useAuth hook
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getAccessToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        tokenManager.setUser(currentUser);
        setUser(currentUser);
        setIsAuthenticated(true);
        try {
          const db = getDB();
          db.currentUser = currentUser;
          saveDB(db);
        } catch (e) {}
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          console.warn('Session expired and refresh failed — logging out');
          tokenManager.clearTokens();
          setUser(null);
          setIsAuthenticated(false);
        } else {
          console.warn('Could not reach server:', error.message);
          const cachedUser = tokenManager.getUser();
          if (cachedUser) {
            setUser(cachedUser);
            setIsAuthenticated(true);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Memoized: these are commonly placed in effect dependency arrays (e.g. a
  // "build my profile once" effect that calls updateUser on completion). An
  // unmemoized function here gets a new reference every render, which turns
  // `useEffect(..., [updateUser])` into an infinite loop — the callback
  // updates state → provider re-renders → new reference → effect re-fires.
  const login = useCallback((userData, token) => {
    tokenManager.setAccessToken(token);
    tokenManager.setUser(userData);
    setUser(userData);
    setIsAuthenticated(true);
    try {
      const db = getDB();
      db.currentUser = userData;
      saveDB(db);
    } catch (e) {}
  }, []);

  const logout = useCallback(async () => {
    tokenManager.clearTokens();
    setUser(null);
    setIsAuthenticated(false);
    try {
      dbLogout();
    } catch (e) {}

    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const updateUser = useCallback((userData) => {
    const freshUser = { ...userData };
    tokenManager.setUser(freshUser);
    setUser(freshUser);
    try {
      const db = getDB();
      db.currentUser = freshUser;
      saveDB(db);
    } catch (e) {}
  }, []);

  // Re-fetch the current user from the backend and merge it in — used after
  // a background action (e.g. linking the AI interview session) that changes
  // server state the client didn't set directly, so a stale cached user
  // isn't left behind. Swallows errors: this is a best-effort refresh, not
  // something that should surface as a hard failure to the caller.
  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.getCurrentUser();
      updateUser(freshUser);
      return freshUser;
    } catch (error) {
      console.warn('refreshUser failed:', error.message);
      return null;
    }
  }, [updateUser]);

  // Also memoize the context value itself — otherwise every consumer
  // re-renders (and re-runs effects keyed on the context value) whenever
  // AuthProvider re-renders for any reason, even if nothing here changed.
  const value = useMemo(
    () => ({ user, isAuthenticated, loading, login, logout, updateUser, refreshUser }),
    [user, isAuthenticated, loading, login, logout, updateUser, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Only export the hook — no named AuthContext export
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

import React, { createContext, useState, useEffect } from 'react';
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

  const login = (userData, token) => {
    tokenManager.setAccessToken(token);
    tokenManager.setUser(userData);
    setUser(userData);
    setIsAuthenticated(true);
    try {
      const db = getDB();
      db.currentUser = userData;
      saveDB(db);
    } catch (e) {}
  };

  const logout = async () => {
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
  };

  const updateUser = (userData) => {
    const freshUser = { ...userData };
    tokenManager.setUser(freshUser);
    setUser(freshUser);
    try {
      const db = getDB();
      db.currentUser = freshUser;
      saveDB(db);
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUser }}>
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

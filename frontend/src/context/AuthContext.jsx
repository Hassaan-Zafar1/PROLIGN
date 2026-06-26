import React, { createContext, useState, useEffect } from 'react';
import { tokenManager } from '../utils/tokenManager';
import { authService } from '../services/authService';
import { getDB, saveDB } from '../utils/db';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getAccessToken();

      if (token) {
        // Try to get fresh user data from API
        try {
          const currentUser = await authService.getCurrentUser();
          tokenManager.setUser(currentUser);
          setUser(currentUser);
          setIsAuthenticated(true);
          // Sync db.currentUser so getCurrentUser() from db.js works
          const db = getDB();
          db.currentUser = currentUser;
          saveDB(db);
        } catch (error) {
          // Token invalid or expired — clear everything
          console.error('Session invalid:', error);
          tokenManager.clearTokens();
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // Token set first, no extra API call — userData from verifyOTP is sufficient
  const login = (userData, token) => {
    tokenManager.setAccessToken(token);
    tokenManager.setUser(userData);
    setUser(userData);
    setIsAuthenticated(true);
    // Sync db.currentUser so getCurrentUser() from db.js works
    try {
      const db = getDB();
      db.currentUser = userData;
      saveDB(db);
    } catch (e) {
      // db may not be available in some contexts
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenManager.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (userData) => {
    tokenManager.setUser(userData);
    setUser(userData);
    // Sync db.currentUser
    try {
      const db = getDB();
      db.currentUser = userData;
      saveDB(db);
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
import React, { createContext, useState, useEffect } from 'react';
import { tokenManager } from '../utils/tokenManager';
import { authService } from '../services/authService';

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
        setIsAuthenticated(true);

        // Try to get fresh user data from API
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          tokenManager.setUser(currentUser);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          tokenManager.clearTokens();
          setIsAuthenticated(false);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (userData, token) => {
    tokenManager.setAccessToken(token);
    setIsAuthenticated(true);

    // Fetch full user data from API
    try {
      const fullUserData = await authService.getCurrentUser();
      tokenManager.setUser(fullUserData);
      setUser(fullUserData);
    } catch (error) {
      // If API call fails, use provided userData as fallback
      console.error('Failed to fetch full user data:', error);
      tokenManager.setUser(userData);
      setUser(userData);
    }
  };

  const logout = () => {
    tokenManager.clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    tokenManager.setUser(userData);
    setUser(userData);
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
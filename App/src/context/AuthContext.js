import React, { createContext, useContext, useState } from 'react';
import { USERS } from '../data/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Mock login — matches the seed credentials from the web app.
  const login = (email, password) => {
    const found = USERS.find(
      (u) => u.email && u.email.toLowerCase() === String(email).trim().toLowerCase() && u.password === password
    );
    if (found) {
      setUser(found);
      return { ok: true, user: found };
    }
    return { ok: false, error: 'Invalid login credentials.' };
  };

  // Quick demo login by role (no typing needed).
  const quickLogin = (role) => {
    const map = { mentor: 'u1', mentee: 'mentee1', admin: 'admin1' };
    const found = USERS.find((u) => u.id === map[role]);
    if (found) setUser(found);
    return found;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, quickLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

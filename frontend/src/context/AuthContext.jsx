import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      const token = authService.getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await authService.me();
        if (response.data?.user) {
          setUser(response.data.user);
          sessionStorage.setItem('vitalwatch_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        setUser(null);
        sessionStorage.removeItem('vitalwatch_token');
        sessionStorage.removeItem('vitalwatch_user');
      } finally {
        setLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setUser(response.data.user);
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    setUser(response.data.user);
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


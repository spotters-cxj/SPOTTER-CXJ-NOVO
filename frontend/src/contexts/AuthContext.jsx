import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const login = useCallback(() => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  }, []);

  const processSession = useCallback(async (sessionId) => {
    try {
      const response = await authApi.createSession(sessionId);
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Session processing error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, []);

  const isAdmin = user?.role === 'admin_principal' || user?.role === 'admin_authorized';
  const isAdminPrincipal = user?.role === 'admin_principal';

  const value = {
    user,
    loading,
    login,
    logout,
    processSession,
    checkAuth,
    isAdmin,
    isAdminPrincipal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

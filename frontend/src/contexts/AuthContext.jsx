import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

// Hierarchy levels for permission checking
const HIERARCHY_LEVELS = {
  lider: 7,
  admin: 6,
  gestao: 5,
  produtor: 4,
  avaliador: 3,
  colaborador: 2,
  membro: 1
};

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

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
      throw error;
    }
  }, []);

  // Get highest role level from user tags
  const getUserLevel = useCallback(() => {
    if (!user?.tags || user.tags.length === 0) return 0;
    return Math.max(...user.tags.map(tag => HIERARCHY_LEVELS[tag] || 0));
  }, [user]);

  // Check permissions based on tags
  const userLevel = getUserLevel();
  
  // Admin = admin tag or higher (admin, lider)
  const isAdmin = userLevel >= HIERARCHY_LEVELS.admin;
  
  // Admin Principal = lider tag
  const isAdminPrincipal = user?.tags?.includes('lider');
  
  // Gestao = gestao tag or higher
  const isGestao = userLevel >= HIERARCHY_LEVELS.gestao;
  
  // Avaliador = avaliador tag or higher
  const isAvaliador = userLevel >= HIERARCHY_LEVELS.avaliador;
  
  // Colaborador = colaborador tag or higher, or VIP
  const isColaborador = userLevel >= HIERARCHY_LEVELS.colaborador || user?.is_vip;

  // Helper function to check if user has specific tag
  const hasTag = useCallback((tag) => {
    return user?.tags?.includes(tag) || false;
  }, [user]);

  // Helper function to check if user level is at least the specified level
  const hasMinLevel = useCallback((minLevel) => {
    return userLevel >= (HIERARCHY_LEVELS[minLevel] || 0);
  }, [userLevel]);

  const value = {
    user,
    loading,
    login,
    logout,
    processSession,
    checkAuth,
    refreshUser,
    isAdmin,
    isAdminPrincipal,
    isGestao,
    isAvaliador,
    isColaborador,
    userLevel,
    hasTag,
    hasMinLevel,
    HIERARCHY_LEVELS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  spotter_cxj: 1
};

// Auth error types
const AUTH_ERRORS = {
  DOMAIN_NOT_AUTHORIZED: 'Domínio não autorizado para autenticação',
  CONNECTION_INTERRUPTED: 'Conexão interrompida durante autenticação',
  SESSION_EXPIRED: 'Sessão expirada. Por favor, faça login novamente',
  TIMEOUT: 'Tempo limite de autenticação excedido',
  UNKNOWN: 'Erro desconhecido durante autenticação'
};

// Helper to clear all auth state
const clearAuthState = () => {
  // Clear localStorage
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_pending');
    localStorage.removeItem('auth_timestamp');
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }

  // Clear session cookies
  try {
    document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
  } catch (e) {
    console.warn('Failed to clear cookies:', e);
  }
};

// Normalize URL (remove www, ensure https)
const normalizeUrl = (url) => {
  try {
    const parsed = new URL(url);
    // Force HTTPS
    parsed.protocol = 'https:';
    // Remove www
    parsed.hostname = parsed.hostname.replace(/^www\./, '');
    return parsed.toString();
  } catch (e) {
    return url;
  }
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
  const [authError, setAuthError] = useState(null);
  const loginTimeoutRef = useRef(null);

  const checkAuth = useCallback(async () => {
    try {
      setAuthError(null);
      const response = await authApi.getMe();
      setUser(response.data);
      
      // Store token in localStorage for persistence
      const token = response.headers?.['x-session-token'];
      if (token) {
        localStorage.setItem('auth_token', token);
      }
    } catch (error) {
      console.log('Auth check failed:', error?.response?.status, error?.message);
      setUser(null);
      
      // Only clear state on actual auth errors, not network errors
      if (error?.response?.status === 401) {
        clearAuthState();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for pending auth on mount
    const authPending = localStorage.getItem('auth_pending');
    const authTimestamp = localStorage.getItem('auth_timestamp');
    
    if (authPending && authTimestamp) {
      const elapsed = Date.now() - parseInt(authTimestamp, 10);
      // If auth has been pending for more than 10 seconds, clear state
      if (elapsed > 10000) {
        console.warn('Auth timeout detected, clearing state');
        clearAuthState();
      }
    }
    
    checkAuth();
    
    // Cleanup timeout on unmount
    return () => {
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
    };
  }, [checkAuth]);

  // Login with Emergent Auth
  const login = useCallback(() => {
    try {
      setAuthError(null);
      
      // Mark auth as pending
      localStorage.setItem('auth_pending', 'true');
      localStorage.setItem('auth_timestamp', Date.now().toString());
      
      // Set timeout to clear state if login doesn't complete
      loginTimeoutRef.current = setTimeout(() => {
        const pending = localStorage.getItem('auth_pending');
        if (pending) {
          console.warn('Login timeout - clearing auth state');
          clearAuthState();
          setAuthError(AUTH_ERRORS.TIMEOUT);
          alert(AUTH_ERRORS.TIMEOUT);
        }
      }, 10000);
      
      // Build redirect URL - normalize to handle www vs non-www
      const origin = normalizeUrl(window.location.origin);
      const redirectUrl = origin + '/auth/callback';
      
      // Ensure HTTPS for auth URL
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      
      console.log('Initiating login with redirect:', redirectUrl);
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Login initiation error:', error);
      clearAuthState();
      
      let errorMessage = AUTH_ERRORS.UNKNOWN;
      if (error.message?.includes('domain') || error.message?.includes('origin')) {
        errorMessage = AUTH_ERRORS.DOMAIN_NOT_AUTHORIZED;
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = AUTH_ERRORS.CONNECTION_INTERRUPTED;
      }
      
      setAuthError(errorMessage);
      alert(errorMessage);
    }
  }, []);

  // Process session after callback
  const processSession = useCallback(async (sessionId) => {
    try {
      setAuthError(null);
      
      // Clear the timeout since we got a response
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }
      
      console.log('Processing session:', sessionId?.substring(0, 8) + '...');
      
      const response = await authApi.createSession(sessionId);
      setUser(response.data);
      
      // Clear pending state
      localStorage.removeItem('auth_pending');
      localStorage.removeItem('auth_timestamp');
      
      // Store session info
      if (response.data?.user_id) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      console.log('Session processed successfully for user:', response.data?.name);
      return response.data;
      
    } catch (error) {
      console.error('Session processing error:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data
      });
      
      // Clear all auth state on error
      clearAuthState();
      
      let errorMessage = AUTH_ERRORS.UNKNOWN;
      const errorDetail = error?.response?.data?.detail || error?.message || '';
      
      if (errorDetail.includes('domain') || errorDetail.includes('origin') || error?.response?.status === 403) {
        errorMessage = AUTH_ERRORS.DOMAIN_NOT_AUTHORIZED;
      } else if (errorDetail.includes('network') || errorDetail.includes('timeout') || !error?.response) {
        errorMessage = AUTH_ERRORS.CONNECTION_INTERRUPTED;
      } else if (error?.response?.status === 401) {
        errorMessage = AUTH_ERRORS.SESSION_EXPIRED;
      }
      
      setAuthError(errorMessage);
      alert(`Erro de autenticação: ${errorMessage}\n\nDetalhes: ${errorDetail}`);
      
      throw error;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      clearAuthState();
    }
  }, []);

  // Get highest role level from user tags
  const getUserLevel = useCallback(() => {
    if (!user?.tags || user.tags.length === 0) return 0;
    return Math.max(...user.tags.map(tag => HIERARCHY_LEVELS[tag] || 0));
  }, [user]);

  // Check permissions based on tags
  const userLevel = getUserLevel();
  const isAdmin = userLevel >= HIERARCHY_LEVELS.admin;
  const isAdminPrincipal = user?.tags?.includes('lider');
  const isGestao = userLevel >= HIERARCHY_LEVELS.gestao;
  const isAvaliador = userLevel >= HIERARCHY_LEVELS.avaliador;
  const isColaborador = userLevel >= HIERARCHY_LEVELS.colaborador || user?.is_vip;

  const hasTag = useCallback((tag) => {
    return user?.tags?.includes(tag) || false;
  }, [user]);

  const hasMinLevel = useCallback((minLevel) => {
    return userLevel >= (HIERARCHY_LEVELS[minLevel] || 0);
  }, [userLevel]);

  const value = {
    user,
    loading,
    authError,
    login,
    logout,
    processSession,
    checkAuth,
    clearAuthState,
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

import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { processSession } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Get session_id from URL hash
      const hash = location.hash;
      const params = new URLSearchParams(hash.replace('#', ''));
      const sessionId = params.get('session_id');

      if (sessionId) {
        try {
          await processSession(sessionId);
          navigate('/', { replace: true });
        } catch (error) {
          console.error('Auth callback error:', error);
          navigate('/', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    };

    processAuth();
  }, [location.hash, navigate, processSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1929]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Autenticando...</p>
      </div>
    </div>
  );
};

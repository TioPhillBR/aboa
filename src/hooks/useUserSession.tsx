import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const ACTIVITY_INTERVAL = 60000; // Update activity every 1 minute
const INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes

export function useUserSession() {
  const { user, signOut } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create or update session
  const createSession = useCallback(async () => {
    if (!user) return;

    try {
      // First, end any existing active sessions for this user
      await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          session_ended_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Create new session
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          user_agent: navigator.userAgent,
        })
        .select('id')
        .single();

      if (!error && data) {
        sessionIdRef.current = data.id;
      }
    } catch (err) {
      console.error('Error creating session:', err);
    }
  }, [user]);

  // Update last activity
  const updateActivity = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', sessionIdRef.current);
    } catch (err) {
      console.error('Error updating activity:', err);
    }
  }, []);

  // End session
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          session_ended_at: new Date().toISOString() 
        })
        .eq('id', sessionIdRef.current);
      
      sessionIdRef.current = null;
    } catch (err) {
      console.error('Error ending session:', err);
    }
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(async () => {
      console.log('User inactive for 20 minutes, logging out...');
      await endSession();
      await signOut();
    }, INACTIVITY_TIMEOUT);
  }, [endSession, signOut]);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Listen for user activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, resetInactivityTimer]);

  // Initialize session on login
  useEffect(() => {
    if (user) {
      createSession();
      resetInactivityTimer();

      // Set up periodic activity updates
      activityIntervalRef.current = setInterval(updateActivity, ACTIVITY_INTERVAL);
    }

    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [user, createSession, updateActivity, resetInactivityTimer]);

  // End session on logout or window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Use sendBeacon for reliable session ending
        const url = `${import.meta.env.VITE_SUPABASE_URL || 'https://sarauvembzbneunhssud.supabase.co'}/rest/v1/user_sessions?id=eq.${sessionIdRef.current}`;
        navigator.sendBeacon(url, JSON.stringify({
          is_active: false,
          session_ended_at: new Date().toISOString()
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, [endSession]);

  return {
    endSession,
    resetInactivityTimer,
  };
}
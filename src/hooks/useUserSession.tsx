import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const ACTIVITY_INTERVAL = 30000; // Update activity every 30 seconds
const INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes

export function useUserSession() {
  const { user, session, signOut } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCreatingSessionRef = useRef<boolean>(false);
  const signOutRef = useRef(signOut);
  const accessTokenRef = useRef<string | null>(null);
  
  // Keep signOut ref updated
  useEffect(() => {
    signOutRef.current = signOut;
  }, [signOut]);

  // Keep access token ref updated
  useEffect(() => {
    accessTokenRef.current = session?.access_token ?? null;
  }, [session]);

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

  // Create or update session
  const createSession = useCallback(async () => {
    if (!user || isCreatingSessionRef.current || sessionIdRef.current) return;

    isCreatingSessionRef.current = true;

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
          is_active: true,
          session_started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (!error && data) {
        sessionIdRef.current = data.id;
        console.log('Session created:', data.id);
      } else if (error) {
        console.error('Error creating session:', error);
      }
    } catch (err) {
      console.error('Error creating session:', err);
    } finally {
      isCreatingSessionRef.current = false;
    }
  }, [user]);

  // Update last activity
  const updateActivity = useCallback(async () => {
    if (!sessionIdRef.current) {
      // If we don't have a session but have a user, try to create one
      if (user && !isCreatingSessionRef.current) {
        await createSession();
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          last_activity_at: new Date().toISOString(),
          is_active: true 
        })
        .eq('id', sessionIdRef.current);

      if (error) {
        console.error('Error updating activity:', error);
        // If update fails, session might be invalid - try to recreate
        sessionIdRef.current = null;
        await createSession();
      }
    } catch (err) {
      console.error('Error updating activity:', err);
    }
  }, [user, createSession]);

  // Reset inactivity timer - use ref for signOut to avoid dependency changes
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(async () => {
      console.log('User inactive for 20 minutes, logging out...');
      await endSession();
      await signOutRef.current();
    }, INACTIVITY_TIMEOUT);
  }, [endSession]);

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
    if (user && !sessionIdRef.current && !isCreatingSessionRef.current) {
      createSession();
      resetInactivityTimer();

      // Set up periodic activity updates
      activityIntervalRef.current = setInterval(updateActivity, ACTIVITY_INTERVAL);
    }

    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
        activityIntervalRef.current = null;
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };
  }, [user, createSession, updateActivity, resetInactivityTimer]);

  // Clean up on user logout
  useEffect(() => {
    if (!user && sessionIdRef.current) {
      endSession();
    }
  }, [user, endSession]);

  // End session on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Use fetch with keepalive instead of sendBeacon to include auth headers
        const url = `https://sarauvembzbneunhssud.supabase.co/rest/v1/user_sessions?id=eq.${sessionIdRef.current}`;
        
        const body = JSON.stringify({
          is_active: false,
          session_ended_at: new Date().toISOString()
        });

        try {
          fetch(url, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcmF1dmVtYnpibmV1bmhzc3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMTc4MjEsImV4cCI6MjA4NDc5MzgyMX0.H1ww5qaVw2WGX7N9Ls6eM2q5_se8cj_J6hsw12XeNpM',
              'Authorization': `Bearer ${accessTokenRef.current || ''}`,
              'Prefer': 'return=minimal',
            },
            keepalive: true,
          });
        } catch {
          // Silently fail on unload
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && sessionIdRef.current) {
        // User came back - update activity
        updateActivity();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, updateActivity]);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        endSession();
      }
    };
  }, [endSession]);

  return {
    endSession,
    resetInactivityTimer,
  };
}

-- Create table to track user sessions (online users)
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can update all sessions (for cleanup)
CREATE POLICY "Admins can update all sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Create indexes for faster queries
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_is_active ON public.user_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions(last_activity_at);

-- Add allowed_locations column to raffles table for location restriction
ALTER TABLE public.raffles 
  ADD COLUMN IF NOT EXISTS allowed_locations TEXT[] DEFAULT NULL;

-- Add lgpd_consent to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lgpd_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lgpd_consent_at TIMESTAMP WITH TIME ZONE;
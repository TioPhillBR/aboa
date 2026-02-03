-- Create table for settings change history/audit log
CREATE TABLE public.settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  change_type VARCHAR(20) NOT NULL DEFAULT 'update',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_settings_history_category ON public.settings_history(category);
CREATE INDEX idx_settings_history_created_at ON public.settings_history(created_at DESC);
CREATE INDEX idx_settings_history_changed_by ON public.settings_history(changed_by);

-- Enable RLS
ALTER TABLE public.settings_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view settings history
CREATE POLICY "Admins can view settings history"
ON public.settings_history
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can insert settings history (through the app)
CREATE POLICY "Admins can insert settings history"
ON public.settings_history
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Create table for settings backups
CREATE TABLE public.settings_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  settings_data JSONB NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings_backups ENABLE ROW LEVEL SECURITY;

-- Only admins can manage backups
CREATE POLICY "Admins can manage settings backups"
ON public.settings_backups
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
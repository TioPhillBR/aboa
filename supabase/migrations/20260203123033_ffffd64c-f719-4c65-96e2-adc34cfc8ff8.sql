-- Create user withdrawals table for wallet balance withdrawals
CREATE TABLE public.user_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL CHECK (amount >= 100),
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL DEFAULT 'cpf',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals"
  ON public.user_withdrawals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own withdrawals
CREATE POLICY "Users can create own withdrawals"
  ON public.user_withdrawals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all withdrawals
CREATE POLICY "Admins can view all withdrawals"
  ON public.user_withdrawals
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can update withdrawals
CREATE POLICY "Admins can update withdrawals"
  ON public.user_withdrawals
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_user_withdrawals_user_id ON public.user_withdrawals(user_id);
CREATE INDEX idx_user_withdrawals_status ON public.user_withdrawals(status);

-- Trigger for updated_at
CREATE TRIGGER update_user_withdrawals_updated_at
  BEFORE UPDATE ON public.user_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
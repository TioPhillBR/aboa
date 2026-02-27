CREATE TABLE IF NOT EXISTS public.pix_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  external_id TEXT NOT NULL UNIQUE,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pix_deposits_external_id ON public.pix_deposits(external_id);
CREATE INDEX IF NOT EXISTS idx_pix_deposits_user_status ON public.pix_deposits(user_id, status);

ALTER TABLE public.pix_deposits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pix deposits" ON public.pix_deposits;
CREATE POLICY "Users can view own pix deposits"
  ON public.pix_deposits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pix deposits" ON public.pix_deposits;
CREATE POLICY "Users can insert own pix deposits"
  ON public.pix_deposits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all pix deposits" ON public.pix_deposits;
CREATE POLICY "Admins can manage all pix deposits"
  ON public.pix_deposits FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
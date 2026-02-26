-- Tabela para rastrear depósitos PIX pendentes (Gatebox)
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

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_pix_deposits_external_id ON public.pix_deposits(external_id);
CREATE INDEX IF NOT EXISTS idx_pix_deposits_user_status ON public.pix_deposits(user_id, status);

-- RLS: usuário só vê seus próprios depósitos
ALTER TABLE public.pix_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pix deposits"
  ON public.pix_deposits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Webhook precisa inserir/atualizar (service role)
-- Service role bypassa RLS por padrão

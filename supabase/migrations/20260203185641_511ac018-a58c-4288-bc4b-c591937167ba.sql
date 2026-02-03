-- Criar tabela para rastrear pagamentos de prêmios
CREATE TABLE public.prize_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  prize_type TEXT NOT NULL, -- 'scratch_card' ou 'raffle'
  prize_source_id UUID NOT NULL, -- ID da scratch_chance ou raffle_prize
  amount NUMERIC NOT NULL,
  pix_key TEXT,
  pix_key_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_prize_payments_user_id ON public.prize_payments(user_id);
CREATE INDEX idx_prize_payments_status ON public.prize_payments(status);
CREATE INDEX idx_prize_payments_created_at ON public.prize_payments(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.prize_payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage all prize payments"
ON public.prize_payments
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view their own prize payments"
ON public.prize_payments
FOR SELECT
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_prize_payments_updated_at
BEFORE UPDATE ON public.prize_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.prize_payments IS 'Rastreamento de pagamentos de prêmios para usuários';
COMMENT ON COLUMN public.prize_payments.prize_type IS 'Tipo do prêmio: scratch_card ou raffle';
COMMENT ON COLUMN public.prize_payments.prize_source_id IS 'ID da origem do prêmio (scratch_chance ou raffle_prize)';
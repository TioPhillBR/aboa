-- =============================================
-- FASE 1: NOVAS TABELAS PARA O SISTEMA COMPLETO
-- =============================================

-- Enum para status de afiliado
CREATE TYPE public.affiliate_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Enum para status de comissão
CREATE TYPE public.commission_status AS ENUM ('pending', 'approved', 'paid');

-- Enum para status de saque
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- Enum para status de pagamento
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'cancelled', 'refunded');

-- Enum para status de prêmio
CREATE TYPE public.prize_status AS ENUM ('pending', 'processing', 'delivered');

-- =============================================
-- TABELA: affiliates (Sistema de Afiliados)
-- =============================================
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  avatar_url TEXT,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  commission_percentage NUMERIC NOT NULL DEFAULT 10,
  affiliate_code VARCHAR(10) NOT NULL UNIQUE,
  status affiliate_status NOT NULL DEFAULT 'pending',
  total_sales NUMERIC DEFAULT 0,
  total_commission NUMERIC DEFAULT 0,
  pending_commission NUMERIC DEFAULT 0,
  paid_commission NUMERIC DEFAULT 0,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABELA: affiliate_sales (Vendas via Afiliados)
-- =============================================
CREATE TABLE public.affiliate_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  product_type TEXT NOT NULL,
  product_id UUID NOT NULL,
  sale_amount NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  commission_status commission_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABELA: affiliate_withdrawals (Saques de Afiliados)
-- =============================================
CREATE TABLE public.affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status withdrawal_status NOT NULL DEFAULT 'pending',
  pix_key TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABELA: payment_transactions (Transações de Pagamento)
-- =============================================
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  transaction_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  gateway_fee NUMERIC DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  gateway_transaction_id TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  product_type TEXT,
  product_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABELA: share_tracking (Rastreamento de Compartilhamentos)
-- =============================================
CREATE TABLE public.share_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sharer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_code VARCHAR(20) NOT NULL UNIQUE,
  clicks INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  credits_earned NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABELA: share_events (Eventos de Compartilhamento)
-- =============================================
CREATE TABLE public.share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_tracking_id UUID NOT NULL REFERENCES public.share_tracking(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  referred_user_id UUID REFERENCES public.profiles(id),
  purchase_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABELA: user_locations (Localização de Usuários)
-- =============================================
CREATE TABLE public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude NUMERIC,
  longitude NUMERIC,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'BR',
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABELA: raffle_prizes (Gestão de Prêmios de Rifas)
-- =============================================
CREATE TABLE public.raffle_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  estimated_value NUMERIC,
  status prize_status NOT NULL DEFAULT 'pending',
  winner_id UUID REFERENCES public.profiles(id),
  delivery_notes TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABELA: scratch_card_batches (Lotes de Raspadinhas)
-- =============================================
CREATE TABLE public.scratch_card_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scratch_card_id UUID NOT NULL REFERENCES public.scratch_cards(id) ON DELETE CASCADE,
  batch_name TEXT NOT NULL,
  total_cards INTEGER NOT NULL,
  cards_sold INTEGER DEFAULT 0,
  total_prizes INTEGER NOT NULL,
  prizes_distributed INTEGER DEFAULT 0,
  prize_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- ALTERAÇÕES EM TABELAS EXISTENTES
-- =============================================

-- Adicionar colunas à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS registration_source TEXT,
ADD COLUMN IF NOT EXISTS source_code TEXT;

-- Adicionar colunas à tabela wallet_transactions
ALTER TABLE public.wallet_transactions
ADD COLUMN IF NOT EXISTS source_type TEXT,
ADD COLUMN IF NOT EXISTS source_id UUID;

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_status ON public.affiliates(status);
CREATE INDEX idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX idx_affiliate_sales_affiliate_id ON public.affiliate_sales(affiliate_id);
CREATE INDEX idx_affiliate_sales_created_at ON public.affiliate_sales(created_at);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions(created_at);
CREATE INDEX idx_share_tracking_sharer_id ON public.share_tracking(sharer_id);
CREATE INDEX idx_share_tracking_code ON public.share_tracking(share_code);
CREATE INDEX idx_share_events_tracking_id ON public.share_events(share_tracking_id);
CREATE INDEX idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX idx_raffle_prizes_raffle_id ON public.raffle_prizes(raffle_id);
CREATE INDEX idx_scratch_card_batches_card_id ON public.scratch_card_batches(scratch_card_id);

-- =============================================
-- TRIGGERS PARA updated_at
-- =============================================
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_share_tracking_updated_at
  BEFORE UPDATE ON public.share_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_raffle_prizes_updated_at
  BEFORE UPDATE ON public.raffle_prizes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scratch_card_batches_updated_at
  BEFORE UPDATE ON public.scratch_card_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNÇÃO PARA GERAR CÓDIGO DE AFILIADO
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS VARCHAR(10)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code VARCHAR(10);
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'AF' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.affiliates WHERE affiliate_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- =============================================
-- FUNÇÃO PARA GERAR CÓDIGO DE COMPARTILHAMENTO
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'SH' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.share_tracking WHERE share_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- =============================================
-- RLS: HABILITAR EM TODAS AS TABELAS
-- =============================================
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratch_card_batches ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: affiliates
-- =============================================
CREATE POLICY "Admins can manage all affiliates"
  ON public.affiliates FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own affiliate profile"
  ON public.affiliates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affiliate profile"
  ON public.affiliates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate profile"
  ON public.affiliates FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: affiliate_sales
-- =============================================
CREATE POLICY "Admins can manage all affiliate sales"
  ON public.affiliate_sales FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Affiliates can view their own sales"
  ON public.affiliate_sales FOR SELECT
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- =============================================
-- RLS POLICIES: affiliate_withdrawals
-- =============================================
CREATE POLICY "Admins can manage all withdrawals"
  ON public.affiliate_withdrawals FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Affiliates can view their own withdrawals"
  ON public.affiliate_withdrawals FOR SELECT
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Affiliates can request withdrawals"
  ON public.affiliate_withdrawals FOR INSERT
  WITH CHECK (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- =============================================
-- RLS POLICIES: payment_transactions
-- =============================================
CREATE POLICY "Admins can view all transactions"
  ON public.payment_transactions FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage transactions"
  ON public.payment_transactions FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: share_tracking
-- =============================================
CREATE POLICY "Admins can manage all share tracking"
  ON public.share_tracking FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own share tracking"
  ON public.share_tracking FOR SELECT
  USING (auth.uid() = sharer_id);

CREATE POLICY "Users can create their own share tracking"
  ON public.share_tracking FOR INSERT
  WITH CHECK (auth.uid() = sharer_id);

CREATE POLICY "Users can update their own share tracking"
  ON public.share_tracking FOR UPDATE
  USING (auth.uid() = sharer_id);

-- =============================================
-- RLS POLICIES: share_events
-- =============================================
CREATE POLICY "Admins can manage all share events"
  ON public.share_events FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Sharers can view events from their shares"
  ON public.share_events FOR SELECT
  USING (share_tracking_id IN (SELECT id FROM public.share_tracking WHERE sharer_id = auth.uid()));

-- =============================================
-- RLS POLICIES: user_locations
-- =============================================
CREATE POLICY "Admins can manage all user locations"
  ON public.user_locations FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own location"
  ON public.user_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own location"
  ON public.user_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their own location"
  ON public.user_locations FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: raffle_prizes
-- =============================================
CREATE POLICY "Admins can manage all raffle prizes"
  ON public.raffle_prizes FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view raffle prizes"
  ON public.raffle_prizes FOR SELECT
  USING (true);

-- =============================================
-- RLS POLICIES: scratch_card_batches
-- =============================================
CREATE POLICY "Admins can manage all batches"
  ON public.scratch_card_batches FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view active batches"
  ON public.scratch_card_batches FOR SELECT
  USING (is_active = true);
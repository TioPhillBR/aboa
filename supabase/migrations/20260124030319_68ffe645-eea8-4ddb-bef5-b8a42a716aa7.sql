-- =====================================================
-- FASE 1: TIPOS E ENUMS
-- =====================================================

-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Enum para status de sorteio
CREATE TYPE public.raffle_status AS ENUM ('open', 'drawing', 'completed', 'cancelled');

-- Enum para tipos de transação
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'purchase', 'prize', 'refund');

-- =====================================================
-- FASE 2: TABELAS BASE
-- =====================================================

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de roles separada (CRÍTICO para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(user_id, role)
);

-- Tabela de carteiras
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de transações da carteira
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  type transaction_type NOT NULL,
  description TEXT,
  reference_id UUID, -- ID do sorteio/raspadinha relacionado
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- FASE 3: TABELAS DE SORTEIOS
-- =====================================================

-- Tabela de sorteios
CREATE TABLE public.raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  total_numbers INTEGER NOT NULL CHECK (total_numbers > 0),
  draw_date TIMESTAMPTZ NOT NULL,
  status raffle_status NOT NULL DEFAULT 'open',
  winner_id UUID REFERENCES public.profiles(id),
  winner_ticket_number INTEGER,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de tickets de sorteio
CREATE TABLE public.raffle_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_number INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(raffle_id, ticket_number)
);

-- =====================================================
-- FASE 4: TABELAS DE RASPADINHAS
-- =====================================================

-- Tabela de tipos de raspadinha
CREATE TABLE public.scratch_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de símbolos das raspadinhas
CREATE TABLE public.scratch_symbols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scratch_card_id UUID NOT NULL REFERENCES public.scratch_cards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  prize_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  probability DECIMAL(5,4) NOT NULL DEFAULT 0.1 CHECK (probability >= 0 AND probability <= 1),
  total_quantity INTEGER, -- NULL = ilimitado
  remaining_quantity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de chances compradas (raspadinhas do usuário)
CREATE TABLE public.scratch_chances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scratch_card_id UUID NOT NULL REFERENCES public.scratch_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbols JSONB NOT NULL, -- Array com os 9 símbolos gerados
  is_revealed BOOLEAN NOT NULL DEFAULT false,
  prize_won DECIMAL(10,2),
  winning_symbol_id UUID REFERENCES public.scratch_symbols(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revealed_at TIMESTAMPTZ
);

-- =====================================================
-- FASE 5: FUNÇÕES DE SEGURANÇA (SECURITY DEFINER)
-- =====================================================

-- Função para verificar se usuário tem uma role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- =====================================================
-- FASE 6: TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_raffles_updated_at
  BEFORE UPDATE ON public.raffles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scratch_cards_updated_at
  BEFORE UPDATE ON public.scratch_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FASE 7: TRIGGER PARA CRIAR PERFIL E CARTEIRA NO SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Criar carteira com saldo zero
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  -- Criar role padrão de usuário
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FASE 8: HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratch_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratch_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratch_chances ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FASE 9: POLÍTICAS RLS - PROFILES
-- =====================================================

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- FASE 10: POLÍTICAS RLS - USER_ROLES
-- =====================================================

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- FASE 11: POLÍTICAS RLS - WALLETS
-- =====================================================

CREATE POLICY "Users can view their own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- FASE 12: POLÍTICAS RLS - WALLET_TRANSACTIONS
-- =====================================================

CREATE POLICY "Users can view their own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM public.wallets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (
    wallet_id IN (
      SELECT id FROM public.wallets WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FASE 13: POLÍTICAS RLS - RAFFLES
-- =====================================================

CREATE POLICY "Anyone can view open raffles"
  ON public.raffles FOR SELECT
  USING (status = 'open' OR status = 'completed');

CREATE POLICY "Admins can view all raffles"
  ON public.raffles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create raffles"
  ON public.raffles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update raffles"
  ON public.raffles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete raffles"
  ON public.raffles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- FASE 14: POLÍTICAS RLS - RAFFLE_TICKETS
-- =====================================================

CREATE POLICY "Users can view their own tickets"
  ON public.raffle_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
  ON public.raffle_tickets FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can buy tickets"
  ON public.raffle_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FASE 15: POLÍTICAS RLS - SCRATCH_CARDS
-- =====================================================

CREATE POLICY "Anyone can view active scratch cards"
  ON public.scratch_cards FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all scratch cards"
  ON public.scratch_cards FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage scratch cards"
  ON public.scratch_cards FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- FASE 16: POLÍTICAS RLS - SCRATCH_SYMBOLS
-- =====================================================

CREATE POLICY "Anyone can view symbols of active cards"
  ON public.scratch_symbols FOR SELECT
  USING (
    scratch_card_id IN (
      SELECT id FROM public.scratch_cards WHERE is_active = true
    )
  );

CREATE POLICY "Admins can view all symbols"
  ON public.scratch_symbols FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage symbols"
  ON public.scratch_symbols FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- FASE 17: POLÍTICAS RLS - SCRATCH_CHANCES
-- =====================================================

CREATE POLICY "Users can view their own chances"
  ON public.scratch_chances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chances"
  ON public.scratch_chances FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can buy chances"
  ON public.scratch_chances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chances (reveal)"
  ON public.scratch_chances FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- FASE 18: ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_raffle_tickets_raffle_id ON public.raffle_tickets(raffle_id);
CREATE INDEX idx_raffle_tickets_user_id ON public.raffle_tickets(user_id);
CREATE INDEX idx_scratch_chances_user_id ON public.scratch_chances(user_id);
CREATE INDEX idx_scratch_chances_scratch_card_id ON public.scratch_chances(scratch_card_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_raffles_status ON public.raffles(status);
CREATE INDEX idx_scratch_cards_active ON public.scratch_cards(is_active);

-- =====================================================
-- FASE 19: STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('raffle-images', 'raffle-images', true),
  ('scratch-images', 'scratch-images', true);

-- Políticas de Storage para avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas de Storage para imagens de sorteios (só admin)
CREATE POLICY "Raffle images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'raffle-images');

CREATE POLICY "Admins can manage raffle images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'raffle-images' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'raffle-images' AND public.is_admin(auth.uid()));

-- Políticas de Storage para imagens de raspadinhas (só admin)
CREATE POLICY "Scratch images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'scratch-images');

CREATE POLICY "Admins can manage scratch images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'scratch-images' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'scratch-images' AND public.is_admin(auth.uid()));
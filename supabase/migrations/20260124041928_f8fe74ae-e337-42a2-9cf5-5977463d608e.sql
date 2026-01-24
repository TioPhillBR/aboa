-- =====================================================
-- SISTEMA DE INDICAÇÃO / REFERRAL SYSTEM
-- =====================================================

-- Tabela de códigos de indicação
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL UNIQUE,
  uses_count INTEGER NOT NULL DEFAULT 0,
  bonus_per_referral DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de indicações realizadas
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  bonus_awarded DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonus_awarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_referred UNIQUE (referred_id)
);

-- Índices para performance
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON public.referrals(referred_id);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Políticas para referral_codes
CREATE POLICY "Users can view their own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert referral codes"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active codes for validation"
  ON public.referral_codes FOR SELECT
  USING (is_active = true);

-- Políticas para referrals
CREATE POLICY "Users can view their referrals (as referrer)"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view if they were referred"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referred_id);

CREATE POLICY "System can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

-- Função para gerar código de indicação único
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS VARCHAR(10)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code VARCHAR(10);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código alfanumérico de 8 caracteres
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    
    -- Verificar se já existe
    SELECT EXISTS(
      SELECT 1 FROM public.referral_codes WHERE code = new_code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Função para criar código automaticamente ao criar perfil
CREATE OR REPLACE FUNCTION public.create_referral_code_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, public.generate_referral_code());
  
  RETURN NEW;
END;
$$;

-- Trigger para criar código automaticamente
CREATE TRIGGER on_profile_created_create_referral_code
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_referral_code_for_user();

-- Adicionar admin role ao usuário phelipeac3@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('5b202b75-9669-4587-9d9f-7d5a59b32c0b', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Criar códigos de indicação para usuários existentes que não têm
INSERT INTO public.referral_codes (user_id, code)
SELECT p.id, public.generate_referral_code()
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.referral_codes rc WHERE rc.user_id = p.id
);
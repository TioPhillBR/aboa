
-- Criar carteiras para usuários que não possuem (idempotente)
INSERT INTO public.wallets (user_id, balance)
SELECT p.id, 0
FROM public.profiles p
LEFT JOIN public.wallets w ON w.user_id = p.id
WHERE w.id IS NULL;

-- Função para criar carteira automaticamente ao criar perfil
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar carteira automaticamente após inserção de perfil
DROP TRIGGER IF EXISTS create_wallet_on_profile_insert ON public.profiles;
CREATE TRIGGER create_wallet_on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_wallet_for_new_user();

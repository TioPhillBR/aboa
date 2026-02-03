
-- Remover o trigger duplicado que criamos anteriormente
DROP TRIGGER IF EXISTS create_wallet_on_profile_insert ON public.profiles;

-- A função pode permanecer pois usa ON CONFLICT DO NOTHING, mas o trigger causa duplicação
-- O trigger handle_new_user no auth.users já cria a carteira corretamente

-- Criar perfil para o super admin se não existir
INSERT INTO public.profiles (id, full_name)
VALUES ('c08f8767-deed-4a4c-978f-f775e63d51d0', 'Phelipe Coelho')
ON CONFLICT (id) DO UPDATE SET full_name = 'Phelipe Coelho';

-- Criar carteira se não existir
INSERT INTO public.wallets (user_id)
VALUES ('c08f8767-deed-4a4c-978f-f775e63d51d0')
ON CONFLICT (user_id) DO NOTHING;

-- Adicionar role de super_admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('c08f8767-deed-4a4c-978f-f775e63d51d0', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Adicionar também role de admin para garantir acesso completo
INSERT INTO public.user_roles (user_id, role)
VALUES ('c08f8767-deed-4a4c-978f-f775e63d51d0', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
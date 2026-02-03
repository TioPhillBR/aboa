-- Create profile for phelipeac3@gmail.com
INSERT INTO public.profiles (id, full_name, created_at, updated_at)
VALUES ('c08f8767-deed-4a4c-978f-f775e63d51d0', 'Phelipe Admin', now(), now())
ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- Create wallet for the user
INSERT INTO public.wallets (user_id, balance)
VALUES ('c08f8767-deed-4a4c-978f-f775e63d51d0', 0)
ON CONFLICT (user_id) DO NOTHING;

-- Assign super_admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('c08f8767-deed-4a4c-978f-f775e63d51d0', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
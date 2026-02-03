-- Insert super_admin role for user phelipeac3@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('5b202b75-9669-4587-9d9f-7d5a59b32c0b', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
-- Atualizar avatar_url para usuários que têm avatares no bucket mas não no perfil
UPDATE public.profiles p
SET 
  avatar_url = 'https://sarauvembzbneunhssud.supabase.co/storage/v1/object/public/avatars/' || o.name,
  updated_at = now()
FROM (
  SELECT DISTINCT ON (owner_id) owner_id, name
  FROM storage.objects
  WHERE bucket_id = 'avatars'
  ORDER BY owner_id, created_at DESC
) o
WHERE p.id = o.owner_id::uuid
  AND (p.avatar_url IS NULL OR p.avatar_url = '');
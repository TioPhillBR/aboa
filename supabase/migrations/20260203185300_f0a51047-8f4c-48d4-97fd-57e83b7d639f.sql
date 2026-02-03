-- Adicionar campos para chave PIX de recebimento de prêmios no perfil
ALTER TABLE public.profiles
ADD COLUMN pix_key TEXT DEFAULT NULL,
ADD COLUMN pix_key_type TEXT DEFAULT NULL;

COMMENT ON COLUMN public.profiles.pix_key IS 'Chave PIX para recebimento de prêmios';
COMMENT ON COLUMN public.profiles.pix_key_type IS 'Tipo da chave PIX (cpf, email, phone, random)';
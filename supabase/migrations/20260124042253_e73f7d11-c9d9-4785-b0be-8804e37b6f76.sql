-- Remover política permissiva e criar uma mais restrita
DROP POLICY IF EXISTS "Users can update uses_count" ON public.referral_codes;

-- Apenas o dono do código pode atualizar (para incrementar usos)
CREATE POLICY "Owner can update their referral code"
  ON public.referral_codes FOR UPDATE
  USING (auth.uid() = user_id);
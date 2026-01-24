-- Adicionar política de update para referral_codes
CREATE POLICY "Users can update uses_count"
  ON public.referral_codes FOR UPDATE
  USING (true)
  WITH CHECK (true);
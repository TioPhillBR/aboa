
-- Permitir que admins insiram transações em qualquer carteira
CREATE POLICY "Admins can insert transactions for any wallet"
ON public.wallet_transactions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Permitir que admins atualizem qualquer carteira
CREATE POLICY "Admins can update any wallet"
ON public.wallets
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

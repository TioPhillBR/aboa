-- Allow admins to view all wallets
CREATE POLICY "Admins can view all wallets"
ON public.wallets
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to view all wallet transactions
CREATE POLICY "Admins can view all transactions"
ON public.wallet_transactions
FOR SELECT
USING (is_admin(auth.uid()));
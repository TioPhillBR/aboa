-- 1. Delete all wallet transactions that are NOT referral bonuses
DELETE FROM public.wallet_transactions 
WHERE source_type IS NULL OR source_type != 'referral';

-- 2. Update wallet balances to match only referral bonus amounts
UPDATE public.wallets w
SET 
  balance = COALESCE(
    (SELECT SUM(wt.amount) 
     FROM public.wallet_transactions wt 
     WHERE wt.wallet_id = w.id AND wt.source_type = 'referral' AND wt.amount > 0),
    0
  ),
  updated_at = now();
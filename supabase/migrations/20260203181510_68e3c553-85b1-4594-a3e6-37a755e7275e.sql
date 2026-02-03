-- Primeiro limpar todas as referências FK do usuário juliocsm90@gmail.com
DO $$
DECLARE
  target_user_id UUID := 'dd1729dc-d4b9-41af-a487-382e782ed19f';
BEGIN
  -- Limpar referências em user_roles.created_by
  UPDATE public.user_roles SET created_by = NULL WHERE created_by = target_user_id;
  
  -- Limpar referências em affiliates
  UPDATE public.affiliates SET approved_by = NULL WHERE approved_by = target_user_id;
  
  -- Limpar referências em affiliate_withdrawals
  UPDATE public.affiliate_withdrawals SET processed_by = NULL WHERE processed_by = target_user_id;
  
  -- Limpar referências em user_withdrawals
  UPDATE public.user_withdrawals SET processed_by = NULL WHERE processed_by = target_user_id;
  
  -- Limpar referências em raffles
  UPDATE public.raffles SET winner_id = NULL WHERE winner_id = target_user_id;
  UPDATE public.raffles SET created_by = NULL WHERE created_by = target_user_id;
  
  -- Limpar referências em raffle_prizes
  UPDATE public.raffle_prizes SET winner_id = NULL WHERE winner_id = target_user_id;
  
  -- Limpar referências em scratch_cards
  UPDATE public.scratch_cards SET created_by = NULL WHERE created_by = target_user_id;
  
  -- Limpar referências em settings_backups
  UPDATE public.settings_backups SET created_by = NULL WHERE created_by = target_user_id;
  
  -- Limpar referências em settings_history
  UPDATE public.settings_history SET changed_by = NULL WHERE changed_by = target_user_id;
  
  -- Limpar referências em support_tickets
  UPDATE public.support_tickets SET assigned_to = NULL WHERE assigned_to = target_user_id;
  
  -- Limpar referências em share_events
  UPDATE public.share_events SET referred_user_id = NULL WHERE referred_user_id = target_user_id;
  
  -- Deletar registros dependentes
  DELETE FROM public.support_messages WHERE user_id = target_user_id;
  DELETE FROM public.wallet_transactions WHERE wallet_id IN (SELECT id FROM public.wallets WHERE user_id = target_user_id);
  DELETE FROM public.raffle_tickets WHERE user_id = target_user_id;
  DELETE FROM public.scratch_chances WHERE user_id = target_user_id;
  DELETE FROM public.affiliate_sales WHERE buyer_id = target_user_id;
  DELETE FROM public.share_events WHERE share_tracking_id IN (SELECT id FROM public.share_tracking WHERE sharer_id = target_user_id);
  DELETE FROM public.referrals WHERE referred_id = target_user_id OR referrer_id = target_user_id;
  DELETE FROM public.support_tickets WHERE user_id = target_user_id;
  DELETE FROM public.user_withdrawals WHERE user_id = target_user_id;
  DELETE FROM public.payment_transactions WHERE user_id = target_user_id;
  DELETE FROM public.wallets WHERE user_id = target_user_id;
  DELETE FROM public.user_locations WHERE user_id = target_user_id;
  DELETE FROM public.user_sessions WHERE user_id = target_user_id;
  DELETE FROM public.affiliates WHERE user_id = target_user_id;
  DELETE FROM public.referral_codes WHERE user_id = target_user_id;
  DELETE FROM public.share_tracking WHERE sharer_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
END $$;

-- Deletar o usuário phelipeac4@gmail.com também (criado depois)
DO $$
DECLARE
  target_user_id UUID := '0b3ad325-2720-4d15-aca2-5d0f98e0d93e';
BEGIN
  UPDATE public.user_roles SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.affiliates SET approved_by = NULL WHERE approved_by = target_user_id;
  UPDATE public.affiliate_withdrawals SET processed_by = NULL WHERE processed_by = target_user_id;
  UPDATE public.user_withdrawals SET processed_by = NULL WHERE processed_by = target_user_id;
  UPDATE public.raffles SET winner_id = NULL WHERE winner_id = target_user_id;
  UPDATE public.raffles SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.raffle_prizes SET winner_id = NULL WHERE winner_id = target_user_id;
  UPDATE public.scratch_cards SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.settings_backups SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.settings_history SET changed_by = NULL WHERE changed_by = target_user_id;
  UPDATE public.support_tickets SET assigned_to = NULL WHERE assigned_to = target_user_id;
  UPDATE public.share_events SET referred_user_id = NULL WHERE referred_user_id = target_user_id;
  
  DELETE FROM public.support_messages WHERE user_id = target_user_id;
  DELETE FROM public.wallet_transactions WHERE wallet_id IN (SELECT id FROM public.wallets WHERE user_id = target_user_id);
  DELETE FROM public.raffle_tickets WHERE user_id = target_user_id;
  DELETE FROM public.scratch_chances WHERE user_id = target_user_id;
  DELETE FROM public.affiliate_sales WHERE buyer_id = target_user_id;
  DELETE FROM public.share_events WHERE share_tracking_id IN (SELECT id FROM public.share_tracking WHERE sharer_id = target_user_id);
  DELETE FROM public.referrals WHERE referred_id = target_user_id OR referrer_id = target_user_id;
  DELETE FROM public.support_tickets WHERE user_id = target_user_id;
  DELETE FROM public.user_withdrawals WHERE user_id = target_user_id;
  DELETE FROM public.payment_transactions WHERE user_id = target_user_id;
  DELETE FROM public.wallets WHERE user_id = target_user_id;
  DELETE FROM public.user_locations WHERE user_id = target_user_id;
  DELETE FROM public.user_sessions WHERE user_id = target_user_id;
  DELETE FROM public.affiliates WHERE user_id = target_user_id;
  DELETE FROM public.referral_codes WHERE user_id = target_user_id;
  DELETE FROM public.share_tracking WHERE sharer_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
END $$;
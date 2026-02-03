-- Limpar todos os dados de usuários (começando pelas tabelas dependentes)

-- Limpar transações e dados financeiros
DELETE FROM wallet_transactions;
DELETE FROM wallets;
DELETE FROM payment_transactions;
DELETE FROM user_withdrawals;

-- Limpar dados de afiliados
DELETE FROM affiliate_sales;
DELETE FROM affiliate_withdrawals;
DELETE FROM affiliates;

-- Limpar dados de indicações
DELETE FROM referrals;
DELETE FROM referral_codes;

-- Limpar dados de compartilhamento
DELETE FROM share_events;
DELETE FROM share_tracking;

-- Limpar dados de suporte
DELETE FROM support_messages;
DELETE FROM support_tickets;

-- Limpar dados de sorteios
DELETE FROM raffle_tickets;
DELETE FROM raffle_prizes;

-- Limpar dados de raspadinhas
DELETE FROM scratch_chances;

-- Limpar sessões e localizações
DELETE FROM user_sessions;
DELETE FROM user_locations;

-- Limpar roles (IMPORTANTE: isso remove todos os admins)
DELETE FROM user_roles;

-- Limpar perfis
DELETE FROM profiles;
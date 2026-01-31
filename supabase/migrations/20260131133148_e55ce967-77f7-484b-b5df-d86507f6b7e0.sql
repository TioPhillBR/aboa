-- Corrigir indicação que não foi processada: Paula indicada por Phelipe
-- Inserir o registro de indicação
INSERT INTO public.referrals (referrer_id, referred_id, referral_code_id, bonus_awarded, bonus_awarded_at)
VALUES (
  '5b202b75-9669-4587-9d9f-7d5a59b32c0b', -- Phelipe (referrer)
  'b81ae011-9e81-41d8-9c61-2464015f6181', -- Paula (referred)
  'adac42eb-2ddb-4120-a22b-3fac7e9a24e1', -- Phelipe's referral code
  5.00,
  NOW()
);

-- Atualizar contador de usos do código
UPDATE public.referral_codes 
SET uses_count = uses_count + 1 
WHERE id = 'adac42eb-2ddb-4120-a22b-3fac7e9a24e1';

-- Atualizar profile da Paula com source
UPDATE public.profiles 
SET registration_source = 'referral', source_code = 'ADB9E85E'
WHERE id = 'b81ae011-9e81-41d8-9c61-2464015f6181';

-- Creditar R$ 5 para Phelipe (referrer)
INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, source_type, source_id)
VALUES (
  '22f51dad-1402-44b9-9881-d9a65a2952b1', -- Phelipe's wallet
  5.00,
  'deposit',
  'Bônus de indicação - Paula Beatriz se cadastrou',
  'referral',
  'b81ae011-9e81-41d8-9c61-2464015f6181'
);

UPDATE public.wallets SET balance = balance + 5.00 WHERE id = '22f51dad-1402-44b9-9881-d9a65a2952b1';

-- Creditar R$ 5 para Paula (referred)
INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, source_type, source_id)
VALUES (
  'd302ca48-1327-4640-af1c-b3f8f2753744', -- Paula's wallet
  5.00,
  'deposit',
  'Bônus de boas-vindas - código de indicação',
  'referral',
  '5b202b75-9669-4587-9d9f-7d5a59b32c0b'
);

UPDATE public.wallets SET balance = balance + 5.00 WHERE id = 'd302ca48-1327-4640-af1c-b3f8f2753744';
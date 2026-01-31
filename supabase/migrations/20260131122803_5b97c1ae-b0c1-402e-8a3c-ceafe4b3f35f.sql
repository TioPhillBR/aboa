-- Adicionar 5000 créditos a todos os usuários cadastrados
UPDATE public.wallets 
SET balance = balance + 5000, 
    updated_at = now();

-- Registrar a transação de bônus para cada usuário
INSERT INTO public.wallet_transactions (wallet_id, type, amount, description)
SELECT id, 'deposit', 5000, 'Bônus promocional - créditos adicionados pelo sistema'
FROM public.wallets;
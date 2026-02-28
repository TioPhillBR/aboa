
-- Recalcular e corrigir todos os saldos de carteira com base no histórico real de transações
-- Usa GREATEST(0, ...) para nunca definir saldo negativo
UPDATE wallets w
SET balance = sub.correct_balance, updated_at = now()
FROM (
  SELECT 
    w2.id as wallet_id,
    GREATEST(0, COALESCE(SUM(wt.amount), 0)) as correct_balance
  FROM wallets w2
  LEFT JOIN wallet_transactions wt ON wt.wallet_id = w2.id
  GROUP BY w2.id
) sub
WHERE w.id = sub.wallet_id
  AND ABS(w.balance - sub.correct_balance) > 0.001;

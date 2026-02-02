-- Inserir lotes ativos para as raspadinhas existentes que não possuem lotes
INSERT INTO public.scratch_card_batches (scratch_card_id, batch_name, total_cards, total_prizes, prize_config, is_active)
SELECT 
  id,
  'Lote Inicial - ' || title,
  1000,
  100,
  '[]'::jsonb,
  true
FROM public.scratch_cards 
WHERE id NOT IN (SELECT DISTINCT scratch_card_id FROM public.scratch_card_batches)
  AND is_active = true;
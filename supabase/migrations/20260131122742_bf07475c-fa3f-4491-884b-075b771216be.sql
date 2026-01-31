-- Adicionar política para que todos possam ver os ticket_numbers vendidos (apenas leitura)
CREATE POLICY "Anyone can view sold ticket numbers for open raffles"
ON public.raffle_tickets
FOR SELECT
USING (
  raffle_id IN (
    SELECT id FROM raffles 
    WHERE status IN ('open', 'drawing', 'completed')
  )
);
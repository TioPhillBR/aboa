
CREATE OR REPLACE FUNCTION public.get_platform_withdrawal_stats()
RETURNS TABLE (
  total_ticket_sales NUMERIC,
  total_prizes_awarded NUMERIC,
  available_for_withdrawal NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    COALESCE(sales.total, 0) AS total_ticket_sales,
    COALESCE(prizes.total, 0) AS total_prizes_awarded,
    COALESCE(sales.total, 0) - COALESCE(prizes.total, 0) AS available_for_withdrawal
  FROM
    (SELECT SUM(r.price) AS total FROM raffle_tickets rt JOIN raffles r ON r.id = rt.raffle_id) sales,
    (SELECT SUM(sc.prize_won) AS total FROM scratch_chances sc WHERE sc.prize_won > 0 AND sc.is_revealed = true) prizes;
$$;

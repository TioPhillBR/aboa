ALTER TABLE public.user_withdrawals DROP CONSTRAINT user_withdrawals_amount_check;
ALTER TABLE public.user_withdrawals ADD CONSTRAINT user_withdrawals_amount_check CHECK (amount >= 10);
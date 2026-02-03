-- Add new fields to profiles table for complete registration wizard
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS address_cep TEXT,
  ADD COLUMN IF NOT EXISTS address_street TEXT,
  ADD COLUMN IF NOT EXISTS address_number TEXT,
  ADD COLUMN IF NOT EXISTS address_complement TEXT,
  ADD COLUMN IF NOT EXISTS address_neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS address_city TEXT,
  ADD COLUMN IF NOT EXISTS address_state TEXT;

-- Create index for CPF lookup
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);

-- Create function to validate CPF (Brazilian tax ID)
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  cpf_clean TEXT;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  digit1 INTEGER;
  digit2 INTEGER;
  i INTEGER;
BEGIN
  -- Remove non-numeric characters
  cpf_clean := regexp_replace(cpf, '[^0-9]', '', 'g');
  
  -- Must have 11 digits
  IF LENGTH(cpf_clean) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for known invalid CPFs (all same digits)
  IF cpf_clean ~ '^(.)\1{10}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate first verification digit
  FOR i IN 1..9 LOOP
    sum1 := sum1 + (CAST(SUBSTRING(cpf_clean FROM i FOR 1) AS INTEGER) * (11 - i));
  END LOOP;
  digit1 := 11 - (sum1 % 11);
  IF digit1 >= 10 THEN
    digit1 := 0;
  END IF;
  
  -- Calculate second verification digit
  FOR i IN 1..10 LOOP
    sum2 := sum2 + (CAST(SUBSTRING(cpf_clean FROM i FOR 1) AS INTEGER) * (12 - i));
  END LOOP;
  digit2 := 11 - (sum2 % 11);
  IF digit2 >= 10 THEN
    digit2 := 0;
  END IF;
  
  -- Verify digits
  RETURN SUBSTRING(cpf_clean FROM 10 FOR 1) = digit1::TEXT 
     AND SUBSTRING(cpf_clean FROM 11 FOR 1) = digit2::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;
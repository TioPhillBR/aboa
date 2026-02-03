-- Create platform_settings table to store all configurations
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read settings
CREATE POLICY "Admins can read platform settings"
ON public.platform_settings
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only admins can insert settings
CREATE POLICY "Admins can insert platform settings"
ON public.platform_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update settings
CREATE POLICY "Admins can update platform settings"
ON public.platform_settings
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only admins can delete settings
CREATE POLICY "Admins can delete platform settings"
ON public.platform_settings
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.platform_settings (key, value, category) VALUES
  ('general', '{"platformName": "A Boa", "platformDescription": "Plataforma de sorteios e raspadinhas premiadas", "contactEmail": "contato@aboa.com.br", "contactPhone": "(11) 99999-9999", "supportEmail": "suporte@aboa.com.br", "logoUrl": "", "faviconUrl": "", "primaryColor": "#10B981", "maintenanceMode": false, "maintenanceMessage": "Estamos em manutenção. Voltamos em breve!"}', 'general'),
  ('payment', '{"pixEnabled": true, "pixKey": "", "pixKeyType": "cpf", "pixReceiverName": "", "pixCity": "São Paulo", "minimumDeposit": 10, "maximumDeposit": 5000, "minimumWithdrawal": 20, "withdrawalFee": 0, "autoApproveWithdrawals": false, "autoApproveLimit": 100}', 'payment'),
  ('games', '{"scratchCardEnabled": true, "scratchCardMinPrice": 1, "scratchCardMaxPrice": 50, "scratchCardDefaultProbability": 15, "scratchCardMaxWinRate": 30, "raffleEnabled": true, "raffleMinPrice": 1, "raffleMaxPrice": 100, "raffleMinNumbers": 100, "raffleMaxNumbers": 100000, "raffleAutoDrawEnabled": true}', 'games'),
  ('commissions', '{"affiliateEnabled": true, "defaultAffiliateCommission": 10, "maxAffiliateCommission": 30, "affiliateMinWithdrawal": 50, "referralEnabled": true, "referralBonusAmount": 5, "referralBonusType": "fixed", "shareRewardEnabled": true, "shareRewardAmount": 1}', 'commissions'),
  ('notifications', '{"emailEnabled": true, "smsEnabled": false, "pushEnabled": true, "notifyOnPurchase": true, "notifyOnWin": true, "notifyOnDeposit": true, "notifyOnWithdrawal": true, "notifyOnRaffleDraw": true, "marketingEmails": false}', 'notifications'),
  ('security', '{"twoFactorEnabled": false, "sessionTimeout": 60, "maxLoginAttempts": 5, "passwordMinLength": 8, "requireUppercase": true, "requireNumbers": true, "requireSpecialChars": false, "ipWhitelist": "", "adminIpRestriction": false}', 'security');
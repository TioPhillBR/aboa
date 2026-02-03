import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for all settings
export interface GeneralSettings {
  platformName: string;
  platformDescription: string;
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface PaymentSettings {
  pixEnabled: boolean;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pixReceiverName: string;
  pixCity: string;
  minimumDeposit: number;
  maximumDeposit: number;
  minimumWithdrawal: number;
  withdrawalFee: number;
  autoApproveWithdrawals: boolean;
  autoApproveLimit: number;
}

export interface GameSettings {
  scratchCardEnabled: boolean;
  scratchCardMinPrice: number;
  scratchCardMaxPrice: number;
  scratchCardDefaultProbability: number;
  scratchCardMaxWinRate: number;
  raffleEnabled: boolean;
  raffleMinPrice: number;
  raffleMaxPrice: number;
  raffleMinNumbers: number;
  raffleMaxNumbers: number;
  raffleAutoDrawEnabled: boolean;
}

export interface CommissionSettings {
  affiliateEnabled: boolean;
  defaultAffiliateCommission: number;
  maxAffiliateCommission: number;
  affiliateMinWithdrawal: number;
  referralEnabled: boolean;
  referralBonusAmount: number;
  referralBonusType: 'fixed' | 'percentage';
  shareRewardEnabled: boolean;
  shareRewardAmount: number;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  notifyOnPurchase: boolean;
  notifyOnWin: boolean;
  notifyOnDeposit: boolean;
  notifyOnWithdrawal: boolean;
  notifyOnRaffleDraw: boolean;
  marketingEmails: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  ipWhitelist: string;
  adminIpRestriction: boolean;
}

export interface AllSettings {
  general: GeneralSettings;
  payment: PaymentSettings;
  games: GameSettings;
  commissions: CommissionSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

// Validation errors type
export interface ValidationErrors {
  [key: string]: string | undefined;
}

// Default values
const defaultSettings: AllSettings = {
  general: {
    platformName: 'A Boa',
    platformDescription: 'Plataforma de sorteios e raspadinhas premiadas',
    contactEmail: 'contato@aboa.com.br',
    contactPhone: '(11) 99999-9999',
    supportEmail: 'suporte@aboa.com.br',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#10B981',
    maintenanceMode: false,
    maintenanceMessage: 'Estamos em manutenção. Voltamos em breve!',
  },
  payment: {
    pixEnabled: true,
    pixKey: '',
    pixKeyType: 'cpf',
    pixReceiverName: '',
    pixCity: 'São Paulo',
    minimumDeposit: 10,
    maximumDeposit: 5000,
    minimumWithdrawal: 20,
    withdrawalFee: 0,
    autoApproveWithdrawals: false,
    autoApproveLimit: 100,
  },
  games: {
    scratchCardEnabled: true,
    scratchCardMinPrice: 1,
    scratchCardMaxPrice: 50,
    scratchCardDefaultProbability: 15,
    scratchCardMaxWinRate: 30,
    raffleEnabled: true,
    raffleMinPrice: 1,
    raffleMaxPrice: 100,
    raffleMinNumbers: 100,
    raffleMaxNumbers: 100000,
    raffleAutoDrawEnabled: true,
  },
  commissions: {
    affiliateEnabled: true,
    defaultAffiliateCommission: 10,
    maxAffiliateCommission: 30,
    affiliateMinWithdrawal: 50,
    referralEnabled: true,
    referralBonusAmount: 5,
    referralBonusType: 'fixed',
    shareRewardEnabled: true,
    shareRewardAmount: 1,
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    notifyOnPurchase: true,
    notifyOnWin: true,
    notifyOnDeposit: true,
    notifyOnWithdrawal: true,
    notifyOnRaffleDraw: true,
    marketingEmails: false,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    ipWhitelist: '',
    adminIpRestriction: false,
  },
};

// Validation functions
export function validateEmail(email: string): string | undefined {
  if (!email) return 'E-mail é obrigatório';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'E-mail inválido';
  if (email.length > 255) return 'E-mail muito longo (máx. 255 caracteres)';
  return undefined;
}

export function validatePhone(phone: string): string | undefined {
  if (!phone) return undefined; // Optional
  const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;
  if (!phoneRegex.test(phone)) return 'Telefone inválido. Use: (11) 99999-9999';
  return undefined;
}

export function validateRequired(value: string, fieldName: string): string | undefined {
  if (!value || value.trim() === '') return `${fieldName} é obrigatório`;
  return undefined;
}

export function validateMinMax(value: number, min: number, max: number, fieldName: string): string | undefined {
  if (value < min) return `${fieldName} deve ser no mínimo ${min}`;
  if (value > max) return `${fieldName} deve ser no máximo ${max}`;
  return undefined;
}

export function validatePositive(value: number, fieldName: string): string | undefined {
  if (value < 0) return `${fieldName} deve ser positivo`;
  return undefined;
}

export function validateColor(color: string): string | undefined {
  if (!color) return 'Cor é obrigatória';
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexRegex.test(color)) return 'Cor inválida. Use formato hex: #RRGGBB';
  return undefined;
}

export function validateUrl(url: string): string | undefined {
  if (!url) return undefined; // Optional
  try {
    new URL(url);
    return undefined;
  } catch {
    return 'URL inválida';
  }
}

export function validatePixKey(key: string, type: string): string | undefined {
  if (!key) return undefined; // Optional when not enabled
  
  switch (type) {
    case 'cpf':
      if (!/^\d{11}$/.test(key.replace(/\D/g, ''))) return 'CPF inválido (11 dígitos)';
      break;
    case 'cnpj':
      if (!/^\d{14}$/.test(key.replace(/\D/g, ''))) return 'CNPJ inválido (14 dígitos)';
      break;
    case 'email':
      return validateEmail(key);
    case 'phone':
      if (!/^\+?\d{10,13}$/.test(key.replace(/\D/g, ''))) return 'Telefone inválido';
      break;
    case 'random':
      if (key.length < 32) return 'Chave aleatória inválida';
      break;
  }
  return undefined;
}

export function usePlatformSettings() {
  const [settings, setSettings] = useState<AllSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value');

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedSettings = JSON.parse(JSON.stringify(defaultSettings)) as AllSettings;
        data.forEach((row) => {
          const key = row.key as keyof AllSettings;
          if (key in loadedSettings && row.value) {
            const rowValue = row.value as Record<string, unknown>;
            Object.assign(loadedSettings[key], rowValue);
          }
        });
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Validate all settings
  const validateAllSettings = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    // General validation
    const g = settings.general;
    newErrors['general.platformName'] = validateRequired(g.platformName, 'Nome da plataforma');
    newErrors['general.contactEmail'] = validateEmail(g.contactEmail);
    newErrors['general.supportEmail'] = validateEmail(g.supportEmail);
    newErrors['general.contactPhone'] = validatePhone(g.contactPhone);
    newErrors['general.primaryColor'] = validateColor(g.primaryColor);
    if (g.logoUrl) newErrors['general.logoUrl'] = validateUrl(g.logoUrl);
    if (g.faviconUrl) newErrors['general.faviconUrl'] = validateUrl(g.faviconUrl);

    // Payment validation
    const p = settings.payment;
    if (p.pixEnabled && p.pixKey) {
      newErrors['payment.pixKey'] = validatePixKey(p.pixKey, p.pixKeyType);
    }
    newErrors['payment.minimumDeposit'] = validateMinMax(p.minimumDeposit, 1, 10000, 'Depósito mínimo');
    newErrors['payment.maximumDeposit'] = validateMinMax(p.maximumDeposit, p.minimumDeposit, 100000, 'Depósito máximo');
    newErrors['payment.minimumWithdrawal'] = validateMinMax(p.minimumWithdrawal, 1, 10000, 'Saque mínimo');
    newErrors['payment.withdrawalFee'] = validatePositive(p.withdrawalFee, 'Taxa de saque');

    // Games validation
    const gm = settings.games;
    newErrors['games.scratchCardMinPrice'] = validateMinMax(gm.scratchCardMinPrice, 0.5, 100, 'Preço mínimo raspadinha');
    newErrors['games.scratchCardMaxPrice'] = validateMinMax(gm.scratchCardMaxPrice, gm.scratchCardMinPrice, 1000, 'Preço máximo raspadinha');
    newErrors['games.scratchCardDefaultProbability'] = validateMinMax(gm.scratchCardDefaultProbability, 1, 100, 'Probabilidade padrão');
    newErrors['games.scratchCardMaxWinRate'] = validateMinMax(gm.scratchCardMaxWinRate, 1, 100, 'Taxa máxima de vitória');
    newErrors['games.raffleMinPrice'] = validateMinMax(gm.raffleMinPrice, 0.5, 100, 'Preço mínimo sorteio');
    newErrors['games.raffleMaxPrice'] = validateMinMax(gm.raffleMaxPrice, gm.raffleMinPrice, 1000, 'Preço máximo sorteio');
    newErrors['games.raffleMinNumbers'] = validateMinMax(gm.raffleMinNumbers, 10, 100000, 'Mínimo de números');
    newErrors['games.raffleMaxNumbers'] = validateMinMax(gm.raffleMaxNumbers, gm.raffleMinNumbers, 1000000, 'Máximo de números');

    // Commissions validation
    const c = settings.commissions;
    newErrors['commissions.defaultAffiliateCommission'] = validateMinMax(c.defaultAffiliateCommission, 1, 100, 'Comissão padrão');
    newErrors['commissions.maxAffiliateCommission'] = validateMinMax(c.maxAffiliateCommission, c.defaultAffiliateCommission, 100, 'Comissão máxima');
    newErrors['commissions.affiliateMinWithdrawal'] = validateMinMax(c.affiliateMinWithdrawal, 1, 10000, 'Saque mínimo afiliado');
    newErrors['commissions.referralBonusAmount'] = validatePositive(c.referralBonusAmount, 'Bônus de indicação');
    newErrors['commissions.shareRewardAmount'] = validatePositive(c.shareRewardAmount, 'Recompensa por compartilhamento');

    // Security validation
    const s = settings.security;
    newErrors['security.sessionTimeout'] = validateMinMax(s.sessionTimeout, 5, 1440, 'Tempo de sessão');
    newErrors['security.maxLoginAttempts'] = validateMinMax(s.maxLoginAttempts, 3, 10, 'Máximo de tentativas');
    newErrors['security.passwordMinLength'] = validateMinMax(s.passwordMinLength, 6, 32, 'Tamanho mínimo de senha');

    // Filter out undefined errors
    const filteredErrors: ValidationErrors = {};
    Object.entries(newErrors).forEach(([key, value]) => {
      if (value !== undefined) {
        filteredErrors[key] = value;
      }
    });

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  }, [settings]);

  // Validate single field
  const validateField = useCallback((category: string, field: string, value: unknown) => {
    const key = `${category}.${field}`;
    let error: string | undefined;

    switch (key) {
      case 'general.platformName':
        error = validateRequired(value as string, 'Nome da plataforma');
        break;
      case 'general.contactEmail':
      case 'general.supportEmail':
        error = validateEmail(value as string);
        break;
      case 'general.contactPhone':
        error = validatePhone(value as string);
        break;
      case 'general.primaryColor':
        error = validateColor(value as string);
        break;
      case 'general.logoUrl':
      case 'general.faviconUrl':
        error = validateUrl(value as string);
        break;
      default:
        if (typeof value === 'number') {
          error = validatePositive(value, field);
        }
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[key] = error;
      } else {
        delete newErrors[key];
      }
      return newErrors;
    });

    return error;
  }, []);

  // Update settings with validation
  const updateSettings = useCallback(<K extends keyof AllSettings>(
    category: K,
    updates: Partial<AllSettings[K]>
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], ...updates }
    }));
    setHasChanges(true);

    // Validate updated fields
    Object.entries(updates).forEach(([field, value]) => {
      validateField(category, field, value);
    });
  }, [validateField]);

  // Save settings to database
  const saveSettings = useCallback(async (): Promise<boolean> => {
    if (!validateAllSettings()) {
      toast.error('Corrija os erros antes de salvar');
      return false;
    }

    setIsSaving(true);
    try {
      const categories: (keyof AllSettings)[] = ['general', 'payment', 'games', 'commissions', 'notifications', 'security'];
      
      for (const category of categories) {
        const settingsValue = settings[category];
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: JSON.parse(JSON.stringify(settingsValue)) })
          .eq('key', category);

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
      setHasChanges(false);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [settings, validateAllSettings]);

  // Upload image to storage
  const uploadImage = useCallback(async (file: File, type: 'logo' | 'favicon'): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `platform-${type}-${Date.now()}.${fileExt}`;
      const filePath = `platform/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    }
  }, []);

  return {
    settings,
    isLoading,
    isSaving,
    errors,
    hasChanges,
    updateSettings,
    saveSettings,
    uploadImage,
    validateField,
    refetch: fetchSettings,
  };
}

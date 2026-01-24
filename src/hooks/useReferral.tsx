import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  uses_count: number;
  bonus_per_referral: number;
  is_active: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code_id: string;
  bonus_awarded: number;
  bonus_awarded_at: string | null;
  created_at: string;
  referred_profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useReferral() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    } else {
      setReferralCode(null);
      setReferrals([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Buscar código de indicação
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (codeError && codeError.code !== 'PGRST116') {
        console.error('Error fetching referral code:', codeError);
      } else if (codeData) {
        setReferralCode(codeData as ReferralCode);
      }

      // Buscar indicações feitas
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_profile:profiles!referrals_referred_id_fkey(full_name, avatar_url)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
      } else if (referralsData) {
        const formattedReferrals = referralsData.map(r => ({
          ...r,
          referred_profile: r.referred_profile as { full_name: string; avatar_url: string | null },
        })) as Referral[];
        
        setReferrals(formattedReferrals);
        
        // Calcular ganhos totais
        const total = formattedReferrals.reduce((sum, r) => sum + (r.bonus_awarded || 0), 0);
        setTotalEarnings(total);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateReferralCode = async (code: string): Promise<ReferralCode | null> => {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) return null;
      return data as ReferralCode;
    } catch {
      return null;
    }
  };

  const applyReferralCode = async (referralCodeId: string, referrerId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Não autenticado' };

    try {
      // Inserir a indicação
      const { error: insertError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referred_id: user.id,
          referral_code_id: referralCodeId,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          return { success: false, error: 'Você já usou um código de indicação' };
        }
        throw insertError;
      }

      // Atualizar contador de usos diretamente
      const { data: currentCode } = await supabase
        .from('referral_codes')
        .select('uses_count')
        .eq('id', referralCodeId)
        .single();

      if (currentCode) {
        await supabase
          .from('referral_codes')
          .update({ uses_count: (currentCode.uses_count || 0) + 1 })
          .eq('id', referralCodeId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error applying referral code:', error);
      return { success: false, error: 'Erro ao aplicar código' };
    }
  };

  const getReferralLink = () => {
    if (!referralCode) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/cadastro?ref=${referralCode.code}`;
  };

  const copyReferralLink = async (): Promise<boolean> => {
    const link = getReferralLink();
    if (!link) return false;

    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch {
      return false;
    }
  };

  const copyReferralCode = async (): Promise<boolean> => {
    if (!referralCode) return false;

    try {
      await navigator.clipboard.writeText(referralCode.code);
      return true;
    } catch {
      return false;
    }
  };

  return {
    referralCode,
    referrals,
    isLoading,
    totalEarnings,
    bonusPerReferral: referralCode?.bonus_per_referral || 5,
    getReferralLink,
    copyReferralLink,
    copyReferralCode,
    validateReferralCode,
    applyReferralCode,
    refetch: fetchReferralData,
  };
}

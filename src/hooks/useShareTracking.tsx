import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ReferralWithReferred {
  id: string;
  referred_id: string;
  bonus_awarded: number;
  bonus_awarded_at: string | null;
  created_at: string;
  referred?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface ReferralCodeTracking {
  id: string;
  user_id: string;
  code: string;
  uses_count: number;
  bonus_per_referral: number;
  is_active: boolean;
  created_at: string;
  owner?: {
    full_name: string;
    avatar_url: string | null;
  };
  referrals?: ReferralWithReferred[];
}

// Legacy interface for backward compatibility
export interface ShareTracking {
  id: string;
  sharer_id: string;
  share_code: string;
  clicks: number;
  signups: number;
  purchases: number;
  credits_earned: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sharer?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface ShareEvent {
  id: string;
  share_tracking_id: string;
  event_type: string;
  visitor_ip: string | null;
  user_agent: string | null;
  referred_user_id: string | null;
  purchase_amount: number | null;
  created_at: string;
}

export function useShareTracking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all referral codes with referrals data (admin view)
  const { data: allReferralCodes, isLoading: isLoadingAll } = useQuery({
    queryKey: ['all-referral-codes-tracking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_codes')
        .select(`
          *,
          owner:profiles!referral_codes_user_id_fkey(
            full_name,
            avatar_url
          ),
          referrals(
            id,
            referred_id,
            bonus_awarded,
            bonus_awarded_at,
            created_at,
            referred:profiles!referrals_referred_id_fkey(
              full_name,
              avatar_url
            )
          )
        `)
        .order('uses_count', { ascending: false });

      if (error) throw error;
      return data as ReferralCodeTracking[];
    },
  });

  // Transform referral codes to legacy ShareTracking format for compatibility
  const allShareTrackings: ShareTracking[] = (allReferralCodes || []).map(rc => ({
    id: rc.id,
    sharer_id: rc.user_id,
    share_code: rc.code,
    clicks: rc.uses_count,
    signups: rc.referrals?.length || 0,
    purchases: 0, // Not tracked in referral system
    credits_earned: rc.referrals?.reduce((sum, r) => sum + Number(r.bonus_awarded), 0) || 0,
    is_active: rc.is_active,
    created_at: rc.created_at,
    updated_at: rc.created_at,
    sharer: rc.owner,
  }));

  // Fetch user's referral code
  const { data: myReferralCode, isLoading: isLoadingMine } = useQuery({
    queryKey: ['my-referral-code', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('referral_codes')
        .select(`
          *,
          referrals(
            id,
            referred_id,
            bonus_awarded,
            created_at,
            referred:profiles!referrals_referred_id_fkey(
              full_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ReferralCodeTracking | null;
    },
    enabled: !!user?.id,
  });

  // Transform to legacy format for compatibility
  const myShareTracking: ShareTracking | null = myReferralCode ? {
    id: myReferralCode.id,
    sharer_id: myReferralCode.user_id,
    share_code: myReferralCode.code,
    clicks: myReferralCode.uses_count,
    signups: myReferralCode.referrals?.length || 0,
    purchases: 0,
    credits_earned: myReferralCode.referrals?.reduce((sum, r) => sum + Number(r.bonus_awarded), 0) || 0,
    is_active: myReferralCode.is_active,
    created_at: myReferralCode.created_at,
    updated_at: myReferralCode.created_at,
  } : null;

  // Get referred users for a specific referral code
  const { data: myShareEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['my-referrals', myReferralCode?.id],
    queryFn: async () => {
      if (!myReferralCode?.id) return [];
      
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referred:profiles!referrals_referred_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('referral_code_id', myReferralCode.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform to legacy ShareEvent format
      return (data || []).map(r => ({
        id: r.id,
        share_tracking_id: r.referral_code_id,
        event_type: 'signup',
        visitor_ip: null,
        user_agent: null,
        referred_user_id: r.referred_id,
        purchase_amount: Number(r.bonus_awarded),
        created_at: r.created_at,
        referred: r.referred,
      })) as (ShareEvent & { referred?: { full_name: string; avatar_url: string | null } })[];
    },
    enabled: !!myReferralCode?.id,
  });

  // Create share tracking for user - now uses referral_codes table
  const createShareTracking = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Generate referral code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_referral_code');
      
      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('referral_codes')
        .insert({
          user_id: user.id,
          code: codeData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-referral-code'] });
      toast.success('Link de compartilhamento criado!');
    },
    onError: (error) => {
      toast.error('Erro ao criar link');
      console.error(error);
    },
  });

  // Calculate share metrics from referral data
  const shareMetrics = {
    totalShares: allReferralCodes?.length || 0,
    totalClicks: allReferralCodes?.reduce((sum, rc) => sum + rc.uses_count, 0) || 0,
    totalSignups: allReferralCodes?.reduce((sum, rc) => 
      sum + (rc.referrals?.length || 0), 0) || 0,
    totalPurchases: 0, // Not tracked in referral system
    totalCredits: allReferralCodes?.reduce((sum, rc) => 
      sum + (rc.referrals?.reduce((s, r) => s + Number(r.bonus_awarded), 0) || 0), 0) || 0,
    conversionRate: (() => {
      const totalClicks = allReferralCodes?.reduce((sum, rc) => sum + rc.uses_count, 0) || 0;
      const totalSignups = allReferralCodes?.reduce((sum, rc) => 
        sum + (rc.referrals?.length || 0), 0) || 0;
      return totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(1) : '0';
    })(),
  };

  return {
    // New referral data
    allReferralCodes,
    myReferralCode,
    
    // Legacy compatibility
    allShareTrackings,
    isLoadingAll,
    myShareTracking,
    isLoadingMine,
    myShareEvents,
    isLoadingEvents,
    createShareTracking,
    shareMetrics,
  };
}

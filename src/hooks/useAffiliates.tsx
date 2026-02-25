import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { AffiliateStatus, CommissionStatus, WithdrawalStatus } from '@/types';

export interface Affiliate {
  id: string;
  user_id: string;
  full_name: string;
  cpf: string;
  phone: string | null;
  email: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  avatar_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  commission_percentage: number;
  affiliate_code: string;
  status: AffiliateStatus;
  total_sales: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface AffiliateSale {
  id: string;
  affiliate_id: string;
  buyer_id: string;
  product_type: string;
  product_id: string;
  sale_amount: number;
  commission_amount: number;
  commission_status: CommissionStatus;
  paid_at: string | null;
  created_at: string;
  buyer?: {
    full_name: string;
  };
}

export interface AffiliateWithdrawal {
  id: string;
  affiliate_id: string;
  amount: number;
  status: WithdrawalStatus;
  pix_key: string | null;
  processed_by: string | null;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
}

export function useAffiliates() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all affiliates (admin only)
  const { data: affiliates, isLoading: isLoadingAffiliates } = useQuery({
    queryKey: ['affiliates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*, profiles:user_id(full_name, avatar_url, phone, cpf, address_street, address_city, address_state, address_cep)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Merge profile data as fallback for empty affiliate fields
      return (data || []).map((a: any) => ({
        ...a,
        avatar_url: a.avatar_url || a.profiles?.avatar_url || null,
        phone: a.phone || a.profiles?.phone || null,
        cpf: a.cpf || a.profiles?.cpf || '',
        address_street: a.address_street || a.profiles?.address_street || null,
        address_city: a.address_city || a.profiles?.address_city || null,
        address_state: a.address_state || a.profiles?.address_state || null,
        address_zip: a.address_zip || a.profiles?.address_cep || null,
      })) as Affiliate[];
    },
    enabled: isAdmin, // Only fetch for admins
  });

  // Fetch current user's affiliate profile
  const { data: myAffiliateProfile, isLoading: isLoadingMyProfile } = useQuery({
    queryKey: ['my-affiliate', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Affiliate | null;
    },
    enabled: !!user?.id,
  });

  // Fetch affiliate sales
  const { data: affiliateSales, isLoading: isLoadingSales } = useQuery({
    queryKey: ['affiliate-sales', myAffiliateProfile?.id],
    queryFn: async () => {
      if (!myAffiliateProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('affiliate_sales')
        .select('*')
        .eq('affiliate_id', myAffiliateProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AffiliateSale[];
    },
    enabled: !!myAffiliateProfile?.id,
  });

  // Fetch affiliate withdrawals
  const { data: affiliateWithdrawals } = useQuery({
    queryKey: ['affiliate-withdrawals', myAffiliateProfile?.id],
    queryFn: async () => {
      if (!myAffiliateProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .select('*')
        .eq('affiliate_id', myAffiliateProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AffiliateWithdrawal[];
    },
    enabled: !!myAffiliateProfile?.id,
  });

  // Register as affiliate
  const registerAffiliate = useMutation({
    mutationFn: async (data: {
      full_name: string;
      cpf: string;
      phone?: string;
      email?: string;
      address_street?: string;
      address_city?: string;
      address_state?: string;
      address_zip?: string;
      instagram?: string;
      facebook?: string;
      tiktok?: string;
      avatar_url?: string;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Generate affiliate code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_affiliate_code');
      
      if (codeError) throw codeError;

      const { data: affiliate, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          affiliate_code: codeData,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return affiliate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-affiliate'] });
      toast.success('Solicitação de afiliado enviada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar como afiliado');
      console.error(error);
    },
  });

  // Update affiliate status (admin)
  const updateAffiliateStatus = useMutation({
    mutationFn: async ({ affiliateId, status, commission_percentage }: { 
      affiliateId: string; 
      status: AffiliateStatus;
      commission_percentage?: number;
    }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'approved') {
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();
      }
      
      if (commission_percentage !== undefined) {
        updateData.commission_percentage = commission_percentage;
      }

      const { error } = await supabase
        .from('affiliates')
        .update(updateData)
        .eq('id', affiliateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      toast.success('Status do afiliado atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status');
      console.error(error);
    },
  });

  // Request withdrawal
  const requestWithdrawal = useMutation({
    mutationFn: async ({ amount, pix_key }: { amount: number; pix_key: string }) => {
      if (!myAffiliateProfile?.id) throw new Error('Perfil de afiliado não encontrado');

      const { error } = await supabase
        .from('affiliate_withdrawals')
        .insert({
          affiliate_id: myAffiliateProfile.id,
          amount,
          pix_key,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-withdrawals'] });
      toast.success('Solicitação de saque enviada');
    },
    onError: (error) => {
      toast.error('Erro ao solicitar saque');
      console.error(error);
    },
  });

  // Process withdrawal (admin)
  const processWithdrawal = useMutation({
    mutationFn: async ({ withdrawalId, status, notes }: { 
      withdrawalId: string; 
      status: WithdrawalStatus;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({
          status,
          notes,
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-withdrawals'] });
      toast.success('Saque processado');
    },
    onError: (error) => {
      toast.error('Erro ao processar saque');
      console.error(error);
    },
  });

  return {
    affiliates,
    isLoadingAffiliates,
    myAffiliateProfile,
    isLoadingMyProfile,
    affiliateSales,
    isLoadingSales,
    affiliateWithdrawals,
    registerAffiliate,
    updateAffiliateStatus,
    requestWithdrawal,
    processWithdrawal,
  };
}

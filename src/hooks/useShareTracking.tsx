import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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

  // Fetch all share trackings (admin) with sharer profile info
  const { data: allShareTrackings, isLoading: isLoadingAll } = useQuery({
    queryKey: ['all-share-trackings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('share_tracking')
        .select(`
          *,
          sharer:profiles!share_tracking_sharer_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShareTracking[];
    },
  });

  // Fetch user's share tracking
  const { data: myShareTracking, isLoading: isLoadingMine } = useQuery({
    queryKey: ['my-share-tracking', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('share_tracking')
        .select('*')
        .eq('sharer_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ShareTracking | null;
    },
    enabled: !!user?.id,
  });

  // Fetch share events for user
  const { data: myShareEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['my-share-events', myShareTracking?.id],
    queryFn: async () => {
      if (!myShareTracking?.id) return [];
      
      const { data, error } = await supabase
        .from('share_events')
        .select('*')
        .eq('share_tracking_id', myShareTracking.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShareEvent[];
    },
    enabled: !!myShareTracking?.id,
  });

  // Create share tracking for user
  const createShareTracking = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Generate share code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_share_code');
      
      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('share_tracking')
        .insert({
          sharer_id: user.id,
          share_code: codeData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-share-tracking'] });
      toast.success('Link de compartilhamento criado!');
    },
    onError: (error) => {
      toast.error('Erro ao criar link');
      console.error(error);
    },
  });

  // Calculate share metrics
  const shareMetrics = {
    totalShares: allShareTrackings?.length || 0,
    totalClicks: allShareTrackings?.reduce((sum, s) => sum + s.clicks, 0) || 0,
    totalSignups: allShareTrackings?.reduce((sum, s) => sum + s.signups, 0) || 0,
    totalPurchases: allShareTrackings?.reduce((sum, s) => sum + s.purchases, 0) || 0,
    totalCredits: allShareTrackings?.reduce((sum, s) => sum + Number(s.credits_earned), 0) || 0,
    conversionRate: allShareTrackings?.length ? 
      ((allShareTrackings.reduce((sum, s) => sum + s.signups, 0) / 
        Math.max(allShareTrackings.reduce((sum, s) => sum + s.clicks, 0), 1)) * 100).toFixed(1) : '0',
  };

  return {
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

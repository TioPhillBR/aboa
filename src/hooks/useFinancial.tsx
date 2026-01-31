import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PaymentStatus } from '@/types';

export interface PaymentTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  gateway_fee: number;
  net_amount: number;
  payment_method: string;
  gateway_transaction_id: string | null;
  status: PaymentStatus;
  product_type: string | null;
  product_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface FinancialSummary {
  totalRevenue: number;
  totalPending: number;
  totalFees: number;
  netRevenue: number;
  totalRefunds: number;
  transactionCount: number;
}

export interface SalesData {
  id: string;
  user_id: string;
  product_type: string;
  product_id: string;
  amount: number;
  status: string;
  created_at: string;
  profile?: {
    full_name: string;
  };
  product_name?: string;
}

export function useFinancial(dateRange?: { start: Date; end: Date }) {
  // Fetch payment transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['payment-transactions', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentTransaction[];
    },
  });

  // Calculate financial summary
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['financial-summary', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('payment_transactions')
        .select('amount, gateway_fee, net_amount, status, transaction_type');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const approved = (data || []).filter(t => t.status === 'approved');
      const pending = (data || []).filter(t => t.status === 'pending');
      const refunded = (data || []).filter(t => t.status === 'refunded');

      return {
        totalRevenue: approved.reduce((sum, t) => sum + Number(t.amount), 0),
        totalPending: pending.reduce((sum, t) => sum + Number(t.amount), 0),
        totalFees: approved.reduce((sum, t) => sum + Number(t.gateway_fee || 0), 0),
        netRevenue: approved.reduce((sum, t) => sum + Number(t.net_amount), 0),
        totalRefunds: refunded.reduce((sum, t) => sum + Number(t.amount), 0),
        transactionCount: data?.length || 0,
      } as FinancialSummary;
    },
  });

  // Fetch sales data (tickets + scratch cards)
  const { data: salesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ['sales-data', dateRange],
    queryFn: async () => {
      // Fetch raffle tickets with profile info
      let ticketsQuery = supabase
        .from('raffle_tickets')
        .select(`
          id,
          user_id,
          raffle_id,
          purchased_at,
          raffles!inner(title, price)
        `)
        .order('purchased_at', { ascending: false });

      if (dateRange) {
        ticketsQuery = ticketsQuery
          .gte('purchased_at', dateRange.start.toISOString())
          .lte('purchased_at', dateRange.end.toISOString());
      }

      const { data: tickets, error: ticketsError } = await ticketsQuery;
      if (ticketsError) throw ticketsError;

      // Fetch scratch chances
      let scratchQuery = supabase
        .from('scratch_chances')
        .select(`
          id,
          user_id,
          scratch_card_id,
          created_at,
          scratch_cards!inner(title, price)
        `)
        .order('created_at', { ascending: false });

      if (dateRange) {
        scratchQuery = scratchQuery
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data: scratches, error: scratchError } = await scratchQuery;
      if (scratchError) throw scratchError;

      // Combine and format sales data
      const ticketSales: SalesData[] = (tickets || []).map((t: any) => ({
        id: t.id,
        user_id: t.user_id,
        product_type: 'raffle',
        product_id: t.raffle_id,
        amount: t.raffles?.price || 0,
        status: 'approved',
        created_at: t.purchased_at,
        product_name: t.raffles?.title,
      }));

      const scratchSales: SalesData[] = (scratches || []).map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        product_type: 'scratch_card',
        product_id: s.scratch_card_id,
        amount: s.scratch_cards?.price || 0,
        status: 'approved',
        created_at: s.created_at,
        product_name: s.scratch_cards?.title,
      }));

      return [...ticketSales, ...scratchSales].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });

  // Calculate sales metrics
  const salesMetrics = {
    totalSales: salesData?.length || 0,
    totalValue: salesData?.reduce((sum, s) => sum + s.amount, 0) || 0,
    averageTicket: salesData?.length ? 
      (salesData.reduce((sum, s) => sum + s.amount, 0) / salesData.length) : 0,
    raffleSales: salesData?.filter(s => s.product_type === 'raffle').length || 0,
    scratchSales: salesData?.filter(s => s.product_type === 'scratch_card').length || 0,
  };

  return {
    transactions,
    isLoadingTransactions,
    summary: summary || {
      totalRevenue: 0,
      totalPending: 0,
      totalFees: 0,
      netRevenue: 0,
      totalRefunds: 0,
      transactionCount: 0,
    },
    isLoadingSummary,
    salesData,
    isLoadingSales,
    salesMetrics,
  };
}

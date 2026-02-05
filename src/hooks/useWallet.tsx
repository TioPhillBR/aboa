import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Wallet, WalletTransaction, TransactionType } from '@/types';

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchTransactions();
    } else {
      setWallet(null);
      setTransactions([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setWallet(data as Wallet);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      // Primeiro buscar a wallet do usuário
      const { data: walletData } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!walletData) return;

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*, source_type')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTransactions((data || []) as WalletTransaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Calculate bonus balance from referral and admin bonus transactions
  // Bonus is calculated by summing all bonus credits received minus bonus used in purchases
  const bonusBalance = useMemo(() => {
    // Sum all bonus credits received
    const bonusReceived = transactions
      .filter(tx => (tx.source_type === 'referral' || tx.source_type === 'admin_bonus') && tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    // The bonus can't go negative and can't exceed what was received
    // Since we can't track exactly which purchases used bonus vs principal,
    // we show the minimum between bonus received and current wallet balance
    return Math.min(bonusReceived, wallet?.balance ?? 0);
  }, [transactions, wallet?.balance]);

  // Main balance is wallet balance minus bonus balance
  const mainBalance = useMemo(() => {
    const total = wallet?.balance ?? 0;
    return Math.max(0, total - bonusBalance);
  }, [wallet?.balance, bonusBalance]);

  const addTransaction = async (
    amount: number,
    type: TransactionType,
    description?: string,
    referenceId?: string
  ) => {
    if (!wallet) return { error: new Error('Carteira não encontrada') };

    try {
      // Inserir transação
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          amount,
          type,
          description,
          reference_id: referenceId,
        });

      if (txError) throw txError;

      // Atualizar saldo da carteira
      const newBalance = wallet.balance + amount;
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      // Atualizar estado local
      setWallet(prev => prev ? { ...prev, balance: newBalance } : null);
      await fetchTransactions();

      return { error: null };
    } catch (error) {
      console.error('Error adding transaction:', error);
      return { error: error as Error };
    }
  };

  const deposit = async (amount: number) => {
    return addTransaction(amount, 'deposit', 'Depósito de créditos');
  };

  const purchase = async (amount: number, description: string, referenceId?: string) => {
    if (!wallet || wallet.balance < amount) {
      return { error: new Error('Saldo insuficiente') };
    }
    return addTransaction(-amount, 'purchase', description, referenceId);
  };

  const awardPrize = async (amount: number, description: string, referenceId?: string) => {
    return addTransaction(amount, 'prize', description, referenceId);
  };

  return {
    wallet,
    transactions,
    isLoading,
    balance: mainBalance,
    totalBalance: wallet?.balance ?? 0,
    bonusBalance,
    deposit,
    purchase,
    awardPrize,
    refetch: () => {
      fetchWallet();
      fetchTransactions();
    },
  };
}

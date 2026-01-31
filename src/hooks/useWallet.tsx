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

  // Calculate bonus balance from referral transactions
  const bonusBalance = useMemo(() => {
    return transactions
      .filter(tx => tx.source_type === 'referral' && tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

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
    balance: wallet?.balance ?? 0,
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

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScratchCard, ScratchSymbol, ScratchChance, ScratchSymbolResult } from '@/types';
import { useAuth } from './useAuth';

export function useScratchCards() {
  const [scratchCards, setScratchCards] = useState<ScratchCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchScratchCards();
  }, []);

  const fetchScratchCards = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('scratch_cards')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScratchCards((data || []) as ScratchCard[]);
    } catch (error) {
      console.error('Error fetching scratch cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    scratchCards,
    isLoading,
    refetch: fetchScratchCards,
  };
}

export function useScratchCard(scratchCardId: string) {
  const { user } = useAuth();
  const [scratchCard, setScratchCard] = useState<ScratchCard | null>(null);
  const [symbols, setSymbols] = useState<ScratchSymbol[]>([]);
  const [myChances, setMyChances] = useState<ScratchChance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (scratchCardId) {
      fetchScratchCardData();
    }
  }, [scratchCardId, user]);

  const fetchScratchCardData = async () => {
    try {
      setIsLoading(true);

      // Buscar raspadinha
      const { data: cardData, error: cardError } = await supabase
        .from('scratch_cards')
        .select('*')
        .eq('id', scratchCardId)
        .single();

      if (cardError) throw cardError;
      setScratchCard(cardData as ScratchCard);

      // Buscar símbolos
      const { data: symbolsData, error: symbolsError } = await supabase
        .from('scratch_symbols')
        .select('*')
        .eq('scratch_card_id', scratchCardId);

      if (symbolsError) throw symbolsError;
      setSymbols((symbolsData || []) as ScratchSymbol[]);

      // Buscar minhas chances se estiver logado
      if (user) {
        const { data: chancesData, error: chancesError } = await supabase
          .from('scratch_chances')
          .select('*')
          .eq('scratch_card_id', scratchCardId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (chancesError) throw chancesError;
        setMyChances((chancesData || []).map(chance => ({
          ...chance,
          symbols: chance.symbols as unknown as ScratchSymbolResult[],
        })) as ScratchChance[]);
      }
    } catch (error) {
      console.error('Error fetching scratch card data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buyChance = async () => {
    if (!user || !scratchCard) {
      return { error: new Error('Usuário não autenticado'), chance: null };
    }

    try {
      const { data, error } = await supabase.functions.invoke('buy-scratch-chance', {
        body: { scratch_card_id: scratchCard.id },
      });

      if (error) throw error;
      if (!data?.chance) throw new Error('Resposta inválida ao comprar raspadinha');

      const newChance: ScratchChance = {
        ...data.chance,
        symbols: data.chance.symbols as unknown as ScratchSymbolResult[],
      } as ScratchChance;
      
      setMyChances(prev => [newChance, ...prev]);
      
      return { error: null, chance: newChance };
    } catch (error) {
      console.error('Error buying chance:', error);
      return { error: error as Error, chance: null };
    }
  };

  const revealChance = async (chanceId: string, isWinner: boolean, prize: number) => {
    // Verificar se já foi revelada localmente para evitar duplicação
    const existingChance = myChances.find(c => c.id === chanceId);
    if (existingChance?.is_revealed) {
      console.log('Chance already revealed, skipping update');
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('scratch_chances')
        .update({
          is_revealed: true,
          revealed_at: new Date().toISOString(),
        })
        .eq('id', chanceId)
        .eq('is_revealed', false); // Apenas atualizar se ainda não revelada

      if (error) throw error;

      // Atualizar estado local
      setMyChances(prev => 
        prev.map(c => 
          c.id === chanceId 
            ? { ...c, is_revealed: true, revealed_at: new Date().toISOString() }
            : c
        )
      );

      return { error: null };
    } catch (error) {
      console.error('Error revealing chance:', error);
      return { error: error as Error };
    }
  };

  return {
    scratchCard,
    symbols,
    myChances,
    isLoading,
    buyChance,
    revealChance,
    refetch: fetchScratchCardData,
  };
}

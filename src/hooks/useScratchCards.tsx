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

  // Gerar símbolos aleatórios para uma nova chance
  const generateSymbols = (): { symbols: ScratchSymbolResult[], isWinner: boolean, prize: number, winningSymbolId: string | null } => {
    if (symbols.length === 0) {
      return { symbols: [], isWinner: false, prize: 0, winningSymbolId: null };
    }

    const result: ScratchSymbolResult[] = [];
    
    // Decidir se vai ganhar (baseado na probabilidade)
    const willWin = Math.random() < 0.15; // 15% de chance de ganhar
    
    if (willWin && symbols.length > 0) {
      // Escolher um símbolo vencedor aleatório baseado na probabilidade
      const winningSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      
      // Preencher 9 posições
      for (let i = 0; i < 9; i++) {
        if (i < 3) {
          // Garantir 3 símbolos iguais (vencedores)
          result.push({
            position: i,
            symbol_id: winningSymbol.id,
            image_url: winningSymbol.image_url,
            name: winningSymbol.name,
          });
        } else {
          // Símbolos aleatórios para o resto
          const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
          result.push({
            position: i,
            symbol_id: randomSymbol.id,
            image_url: randomSymbol.image_url,
            name: randomSymbol.name,
          });
        }
      }
      
      // Embaralhar
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
        result[i].position = i;
        result[j].position = j;
      }
      
      return { 
        symbols: result, 
        isWinner: true, 
        prize: winningSymbol.prize_value,
        winningSymbolId: winningSymbol.id 
      };
    } else {
      // Gerar sem 3 iguais
      const symbolCounts: Record<string, number> = {};
      
      for (let i = 0; i < 9; i++) {
        let attempts = 0;
        let randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        
        // Garantir que nenhum símbolo apareça 3 vezes
        while (symbolCounts[randomSymbol.id] >= 2 && attempts < 10) {
          randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
          attempts++;
        }
        
        symbolCounts[randomSymbol.id] = (symbolCounts[randomSymbol.id] || 0) + 1;
        
        result.push({
          position: i,
          symbol_id: randomSymbol.id,
          image_url: randomSymbol.image_url,
          name: randomSymbol.name,
        });
      }
      
      return { symbols: result, isWinner: false, prize: 0, winningSymbolId: null };
    }
  };

  const buyChance = async () => {
    if (!user || !scratchCard) {
      return { error: new Error('Usuário não autenticado'), chance: null };
    }

    try {
      const generated = generateSymbols();
      
      const { data, error } = await supabase
        .from('scratch_chances')
        .insert({
          scratch_card_id: scratchCard.id,
          user_id: user.id,
          symbols: generated.symbols as unknown as any,
          is_revealed: false,
          prize_won: generated.isWinner ? generated.prize : null,
          winning_symbol_id: generated.winningSymbolId,
        })
        .select()
        .single();

      if (error) throw error;

      const newChance: ScratchChance = {
        ...data,
        symbols: data.symbols as unknown as ScratchSymbolResult[],
      };
      
      setMyChances(prev => [newChance, ...prev]);
      
      return { error: null, chance: newChance };
    } catch (error) {
      console.error('Error buying chance:', error);
      return { error: error as Error, chance: null };
    }
  };

  const revealChance = async (chanceId: string, isWinner: boolean, prize: number) => {
    try {
      const { error } = await supabase
        .from('scratch_chances')
        .update({
          is_revealed: true,
          revealed_at: new Date().toISOString(),
        })
        .eq('id', chanceId);

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

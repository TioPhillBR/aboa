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
  // Usa as probabilidades cadastradas de cada símbolo
  const generateSymbols = (): { symbols: ScratchSymbolResult[], isWinner: boolean, prize: number, winningSymbolId: string | null } => {
    if (symbols.length === 0) {
      return { symbols: [], isWinner: false, prize: 0, winningSymbolId: null };
    }

    const result: ScratchSymbolResult[] = [];
    
    // Calcular probabilidade total de ganhar (soma das probabilidades dos símbolos)
    // Cada símbolo tem uma probabilidade individual de ser o vencedor
    const totalWinProbability = symbols.reduce((sum, s) => sum + s.probability, 0);
    
    // Decidir se vai ganhar baseado na probabilidade total cadastrada
    const winRoll = Math.random();
    const willWin = winRoll < totalWinProbability;
    
    if (willWin && symbols.length > 0) {
      // Escolher qual símbolo será o vencedor baseado nas probabilidades individuais
      let cumulativeProbability = 0;
      let winningSymbol = symbols[0];
      const symbolRoll = Math.random() * totalWinProbability;
      
      for (const symbol of symbols) {
        cumulativeProbability += symbol.probability;
        if (symbolRoll <= cumulativeProbability) {
          winningSymbol = symbol;
          break;
        }
      }
      
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
      // Gerar sem 3 iguais (derrota)
      // Para 9 posições com máximo 2 de cada, precisamos de pelo menos 5 símbolos diferentes
      // Se tivermos menos, usamos estratégia de distribuição controlada
      
      const symbolCounts: Record<string, number> = {};
      const maxPerSymbol = 2; // Máximo de repetições permitidas
      
      // Criar pool de símbolos disponíveis (cada um pode aparecer até 2x)
      const availablePool: typeof symbols = [];
      for (const symbol of symbols) {
        availablePool.push(symbol, symbol); // Cada símbolo pode aparecer até 2x
      }
      
      // Se o pool for menor que 9, não conseguimos evitar 3 iguais
      // Nesse caso, precisamos de mais símbolos cadastrados
      if (availablePool.length < 9) {
        console.warn(`Aviso: Poucos símbolos cadastrados (${symbols.length}). Mínimo recomendado: 5 símbolos para garantir derrotas válidas.`);
        // Fallback: adicionar mais do pool mesmo repetindo
        while (availablePool.length < 9) {
          availablePool.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }
      }
      
      // Embaralhar o pool
      for (let i = availablePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availablePool[i], availablePool[j]] = [availablePool[j], availablePool[i]];
      }
      
      // Selecionar 9 símbolos do pool embaralhado, respeitando limite de 2 por símbolo
      for (let i = 0; i < 9; i++) {
        let selectedSymbol = availablePool[i % availablePool.length];
        let attempts = 0;
        
        // Garantir que não exceda 2 repetições
        while ((symbolCounts[selectedSymbol.id] || 0) >= maxPerSymbol && attempts < 50) {
          const randomIndex = Math.floor(Math.random() * symbols.length);
          selectedSymbol = symbols[randomIndex];
          attempts++;
        }
        
        symbolCounts[selectedSymbol.id] = (symbolCounts[selectedSymbol.id] || 0) + 1;
        
        result.push({
          position: i,
          symbol_id: selectedSymbol.id,
          image_url: selectedSymbol.image_url,
          name: selectedSymbol.name,
        });
      }
      
      // Verificar se realmente não há 3 iguais (validação final)
      const finalCounts: Record<string, number> = {};
      for (const s of result) {
        finalCounts[s.symbol_id] = (finalCounts[s.symbol_id] || 0) + 1;
      }
      const hasThreeOrMore = Object.values(finalCounts).some(count => count >= 3);
      
      if (hasThreeOrMore) {
        console.warn('Não foi possível gerar uma derrota válida. Verifique a quantidade de símbolos cadastrados.');
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

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Raffle, RaffleTicket, Profile } from '@/types';
import { useAuth } from './useAuth';

export function useRaffles() {
  const [raffles, setRaffles] = useState<(Raffle & { tickets_sold: number })[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalPrizesValue, setTotalPrizesValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRaffles();
  }, []);

  const fetchRaffles = async () => {
    try {
      setIsLoading(true);
      
      // Buscar sorteios
      const { data: rafflesData, error } = await supabase
        .from('raffles')
        .select('*')
        .in('status', ['open', 'completed'])
        .order('draw_date', { ascending: true });

      if (error) throw error;

      // Para cada sorteio, buscar quantidade de tickets vendidos
      const rafflesWithTickets = await Promise.all(
        (rafflesData || []).map(async (raffle) => {
          const { count } = await supabase
            .from('raffle_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('raffle_id', raffle.id);

          return {
            ...raffle,
            tickets_sold: count || 0,
          } as Raffle & { tickets_sold: number };
        })
      );

      setRaffles(rafflesWithTickets);

      // Buscar total de participantes únicos (usuários que compraram tickets)
      const { data: allTickets, error: ticketsError } = await supabase
        .from('raffle_tickets')
        .select('user_id');

      if (!ticketsError && allTickets) {
        const uniqueParticipants = new Set(allTickets.map(t => t.user_id));
        setTotalParticipants(uniqueParticipants.size);
      }

      // Buscar valor total de prêmios de sorteios completados
      const completedRaffles = rafflesWithTickets.filter(r => r.status === 'completed');
      const { data: prizesData, error: prizesError } = await supabase
        .from('raffle_prizes')
        .select('estimated_value, raffle_id')
        .in('raffle_id', completedRaffles.map(r => r.id));

      if (!prizesError && prizesData) {
        const total = prizesData.reduce((sum, prize) => sum + (prize.estimated_value || 0), 0);
        setTotalPrizesValue(total);
      }
    } catch (error) {
      console.error('Error fetching raffles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    raffles,
    totalParticipants,
    totalPrizesValue,
    isLoading,
    refetch: fetchRaffles,
  };
}

export function useRaffle(raffleId: string) {
  const { user } = useAuth();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<RaffleTicket[]>([]);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [myTickets, setMyTickets] = useState<RaffleTicket[]>([]);
  const [soldNumbers, setSoldNumbers] = useState<number[]>([]);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (raffleId) {
      fetchRaffleData();
    }
  }, [raffleId, user]);

  // Subscribe to realtime changes on the raffle
  useEffect(() => {
    if (!raffleId) return;

    const channel = supabase
      .channel(`raffle-${raffleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'raffles',
          filter: `id=eq.${raffleId}`,
        },
        (payload) => {
          console.log('Raffle updated in realtime:', payload);
          if (payload.eventType === 'UPDATE') {
            setRaffle(payload.new as Raffle);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'raffle_tickets',
          filter: `raffle_id=eq.${raffleId}`,
        },
        (payload) => {
          console.log('New ticket purchased:', payload);
          // Atualizar tickets em tempo real
          const newTicket = payload.new as RaffleTicket;
          setTickets((prev) => [...prev, newTicket]);
          setSoldNumbers((prev) => [...prev, newTicket.ticket_number]);
          
          // Atualizar meus tickets se for meu
          if (user && newTicket.user_id === user.id) {
            setMyTickets((prev) => [...prev, newTicket]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [raffleId, user]);

  // Fetch participant profiles when tickets change
  useEffect(() => {
    const fetchNewParticipants = async () => {
      const uniqueUserIds = [...new Set(tickets.map(t => t.user_id))];
      const existingIds = participants.map(p => p.id);
      const newUserIds = uniqueUserIds.filter(id => !existingIds.includes(id));

      if (newUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', newUserIds);

        if (profilesData) {
          setParticipants((prev) => [...prev, ...(profilesData as Profile[])]);
        }
      }
    };

    if (tickets.length > 0) {
      fetchNewParticipants();
    }
  }, [tickets]);

  const fetchRaffleData = async () => {
    try {
      setIsLoading(true);

      // Buscar sorteio
      const { data: raffleData, error: raffleError } = await supabase
        .from('raffles')
        .select('*')
        .eq('id', raffleId)
        .single();

      if (raffleError) throw raffleError;
      setRaffle(raffleData as Raffle);

      // Buscar todos os tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('raffle_tickets')
        .select('*')
        .eq('raffle_id', raffleId);

      if (ticketsError) throw ticketsError;
      setTickets((ticketsData || []) as RaffleTicket[]);
      setSoldNumbers((ticketsData || []).map(t => t.ticket_number));

      // Buscar meus tickets se estiver logado
      if (user) {
        const myTicketsData = (ticketsData || []).filter(t => t.user_id === user.id);
        setMyTickets(myTicketsData as RaffleTicket[]);
      }

      // Buscar participantes únicos com perfis
      const uniqueUserIds = [...new Set((ticketsData || []).map(t => t.user_id))];
      
      if (uniqueUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', uniqueUserIds);

        if (profilesError) throw profilesError;
        setParticipants((profilesData || []) as Profile[]);
      }

      // Buscar prêmios com dados do vencedor
      const { data: prizesData } = await supabase
        .from('raffle_prizes')
        .select('*')
        .eq('raffle_id', raffleId)
        .order('created_at', { ascending: true });

      if (prizesData && prizesData.length > 0) {
        // Buscar perfis dos vencedores
        const winnerIds = prizesData.filter(p => p.winner_id).map(p => p.winner_id!);
        let winnersMap: Record<string, Profile> = {};
        
        if (winnerIds.length > 0) {
          const { data: winnersData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', winnerIds);
          
          (winnersData || []).forEach((w: any) => {
            winnersMap[w.id] = w as Profile;
          });
        }

        setPrizes(prizesData.map(p => ({
          ...p,
          winner: p.winner_id ? winnersMap[p.winner_id] || null : null,
        })));
      } else {
        setPrizes([]);
      }
    } catch (error) {
      console.error('Error fetching raffle data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buyTicket = async (ticketNumber: number) => {
    if (!user || !raffle) {
      return { error: new Error('Usuário não autenticado') };
    }

    try {
      const { error } = await supabase.from('raffle_tickets').insert({
        raffle_id: raffle.id,
        user_id: user.id,
        ticket_number: ticketNumber,
      });

      if (error) throw error;

      await fetchRaffleData();
      return { error: null };
    } catch (error) {
      console.error('Error buying ticket:', error);
      return { error: error as Error };
    }
  };

  const buyMultipleTickets = async (ticketNumbers: number[]) => {
    if (!user || !raffle) {
      return { error: new Error('Usuário não autenticado') };
    }

    try {
      const ticketsToInsert = ticketNumbers.map(num => ({
        raffle_id: raffle.id,
        user_id: user.id,
        ticket_number: num,
      }));

      const { error } = await supabase.from('raffle_tickets').insert(ticketsToInsert);

      if (error) throw error;

      await fetchRaffleData();
      return { error: null };
    } catch (error) {
      console.error('Error buying tickets:', error);
      return { error: error as Error };
    }
  };

  return {
    raffle,
    tickets,
    participants,
    myTickets,
    soldNumbers,
    prizes,
    isLoading,
    buyTicket,
    buyMultipleTickets,
    refetch: fetchRaffleData,
  };
}

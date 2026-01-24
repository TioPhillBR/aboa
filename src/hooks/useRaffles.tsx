import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Raffle, RaffleTicket, Profile } from '@/types';
import { useAuth } from './useAuth';

export function useRaffles() {
  const [raffles, setRaffles] = useState<(Raffle & { tickets_sold: number })[]>([]);
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
    } catch (error) {
      console.error('Error fetching raffles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    raffles,
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (raffleId) {
      fetchRaffleData();
    }
  }, [raffleId, user]);

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
    isLoading,
    buyTicket,
    buyMultipleTickets,
    refetch: fetchRaffleData,
  };
}

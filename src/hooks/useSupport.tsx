import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_from_admin: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useSupport() {
  const { user, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!support_tickets_user_id_fkey (full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data || []) as unknown as SupportTicket[]);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      toast.error('Erro ao carregar chamados');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const createTicket = async (data: {
    subject: string;
    description: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) => {
    if (!user) return null;

    try {
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: data.subject,
          description: data.description,
          category: data.category || 'general',
          priority: data.priority || 'medium',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Chamado criado com sucesso!');
      await fetchTickets();
      return ticket;
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error('Erro ao criar chamado');
      return null;
    }
  };

  const updateTicketStatus = async (
    ticketId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ) => {
    try {
      const updateData: any = { status };
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Status atualizado!');
      await fetchTickets();
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      toast.error('Erro ao atualizar chamado');
    }
  };

  const assignTicket = async (ticketId: string, adminId: string | null) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: adminId })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Chamado atribuído!');
      await fetchTickets();
    } catch (error: any) {
      console.error('Error assigning ticket:', error);
      toast.error('Erro ao atribuir chamado');
    }
  };

  return {
    tickets,
    loading,
    createTicket,
    updateTicketStatus,
    assignTicket,
    refetch: fetchTickets,
    isAdmin,
  };
}

export function useTicketMessages(ticketId: string | null) {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!ticketId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          profiles!support_messages_user_id_fkey (full_name, avatar_url)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as unknown as SupportMessage[]);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    if (ticketId) {
      const channel = supabase
        .channel(`ticket-${ticketId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `ticket_id=eq.${ticketId}`,
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [ticketId, fetchMessages]);

  const sendMessage = async (message: string) => {
    if (!ticketId || !user) return false;

    try {
      const { error } = await supabase.from('support_messages').insert({
        ticket_id: ticketId,
        user_id: user.id,
        message,
        is_from_admin: isAdmin,
      });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
      return false;
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
}

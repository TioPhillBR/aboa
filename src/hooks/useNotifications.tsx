import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  type: 'raffle_result' | 'prize_won' | 'promotion' | 'system';
  title: string;
  message: string;
  icon?: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  data?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Carregar notificações do localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`notifications_${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setNotifications(parsed.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          })));
        } catch (e) {
          console.error('Error parsing notifications:', e);
        }
      }
    }
  }, [user]);

  // Salvar no localStorage quando mudar
  useEffect(() => {
    if (user && notifications.length > 0) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  // Escutar resultados de sorteios em tempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('raffle-results')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'raffles',
          filter: 'status=eq.completed',
        },
        async (payload) => {
          const raffle = payload.new as any;
          
          // Verificar se o usuário tem tickets neste sorteio
          const { data: tickets } = await supabase
            .from('raffle_tickets')
            .select('ticket_number')
            .eq('raffle_id', raffle.id)
            .eq('user_id', user.id);

          if (tickets && tickets.length > 0) {
            const isWinner = raffle.winner_id === user.id;
            
            addNotification({
              type: 'raffle_result',
              title: isWinner ? '🎉 Você Ganhou!' : 'Resultado do Sorteio',
              message: isWinner 
                ? `Parabéns! Você ganhou o sorteio "${raffle.title}"!`
                : `O sorteio "${raffle.title}" foi realizado. Infelizmente não foi dessa vez.`,
              icon: isWinner ? '🏆' : '🎲',
              link: `/sorteio/${raffle.id}`,
              data: { raffleId: raffle.id, isWinner },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Manter últimas 50
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (user) {
      localStorage.removeItem(`notifications_${user.id}`);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        addNotification, 
        markAsRead, 
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

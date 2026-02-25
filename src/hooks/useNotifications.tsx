import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  type: 'raffle_result' | 'prize_won' | 'promotion' | 'system' | 'profile_incomplete';
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
  dismissProfilePhotoReminder: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profilePhotoReminderDismissed, setProfilePhotoReminderDismissed] = useState(false);

  // Carregar notificações e estado de dismissal do localStorage
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
      
      // Verificar se o lembrete de foto foi dispensado
      const dismissed = localStorage.getItem(`profile_photo_reminder_dismissed_${user.id}`);
      setProfilePhotoReminderDismissed(dismissed === 'true');
    }
  }, [user]);

  // Verificar se usuário não tem foto e adicionar notificação
  useEffect(() => {
    if (user && profile && !profilePhotoReminderDismissed) {
      // Verificar se o usuário não tem avatar_url
      if (!profile.avatar_url) {
        // Verificar se já existe uma notificação de foto de perfil não lida
        const existingPhotoNotification = notifications.find(
          n => n.type === 'profile_incomplete' && n.data?.reason === 'missing_photo' && !n.read
        );
        
        if (!existingPhotoNotification) {
          // Adicionar notificação após um pequeno delay para não atrapalhar o carregamento
          const timer = setTimeout(() => {
            addNotification({
              type: 'profile_incomplete',
              title: '📸 Complete seu perfil!',
              message: 'Adicione uma foto de perfil para que outros jogadores possam te reconhecer nos sorteios e raspadinhas.',
              icon: '📷',
              link: '/perfil',
              data: { reason: 'missing_photo' },
            });
          }, 2000);
          
          return () => clearTimeout(timer);
        }
      }
    }
  }, [user, profile, profilePhotoReminderDismissed, notifications.length]);

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

  // Escutar créditos de prêmios na carteira em tempo real
  useEffect(() => {
    if (!user) return;

    let walletId: string | null = null;

    const setup = async () => {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!wallet) return;
      walletId = wallet.id;

      const channel = supabase
        .channel('prize-credits')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'wallet_transactions',
            filter: `wallet_id=eq.${walletId}`,
          },
          (payload) => {
            const tx = payload.new as any;
            if (tx.type === 'prize' && tx.amount > 0) {
              addNotification({
                type: 'prize_won',
                title: '💰 Prêmio Creditado!',
                message: `R$ ${Number(tx.amount).toFixed(2)} foi creditado na sua carteira! ${tx.description || ''}`.trim(),
                icon: '🎉',
                link: '/carteira',
                data: { transactionId: tx.id, amount: tx.amount },
              });
            }
          }
        )
        .subscribe();

      return channel;
    };

    let channelRef: any;
    setup().then(ch => { channelRef = ch; });

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
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

  const dismissProfilePhotoReminder = useCallback(() => {
    if (user) {
      localStorage.setItem(`profile_photo_reminder_dismissed_${user.id}`, 'true');
      setProfilePhotoReminderDismissed(true);
      // Marcar notificações de foto como lidas
      setNotifications(prev => 
        prev.map(n => 
          n.type === 'profile_incomplete' && n.data?.reason === 'missing_photo'
            ? { ...n, read: true }
            : n
        )
      );
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
        dismissProfilePhotoReminder,
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

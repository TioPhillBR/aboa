import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import { useSupport, useTicketMessages, SupportTicket } from '@/hooks/useSupport';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  User,
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  open: { label: 'Aberto', color: 'bg-blue-500', icon: Clock },
  in_progress: { label: 'Em Andamento', color: 'bg-yellow-500', icon: AlertCircle },
  resolved: { label: 'Resolvido', color: 'bg-green-500', icon: CheckCircle2 },
  closed: { label: 'Fechado', color: 'bg-gray-500', icon: CheckCircle2 },
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-400' },
  medium: { label: 'Média', color: 'bg-blue-400' },
  high: { label: 'Alta', color: 'bg-orange-500' },
  urgent: { label: 'Urgente', color: 'bg-red-500' },
};

export default function SuporteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { tickets, updateTicketStatus } = useSupport();
  const { messages, loading: messagesLoading, sendMessage } = useTicketMessages(id || null);
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ticket = tickets.find(t => t.id === id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!ticket) {
    return (
      <div className="container max-w-4xl py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    const success = await sendMessage(newMessage.trim());
    setSending(false);

    if (success) {
      setNewMessage('');
    }
  };

  const StatusIcon = statusConfig[ticket.status].icon;
  const canReply = ticket.status !== 'closed';

  return (
    <div className="container max-w-4xl py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton />
        <div className="flex-1">
          <h1 className="text-xl font-bold">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`${priorityConfig[ticket.priority].color} text-white border-0`}>
              {priorityConfig[ticket.priority].label}
            </Badge>
            <Badge variant="outline" className={`${statusConfig[ticket.status].color} text-white border-0`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[ticket.status].label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              • Criado em {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Description */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Descrição do Chamado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="flex flex-col h-[400px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Conversa</CardTitle>
        </CardHeader>
        <Separator />
        
        <ScrollArea className="flex-1 p-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">Envie uma mensagem para iniciar a conversa.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.user_id === user.id;
                const senderName = message.profiles?.full_name || 'Usuário';
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {message.is_from_admin ? (
                          <ShieldCheck className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {message.is_from_admin ? (
                            <span className="flex items-center gap-1 text-primary">
                              <ShieldCheck className="h-3 w-3" />
                              Suporte
                            </span>
                          ) : (
                            senderName
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          message.is_from_admin
                            ? 'bg-primary text-primary-foreground'
                            : isCurrentUser
                            ? 'bg-muted'
                            : 'bg-secondary'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <Separator />
        
        {/* Message Input */}
        <div className="p-4">
          {canReply ? (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Este chamado foi fechado e não aceita novas mensagens.
            </p>
          )}
        </div>
      </Card>

      {/* User Actions */}
      {ticket.status === 'resolved' && ticket.user_id === user.id && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                Seu chamado foi resolvido. Se o problema persistir, você pode reabri-lo.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => updateTicketStatus(ticket.id, 'closed')}
                >
                  Confirmar Resolução
                </Button>
                <Button
                  variant="default"
                  onClick={() => updateTicketStatus(ticket.id, 'open')}
                >
                  Reabrir Chamado
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

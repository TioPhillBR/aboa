import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupport, useTicketMessages, SupportTicket } from '@/hooks/useSupport';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  User,
  ShieldCheck,
  Calendar,
  Tag
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

const categoryLabels: Record<string, string> = {
  general: 'Dúvida Geral',
  payment: 'Pagamento',
  raffle: 'Sorteios',
  scratch: 'Raspadinhas',
  account: 'Conta',
  bug: 'Problema Técnico',
  suggestion: 'Sugestão',
};

export default function AdminSuporteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tickets, updateTicketStatus, assignTicket } = useSupport();
  const { messages, loading: messagesLoading, sendMessage } = useTicketMessages(id || null);
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ticket = tickets.find(t => t.id === id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!ticket) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
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

  const handleStatusChange = async (newStatus: string) => {
    await updateTicketStatus(ticket.id, newStatus as any);
  };

  const handleAssign = async () => {
    if (user) {
      await assignTicket(ticket.id, user.id);
      if (ticket.status === 'open') {
        await updateTicketStatus(ticket.id, 'in_progress');
      }
    }
  };

  const StatusIcon = statusConfig[ticket.status].icon;

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/suporte')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{ticket.subject}</h1>
            <p className="text-sm text-muted-foreground">
              Chamado de {ticket.profiles?.full_name || 'Usuário'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content - Messages */}
          <div className="lg:col-span-2 space-y-4">
            {/* Description */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Descrição do Chamado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="flex flex-col h-[500px]">
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
                    <p className="text-sm">Responda o chamado do usuário.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const senderName = message.profiles?.full_name || 'Usuário';
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.is_from_admin ? 'flex-row-reverse' : ''}`}
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
                          
                          <div className={`flex flex-col max-w-[70%] ${message.is_from_admin ? 'items-end' : ''}`}>
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
                                  : 'bg-muted'
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
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Responder ao usuário..."
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
              </div>
            </Card>
          </div>

          {/* Sidebar - Ticket Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações do Chamado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={ticket.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <Badge 
                        variant="outline" 
                        className={`${statusConfig[ticket.status].color} text-white border-0`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[ticket.status].label}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Prioridade</label>
                  <Badge 
                    variant="outline" 
                    className={`${priorityConfig[ticket.priority].color} text-white border-0`}
                  >
                    {priorityConfig[ticket.priority].label}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>{categoryLabels[ticket.category] || 'Geral'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>

                <Separator />

                {!ticket.assigned_to && (
                  <Button onClick={handleAssign} className="w-full">
                    Assumir Chamado
                  </Button>
                )}

                {ticket.assigned_to === user?.id && (
                  <p className="text-sm text-center text-muted-foreground">
                    Você está atendendo este chamado
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Usuário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={ticket.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{ticket.profiles?.full_name || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {ticket.user_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

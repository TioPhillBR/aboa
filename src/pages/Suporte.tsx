import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupport, SupportTicket } from '@/hooks/useSupport';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Headphones,
  FileText
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

const categoryOptions = [
  { value: 'general', label: 'Dúvida Geral' },
  { value: 'payment', label: 'Pagamento' },
  { value: 'raffle', label: 'Sorteios' },
  { value: 'scratch', label: 'Raspadinhas' },
  { value: 'account', label: 'Conta' },
  { value: 'bug', label: 'Problema Técnico' },
  { value: 'suggestion', label: 'Sugestão' },
];

export default function Suporte() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { tickets, loading, createTicket } = useSupport();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{
    subject: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }>({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) return;

    setSubmitting(true);
    const ticket = await createTicket(formData);
    setSubmitting(false);

    if (ticket) {
      setFormData({ subject: '', description: '', category: 'general', priority: 'medium' });
      setIsDialogOpen(false);
    }
  };

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const closedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  const TicketCard = ({ ticket }: { ticket: SupportTicket }) => {
    const StatusIcon = statusConfig[ticket.status].icon;
    
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(`/suporte/${ticket.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`${priorityConfig[ticket.priority].color} text-white border-0`}>
                  {priorityConfig[ticket.priority].label}
                </Badge>
                <Badge variant="outline" className={`${statusConfig[ticket.status].color} text-white border-0`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig[ticket.status].label}
                </Badge>
              </div>
              <h3 className="font-semibold truncate">{ticket.subject}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {ticket.description}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>{categoryOptions.find(c => c.value === ticket.category)?.label || 'Geral'}</span>
                <span>•</span>
                <span>{format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
            </div>
            <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            Suporte
          </h1>
          <p className="text-muted-foreground">
            Envie suas dúvidas e acompanhe seus chamados
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Chamado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Abrir Novo Chamado</DialogTitle>
              <DialogDescription>
                Descreva seu problema ou dúvida em detalhes para que possamos ajudá-lo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Resumo do seu problema"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => 
                      setFormData({ ...formData, priority: value as 'low' | 'medium' | 'high' | 'urgent' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva detalhadamente seu problema ou dúvida..."
                  rows={5}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar Chamado
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum chamado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Você ainda não possui nenhum chamado de suporte.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Abrir Primeiro Chamado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="open" className="space-y-4">
          <TabsList>
            <TabsTrigger value="open" className="gap-2">
              <Clock className="h-4 w-4" />
              Abertos ({openTickets.length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Finalizados ({closedTickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-3 pr-4">
                {openTickets.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhum chamado em aberto
                    </CardContent>
                  </Card>
                ) : (
                  openTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="closed">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-3 pr-4">
                {closedTickets.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhum chamado finalizado
                    </CardContent>
                  </Card>
                ) : (
                  closedTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

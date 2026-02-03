import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Banknote, 
  Search, 
  Sparkles, 
  Calendar,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Send,
  Copy,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PrizePayment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  user_pix_key: string | null;
  user_pix_key_type: string | null;
  prize_type: string;
  prize_source_id: string;
  prize_source_name: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

interface PendingPrize {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  user_pix_key: string | null;
  user_pix_key_type: string | null;
  prize_type: 'scratch_card' | 'raffle';
  source_name: string;
  amount: number;
  won_at: string;
}

interface PaymentStats {
  totalPending: number;
  totalPendingAmount: number;
  totalPaid: number;
  totalPaidAmount: number;
}

export default function AdminPagamentosPremios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PrizePayment[]>([]);
  const [pendingPrizes, setPendingPrizes] = useState<PendingPrize[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalPending: 0,
    totalPendingAmount: 0,
    totalPaid: 0,
    totalPaidAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pendentes');
  
  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<PendingPrize | null>(null);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchPendingPrizes(), fetchPayments()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingPrizes = async () => {
    // Fetch scratch card prizes that don't have a payment record yet
    const { data: scratchPrizes } = await supabase
      .from('scratch_chances')
      .select('id, user_id, scratch_card_id, prize_won, revealed_at')
      .not('prize_won', 'is', null)
      .gt('prize_won', 0)
      .order('revealed_at', { ascending: false });

    // Get existing payment source IDs
    const { data: existingPayments } = await supabase
      .from('prize_payments')
      .select('prize_source_id');
    
    const paidSourceIds = new Set(existingPayments?.map(p => p.prize_source_id) || []);

    // Filter out already paid prizes
    const unpaidScratchPrizes = scratchPrizes?.filter(p => !paidSourceIds.has(p.id)) || [];

    // Get user and card details
    const pendingWithDetails = await Promise.all(
      unpaidScratchPrizes.map(async (prize) => {
        const [profileResult, cardResult] = await Promise.all([
          supabase.from('profiles').select('full_name, avatar_url, pix_key, pix_key_type').eq('id', prize.user_id).single(),
          supabase.from('scratch_cards').select('title').eq('id', prize.scratch_card_id).single(),
        ]);

        return {
          id: prize.id,
          user_id: prize.user_id,
          user_name: profileResult.data?.full_name || 'Usuário',
          user_avatar: profileResult.data?.avatar_url,
          user_pix_key: profileResult.data?.pix_key,
          user_pix_key_type: profileResult.data?.pix_key_type,
          prize_type: 'scratch_card' as const,
          source_name: cardResult.data?.title || 'Raspadinha',
          amount: prize.prize_won || 0,
          won_at: prize.revealed_at || '',
        };
      })
    );

    setPendingPrizes(pendingWithDetails);
    
    // Update stats
    const totalPendingAmount = pendingWithDetails.reduce((sum, p) => sum + p.amount, 0);
    setStats(prev => ({
      ...prev,
      totalPending: pendingWithDetails.length,
      totalPendingAmount,
    }));
  };

  const fetchPayments = async () => {
    const { data: paymentsData } = await supabase
      .from('prize_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (paymentsData) {
      const paymentsWithDetails = await Promise.all(
        paymentsData.map(async (payment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, pix_key, pix_key_type')
            .eq('id', payment.user_id)
            .single();

          let sourceName = 'Prêmio';
          if (payment.prize_type === 'scratch_card') {
            const { data: chance } = await supabase
              .from('scratch_chances')
              .select('scratch_card_id')
              .eq('id', payment.prize_source_id)
              .single();
            
            if (chance) {
              const { data: card } = await supabase
                .from('scratch_cards')
                .select('title')
                .eq('id', chance.scratch_card_id)
                .single();
              sourceName = card?.title || 'Raspadinha';
            }
          }

          return {
            ...payment,
            status: payment.status as 'pending' | 'paid' | 'cancelled',
            user_name: profile?.full_name || 'Usuário',
            user_avatar: profile?.avatar_url,
            user_pix_key: profile?.pix_key,
            user_pix_key_type: profile?.pix_key_type,
            prize_source_name: sourceName,
          };
        })
      );

      setPayments(paymentsWithDetails);

      // Update stats
      const paidPayments = paymentsWithDetails.filter(p => p.status === 'paid');
      const totalPaidAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0);
      setStats(prev => ({
        ...prev,
        totalPaid: paidPayments.length,
        totalPaidAmount,
      }));
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPrize || !user) return;

    setIsProcessing(true);
    try {
      // Create payment record
      const { error } = await supabase
        .from('prize_payments')
        .insert({
          user_id: selectedPrize.user_id,
          prize_type: selectedPrize.prize_type,
          prize_source_id: selectedPrize.id,
          amount: selectedPrize.amount,
          pix_key: selectedPrize.user_pix_key,
          pix_key_type: selectedPrize.user_pix_key_type,
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_by: user.id,
          notes: paymentNotes || null,
        });

      if (error) throw error;

      toast({
        title: 'Pagamento registrado!',
        description: `Prêmio de R$ ${selectedPrize.amount.toFixed(2)} marcado como pago.`,
      });

      setPaymentDialogOpen(false);
      setSelectedPrize(null);
      setPaymentNotes('');
      fetchData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: 'Erro ao registrar pagamento',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Chave PIX copiada para a área de transferência.',
    });
  };

  const getPixKeyTypeLabel = (type: string | null) => {
    switch (type) {
      case 'cpf': return 'CPF';
      case 'email': return 'E-mail';
      case 'phone': return 'Telefone';
      case 'random': return 'Chave Aleatória';
      default: return 'Não informado';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" /> Pago</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="h-3 w-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPending = pendingPrizes.filter(p =>
    p.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.source_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(p =>
    p.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.prize_source_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/10">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
              Pagamentos de Prêmios
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os pagamentos de prêmios via PIX
            </p>
          </div>
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{stats.totalPending}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pendente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    R$ {stats.totalPendingAmount.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pagos</p>
                  <p className="text-2xl font-bold">{stats.totalPaid}</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pago</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {stats.totalPaidAmount.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <Banknote className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou jogo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pendentes" className="gap-2">
              <Clock className="h-4 w-4" />
              Pendentes ({stats.totalPending})
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Pendentes Tab */}
          <TabsContent value="pendentes">
            <Card>
              <CardHeader>
                <CardTitle>Prêmios Aguardando Pagamento</CardTitle>
                <CardDescription>
                  Prêmios ganhos pelos usuários que ainda não foram pagos via PIX
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ganhador</TableHead>
                      <TableHead>Prêmio</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Chave PIX</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredPending.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                          <p>Todos os prêmios foram pagos!</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPending.map((prize) => (
                        <TableRow key={prize.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={prize.user_avatar || ''} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {prize.user_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{prize.user_name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-accent" />
                              <span>{prize.source_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-green-600">
                              R$ {prize.amount.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {prize.user_pix_key ? (
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    {getPixKeyTypeLabel(prize.user_pix_key_type)}
                                  </p>
                                  <p className="font-mono text-sm">{prize.user_pix_key}</p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => copyToClipboard(prize.user_pix_key!)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Não cadastrada
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {prize.won_at ? format(new Date(prize.won_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '—'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                setSelectedPrize(prize);
                                setPaymentDialogOpen(true);
                              }}
                              disabled={!prize.user_pix_key}
                            >
                              <Send className="h-4 w-4" />
                              Pagar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico Tab */}
          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
                <CardDescription>
                  Todos os pagamentos de prêmios realizados
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ganhador</TableHead>
                      <TableHead>Prêmio</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Nenhum pagamento registrado</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={payment.user_avatar || ''} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {payment.user_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="font-semibold">{payment.user_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>{payment.prize_source_name}</TableCell>
                          <TableCell>
                            <span className="font-bold text-green-600">
                              R$ {payment.amount.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            {payment.paid_at 
                              ? format(new Date(payment.paid_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                              : '—'
                            }
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {payment.notes || '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              Confirmar Pagamento
            </DialogTitle>
            <DialogDescription>
              Confirme que o pagamento foi realizado via PIX
            </DialogDescription>
          </DialogHeader>

          {selectedPrize && (
            <div className="space-y-4 py-4">
              {/* User info */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedPrize.user_avatar || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {selectedPrize.user_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedPrize.user_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPrize.source_name}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor do prêmio:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {selectedPrize.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* PIX Key */}
              <div className="space-y-2">
                <Label>Chave PIX do ganhador</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={selectedPrize.user_pix_key || ''} 
                    readOnly 
                    className="font-mono"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(selectedPrize.user_pix_key!)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tipo: {getPixKeyTypeLabel(selectedPrize.user_pix_key_type)}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ex: Comprovante enviado via WhatsApp"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPaymentDialogOpen(false);
                setSelectedPrize(null);
                setPaymentNotes('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={isProcessing}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

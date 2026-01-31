import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Gift, 
  Search, 
  Plus,
  Clock,
  Package,
  CheckCircle,
  Loader2,
  Truck,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { PrizeStatus } from '@/types';

interface RafflePrize {
  id: string;
  raffle_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  estimated_value: number | null;
  status: PrizeStatus;
  winner_id: string | null;
  delivery_notes: string | null;
  delivered_at: string | null;
  created_at: string;
  raffle?: {
    title: string;
  };
  winner?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export default function AdminPremios() {
  const [prizes, setPrizes] = useState<RafflePrize[]>([]);
  const [raffles, setRaffles] = useState<{ id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<RafflePrize | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Form state for new prize
  const [newPrize, setNewPrize] = useState({
    raffle_id: '',
    name: '',
    description: '',
    estimated_value: 0,
  });

  useEffect(() => {
    fetchPrizes();
    fetchRaffles();
  }, []);

  const fetchPrizes = async () => {
    try {
      const { data, error } = await supabase
        .from('raffle_prizes')
        .select(`
          *,
          raffles!inner(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch winner profiles separately
      const prizesWithWinners = await Promise.all(
        (data || []).map(async (prize: any) => {
          if (prize.winner_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', prize.winner_id)
              .single();
            return { ...prize, raffle: prize.raffles, winner: profile };
          }
          return { ...prize, raffle: prize.raffles };
        })
      );

      setPrizes(prizesWithWinners);
    } catch (error) {
      console.error('Error fetching prizes:', error);
      toast.error('Erro ao carregar prêmios');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRaffles = async () => {
    const { data } = await supabase
      .from('raffles')
      .select('id, title')
      .order('created_at', { ascending: false });
    setRaffles(data || []);
  };

  const handleCreatePrize = async () => {
    try {
      const { error } = await supabase
        .from('raffle_prizes')
        .insert({
          raffle_id: newPrize.raffle_id,
          name: newPrize.name,
          description: newPrize.description || null,
          estimated_value: newPrize.estimated_value || null,
        });

      if (error) throw error;

      toast.success('Prêmio criado com sucesso');
      setIsDialogOpen(false);
      setNewPrize({ raffle_id: '', name: '', description: '', estimated_value: 0 });
      fetchPrizes();
    } catch (error) {
      console.error('Error creating prize:', error);
      toast.error('Erro ao criar prêmio');
    }
  };

  const handleUpdateStatus = async (prizeId: string, status: PrizeStatus) => {
    try {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
        updateData.delivery_notes = deliveryNotes;
      }

      const { error } = await supabase
        .from('raffle_prizes')
        .update(updateData)
        .eq('id', prizeId);

      if (error) throw error;

      toast.success('Status atualizado');
      setSelectedPrize(null);
      setDeliveryNotes('');
      fetchPrizes();
    } catch (error) {
      console.error('Error updating prize:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const filteredPrizes = prizes.filter(prize => {
    const matchesSearch = prize.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prize.raffle?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || prize.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const metrics = {
    total: prizes.length,
    pending: prizes.filter(p => p.status === 'pending').length,
    processing: prizes.filter(p => p.status === 'processing').length,
    delivered: prizes.filter(p => p.status === 'delivered').length,
    totalValue: prizes.reduce((sum, p) => sum + Number(p.estimated_value || 0), 0),
  };

  const getStatusBadge = (status: PrizeStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning/10 text-warning"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'processing':
        return <Badge className="bg-primary/10 text-primary"><Package className="h-3 w-3 mr-1" />Processando</Badge>;
      case 'delivered':
        return <Badge className="bg-success/10 text-success"><CheckCircle className="h-3 w-3 mr-1" />Entregue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-gold">
                <Gift className="h-6 w-6 text-primary-foreground" />
              </div>
              Prêmios
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestão de prêmios de rifas
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Prêmio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Prêmio</DialogTitle>
                <DialogDescription>
                  Adicione um novo prêmio a uma rifa
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Rifa</Label>
                  <Select 
                    value={newPrize.raffle_id} 
                    onValueChange={(v) => setNewPrize({ ...newPrize, raffle_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma rifa" />
                    </SelectTrigger>
                    <SelectContent>
                      {raffles.map((raffle) => (
                        <SelectItem key={raffle.id} value={raffle.id}>
                          {raffle.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nome do Prêmio</Label>
                  <Input
                    value={newPrize.name}
                    onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                    placeholder="Ex: iPhone 15 Pro Max"
                  />
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={newPrize.description}
                    onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
                    placeholder="Descrição do prêmio..."
                  />
                </div>

                <div>
                  <Label>Valor Estimado (R$)</Label>
                  <Input
                    type="number"
                    value={newPrize.estimated_value}
                    onChange={(e) => setNewPrize({ ...newPrize, estimated_value: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePrize} disabled={!newPrize.raffle_id || !newPrize.name}>
                  Criar Prêmio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{metrics.total}</p>
                </div>
                <Gift className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-warning">{metrics.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Processando</p>
                  <p className="text-2xl font-bold text-primary">{metrics.processing}</p>
                </div>
                <Package className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entregues</p>
                  <p className="text-2xl font-bold text-success">{metrics.delivered}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">R$ {metrics.totalValue.toFixed(0)}</p>
                </div>
                <Gift className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prizes List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Prêmios</CardTitle>
            <CardDescription>
              {filteredPrizes.length} prêmios encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou rifa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="delivered">Entregues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prêmio</TableHead>
                    <TableHead>Rifa</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Ganhador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrizes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum prêmio encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrizes.map((prize) => (
                      <TableRow key={prize.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{prize.name}</p>
                            {prize.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {prize.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{prize.raffle?.title}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {prize.estimated_value ? `R$ ${Number(prize.estimated_value).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          {prize.winner ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={prize.winner.avatar_url || ''} />
                                <AvatarFallback>{prize.winner.full_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{prize.winner.full_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(prize.status)}</TableCell>
                        <TableCell>
                          {prize.status !== 'delivered' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedPrize(prize)}
                                >
                                  <Truck className="h-4 w-4 mr-2" />
                                  Atualizar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Atualizar Status do Prêmio</DialogTitle>
                                  <DialogDescription>
                                    {prize.name}
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      variant={prize.status === 'processing' ? 'default' : 'outline'}
                                      onClick={() => handleUpdateStatus(prize.id, 'processing')}
                                    >
                                      <Package className="h-4 w-4 mr-2" />
                                      Processando
                                    </Button>
                                    <Button
                                      variant="default"
                                      className="bg-success hover:bg-success/90"
                                      onClick={() => handleUpdateStatus(prize.id, 'delivered')}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Entregue
                                    </Button>
                                  </div>

                                  <div>
                                    <Label>Notas de Entrega</Label>
                                    <Textarea
                                      value={deliveryNotes}
                                      onChange={(e) => setDeliveryNotes(e.target.value)}
                                      placeholder="Observações sobre a entrega..."
                                    />
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {prize.delivered_at && (
                            <span className="text-xs text-muted-foreground">
                              Entregue em {format(new Date(prize.delivered_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

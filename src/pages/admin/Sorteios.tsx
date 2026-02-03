import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import { PrizeConfigList, PrizeConfig } from '@/components/admin/PrizeConfigList';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Raffle, Profile } from '@/types';
import { 
  Ticket, 
  Plus, 
  Play, 
  Users,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Gift,
  MapPin,
  X,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Brazilian states with names
const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' },
];

type LocationScope = 'national' | 'state' | 'city';

interface RaffleWithStats extends Raffle {
  tickets_sold: number;
  participants: Profile[];
  prizes_count?: number;
}

export default function AdminSorteios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [raffles, setRaffles] = useState<RaffleWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState<RaffleWithStats | null>(null);
  const [drawDialogOpen, setDrawDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    total_numbers: '',
    draw_date: '',
    image_url: '',
    allowed_locations: [] as string[],
  });

  // Prizes state for the new raffle
  const [prizes, setPrizes] = useState<PrizeConfig[]>([]);
  
  // Location restriction state
  const [locationScope, setLocationScope] = useState<LocationScope>('national');
  const [selectedState, setSelectedState] = useState('');
  const [cityInput, setCityInput] = useState('');

  useEffect(() => {
    fetchRaffles();
  }, []);

  const fetchRaffles = async () => {
    try {
      setIsLoading(true);

      const { data: rafflesData, error } = await supabase
        .from('raffles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Para cada sorteio, buscar estatísticas
      const rafflesWithStats = await Promise.all(
        (rafflesData || []).map(async (raffle) => {
          // Buscar tickets
          const { data: ticketsData } = await supabase
            .from('raffle_tickets')
            .select('user_id')
            .eq('raffle_id', raffle.id);

          const uniqueUserIds = [...new Set((ticketsData || []).map(t => t.user_id))];

          // Buscar perfis dos participantes
          let participants: Profile[] = [];
          if (uniqueUserIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', uniqueUserIds);
            participants = (profilesData || []) as Profile[];
          }

          return {
            ...raffle,
            tickets_sold: ticketsData?.length || 0,
            participants,
          } as RaffleWithStats;
        })
      );

      setRaffles(rafflesWithStats);
    } catch (error) {
      console.error('Error fetching raffles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRaffle = async () => {
    if (!user) return;

    if (!formData.title || !formData.price || !formData.total_numbers || !formData.draw_date) {
      toast({
        title: 'Preencha todos os campos',
        description: 'Todos os campos são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (prizes.length === 0) {
      toast({
        title: 'Adicione ao menos um prêmio',
        description: 'Configure pelo menos um prêmio para o sorteio',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // 1. Criar o sorteio
      const { data: raffleData, error: raffleError } = await supabase
        .from('raffles')
        .insert({
          title: formData.title,
          description: formData.description || null,
          price: parseFloat(formData.price),
          total_numbers: parseInt(formData.total_numbers),
          draw_date: new Date(formData.draw_date).toISOString(),
          image_url: formData.image_url || null,
          allowed_locations: formData.allowed_locations.length > 0 ? formData.allowed_locations : null,
          status: 'open',
          created_by: user.id,
        })
        .select()
        .single();

      if (raffleError) throw raffleError;

      // 2. Criar os prêmios
      const prizesToInsert = prizes.flatMap(prize => 
        Array.from({ length: prize.quantity }, () => ({
          raffle_id: raffleData.id,
          name: prize.name,
          description: prize.description || null,
          image_url: prize.image_url || null,
          estimated_value: prize.value,
          status: 'pending' as const,
        }))
      );

      if (prizesToInsert.length > 0) {
        const { error: prizesError } = await supabase
          .from('raffle_prizes')
          .insert(prizesToInsert);

        if (prizesError) throw prizesError;
      }

      toast({
        title: 'Sorteio criado!',
        description: `${prizesToInsert.length} prêmio(s) configurado(s).`,
      });

      setCreateDialogOpen(false);
      setFormData({ title: '', description: '', price: '', total_numbers: '', draw_date: '', image_url: '', allowed_locations: [] });
      setPrizes([]);
      setLocationScope('national');
      setSelectedState('');
      setCityInput('');
      fetchRaffles();
    } catch (error) {
      console.error('Error creating raffle:', error);
      toast({
        title: 'Erro ao criar sorteio',
        description: 'Não foi possível criar o sorteio. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRaffle = async (raffleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este sorteio?')) return;

    try {
      const { error } = await supabase
        .from('raffles')
        .delete()
        .eq('id', raffleId);

      if (error) throw error;

      toast({
        title: 'Sorteio excluído',
        description: 'O sorteio foi excluído com sucesso.',
      });

      fetchRaffles();
    } catch (error) {
      console.error('Error deleting raffle:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o sorteio.',
        variant: 'destructive',
      });
    }
  };

  const openDrawDialog = (raffle: RaffleWithStats) => {
    if (raffle.participants.length < 2) {
      toast({
        title: 'Participantes insuficientes',
        description: 'É necessário pelo menos 2 participantes para realizar o sorteio.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedRaffle(raffle);
    setDrawDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-500">Aberto</Badge>;
      case 'drawing':
        return <Badge className="bg-yellow-500 animate-pulse">Sorteando</Badge>;
      case 'completed':
        return <Badge variant="secondary">Finalizado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Ticket className="h-8 w-8" />
              Sorteios
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os sorteios e realize sorteios ao vivo
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Sorteio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Criar Novo Sorteio
                </DialogTitle>
                <DialogDescription>
                  Configure o sorteio e os prêmios que serão sorteados
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Dados Básicos */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Dados do Sorteio
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Sorteio iPhone 15"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição do sorteio..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço por Número (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="10.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="total_numbers">Total de Números *</Label>
                      <Input
                        id="total_numbers"
                        type="number"
                        min="1"
                        value={formData.total_numbers}
                        onChange={(e) => setFormData({ ...formData, total_numbers: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="draw_date">Data do Sorteio *</Label>
                    <Input
                      id="draw_date"
                      type="datetime-local"
                      value={formData.draw_date}
                      onChange={(e) => setFormData({ ...formData, draw_date: e.target.value })}
                    />
                  </div>

                  <ImageUpload
                    label="Imagem do Sorteio"
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    bucket="raffle-images"
                    folder="covers"
                    aspectRatio="video"
                  />

                  {/* Restrição de Localidade */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Restrição de Localidade (opcional)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Defina a abrangência geográfica do sorteio
                    </p>
                    
                    {/* Scope selector */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={locationScope === 'national' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setLocationScope('national');
                          setFormData({ ...formData, allowed_locations: [] });
                          setSelectedState('');
                          setCityInput('');
                        }}
                      >
                        🇧🇷 Nacional
                      </Button>
                      <Button
                        type="button"
                        variant={locationScope === 'state' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setLocationScope('state');
                          setFormData({ ...formData, allowed_locations: [] });
                          setCityInput('');
                        }}
                      >
                        Estadual
                      </Button>
                      <Button
                        type="button"
                        variant={locationScope === 'city' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setLocationScope('city');
                          setFormData({ ...formData, allowed_locations: [] });
                        }}
                      >
                        Municipal
                      </Button>
                    </div>

                    {locationScope === 'national' && (
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Sorteio aberto para todo o Brasil
                      </p>
                    )}

                    {locationScope === 'state' && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione um estado...</option>
                            {BRAZILIAN_STATES.filter(s => !formData.allowed_locations.includes(s.code)).map(state => (
                              <option key={state.code} value={state.code}>{state.code} - {state.name}</option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (selectedState && !formData.allowed_locations.includes(selectedState)) {
                                setFormData({
                                  ...formData,
                                  allowed_locations: [...formData.allowed_locations, selectedState]
                                });
                                setSelectedState('');
                              }
                            }}
                            disabled={!selectedState}
                          >
                            Adicionar
                          </Button>
                        </div>
                        {formData.allowed_locations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.allowed_locations.map(loc => {
                              const stateName = BRAZILIAN_STATES.find(s => s.code === loc)?.name || loc;
                              return (
                                <Badge key={loc} variant="secondary" className="gap-1">
                                  {loc} - {stateName}
                                  <button
                                    type="button"
                                    onClick={() => setFormData({
                                      ...formData,
                                      allowed_locations: formData.allowed_locations.filter(l => l !== loc)
                                    })}
                                    className="hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {locationScope === 'city' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">UF</option>
                            {BRAZILIAN_STATES.map(state => (
                              <option key={state.code} value={state.code}>{state.code}</option>
                            ))}
                          </select>
                          <Input
                            placeholder="Nome da cidade..."
                            value={cityInput}
                            onChange={(e) => setCityInput(e.target.value)}
                            className="col-span-2"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            if (selectedState && cityInput.trim()) {
                              const locationEntry = `${cityInput.trim()}-${selectedState}`;
                              if (!formData.allowed_locations.includes(locationEntry)) {
                                setFormData({
                                  ...formData,
                                  allowed_locations: [...formData.allowed_locations, locationEntry]
                                });
                                setCityInput('');
                              }
                            }
                          }}
                          disabled={!selectedState || !cityInput.trim()}
                        >
                          Adicionar Cidade
                        </Button>
                        {formData.allowed_locations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.allowed_locations.map(loc => (
                              <Badge key={loc} variant="secondary" className="gap-1">
                                {loc}
                                <button
                                  type="button"
                                  onClick={() => setFormData({
                                    ...formData,
                                    allowed_locations: formData.allowed_locations.filter(l => l !== loc)
                                  })}
                                  className="hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Prêmios */}
                <div className="border-t pt-4">
                  <PrizeConfigList
                    prizes={prizes}
                    onChange={setPrizes}
                    type="raffle"
                    showImage={true}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateRaffle} disabled={isCreating || prizes.length === 0}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Sorteio'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Números</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : raffles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum sorteio criado ainda
                    </TableCell>
                  </TableRow>
                ) : (
                  raffles.map((raffle) => (
                    <TableRow key={raffle.id}>
                      <TableCell className="font-medium">{raffle.title}</TableCell>
                      <TableCell>R$ {raffle.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {Math.round((raffle.tickets_sold / raffle.total_numbers) * 100)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {raffle.participants.length}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(raffle.draw_date), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(raffle.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {raffle.status === 'open' && (
                            <Button
                              size="sm"
                              onClick={() => openDrawDialog(raffle)}
                              className="gap-1 bg-green-500 hover:bg-green-600"
                            >
                              <Play className="h-3 w-3" />
                              Sortear
                            </Button>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/sorteio/${raffle.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {raffle.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRaffle(raffle.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Draw Dialog */}
        {selectedRaffle && (
          <DrawRaffleDialog
            raffle={selectedRaffle}
            open={drawDialogOpen}
            onOpenChange={setDrawDialogOpen}
            onComplete={() => {
              setDrawDialogOpen(false);
              setSelectedRaffle(null);
              fetchRaffles();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// Componente do diálogo de sorteio em tela cheia
import { FullscreenRaffleDraw } from '@/components/games/FullscreenRaffleDraw';

interface DrawRaffleDialogProps {
  raffle: RaffleWithStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

function DrawRaffleDialog({ raffle, open, onOpenChange, onComplete }: DrawRaffleDialogProps) {
  const { toast } = useToast();
  const [winner, setWinner] = useState<Profile | null>(null);

  const handleWinnerSelected = async (selectedWinner: Profile) => {
    setWinner(selectedWinner);

    // Atualizar status para 'drawing' primeiro
    await supabase
      .from('raffles')
      .update({ status: 'drawing' })
      .eq('id', raffle.id);

    // Buscar um ticket aleatório do vencedor
    const { data: tickets } = await supabase
      .from('raffle_tickets')
      .select('ticket_number')
      .eq('raffle_id', raffle.id)
      .eq('user_id', selectedWinner.id);

    const winningTicket = tickets?.[Math.floor(Math.random() * (tickets?.length || 1))]?.ticket_number || 1;

    // Atualizar o sorteio com o vencedor
    const { error } = await supabase
      .from('raffles')
      .update({
        status: 'completed',
        winner_id: selectedWinner.id,
        winner_ticket_number: winningTicket,
      })
      .eq('id', raffle.id);

    if (error) {
      console.error('Error updating winner:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o vencedor.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: '🎉 Sorteio Realizado!',
        description: `${selectedWinner.full_name} foi o vencedor!`,
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (winner) {
      onComplete();
    }
    setWinner(null);
  };

  return (
    <FullscreenRaffleDraw
      participants={raffle.participants}
      raffleTitle={raffle.title}
      ticketsSold={raffle.tickets_sold}
      open={open}
      onClose={handleClose}
      onWinnerSelected={handleWinnerSelected}
      winner={winner}
    />
  );
}

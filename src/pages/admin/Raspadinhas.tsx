import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';
import { PrizeConfigList, PrizeConfig } from '@/components/admin/PrizeConfigList';
import { SymbolProbabilityEditor } from '@/components/admin/SymbolProbabilityEditor';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ScratchCard, ScratchSymbol } from '@/types';
import { 
  Sparkles, 
  Plus, 
  Edit,
  Trash2,
  Eye,
  Loader2,
  Image as ImageIcon,
  Coins,
  Settings2,
  X,
  Package,
  AlertTriangle,
  TrendingUp,
  Percent
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface ScratchCardWithStats extends ScratchCard {
  symbols: ScratchSymbol[];
  total_sold: number;
  total_prizes: number;
  batch?: {
    id: string;
    batch_name: string;
    total_cards: number;
    cards_sold: number;
  };
}

export default function AdminRaspadinhas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scratchCards, setScratchCards] = useState<ScratchCardWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [symbolsDialogOpen, setSymbolsDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ScratchCardWithStats | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Form state for creating scratch card
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    cover_image_url: '',
    total_cards: '100',
  });

  // Prizes state for the new scratch card
  const [prizes, setPrizes] = useState<PrizeConfig[]>([]);

  // Form state for symbols (legacy - for existing cards)
  const [symbolForm, setSymbolForm] = useState({
    name: '',
    image_url: '',
    prize_value: '',
    probability: '10',
    total_quantity: '',
  });
  const [isAddingSymbol, setIsAddingSymbol] = useState(false);

  useEffect(() => {
    fetchScratchCards();
  }, []);

  const fetchScratchCards = async () => {
    try {
      setIsLoading(true);

      const { data: cardsData, error } = await supabase
        .from('scratch_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Para cada raspadinha, buscar estatísticas
      const cardsWithStats = await Promise.all(
        (cardsData || []).map(async (card) => {
          // Buscar símbolos
          const { data: symbolsData } = await supabase
            .from('scratch_symbols')
            .select('*')
            .eq('scratch_card_id', card.id);

          // Buscar chances vendidas e prêmios
          const { data: chancesData } = await supabase
            .from('scratch_chances')
            .select('prize_won')
            .eq('scratch_card_id', card.id);

          const totalPrizes = (chancesData || []).reduce(
            (sum, c) => sum + (c.prize_won || 0), 
            0
          );

          return {
            ...card,
            symbols: (symbolsData || []) as ScratchSymbol[],
            total_sold: chancesData?.length || 0,
            total_prizes: totalPrizes,
          } as ScratchCardWithStats;
        })
      );

      setScratchCards(cardsWithStats);
    } catch (error) {
      console.error('Error fetching scratch cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateScratchCard = async () => {
    if (!user) return;

    if (!formData.title || !formData.price || !formData.total_cards) {
      toast({
        title: 'Preencha os campos obrigatórios',
        description: 'Título, preço e quantidade de raspadinhas são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (prizes.length === 0) {
      toast({
        title: 'Adicione ao menos um prêmio',
        description: 'Configure pelo menos um prêmio para a raspadinha',
        variant: 'destructive',
      });
      return;
    }

    // Validar prêmios
    const totalPrizes = prizes.reduce((sum, p) => sum + p.quantity, 0);
    const totalCards = parseInt(formData.total_cards);
    if (totalPrizes > totalCards) {
      toast({
        title: 'Quantidade de prêmios inválida',
        description: 'O total de prêmios não pode ser maior que a quantidade de raspadinhas',
        variant: 'destructive',
      });
      return;
    }

    const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);
    if (totalProbability > 100) {
      toast({
        title: 'Probabilidade inválida',
        description: 'A soma das probabilidades não pode ultrapassar 100%',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // 1. Criar a raspadinha
      const { data: scratchCardData, error: scratchError } = await supabase
        .from('scratch_cards')
        .insert({
          title: formData.title,
          description: formData.description || null,
          price: parseFloat(formData.price),
          cover_image_url: formData.cover_image_url || null,
          is_active: false,
          created_by: user.id,
        })
        .select()
        .single();

      if (scratchError) throw scratchError;

      // 2. Criar o lote
      const prizeConfig = prizes.map(p => ({
        name: p.name,
        value: p.value,
        quantity: p.quantity,
        probability: p.probability,
        image_url: p.image_url || '',
      }));

      const { error: batchError } = await supabase
        .from('scratch_card_batches')
        .insert({
          scratch_card_id: scratchCardData.id,
          batch_name: `Lote ${formData.title}`,
          total_cards: parseInt(formData.total_cards),
          total_prizes: totalPrizes,
          prize_config: prizeConfig,
          is_active: true,
        });

      if (batchError) throw batchError;

      // 3. Criar os símbolos baseados nos prêmios
      const symbolsToInsert = prizes.map(prize => ({
        scratch_card_id: scratchCardData.id,
        name: prize.name,
        image_url: prize.image_url || '/placeholder.svg',
        prize_value: prize.value,
        probability: prize.probability / 100,
        total_quantity: prize.quantity,
        remaining_quantity: prize.quantity,
      }));

      const { error: symbolsError } = await supabase
        .from('scratch_symbols')
        .insert(symbolsToInsert);

      if (symbolsError) throw symbolsError;

      toast({
        title: 'Raspadinha criada!',
        description: `${prizes.length} prêmios configurados para ${formData.total_cards} raspadinhas.`,
      });

      setCreateDialogOpen(false);
      setFormData({ title: '', description: '', price: '', cover_image_url: '', total_cards: '100' });
      setPrizes([]);
      fetchScratchCards();
    } catch (error) {
      console.error('Error creating scratch card:', error);
      toast({
        title: 'Erro ao criar raspadinha',
        description: 'Não foi possível criar a raspadinha. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteScratchCard = async (cardId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta raspadinha? Todos os símbolos serão excluídos.')) return;

    try {
      // Primeiro excluir os símbolos
      await supabase
        .from('scratch_symbols')
        .delete()
        .eq('scratch_card_id', cardId);

      // Depois excluir a raspadinha
      const { error } = await supabase
        .from('scratch_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      toast({
        title: 'Raspadinha excluída',
        description: 'A raspadinha foi excluída com sucesso.',
      });

      fetchScratchCards();
    } catch (error) {
      console.error('Error deleting scratch card:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a raspadinha.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (card: ScratchCardWithStats) => {
    if (!card.is_active && card.symbols.length === 0) {
      toast({
        title: 'Adicione símbolos primeiro',
        description: 'É necessário adicionar pelo menos um símbolo antes de ativar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('scratch_cards')
        .update({ is_active: !card.is_active })
        .eq('id', card.id);

      if (error) throw error;

      toast({
        title: card.is_active ? 'Raspadinha desativada' : 'Raspadinha ativada',
        description: card.is_active 
          ? 'A raspadinha não está mais disponível para compra.' 
          : 'A raspadinha está disponível para compra.',
      });

      fetchScratchCards();
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  const openSymbolsDialog = (card: ScratchCardWithStats) => {
    setSelectedCard(card);
    setSymbolsDialogOpen(true);
  };

  const handleAddSymbol = async () => {
    if (!selectedCard) return;

    if (!symbolForm.name || !symbolForm.image_url) {
      toast({
        title: 'Preencha os campos obrigatórios',
        description: 'Nome e imagem são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingSymbol(true);

    try {
      const { error } = await supabase.from('scratch_symbols').insert({
        scratch_card_id: selectedCard.id,
        name: symbolForm.name,
        image_url: symbolForm.image_url,
        prize_value: parseFloat(symbolForm.prize_value) || 0,
        probability: parseFloat(symbolForm.probability) / 100 || 0.1,
        total_quantity: symbolForm.total_quantity ? parseInt(symbolForm.total_quantity) : null,
        remaining_quantity: symbolForm.total_quantity ? parseInt(symbolForm.total_quantity) : null,
      });

      if (error) throw error;

      toast({
        title: 'Símbolo adicionado!',
        description: `${symbolForm.name} foi adicionado à raspadinha.`,
      });

      setSymbolForm({ name: '', image_url: '', prize_value: '', probability: '10', total_quantity: '' });
      
      // Atualizar a lista
      fetchScratchCards();
      
      // Atualizar o card selecionado
      const { data: updatedSymbols } = await supabase
        .from('scratch_symbols')
        .select('*')
        .eq('scratch_card_id', selectedCard.id);
      
      setSelectedCard({
        ...selectedCard,
        symbols: (updatedSymbols || []) as ScratchSymbol[],
      });
    } catch (error) {
      console.error('Error adding symbol:', error);
      toast({
        title: 'Erro ao adicionar símbolo',
        description: 'Não foi possível adicionar o símbolo.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingSymbol(false);
    }
  };

  const handleDeleteSymbol = async (symbolId: string) => {
    if (!selectedCard) return;

    try {
      const { error } = await supabase
        .from('scratch_symbols')
        .delete()
        .eq('id', symbolId);

      if (error) throw error;

      toast({
        title: 'Símbolo excluído',
      });

      // Atualizar a lista
      fetchScratchCards();
      
      // Atualizar o card selecionado
      setSelectedCard({
        ...selectedCard,
        symbols: selectedCard.symbols.filter(s => s.id !== symbolId),
      });
    } catch (error) {
      console.error('Error deleting symbol:', error);
    }
  };

  const handleUpdateCard = async () => {
    if (!selectedCard) return;

    try {
      const { error } = await supabase
        .from('scratch_cards')
        .update({
          title: formData.title,
          description: formData.description || null,
          price: parseFloat(formData.price),
          cover_image_url: formData.cover_image_url || null,
        })
        .eq('id', selectedCard.id);

      if (error) throw error;

      toast({
        title: 'Raspadinha atualizada!',
      });

      setEditDialogOpen(false);
      setSelectedCard(null);
      fetchScratchCards();
    } catch (error) {
      console.error('Error updating scratch card:', error);
      toast({
        title: 'Erro ao atualizar',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (card: ScratchCardWithStats) => {
    setSelectedCard(card);
    setFormData({
      title: card.title,
      description: card.description || '',
      price: card.price.toString(),
      cover_image_url: card.cover_image_url || '',
      total_cards: card.batch?.total_cards?.toString() || '100',
    });
    setEditDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="h-8 w-8" />
              Raspadinhas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as raspadinhas, símbolos e prêmios
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Raspadinha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Criar Nova Raspadinha
                </DialogTitle>
                <DialogDescription>
                  Configure a raspadinha, quantidade do lote e os prêmios
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Dados Básicos */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Dados Básicos
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Raspadinha da Sorte"
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="description">Descrição (opcional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descrição da raspadinha..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Preço por Raspadinha (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="5.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="total_cards" className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Quantidade do Lote *
                      </Label>
                      <Input
                        id="total_cards"
                        type="number"
                        min="1"
                        value={formData.total_cards}
                        onChange={(e) => setFormData({ ...formData, total_cards: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <ImageUpload
                    label="Imagem de Capa"
                    value={formData.cover_image_url}
                    onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                    bucket="scratch-images"
                    folder="covers"
                    aspectRatio="video"
                  />
                </div>

                {/* Prêmios */}
                <div className="border-t pt-4">
                  <PrizeConfigList
                    prizes={prizes}
                    onChange={setPrizes}
                    type="scratch"
                    showImage={true}
                    totalItems={parseInt(formData.total_cards) || 0}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateScratchCard} disabled={isCreating || prizes.length === 0}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Raspadinha'
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
                  <TableHead>Símbolos</TableHead>
                  <TableHead>Chance de Vitória</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Prêmios Pagos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : scratchCards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma raspadinha criada ainda
                    </TableCell>
                  </TableRow>
                ) : (
                  scratchCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {card.cover_image_url ? (
                            <img 
                              src={card.cover_image_url} 
                              alt={card.title}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Sparkles className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{card.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>R$ {card.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {card.symbols.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalProbability = card.symbols.reduce((sum, s) => sum + s.probability, 0) * 100;
                          const isHighRisk = totalProbability > 30;
                          const isVeryHighRisk = totalProbability > 50;
                          const needsMoreSymbols = card.symbols.length < 5;
                          
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`flex items-center gap-1.5 font-medium ${
                                    isVeryHighRisk ? 'text-red-600' : 
                                    isHighRisk ? 'text-amber-600' : 
                                    'text-green-600'
                                  }`}>
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    {totalProbability.toFixed(1)}%
                                    {(isHighRisk || needsMoreSymbols) && (
                                      <AlertTriangle className="h-3.5 w-3.5" />
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-1 text-xs">
                                    <p className="font-medium">Chance total de vitória: {totalProbability.toFixed(1)}%</p>
                                    {isVeryHighRisk && (
                                      <p className="text-red-500">⚠️ Muito alta! Recomendado: até 15%</p>
                                    )}
                                    {isHighRisk && !isVeryHighRisk && (
                                      <p className="text-amber-500">⚠️ Alta. Recomendado: até 15%</p>
                                    )}
                                    {needsMoreSymbols && (
                                      <p className="text-amber-500">⚠️ Poucos símbolos ({card.symbols.length}). Mínimo: 5</p>
                                    )}
                                    {!isHighRisk && !needsMoreSymbols && (
                                      <p className="text-green-500">✓ Configuração adequada</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{card.total_sold}</TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">
                          R$ {card.total_prizes.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={card.is_active}
                            onCheckedChange={() => handleToggleActive(card)}
                          />
                          <span className={card.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                            {card.is_active ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSymbolsDialog(card)}
                            className="gap-1"
                          >
                            <Settings2 className="h-3 w-3" />
                            Símbolos
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(card)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteScratchCard(card.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={symbolsDialogOpen} onOpenChange={setSymbolsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Configurar - {selectedCard?.title}
              </DialogTitle>
              <DialogDescription>
                Gerencie os símbolos, prêmios e probabilidades
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="probabilities" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="probabilities" className="gap-2">
                  <Percent className="h-4 w-4" />
                  Probabilidades
                </TabsTrigger>
                <TabsTrigger value="symbols" className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Adicionar Símbolos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="probabilities" className="mt-4">
                {selectedCard && (
                  <SymbolProbabilityEditor 
                    symbols={selectedCard.symbols}
                    onUpdate={() => {
                      fetchScratchCards();
                      // Atualizar símbolos do card selecionado
                      supabase
                        .from('scratch_symbols')
                        .select('*')
                        .eq('scratch_card_id', selectedCard.id)
                        .then(({ data }) => {
                          if (data) {
                            setSelectedCard({
                              ...selectedCard,
                              symbols: data as ScratchSymbol[],
                            });
                          }
                        });
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="symbols" className="mt-4 space-y-6">
                {/* Existing Symbols */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Símbolos Configurados</h4>
                  {selectedCard?.symbols.length === 0 ? (
                    <div className="text-center py-6 bg-muted/50 rounded-lg">
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum símbolo configurado
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 max-h-[200px] overflow-y-auto">
                      {selectedCard?.symbols.map((symbol) => (
                        <div 
                          key={symbol.id}
                          className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                        >
                          <img 
                            src={symbol.image_url} 
                            alt={symbol.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{symbol.name}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>R$ {symbol.prize_value.toFixed(2)}</span>
                              <span>{(symbol.probability * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSymbol(symbol.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New Symbol */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Adicionar Novo Símbolo</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        value={symbolForm.name}
                        onChange={(e) => setSymbolForm({ ...symbolForm, name: e.target.value })}
                        placeholder="Ex: Diamante"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <ImageUpload
                        label="Imagem do Símbolo *"
                        value={symbolForm.image_url}
                        onChange={(url) => setSymbolForm({ ...symbolForm, image_url: url })}
                        bucket="scratch-images"
                        folder="symbols"
                        aspectRatio="square"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor do Prêmio (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={symbolForm.prize_value}
                        onChange={(e) => setSymbolForm({ ...symbolForm, prize_value: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Probabilidade (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={symbolForm.probability}
                        onChange={(e) => setSymbolForm({ ...symbolForm, probability: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Quantidade Total (opcional - limita prêmios)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={symbolForm.total_quantity}
                        onChange={(e) => setSymbolForm({ ...symbolForm, total_quantity: e.target.value })}
                        placeholder="Ilimitado se vazio"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddSymbol} 
                    disabled={isAddingSymbol}
                    className="mt-4 w-full gap-2"
                  >
                    {isAddingSymbol ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Adicionar Símbolo
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Raspadinha</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price">Preço (R$) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <ImageUpload
                label="Imagem de Capa"
                value={formData.cover_image_url}
                onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                bucket="scratch-images"
                folder="covers"
                aspectRatio="video"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateCard}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Trophy, 
  Search, 
  Ticket, 
  Sparkles, 
  Calendar,
  Crown,
  Medal,
  Award,
  Loader2,
  Gift,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RaffleWinner {
  id: string;
  raffle_id: string;
  raffle_title: string;
  winner_name: string;
  winner_avatar: string | null;
  winner_ticket: number;
  completed_at: string;
  total_tickets: number;
  price: number;
}

interface ScratchWinner {
  id: string;
  scratch_card_id: string;
  scratch_card_title: string;
  winner_name: string;
  winner_avatar: string | null;
  prize_won: number;
  revealed_at: string;
}

interface WinnerStats {
  totalRaffleWinners: number;
  totalScratchWinners: number;
  totalRafflePrizes: number;
  totalScratchPrizes: number;
}

export default function AdminGanhadores() {
  const [raffleWinners, setRaffleWinners] = useState<RaffleWinner[]>([]);
  const [scratchWinners, setScratchWinners] = useState<ScratchWinner[]>([]);
  const [stats, setStats] = useState<WinnerStats>({
    totalRaffleWinners: 0,
    totalScratchWinners: 0,
    totalRafflePrizes: 0,
    totalScratchPrizes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('sorteios');

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      setIsLoading(true);

      // Fetch raffle winners
      const { data: raffles } = await supabase
        .from('raffles')
        .select('id, title, winner_id, winner_ticket_number, updated_at, total_numbers, price')
        .eq('status', 'completed')
        .not('winner_id', 'is', null)
        .order('updated_at', { ascending: false });

      if (raffles) {
        const raffleWinnersWithDetails = await Promise.all(
          raffles.map(async (raffle) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', raffle.winner_id)
              .single();

            const { count: ticketCount } = await supabase
              .from('raffle_tickets')
              .select('*', { count: 'exact', head: true })
              .eq('raffle_id', raffle.id);

            return {
              id: raffle.id,
              raffle_id: raffle.id,
              raffle_title: raffle.title,
              winner_name: profile?.full_name || 'Usuário',
              winner_avatar: profile?.avatar_url,
              winner_ticket: raffle.winner_ticket_number || 0,
              completed_at: raffle.updated_at,
              total_tickets: ticketCount || 0,
              price: raffle.price,
            };
          })
        );
        setRaffleWinners(raffleWinnersWithDetails);
      }

      // Fetch scratch card winners
      const { data: scratches } = await supabase
        .from('scratch_chances')
        .select('id, scratch_card_id, user_id, prize_won, revealed_at')
        .not('prize_won', 'is', null)
        .gt('prize_won', 0)
        .order('revealed_at', { ascending: false })
        .limit(100);

      if (scratches) {
        const scratchWinnersWithDetails = await Promise.all(
          scratches.map(async (scratch) => {
            const [profileResult, cardResult] = await Promise.all([
              supabase.from('profiles').select('full_name, avatar_url').eq('id', scratch.user_id).single(),
              supabase.from('scratch_cards').select('title').eq('id', scratch.scratch_card_id).single(),
            ]);

            return {
              id: scratch.id,
              scratch_card_id: scratch.scratch_card_id,
              scratch_card_title: cardResult.data?.title || 'Raspadinha',
              winner_name: profileResult.data?.full_name || 'Usuário',
              winner_avatar: profileResult.data?.avatar_url,
              prize_won: scratch.prize_won || 0,
              revealed_at: scratch.revealed_at || '',
            };
          })
        );
        setScratchWinners(scratchWinnersWithDetails);

        // Calculate stats
        const totalScratchPrizes = scratchWinnersWithDetails.reduce((sum, s) => sum + s.prize_won, 0);
        
        setStats({
          totalRaffleWinners: raffles?.length || 0,
          totalScratchWinners: scratchWinnersWithDetails.length,
          totalRafflePrizes: (raffles?.length || 0) * 1000, // Placeholder - would need actual prize data
          totalScratchPrizes: totalScratchPrizes,
        });
      }
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRaffleWinners = raffleWinners.filter(w =>
    w.winner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.raffle_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredScratchWinners = scratchWinners.filter(w =>
    w.winner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.scratch_card_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-gold">
              <Trophy className="h-6 w-6 text-accent-foreground" />
            </div>
            Ganhadores
          </h1>
          <p className="text-muted-foreground mt-1">
            Histórico de todos os vencedores da plataforma
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ganhadores Sorteios</p>
                  <p className="text-2xl font-bold">{stats.totalRaffleWinners}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ganhadores Raspadinhas</p>
                  <p className="text-2xl font-bold">{stats.totalScratchWinners}</p>
                </div>
                <div className="p-3 rounded-full bg-accent/20">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Premiado</p>
                  <p className="text-2xl font-bold text-success">
                    R$ {(stats.totalScratchPrizes).toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Ganhadores</p>
                  <p className="text-2xl font-bold">{stats.totalRaffleWinners + stats.totalScratchWinners}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
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
            <TabsTrigger value="sorteios" className="gap-2">
              <Ticket className="h-4 w-4" />
              Sorteios
            </TabsTrigger>
            <TabsTrigger value="raspadinhas" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Raspadinhas
            </TabsTrigger>
          </TabsList>

          {/* Sorteios Tab */}
          <TabsContent value="sorteios">
            <Card>
              <CardHeader>
                <CardTitle>Ganhadores de Sorteios</CardTitle>
                <CardDescription>Lista de todos os vencedores de sorteios realizados</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Ganhador</TableHead>
                      <TableHead>Sorteio</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredRaffleWinners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Nenhum ganhador encontrado</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRaffleWinners.map((winner, index) => (
                        <TableRow key={winner.id}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {getMedalIcon(index) || (
                                <span className="text-muted-foreground font-medium">{index + 1}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                                <AvatarImage src={winner.winner_avatar || ''} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {winner.winner_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{winner.winner_name}</p>
                                <p className="text-xs text-muted-foreground">Vencedor</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{winner.raffle_title}</p>
                              <p className="text-xs text-muted-foreground">
                                {winner.total_tickets} tickets vendidos
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              #{winner.winner_ticket.toString().padStart(4, '0')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(winner.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-success/10 text-success border-success/20">
                              R$ {(winner.total_tickets * winner.price).toFixed(2)} arrecadado
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Raspadinhas Tab */}
          <TabsContent value="raspadinhas">
            <Card>
              <CardHeader>
                <CardTitle>Ganhadores de Raspadinhas</CardTitle>
                <CardDescription>Lista de todos os prêmios ganhos em raspadinhas</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Ganhador</TableHead>
                      <TableHead>Raspadinha</TableHead>
                      <TableHead>Prêmio</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredScratchWinners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Nenhum ganhador encontrado</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredScratchWinners.map((winner, index) => (
                        <TableRow key={winner.id}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {getMedalIcon(index) || (
                                <span className="text-muted-foreground font-medium">{index + 1}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 ring-2 ring-accent/20">
                                <AvatarImage src={winner.winner_avatar || ''} />
                                <AvatarFallback className="bg-accent text-accent-foreground">
                                  {winner.winner_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{winner.winner_name}</p>
                                <p className="text-xs text-muted-foreground">Premiado</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-accent" />
                              <span className="font-medium">{winner.scratch_card_title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-success text-success-foreground font-bold">
                              R$ {winner.prize_won.toFixed(2)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {winner.revealed_at && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(winner.revealed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </div>
                            )}
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

        {/* Top Winners Summary */}
        {!isLoading && (filteredRaffleWinners.length > 0 || filteredScratchWinners.length > 0) && (
          <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Resumo de Premiações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-xl bg-background/50">
                  <Crown className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-2xl font-bold">{raffleWinners.length}</p>
                  <p className="text-sm text-muted-foreground">Sorteios Realizados</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-background/50">
                  <Gift className="h-8 w-8 mx-auto text-accent mb-2" />
                  <p className="text-2xl font-bold">{scratchWinners.length}</p>
                  <p className="text-sm text-muted-foreground">Prêmios Distribuídos</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-background/50">
                  <DollarSign className="h-8 w-8 mx-auto text-success mb-2" />
                  <p className="text-2xl font-bold text-success">R$ {stats.totalScratchPrizes.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total em Prêmios</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

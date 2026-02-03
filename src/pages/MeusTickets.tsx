import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Ticket, 
  Sparkles, 
  Calendar, 
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RaffleTicket, Raffle, ScratchChance, ScratchCard } from '@/types';

interface TicketWithRaffle extends RaffleTicket {
  raffle: Raffle;
}

interface ChanceWithCard extends ScratchChance {
  scratch_card: ScratchCard;
}

export default function MeusTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithRaffle[]>([]);
  const [chances, setChances] = useState<ChanceWithCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserTickets();
    }
  }, [user]);

  const fetchUserTickets = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Buscar tickets de sorteios com dados do sorteio
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('raffle_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Buscar dados dos sorteios
      if (ticketsData && ticketsData.length > 0) {
        const raffleIds = [...new Set(ticketsData.map(t => t.raffle_id))];
        
        const { data: rafflesData } = await supabase
          .from('raffles')
          .select('*')
          .in('id', raffleIds);

        const rafflesMap = new Map((rafflesData || []).map(r => [r.id, r as Raffle]));

        const ticketsWithRaffle: TicketWithRaffle[] = ticketsData
          .filter(t => rafflesMap.has(t.raffle_id))
          .map(t => ({
            ...t,
            raffle: rafflesMap.get(t.raffle_id)!,
          })) as TicketWithRaffle[];

        setTickets(ticketsWithRaffle);
      }

      // Buscar raspadinhas jogadas
      const { data: chancesData, error: chancesError } = await supabase
        .from('scratch_chances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (chancesError) throw chancesError;

      // Buscar dados das raspadinhas
      if (chancesData && chancesData.length > 0) {
        const cardIds = [...new Set(chancesData.map(c => c.scratch_card_id))];
        
        const { data: cardsData } = await supabase
          .from('scratch_cards')
          .select('*')
          .in('id', cardIds);

        const cardsMap = new Map((cardsData || []).map(c => [c.id, c as ScratchCard]));

        const chancesWithCard: ChanceWithCard[] = chancesData
          .filter(c => cardsMap.has(c.scratch_card_id))
          .map(c => ({
            ...c,
            symbols: c.symbols as any,
            scratch_card: cardsMap.get(c.scratch_card_id)!,
          })) as ChanceWithCard[];

        setChances(chancesWithCard);
      }
    } catch (error) {
      console.error('Error fetching user tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Estatísticas
  const totalTickets = tickets.length;
  const totalChances = chances.length;
  const wonRaffles = tickets.filter(t => t.raffle.winner_id === user?.id).length;
  const wonChances = chances.filter(c => c.is_revealed && c.prize_won && c.prize_won > 0).length;
  const pendingChances = chances.filter(c => !c.is_revealed).length;
  const totalPrizes = chances
    .filter(c => c.prize_won && c.prize_won > 0)
    .reduce((sum, c) => sum + (c.prize_won || 0), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Meus Tickets</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para ver seus tickets e raspadinhas
          </p>
          <Button asChild>
            <Link to="/login">Fazer Login</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <BackButton className="mb-4" />
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Ticket className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Meus Tickets</h1>
            <p className="text-muted-foreground">
              Acompanhe seus tickets de sorteios e raspadinhas
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Ticket className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tickets Sorteio</p>
                  <p className="text-2xl font-bold">{totalTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-500/10">
                  <Sparkles className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Raspadinhas</p>
                  <p className="text-2xl font-bold">{totalChances}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vitórias</p>
                  <p className="text-2xl font-bold">{wonRaffles + wonChances}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <Trophy className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prêmios Ganhos</p>
                  <p className="text-2xl font-bold">R$ {totalPrizes.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="raffles" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="raffles" className="gap-2">
              <Ticket className="h-4 w-4" />
              Sorteios ({totalTickets})
            </TabsTrigger>
            <TabsTrigger value="scratch" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Raspadinhas ({totalChances})
            </TabsTrigger>
          </TabsList>

          {/* Tickets de Sorteios */}
          <TabsContent value="raffles" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : tickets.length > 0 ? (
              <div className="space-y-4">
                {/* Agrupar por sorteio */}
                {Object.entries(
                  tickets.reduce((acc, ticket) => {
                    if (!acc[ticket.raffle_id]) {
                      acc[ticket.raffle_id] = {
                        raffle: ticket.raffle,
                        tickets: [],
                      };
                    }
                    acc[ticket.raffle_id].tickets.push(ticket);
                    return acc;
                  }, {} as Record<string, { raffle: Raffle; tickets: TicketWithRaffle[] }>)
                ).map(([raffleId, { raffle, tickets: raffleTickets }]) => {
                  const isWinner = raffle.winner_id === user?.id;
                  const isCompleted = raffle.status === 'completed';
                  const isOpen = raffle.status === 'open';

                  return (
                    <Card key={raffleId} className="overflow-hidden">
                      <div className={`h-1 ${
                        isWinner ? 'bg-green-500' : 
                        isCompleted ? 'bg-muted' : 
                        'bg-blue-500'
                      }`} />
                      
                      <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{raffle.title}</h3>
                              {isWinner && (
                                <Badge className="bg-green-500 gap-1">
                                  <Trophy className="h-3 w-3" />
                                  Vencedor!
                                </Badge>
                              )}
                              {isOpen && (
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  Aguardando
                                </Badge>
                              )}
                              {isCompleted && !isWinner && (
                                <Badge variant="secondary">Finalizado</Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(raffle.draw_date), "dd/MM/yyyy 'às' HH:mm")}
                              </span>
                            </div>

                            {/* Números */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {raffleTickets
                                .sort((a, b) => a.ticket_number - b.ticket_number)
                                .map((ticket) => (
                                  <Badge
                                    key={ticket.id}
                                    variant={
                                      isWinner && raffle.winner_ticket_number === ticket.ticket_number
                                        ? 'default'
                                        : 'secondary'
                                    }
                                    className={`text-sm ${
                                      isWinner && raffle.winner_ticket_number === ticket.ticket_number
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : ''
                                    }`}
                                  >
                                    {ticket.ticket_number}
                                    {isWinner && raffle.winner_ticket_number === ticket.ticket_number && (
                                      <Trophy className="h-3 w-3 ml-1" />
                                    )}
                                  </Badge>
                                ))}
                            </div>
                          </div>

                          <Button variant="outline" size="sm" asChild className="gap-2">
                            <Link to={`/sorteio/${raffle.id}`}>
                              Ver Sorteio
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center py-12">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nenhum ticket ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não comprou números em nenhum sorteio
                </p>
                <Button asChild>
                  <Link to="/sorteios">Ver Sorteios</Link>
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Raspadinhas */}
          <TabsContent value="scratch" className="space-y-4">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : chances.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {chances.map((chance) => {
                  const isRevealed = chance.is_revealed;
                  const isWinner = isRevealed && chance.prize_won && chance.prize_won > 0;

                  return (
                    <Card 
                      key={chance.id} 
                      className={`overflow-hidden ${
                        isWinner ? 'ring-2 ring-green-500' : ''
                      }`}
                    >
                      <div className={`h-1 ${
                        isWinner ? 'bg-green-500' : 
                        isRevealed ? 'bg-muted' : 
                        'bg-gradient-to-r from-yellow-400 to-orange-500'
                      }`} />
                      
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{chance.scratch_card.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(chance.created_at), "dd/MM/yyyy 'às' HH:mm")}
                            </p>
                          </div>

                          {isWinner ? (
                            <Badge className="bg-green-500 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Ganhou!
                            </Badge>
                          ) : isRevealed ? (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Não ganhou
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 animate-pulse">
                              <Clock className="h-3 w-3" />
                              Pendente
                            </Badge>
                          )}
                        </div>

                        {isWinner && (
                          <div className="bg-green-500/10 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-green-700">Prêmio:</span>
                              <span className="font-bold text-green-700">
                                R$ {(chance.prize_won || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        {!isRevealed && (
                          <Button 
                            asChild 
                            className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                          >
                            <Link to={`/raspadinha/${chance.scratch_card_id}`}>
                              <Sparkles className="h-4 w-4" />
                              Raspar Agora
                            </Link>
                          </Button>
                        )}

                        {isRevealed && (
                          <Button variant="outline" size="sm" asChild className="w-full">
                            <Link to={`/raspadinha/${chance.scratch_card_id}`}>
                              Jogar Novamente
                            </Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma raspadinha ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não jogou nenhuma raspadinha
                </p>
                <Button asChild className="bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Link to="/raspadinhas">Ver Raspadinhas</Link>
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

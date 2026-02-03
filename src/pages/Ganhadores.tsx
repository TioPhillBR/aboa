import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/back-button';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Ticket, Sparkles, Calendar, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Profile, Raffle, ScratchChance, ScratchCard } from '@/types';

interface RaffleWinner {
  raffle: Raffle;
  winner: Profile;
}

interface ScratchWinner {
  chance: ScratchChance;
  winner: Profile;
  scratchCard: ScratchCard;
}

export default function Ganhadores() {
  const [raffleWinners, setRaffleWinners] = useState<RaffleWinner[]>([]);
  const [scratchWinners, setScratchWinners] = useState<ScratchWinner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      setIsLoading(true);

      // Buscar sorteios finalizados com vencedores
      const { data: rafflesData, error: rafflesError } = await supabase
        .from('raffles')
        .select('*')
        .eq('status', 'completed')
        .not('winner_id', 'is', null)
        .order('draw_date', { ascending: false })
        .limit(20);

      if (rafflesError) throw rafflesError;

      // Buscar perfis dos vencedores de sorteios
      if (rafflesData && rafflesData.length > 0) {
        const winnerIds = [...new Set(rafflesData.map(r => r.winner_id).filter(Boolean))];
        
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', winnerIds);

        const profilesMap = new Map((profilesData || []).map(p => [p.id, p as Profile]));

        const raffleWinnersData: RaffleWinner[] = rafflesData
          .filter(r => r.winner_id && profilesMap.has(r.winner_id))
          .map(r => ({
            raffle: r as Raffle,
            winner: profilesMap.get(r.winner_id!)!,
          }));

        setRaffleWinners(raffleWinnersData);
      }

      // Buscar raspadinhas premiadas
      const { data: chancesData, error: chancesError } = await supabase
        .from('scratch_chances')
        .select('*')
        .eq('is_revealed', true)
        .not('prize_won', 'is', null)
        .gt('prize_won', 0)
        .order('revealed_at', { ascending: false })
        .limit(50);

      if (chancesError) throw chancesError;

      if (chancesData && chancesData.length > 0) {
        // Buscar perfis dos vencedores
        const winnerIds = [...new Set(chancesData.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', winnerIds);

        // Buscar dados das raspadinhas
        const cardIds = [...new Set(chancesData.map(c => c.scratch_card_id))];
        const { data: cardsData } = await supabase
          .from('scratch_cards')
          .select('*')
          .in('id', cardIds);

        const profilesMap = new Map((profilesData || []).map(p => [p.id, p as Profile]));
        const cardsMap = new Map((cardsData || []).map(c => [c.id, c as ScratchCard]));

        const scratchWinnersData: ScratchWinner[] = chancesData
          .filter(c => profilesMap.has(c.user_id) && cardsMap.has(c.scratch_card_id))
          .map(c => ({
            chance: {
              ...c,
              symbols: c.symbols as any,
            } as ScratchChance,
            winner: profilesMap.get(c.user_id)!,
            scratchCard: cardsMap.get(c.scratch_card_id)!,
          }));

        setScratchWinners(scratchWinnersData);
      }
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const totalWinners = raffleWinners.length + scratchWinners.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <BackButton className="mb-4" />
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Ganhadores</h1>
            <p className="text-muted-foreground">
              Veja quem já ganhou em nossos sorteios e raspadinhas!
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Ganhadores</p>
                  <p className="text-3xl font-bold">{totalWinners}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Ticket className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sorteios Realizados</p>
                  <p className="text-3xl font-bold">{raffleWinners.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-pink-500/20">
                  <Sparkles className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Raspadinhas Premiadas</p>
                  <p className="text-3xl font-bold">{scratchWinners.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de conteúdo */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all" className="gap-2">
              <Trophy className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="raffles" className="gap-2">
              <Ticket className="h-4 w-4" />
              Sorteios
            </TabsTrigger>
            <TabsTrigger value="scratch" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Raspadinhas
            </TabsTrigger>
          </TabsList>

          {/* Todos os ganhadores */}
          <TabsContent value="all" className="space-y-6">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : totalWinners > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Sorteios */}
                {raffleWinners.map((item) => (
                  <WinnerCard
                    key={`raffle-${item.raffle.id}`}
                    type="raffle"
                    winner={item.winner}
                    title={item.raffle.title}
                    date={item.raffle.draw_date}
                    ticketNumber={item.raffle.winner_ticket_number}
                  />
                ))}
                
                {/* Raspadinhas */}
                {scratchWinners.map((item) => (
                  <WinnerCard
                    key={`scratch-${item.chance.id}`}
                    type="scratch"
                    winner={item.winner}
                    title={item.scratchCard.title}
                    date={item.chance.revealed_at || item.chance.created_at}
                    prize={item.chance.prize_won}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          {/* Sorteios */}
          <TabsContent value="raffles" className="space-y-6">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : raffleWinners.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {raffleWinners.map((item) => (
                  <WinnerCard
                    key={`raffle-${item.raffle.id}`}
                    type="raffle"
                    winner={item.winner}
                    title={item.raffle.title}
                    date={item.raffle.draw_date}
                    ticketNumber={item.raffle.winner_ticket_number}
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="raffle" />
            )}
          </TabsContent>

          {/* Raspadinhas */}
          <TabsContent value="scratch" className="space-y-6">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : scratchWinners.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scratchWinners.map((item) => (
                  <WinnerCard
                    key={`scratch-${item.chance.id}`}
                    type="scratch"
                    winner={item.winner}
                    title={item.scratchCard.title}
                    date={item.chance.revealed_at || item.chance.created_at}
                    prize={item.chance.prize_won}
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="scratch" />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

interface WinnerCardProps {
  type: 'raffle' | 'scratch';
  winner: Profile;
  title: string;
  date: string;
  ticketNumber?: number | null;
  prize?: number | null;
}

function WinnerCard({ type, winner, title, date, ticketNumber, prize }: WinnerCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className={`
        h-2 
        ${type === 'raffle' 
          ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
          : 'bg-gradient-to-r from-yellow-400 to-orange-500'
        }
      `} />
      
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-muted">
              <AvatarImage src={winner.avatar_url || undefined} alt={winner.full_name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials(winner.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className={`
              absolute -bottom-1 -right-1 p-1 rounded-full
              ${type === 'raffle' ? 'bg-blue-500' : 'bg-yellow-500'}
            `}>
              {type === 'raffle' ? (
                <Ticket className="h-3 w-3 text-white" />
              ) : (
                <Sparkles className="h-3 w-3 text-white" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{winner.full_name}</p>
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            
            <div className="flex items-center gap-2 mt-2">
              {type === 'raffle' && ticketNumber && (
                <Badge variant="secondary" className="gap-1">
                  <Ticket className="h-3 w-3" />
                  Nº {ticketNumber}
                </Badge>
              )}
              
              {type === 'scratch' && prize && (
                <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                  <Trophy className="h-3 w-3" />
                  R$ {prize.toFixed(2)}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ type }: { type?: 'raffle' | 'scratch' }) {
  return (
    <div className="text-center py-16 bg-muted/30 rounded-xl">
      <PartyPopper className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">Nenhum ganhador ainda</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        {type === 'raffle' 
          ? 'Ainda não temos sorteios finalizados. Participe e seja o primeiro ganhador!'
          : type === 'scratch'
            ? 'Ninguém ganhou nas raspadinhas ainda. Tente a sorte!'
            : 'Em breve teremos nossos primeiros ganhadores. Participe dos sorteios e raspadinhas!'
        }
      </p>
    </div>
  );
}

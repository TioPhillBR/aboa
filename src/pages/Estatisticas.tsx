import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Ticket, 
  Sparkles, 
  TrendingUp, 
  Calendar,
  Wallet,
  ArrowRight,
  Target,
  Coins,
  Award,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserStats {
  totalRaffleTickets: number;
  totalScratchChances: number;
  rafflesWon: number;
  scratchWins: number;
  totalSpent: number;
  totalWon: number;
  winRate: number;
  favoriteGame: 'raffles' | 'scratch' | 'none';
}

interface RecentActivity {
  id: string;
  type: 'raffle_ticket' | 'scratch_chance' | 'win' | 'deposit';
  title: string;
  amount: number;
  date: Date;
  status: 'won' | 'lost' | 'pending' | 'completed';
  link?: string;
}

export default function Estatisticas() {
  const { user } = useAuth();
  const { balance, transactions } = useWallet();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Buscar tickets de sorteios
      const { data: raffleTickets } = await supabase
        .from('raffle_tickets')
        .select('*, raffles(*)')
        .eq('user_id', user.id);

      // Buscar chances de raspadinhas
      const { data: scratchChances } = await supabase
        .from('scratch_chances')
        .select('*, scratch_cards(*)')
        .eq('user_id', user.id);

      // Buscar transações
      const { data: walletData } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let userTransactions: any[] = [];
      if (walletData) {
        const { data: txData } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false });
        userTransactions = txData || [];
      }

      // Calcular estatísticas
      const totalRaffleTickets = raffleTickets?.length || 0;
      const totalScratchChances = scratchChances?.length || 0;
      
      const rafflesWon = raffleTickets?.filter(t => {
        const raffle = t.raffles as any;
        return raffle?.winner_id === user.id;
      }).length || 0;

      const scratchWins = scratchChances?.filter(c => c.prize_won && c.prize_won > 0).length || 0;

      const totalSpent = userTransactions
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const totalWon = userTransactions
        .filter(t => t.type === 'prize')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalGames = totalRaffleTickets + totalScratchChances;
      const totalWins = rafflesWon + scratchWins;
      const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

      const favoriteGame = totalRaffleTickets > totalScratchChances 
        ? 'raffles' 
        : totalScratchChances > totalRaffleTickets 
          ? 'scratch' 
          : 'none';

      setStats({
        totalRaffleTickets,
        totalScratchChances,
        rafflesWon,
        scratchWins,
        totalSpent,
        totalWon,
        winRate,
        favoriteGame,
      });

      // Criar lista de atividades recentes
      const recentActivities: RecentActivity[] = [];

      raffleTickets?.slice(0, 5).forEach(ticket => {
        const raffle = ticket.raffles as any;
        recentActivities.push({
          id: ticket.id,
          type: 'raffle_ticket',
          title: raffle?.title || 'Sorteio',
          amount: raffle?.price || 0,
          date: new Date(ticket.purchased_at),
          status: raffle?.status === 'completed' 
            ? (raffle?.winner_id === user.id ? 'won' : 'lost')
            : 'pending',
          link: `/sorteio/${ticket.raffle_id}`,
        });
      });

      scratchChances?.slice(0, 5).forEach(chance => {
        const card = chance.scratch_cards as any;
        recentActivities.push({
          id: chance.id,
          type: 'scratch_chance',
          title: card?.title || 'Raspadinha',
          amount: chance.prize_won || 0,
          date: new Date(chance.created_at),
          status: chance.is_revealed 
            ? (chance.prize_won && chance.prize_won > 0 ? 'won' : 'lost')
            : 'pending',
          link: `/raspadinha/${chance.scratch_card_id}`,
        });
      });

      // Ordenar por data
      recentActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
      setActivities(recentActivities.slice(0, 10));

    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Card className="max-w-md mx-auto text-center p-8">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Faça login para ver suas estatísticas</h2>
            <p className="text-muted-foreground mb-6">
              Acompanhe seu histórico de jogos, ganhos e muito mais!
            </p>
            <Button asChild>
              <Link to="/login">Entrar na conta</Link>
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Minhas Estatísticas</h1>
          <p className="text-muted-foreground">
            Acompanhe seu desempenho e histórico de jogos
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-primary opacity-10 rounded-full blur-2xl" />
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 md:p-2.5 rounded-xl bg-primary/10">
                      <Ticket className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">{stats.totalRaffleTickets}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Tickets de Sorteio</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-gold opacity-10 rounded-full blur-2xl" />
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 md:p-2.5 rounded-xl bg-warning/10">
                      <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-warning" />
                    </div>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">{stats.totalScratchChances}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Raspadinhas Jogadas</p>
                </CardContent>
              </Card>
            </div>

            {/* Financial Summary */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Wallet className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary">Atual</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
                  <p className="text-3xl font-bold text-primary">R$ {balance.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-green-500/10">
                      <Award className="h-6 w-6 text-green-500" />
                    </div>
                    <Badge variant="outline" className="text-green-500 border-green-500/30">Ganho</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Total Ganho</p>
                  <p className="text-3xl font-bold text-green-500">R$ {stats.totalWon.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Atividade Recente
                </CardTitle>
                <CardDescription>
                  Suas últimas participações e resultados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            activity.type === 'raffle_ticket' 
                              ? 'bg-primary/10' 
                              : 'bg-warning/10'
                          }`}>
                            {activity.type === 'raffle_ticket' ? (
                              <Ticket className="h-4 w-4 text-primary" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-warning" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm md:text-base">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(activity.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              activity.status === 'won' 
                                ? 'default' 
                                : activity.status === 'pending'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className={
                              activity.status === 'won' 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : ''
                            }
                          >
                            {activity.status === 'won' && `+R$ ${activity.amount.toFixed(2)}`}
                            {activity.status === 'lost' && 'Não ganhou'}
                            {activity.status === 'pending' && 'Pendente'}
                          </Badge>
                          {activity.link && (
                            <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
                              <Link to={activity.link}>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Nenhuma atividade ainda</p>
                    <div className="flex gap-3 justify-center mt-4">
                      <Button asChild variant="outline">
                        <Link to="/sorteios">Ver Sorteios</Link>
                      </Button>
                      <Button asChild>
                        <Link to="/raspadinhas">Jogar Raspadinhas</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}

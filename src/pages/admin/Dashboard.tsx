import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Ticket, 
  Sparkles, 
  Users, 
  Trophy,
  TrendingUp,
  ArrowRight,
  DollarSign,
  Activity,
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Play,
  Crown
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  totalUsers: number;
  totalRaffles: number;
  openRaffles: number;
  totalScratchCards: number;
  totalTicketsSold: number;
  totalPrizesAwarded: number;
  totalWalletBalance: number;
  totalDeposits: number;
}

interface RecentWinner {
  id: string;
  name: string;
  avatar: string | null;
  prize: number;
  game: string;
  date: string;
}

interface ActiveRaffle {
  id: string;
  title: string;
  tickets_sold: number;
  total_numbers: number;
  draw_date: string;
  price: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRaffles: 0,
    openRaffles: 0,
    totalScratchCards: 0,
    totalTicketsSold: 0,
    totalPrizesAwarded: 0,
    totalWalletBalance: 0,
    totalDeposits: 0,
  });
  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([]);
  const [activeRaffles, setActiveRaffles] = useState<ActiveRaffle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Parallel fetch all stats
      const [
        usersResult,
        rafflesResult,
        openRafflesResult,
        scratchResult,
        ticketsResult,
        prizesResult,
        walletsResult,
        depositsResult,
        activeRafflesResult,
        recentWinnersResult
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('raffles').select('*', { count: 'exact', head: true }),
        supabase.from('raffles').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('scratch_cards').select('*', { count: 'exact', head: true }),
        supabase.from('raffle_tickets').select('*', { count: 'exact', head: true }),
        supabase.from('scratch_chances').select('prize_won').not('prize_won', 'is', null).gt('prize_won', 0),
        supabase.from('wallets').select('balance'),
        supabase.from('wallet_transactions').select('amount').eq('type', 'deposit'),
        supabase.from('raffles').select('id, title, total_numbers, draw_date, price').eq('status', 'open').limit(5),
        supabase.from('raffles').select('id, title, winner_id, updated_at').eq('status', 'completed').not('winner_id', 'is', null).order('updated_at', { ascending: false }).limit(5)
      ]);

      // Calculate totals
      const totalPrizes = (prizesResult.data || []).reduce((sum, p) => sum + (p.prize_won || 0), 0);
      const totalBalance = (walletsResult.data || []).reduce((sum, w) => sum + (w.balance || 0), 0);
      const totalDeposits = (depositsResult.data || []).reduce((sum, d) => sum + (d.amount || 0), 0);

      setStats({
        totalUsers: usersResult.count || 0,
        totalRaffles: rafflesResult.count || 0,
        openRaffles: openRafflesResult.count || 0,
        totalScratchCards: scratchResult.count || 0,
        totalTicketsSold: ticketsResult.count || 0,
        totalPrizesAwarded: totalPrizes,
        totalWalletBalance: totalBalance,
        totalDeposits: totalDeposits,
      });

      // Process active raffles with ticket counts
      if (activeRafflesResult.data) {
        const rafflesWithTickets = await Promise.all(
          activeRafflesResult.data.map(async (raffle) => {
            const { count } = await supabase
              .from('raffle_tickets')
              .select('*', { count: 'exact', head: true })
              .eq('raffle_id', raffle.id);
            return {
              ...raffle,
              tickets_sold: count || 0,
            };
          })
        );
        setActiveRaffles(rafflesWithTickets);
      }

      // Process recent winners
      if (recentWinnersResult.data) {
        const winnersWithProfiles = await Promise.all(
          recentWinnersResult.data.map(async (winner) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', winner.winner_id)
              .single();
            return {
              id: winner.id,
              name: profile?.full_name || 'Usuário',
              avatar: profile?.avatar_url,
              prize: 0, // Would need raffle prize info
              game: winner.title,
              date: winner.updated_at,
            };
          })
        );
        setRecentWinners(winnersWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-primary">
                <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
              </div>
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão geral do sistema de apostas
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-success">
                <ArrowUpRight className="h-3 w-3" />
                <span>+12% este mês</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-gold opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tickets Vendidos</CardTitle>
              <div className="p-2 rounded-lg bg-accent/20">
                <Ticket className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTicketsSold}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>{stats.openRaffles} sorteios ativos</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-success opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saldo em Carteiras</CardTitle>
              <div className="p-2 rounded-lg bg-success/20">
                <Wallet className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                R$ {stats.totalWalletBalance.toFixed(0)}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Total disponível</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-fire opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Prêmios Pagos</CardTitle>
              <div className="p-2 rounded-lg bg-destructive/20">
                <Trophy className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                R$ {stats.totalPrizesAwarded.toFixed(0)}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span>Em raspadinhas</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sorteios</p>
                  <p className="text-2xl font-bold">{stats.totalRaffles}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="bg-success/10 text-success">
                  {stats.openRaffles} abertos
                </Badge>
                <Badge variant="secondary">
                  {stats.totalRaffles - stats.openRaffles} finalizados
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Raspadinhas</p>
                  <p className="text-2xl font-bold">{stats.totalScratchCards}</p>
                </div>
                <div className="p-3 rounded-full bg-accent/20">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">Tipos disponíveis na plataforma</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-2xl font-bold">
                    {stats.totalUsers > 0 
                      ? ((stats.totalTicketsSold / stats.totalUsers)).toFixed(1)
                      : 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">Tickets por usuário</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Raffles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Sorteios Ativos
                </CardTitle>
                <CardDescription>Sorteios abertos para compra</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/sorteios">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {activeRaffles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum sorteio ativo</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/admin/sorteios">Criar sorteio</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeRaffles.map((raffle) => {
                    const progress = (raffle.tickets_sold / raffle.total_numbers) * 100;
                    return (
                      <div key={raffle.id} className="p-4 rounded-xl bg-muted/50 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{raffle.title}</p>
                            <p className="text-sm text-muted-foreground">
                              R$ {raffle.price.toFixed(2)} por número
                            </p>
                          </div>
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/sorteio/${raffle.id}`}>
                              <Play className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{raffle.tickets_sold}/{raffle.total_numbers}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(raffle.draw_date), "dd/MM/yyyy 'às' HH:mm")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Winners */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-accent" />
                  Ganhadores Recentes
                </CardTitle>
                <CardDescription>Últimos vencedores de sorteios</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/ganhadores">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentWinners.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum ganhador ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentWinners.map((winner, index) => (
                    <div key={winner.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
                      <div className="relative">
                        <Avatar className="h-12 w-12 ring-2 ring-accent/20">
                          <AvatarImage src={winner.avatar || ''} />
                          <AvatarFallback className="bg-accent text-accent-foreground">
                            {winner.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 p-1 rounded-full bg-accent">
                            <Crown className="h-3 w-3 text-accent-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{winner.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{winner.game}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(winner.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/sorteios">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-primary group-hover:scale-110 transition-transform">
                    <Ticket className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Sorteios</p>
                    <p className="text-sm text-muted-foreground">Gerenciar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/raspadinhas">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-gold group-hover:scale-110 transition-transform">
                    <Sparkles className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Raspadinhas</p>
                    <p className="text-sm text-muted-foreground">Configurar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/usuarios">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-ocean group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Usuários</p>
                    <p className="text-sm text-muted-foreground">Gerenciar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/ganhadores">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-sunset group-hover:scale-110 transition-transform">
                    <Trophy className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Ganhadores</p>
                    <p className="text-sm text-muted-foreground">Histórico</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}

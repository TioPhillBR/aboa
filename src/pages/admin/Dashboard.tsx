import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Ticket, 
  Sparkles, 
  Users, 
  Trophy,
  TrendingUp,
  ArrowRight,
  DollarSign
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalRaffles: number;
  openRaffles: number;
  totalScratchCards: number;
  totalTicketsSold: number;
  totalPrizesAwarded: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRaffles: 0,
    openRaffles: 0,
    totalScratchCards: 0,
    totalTicketsSold: 0,
    totalPrizesAwarded: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total de usuários
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total de sorteios
      const { count: rafflesCount } = await supabase
        .from('raffles')
        .select('*', { count: 'exact', head: true });

      // Sorteios abertos
      const { count: openRafflesCount } = await supabase
        .from('raffles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      // Total de raspadinhas
      const { count: scratchCount } = await supabase
        .from('scratch_cards')
        .select('*', { count: 'exact', head: true });

      // Total de tickets vendidos
      const { count: ticketsCount } = await supabase
        .from('raffle_tickets')
        .select('*', { count: 'exact', head: true });

      // Total de prêmios (raspadinhas)
      const { data: prizesData } = await supabase
        .from('scratch_chances')
        .select('prize_won')
        .not('prize_won', 'is', null)
        .gt('prize_won', 0);

      const totalPrizes = (prizesData || []).reduce((sum, p) => sum + (p.prize_won || 0), 0);

      setStats({
        totalUsers: usersCount || 0,
        totalRaffles: rafflesCount || 0,
        openRaffles: openRafflesCount || 0,
        totalScratchCards: scratchCount || 0,
        totalTicketsSold: ticketsCount || 0,
        totalPrizesAwarded: totalPrizes,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema de apostas
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">usuários cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sorteios</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRaffles}</div>
              <p className="text-xs text-muted-foreground">
                {stats.openRaffles} abertos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Raspadinhas</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScratchCards}</div>
              <p className="text-xs text-muted-foreground">tipos disponíveis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tickets Vendidos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTicketsSold}</div>
              <p className="text-xs text-muted-foreground">em todos os sorteios</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Prêmios Pagos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.totalPrizesAwarded.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">em raspadinhas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalUsers > 0 
                  ? ((stats.totalTicketsSold / stats.totalUsers) * 100).toFixed(1)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">tickets por usuário</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Gerenciar Sorteios
              </CardTitle>
              <CardDescription>
                Crie, edite e realize sorteios ao vivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="gap-2">
                <Link to="/admin/sorteios">
                  Ir para Sorteios
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Gerenciar Raspadinhas
              </CardTitle>
              <CardDescription>
                Configure símbolos e prêmios das raspadinhas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/admin/raspadinhas">
                  Ir para Raspadinhas
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

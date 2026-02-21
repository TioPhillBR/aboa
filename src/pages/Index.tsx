import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Ticket, 
  Gift, 
  Users, 
  ArrowRight, 
  Sparkles,
  Zap,
  Star,
  TrendingUp,
  Clock,
  Coins,
  Shield,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import logoABoa from '@/assets/logo-a-boa.png';

interface Stats {
  totalPrizes: number;
  totalUsers: number;
  activeRaffles: number;
  scratchCardsPlayed: number;
}

interface FeaturedRaffle {
  id: string;
  title: string;
  price: number;
  total_numbers: number;
  image_url: string | null;
  draw_date: string;
  sold_count: number;
}

export default function Index() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalPrizes: 0,
    totalUsers: 0,
    activeRaffles: 0,
    scratchCardsPlayed: 0,
  });
  const [featuredRaffles, setFeaturedRaffles] = useState<FeaturedRaffle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchFeaturedRaffles();
  }, []);

  const fetchStats = async () => {
    try {
      // Buscar estatísticas reais
      const [profilesRes, rafflesRes, scratchRes, prizesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('raffles').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('scratch_chances').select('id', { count: 'exact', head: true }).eq('is_revealed', true),
        supabase.from('wallet_transactions').select('amount').eq('type', 'prize'),
      ]);

      const totalPrizes = prizesRes.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      setStats({
        totalUsers: profilesRes.count || 0,
        activeRaffles: rafflesRes.count || 0,
        scratchCardsPlayed: scratchRes.count || 0,
        totalPrizes,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFeaturedRaffles = async () => {
    try {
      const { data: raffles } = await supabase
        .from('raffles')
        .select('*')
        .eq('status', 'open')
        .order('draw_date', { ascending: true })
        .limit(3);

      if (raffles) {
        // Buscar contagem de tickets vendidos para cada sorteio
        const rafflesWithCounts = await Promise.all(
          raffles.map(async (raffle) => {
            const { count } = await supabase
              .from('raffle_tickets')
              .select('id', { count: 'exact', head: true })
              .eq('raffle_id', raffle.id);
            
            return {
              ...raffle,
              sold_count: count || 0,
            };
          })
        );
        
        setFeaturedRaffles(rafflesWithCounts);
      }
    } catch (error) {
      console.error('Error fetching featured raffles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section - Impactante */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-emerald-500/20 to-amber-500/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        
        {/* Floating Elements */}
        <motion.div 
          className="absolute top-20 left-10 w-20 h-20 bg-amber-400/20 rounded-full blur-xl hidden lg:block"
          animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-xl hidden lg:block"
          animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-16 h-16 bg-green-400/20 rounded-full blur-xl hidden lg:block"
          animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="container relative py-16 md:py-24 lg:py-32">
          <div className="flex flex-col items-center text-center space-y-6 md:space-y-8">
            {/* Badge animada */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center rounded-full border border-primary/30 px-4 py-2 text-sm font-medium bg-primary/10 text-primary backdrop-blur-sm"
            >
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              {stats.totalUsers > 0 ? `🍀 Junte-se a ${stats.totalUsers} usuários!` : '🍀 Comece a jogar agora!'}
            </motion.div>

            {/* Título Principal */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl px-2"
            >
              <span className="bg-gradient-to-r from-primary via-emerald-600 to-accent bg-clip-text text-transparent">
                Vai na Certa
              </span>
              <br />
              <span className="text-foreground">
                Vai na Boa! 🍀
              </span>
            </motion.h1>

            {/* Subtítulo */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl px-4"
            >
              Participe de sorteios emocionantes e raspadinhas instantâneas. 
              <span className="text-primary font-semibold"> Prêmios reais, diversão garantida!</span>
            </motion.p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0"
            >
              <Button 
                size="lg" 
                asChild 
                className="w-full sm:w-auto text-lg h-14 px-8 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 shadow-lg shadow-primary/25"
              >
                <Link to="/sorteios">
                  <Ticket className="mr-2 h-5 w-5" />
                  Ver Sorteios
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="w-full sm:w-auto text-lg h-14 px-8 border-2 hover:bg-primary/5"
              >
                <Link to="/raspadinhas">
                  <Sparkles className="mr-2 h-5 w-5 text-yellow-500" />
                  Jogar Raspadinhas
                </Link>
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 md:gap-8 pt-8"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm">100% Seguro</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-sm">Prêmios Instantâneos</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Coins className="h-5 w-5 text-primary" />
                <span className="text-sm">PIX Rápido</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Estatísticas em Tempo Real */}
      <section className="py-12 bg-muted/30 border-y">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {formatCurrency(stats.totalPrizes)}
              </div>
              <div className="text-sm text-muted-foreground">Prêmios Distribuídos</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-purple-500 mb-1">
                {stats.totalUsers}
              </div>
              <div className="text-sm text-muted-foreground">Usuários Ativos</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-pink-500 mb-1">
                {stats.activeRaffles}
              </div>
              <div className="text-sm text-muted-foreground">Sorteios Ativos</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-yellow-500 mb-1">
                {stats.scratchCardsPlayed}
              </div>
              <div className="text-sm text-muted-foreground">Raspadinhas Jogadas</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sorteios em Destaque */}
      {featuredRaffles.length > 0 && (
        <section className="container py-16 md:py-24">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
                <Zap className="h-7 w-7 text-yellow-500" />
                Sorteios em Destaque
              </h2>
              <p className="text-muted-foreground">
                Não perca a chance de ganhar!
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/sorteios">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRaffles.map((raffle, index) => (
              <motion.div
                key={raffle.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-purple-500/20">
                    {raffle.image_url ? (
                      <img 
                        src={raffle.image_url} 
                        alt={raffle.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy className="h-16 w-16 text-primary/30" />
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 bg-green-500">
                      <Play className="h-3 w-3 mr-1" />
                      Ao Vivo
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                      {raffle.title}
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Ticket className="h-4 w-4" />
                        <span className="text-sm text-green-500 font-medium">Disponível</span>
                      </div>
                      <div className="text-xl font-bold text-primary">
                        R$ {raffle.price.toFixed(2)}
                      </div>
                    </div>
                    <Button asChild className="w-full">
                      <Link to={`/sorteio/${raffle.id}`}>
                        Participar Agora
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Button asChild>
              <Link to="/sorteios">
                Ver Todos os Sorteios
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Seção de Jogos */}
      <section id="escolha-como-jogar" className="bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Escolha Como Jogar</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Duas formas incríveis de testar sua sorte e ganhar prêmios
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Sorteios */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  >
                    <Ticket className="h-20 w-20 text-primary" />
                  </motion.div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Sorteios
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Escolha seus números da sorte e aguarde o sorteio. 
                    Acompanhe a roleta girar ao vivo!
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Prêmios maiores
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Sorteios programados
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-green-500" />
                      Concorra com outros
                    </li>
                  </ul>
                  <Button asChild className="w-full">
                    <Link to="/sorteios">
                      Ver Sorteios
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Raspadinhas */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card className="h-full border-2 hover:border-yellow-500/50 transition-all overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-transparent flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-20 w-20 text-yellow-500" />
                  </motion.div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Raspadinhas
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Raspe e descubra se ganhou na hora! 
                    Resultado instantâneo e muita emoção.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Resultado instantâneo
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Gift className="h-4 w-4 text-pink-500" />
                      Vários prêmios
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Play className="h-4 w-4 text-green-500" />
                      Jogue quando quiser
                    </li>
                  </ul>
                  <Button asChild variant="secondary" className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0">
                    <Link to="/raspadinhas">
                      Jogar Agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="container py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Como Funciona</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Começar é fácil! Em poucos passos você já estará jogando
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, title: '1. Cadastre-se', desc: 'Crie sua conta grátis em segundos', color: 'bg-blue-500' },
            { icon: Coins, title: '2. Adicione Créditos', desc: 'Deposite via PIX de forma rápida', color: 'bg-green-500' },
            { icon: Ticket, title: '3. Escolha seu Jogo', desc: 'Sorteios ou raspadinhas, você decide', color: 'bg-purple-500' },
            { icon: Trophy, title: '4. Ganhe Prêmios!', desc: 'Receba na hora em sua carteira', color: 'bg-yellow-500' },
          ].map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center h-full hover:shadow-lg transition-shadow border-2 hover:border-primary/30">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription>{step.desc}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA de Indicação */}
      <section className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 py-16">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-white">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <Gift className="h-8 w-8" />
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                  Programa de Indicação
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                Convide amigos e ganhe R$ 5,00
              </h3>
              <p className="text-white/80 max-w-lg">
                Para cada amigo que se cadastrar com seu código, vocês dois ganham créditos bônus!
              </p>
            </div>
            <Button 
              size="lg" 
              variant="secondary" 
              asChild 
              className="shrink-0 h-14 px-8 text-lg"
            >
              <Link to="/indicacoes">
                <Users className="mr-2 h-5 w-5" />
                Ver Meu Código
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container py-16 md:py-24">
        <Card className="bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/5 border-2 border-primary/20 overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', bounce: 0.4 }}
            >
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
            </motion.div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Pronto para tentar a sorte?
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Cadastre-se agora e receba bônus de boas-vindas! 
              A sorte pode estar esperando por você.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="h-14 px-8 text-lg">
                {user ? (
                  <a href="#escolha-como-jogar">
                    Escolha Como Jogar
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                ) : (
                  <Link to="/cadastro">
                    Criar Conta Grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                )}
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-8">
                <Link to="/ganhadores">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                  Ver Ganhadores
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center">
              <img 
                src={logoABoa} 
                alt="A Boa - Vai na Certa, Vai na Boa" 
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              © 2025 A Boa. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

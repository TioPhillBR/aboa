import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/back-button';
import { RaffleCard } from '@/components/games/RaffleCard';
import { useRaffles } from '@/hooks/useRaffles';
import { Skeleton } from '@/components/ui/skeleton';
import { Ticket, Trophy, Sparkles, Gift, Zap } from 'lucide-react';

export default function Sorteios() {
  const { raffles, isLoading } = useRaffles();

  const openRaffles = raffles.filter(r => r.status === 'open');
  const completedRaffles = raffles.filter(r => r.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 md:py-8">
        <BackButton className="mb-4" />
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-primary p-6 md:p-8 lg:p-12 mb-8 md:mb-10">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          {/* Floating icons - hidden on small mobile */}
          <div className="absolute top-8 right-8 animate-float opacity-20 hidden sm:block">
            <Ticket className="h-16 md:h-24 w-16 md:w-24 text-white" />
          </div>
          <div className="absolute bottom-8 right-24 animate-float opacity-10 hidden md:block" style={{ animationDelay: '1s' }}>
            <Gift className="h-16 w-16 text-white" />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm">
                <Ticket className="h-5 w-5 md:h-8 md:w-8 text-white" />
              </div>
              <span className="px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-white/20 text-white text-xs md:text-sm font-medium backdrop-blur-sm flex items-center gap-1.5 md:gap-2">
                <Zap className="h-3 w-3 md:h-4 md:w-4" />
                Sorteios ao vivo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">
              Escolha seus números
              <br className="hidden sm:block" />
              <span className="text-white/80"> e concorra a prêmios incríveis</span>
            </h1>
            <p className="text-white/70 text-sm md:text-base lg:text-lg max-w-xl">
              Participe dos nossos sorteios com transmissão ao vivo. Escolha seus números da sorte e realize seus sonhos!
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
          {[
            { label: 'Sorteios Ativos', value: openRaffles.length, icon: Ticket, color: 'bg-gradient-primary' },
            { label: 'Finalizados', value: completedRaffles.length, icon: Trophy, color: 'bg-gradient-gold' },
            { label: 'Prêmios Entregues', value: `R$ ${(completedRaffles.length * 5000).toLocaleString()}`, icon: Gift, color: 'bg-gradient-success' },
            { label: 'Participantes', value: '500+', icon: Sparkles, color: 'bg-gradient-ocean' },
          ].map((stat, i) => (
            <div 
              key={stat.label}
              className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-card p-4 md:p-5 border shadow-sm hover:shadow-lg transition-all duration-300 card-hover animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute top-0 right-0 w-16 md:w-20 h-16 md:h-20 ${stat.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
              <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-primary mb-1.5 md:mb-2" />
              <p className="text-lg md:text-2xl font-bold truncate">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground truncate">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Sorteios Abertos */}
        <section className="mb-10 md:mb-12">
          <div className="flex items-center gap-2 md:gap-3 mb-5 md:mb-6">
            <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-success/10 text-success">
              <span className="relative flex h-2.5 w-2.5 md:h-3 md:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-success" />
              </span>
              <span className="font-semibold text-sm md:text-base">Sorteios Abertos</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-success/20 to-transparent" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 md:space-y-4 animate-pulse">
                  <Skeleton className="h-40 md:h-52 w-full rounded-xl md:rounded-2xl" />
                  <Skeleton className="h-4 md:h-5 w-3/4" />
                  <Skeleton className="h-3 md:h-4 w-1/2" />
                  <Skeleton className="h-10 md:h-12 w-full rounded-lg md:rounded-xl" />
                </div>
              ))}
            </div>
          ) : openRaffles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {openRaffles.map((raffle, index) => (
                <div 
                  key={raffle.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <RaffleCard raffle={raffle} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-dashed">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Ticket className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Nenhum sorteio aberto no momento
              </p>
              <p className="text-sm text-muted-foreground">
                Novos sorteios serão anunciados em breve! ✨
              </p>
            </div>
          )}
        </section>

        {/* Sorteios Finalizados */}
        {completedRaffles.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning">
                <Trophy className="h-5 w-5" />
                <span className="font-semibold">Sorteios Finalizados</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-warning/20 to-transparent" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedRaffles.map((raffle, index) => (
                <div 
                  key={raffle.id}
                  className="animate-fade-in opacity-80 hover:opacity-100 transition-opacity"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <RaffleCard raffle={raffle} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

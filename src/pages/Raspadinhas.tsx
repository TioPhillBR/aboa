import { Header } from '@/components/layout/Header';
import { ScratchCardItem } from '@/components/games/ScratchCardItem';
import { useScratchCards } from '@/hooks/useScratchCards';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Coins, Zap, Gift, Star, Trophy } from 'lucide-react';

export default function Raspadinhas() {
  const { scratchCards, isLoading } = useScratchCards();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-sunset p-8 md:p-12 mb-10">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-yellow-300/20 rounded-full blur-3xl translate-y-1/2" />
          
          {/* Floating icons */}
          <div className="absolute top-6 right-6 md:right-12 animate-float">
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="absolute top-1/2 right-1/4 animate-float opacity-50" style={{ animationDelay: '0.5s' }}>
            <Coins className="h-8 w-8 text-white" />
          </div>
          <div className="absolute bottom-12 right-12 animate-float opacity-30" style={{ animationDelay: '1.5s' }}>
            <Star className="h-10 w-10 text-white" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Prêmios Instantâneos
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Raspe e Ganhe
              <br />
              <span className="text-white/80">prêmios incríveis agora!</span>
            </h1>
            <p className="text-white/70 text-lg max-w-xl">
              Encontre 3 símbolos iguais e ganhe instantaneamente. Cada raspadinha é uma nova chance de vitória!
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {[
            { 
              step: '1', 
              title: 'Compre sua chance', 
              desc: 'Escolha uma raspadinha e adquira sua chance',
              icon: Coins,
              color: 'from-purple-500 to-pink-500'
            },
            { 
              step: '2', 
              title: 'Raspe a cartela', 
              desc: 'Use o dedo ou mouse para revelar os símbolos',
              icon: Sparkles,
              color: 'from-orange-500 to-yellow-500'
            },
            { 
              step: '3', 
              title: 'Ganhe prêmios', 
              desc: '3 símbolos iguais = prêmio instantâneo!',
              icon: Trophy,
              color: 'from-green-500 to-emerald-500'
            },
          ].map((item, i) => (
            <div 
              key={item.step}
              className="group relative overflow-hidden rounded-2xl bg-card p-6 border shadow-sm hover:shadow-lg transition-all duration-300 card-hover animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
              <div className="flex items-start gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} text-white font-bold text-lg shrink-0`}>
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Prize info banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20 p-6 mb-10 animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent animate-pulse" />
          <div className="relative flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold text-white shrink-0">
              <Gift className="h-8 w-8" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold mb-1 flex items-center justify-center md:justify-start gap-2">
                <span className="text-gradient-gold">Prêmios de até R$ 1.000!</span>
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </h2>
              <p className="text-muted-foreground">
                Cada raspadinha oferece diferentes valores de prêmio. Quanto mais raro o símbolo, maior o prêmio!
              </p>
            </div>
          </div>
        </div>

        {/* Lista de raspadinhas */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Raspadinhas Disponíveis</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4 animate-pulse">
                  <Skeleton className="h-52 w-full rounded-2xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : scratchCards.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {scratchCards.map((card, index) => (
                <div 
                  key={card.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ScratchCardItem scratchCard={card} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-dashed">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Nenhuma raspadinha disponível no momento
              </p>
              <p className="text-sm text-muted-foreground">
                Novas raspadinhas serão adicionadas em breve! 🎰
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

import { Header } from '@/components/layout/Header';
import { ScratchCardItem } from '@/components/games/ScratchCardItem';
import { useScratchCards } from '@/hooks/useScratchCards';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

export default function Raspadinhas() {
  const { scratchCards, isLoading } = useScratchCards();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Header da página */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Raspadinhas</h1>
            <p className="text-muted-foreground">
              Raspe e descubra se você ganhou prêmios instantâneos!
            </p>
          </div>
        </div>

        {/* Como funciona */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-2xl">🎰</span>
            Como funciona?
          </h2>
          <p className="text-muted-foreground">
            Compre uma chance, raspe a cartela com o dedo ou mouse e encontre <strong>3 símbolos iguais</strong> para ganhar o prêmio correspondente!
          </p>
        </div>

        {/* Lista de raspadinhas */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : scratchCards.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {scratchCards.map((card) => (
              <ScratchCardItem key={card.id} scratchCard={card} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-xl">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma raspadinha disponível no momento
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Novas raspadinhas serão adicionadas em breve!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

import { Header } from '@/components/layout/Header';
import { RaffleCard } from '@/components/games/RaffleCard';
import { useRaffles } from '@/hooks/useRaffles';
import { Skeleton } from '@/components/ui/skeleton';
import { Ticket, Trophy } from 'lucide-react';

export default function Sorteios() {
  const { raffles, isLoading } = useRaffles();

  const openRaffles = raffles.filter(r => r.status === 'open');
  const completedRaffles = raffles.filter(r => r.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Header da página */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Ticket className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Sorteios</h1>
            <p className="text-muted-foreground">
              Escolha seus números da sorte e participe dos sorteios
            </p>
          </div>
        </div>

        {/* Sorteios Abertos */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Sorteios Abertos
          </h2>

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
          ) : openRaffles.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {openRaffles.map((raffle) => (
                <RaffleCard key={raffle.id} raffle={raffle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum sorteio aberto no momento
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Novos sorteios serão anunciados em breve!
              </p>
            </div>
          )}
        </section>

        {/* Sorteios Finalizados */}
        {completedRaffles.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Sorteios Finalizados
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedRaffles.map((raffle) => (
                <RaffleCard key={raffle.id} raffle={raffle} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

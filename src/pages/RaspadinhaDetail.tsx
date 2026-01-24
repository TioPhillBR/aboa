import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { ScratchCard } from '@/components/games/ScratchCard';
import { useScratchCard } from '@/hooks/useScratchCards';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Wallet, 
  Sparkles,
  Plus,
  Trophy,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScratchChance } from '@/types';

export default function RaspadinhaDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { scratchCard, symbols, myChances, isLoading, buyChance, revealChance } = useScratchCard(id || '');
  const { balance, purchase, awardPrize } = useWallet();
  const { toast } = useToast();
  
  const [isBuying, setIsBuying] = useState(false);
  const [activeChance, setActiveChance] = useState<ScratchChance | null>(null);

  const handleBuyChance = async () => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para comprar raspadinhas',
        variant: 'destructive',
      });
      return;
    }

    if (!scratchCard) return;

    if (balance < scratchCard.price) {
      toast({
        title: 'Saldo insuficiente',
        description: 'Adicione mais créditos à sua carteira',
        variant: 'destructive',
      });
      return;
    }

    setIsBuying(true);

    // Debitar da carteira
    const { error: walletError } = await purchase(
      scratchCard.price,
      `Raspadinha - ${scratchCard.title}`,
      scratchCard.id
    );

    if (walletError) {
      toast({
        title: 'Erro',
        description: walletError.message,
        variant: 'destructive',
      });
      setIsBuying(false);
      return;
    }

    // Comprar chance
    const { error, chance } = await buyChance();

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível comprar a raspadinha. Tente novamente.',
        variant: 'destructive',
      });
    } else if (chance) {
      toast({
        title: 'Raspadinha comprada!',
        description: 'Boa sorte! Raspe para descobrir seu prêmio.',
      });
      setActiveChance(chance);
    }

    setIsBuying(false);
  };

  const handleReveal = async (isWinner: boolean, prize: number) => {
    if (!activeChance) return;

    // Marcar como revelada
    await revealChance(activeChance.id, isWinner, prize);

    // Se ganhou, creditar prêmio
    if (isWinner && prize > 0) {
      await awardPrize(prize, `Prêmio raspadinha - ${scratchCard?.title}`, scratchCard?.id);
      toast({
        title: '🎉 Parabéns!',
        description: `Você ganhou R$ ${prize.toFixed(2)}! O valor foi creditado na sua carteira.`,
      });
    }
  };

  const handlePlayAgain = () => {
    setActiveChance(null);
  };

  const unrevealed = myChances.filter(c => !c.is_revealed);
  const revealed = myChances.filter(c => c.is_revealed);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!scratchCard) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <p className="text-muted-foreground">Raspadinha não encontrada</p>
          <Button asChild className="mt-4">
            <Link to="/raspadinhas">Voltar às Raspadinhas</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Voltar */}
        <Link 
          to="/raspadinhas" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar às raspadinhas
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{scratchCard.title}</h1>
              {scratchCard.description && (
                <p className="text-muted-foreground">{scratchCard.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Preço por chance</p>
              <p className="text-2xl font-bold text-primary">R$ {scratchCard.price.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Área de jogo */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  {activeChance ? 'Raspe para Revelar!' : 'Comprar Raspadinha'}
                </CardTitle>
                <CardDescription>
                  {activeChance 
                    ? 'Use o dedo ou mouse para raspar e descobrir se você ganhou!'
                    : 'Compre uma chance e tente a sorte!'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {activeChance ? (
                  <div className="space-y-6">
                    <ScratchCard
                      symbols={activeChance.symbols}
                      coverImage={scratchCard.cover_image_url || undefined}
                      onReveal={handleReveal}
                      isRevealed={activeChance.is_revealed}
                      prizeWon={activeChance.prize_won}
                    />

                    {activeChance.is_revealed && (
                      <Button 
                        onClick={handlePlayAgain}
                        className="w-full gap-2"
                        size="lg"
                      >
                        <Plus className="h-5 w-5" />
                        Jogar Novamente
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-6 py-8">
                    <div className="w-[300px] h-[300px] rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-80" />
                        <p className="text-2xl font-bold">RASPADINHA</p>
                        <p className="text-sm opacity-80 mt-2">Clique para comprar</p>
                      </div>
                    </div>

                    {user ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                          <Wallet className="h-4 w-4" />
                          <span>Seu saldo: R$ {balance.toFixed(2)}</span>
                        </div>

                        <Button 
                          onClick={handleBuyChance}
                          disabled={isBuying || balance < scratchCard.price}
                          size="lg"
                          className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        >
                          {isBuying ? (
                            'Comprando...'
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5" />
                              Comprar por R$ {scratchCard.price.toFixed(2)}
                            </>
                          )}
                        </Button>

                        {balance < scratchCard.price && (
                          <Button variant="outline" className="w-full" asChild>
                            <Link to="/carteira">Adicionar Créditos</Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button size="lg" className="w-full" asChild>
                        <Link to="/login">Fazer Login para Jogar</Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tabela de prêmios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Tabela de Prêmios
                </CardTitle>
                <CardDescription>
                  Encontre 3 símbolos iguais para ganhar!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {symbols.length > 0 ? (
                  <div className="space-y-3">
                    {symbols.map((symbol) => (
                      <div 
                        key={symbol.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {symbol.image_url ? (
                            <img 
                              src={symbol.image_url} 
                              alt={symbol.name}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <span className="text-3xl">{symbol.name}</span>
                          )}
                          <span className="font-medium">{symbol.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-lg">
                          R$ {symbol.prize_value.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Prêmios surpresa!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Minhas raspadinhas não reveladas */}
            {unrevealed.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Raspadinhas Pendentes ({unrevealed.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {unrevealed.map((chance) => (
                      <Button
                        key={chance.id}
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => setActiveChance(chance)}
                      >
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Raspadinha pendente
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(chance.created_at), 'dd/MM HH:mm')}
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Histórico */}
            {revealed.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Histórico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {revealed.slice(0, 10).map((chance) => (
                      <div
                        key={chance.id}
                        className={`
                          flex items-center justify-between p-3 rounded-lg
                          ${chance.prize_won ? 'bg-green-500/10' : 'bg-muted/50'}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          {chance.prize_won ? (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          <span className="text-sm">
                            {chance.revealed_at 
                              ? format(new Date(chance.revealed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                              : format(new Date(chance.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            }
                          </span>
                        </div>
                        {chance.prize_won ? (
                          <Badge className="bg-green-500">
                            + R$ {chance.prize_won.toFixed(2)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Não ganhou
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/back-button';
import { ScratchCard } from '@/components/games/ScratchCard';
import { WinCelebration } from '@/components/games/WinCelebration';
import { useScratchCard } from '@/hooks/useScratchCards';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatInSaoPaulo } from '@/lib/utils';
import { ScratchChance } from '@/types';
import {
  Wallet,
  Sparkles,
  Trophy,
  Clock,
  Gift,
  TrendingUp,
  History,
} from 'lucide-react';

export default function RaspadinhaDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { scratchCard, symbols, myChances, isLoading, buyChance, revealChance, refetch } = useScratchCard(id || '');
  const { balance, purchase, awardPrize } = useWallet();
  const { addNotification } = useNotifications();
  const { toast } = useToast();

  const [isBuying, setIsBuying] = useState(false);
  const [activeChance, setActiveChance] = useState<ScratchChance | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPrize, setCelebrationPrize] = useState(0);
  const hasRevealedRef = useRef(false);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleBuyChance = useCallback(async () => {
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
    hasRevealedRef.current = false;

    try {
      // Debitar da carteira
      const { error: walletError } = await purchase(
        scratchCard.price,
        `Raspadinha - ${scratchCard.title}`,
        scratchCard.id
      );

      if (walletError) {
        toast({
          title: 'Erro no pagamento',
          description: walletError.message,
          variant: 'destructive',
        });
        return;
      }

      // Comprar chance (Edge Function)
      const { error, chance } = await buyChance();

      if (error || !chance) {
        toast({
          title: 'Erro',
          description: 'Não foi possível comprar a raspadinha. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: '🎰 Raspadinha comprada!',
        description: 'Boa sorte! Raspe para descobrir seu prêmio.',
      });

      setActiveChance(chance);
    } finally {
      setIsBuying(false);
    }
  }, [user, scratchCard, balance, purchase, buyChance, toast]);

  const handleReveal = useCallback(async (isWinner: boolean, prize: number) => {
    if (!activeChance || hasRevealedRef.current) return;
    hasRevealedRef.current = true;

    // Marcar como revelada no banco
    await revealChance(activeChance.id, isWinner, prize);

    // Se ganhou, creditar prêmio e mostrar celebração
    if (isWinner && prize > 0) {
      await awardPrize(prize, `Prêmio raspadinha - ${scratchCard?.title}`, scratchCard?.id);

      setCelebrationPrize(prize);
      setShowCelebration(true);

      addNotification({
        type: 'prize_won',
        title: '🎉 Você Ganhou!',
        message: `Parabéns! Você ganhou R$ ${prize.toFixed(2)} na raspadinha "${scratchCard?.title}"!`,
        icon: '🏆',
        link: `/raspadinha/${scratchCard?.id}`,
      });
    }

    // Atualizar lista de chances
    refetch();
  }, [activeChance, revealChance, awardPrize, scratchCard, addNotification, refetch]);

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  // ==========================================================================
  // COMPUTED
  // ==========================================================================

  const unrevealed = myChances.filter(c => !c.is_revealed);
  const revealed = myChances.filter(c => c.is_revealed);
  const totalWon = revealed.reduce((sum, c) => sum + (c.prize_won || 0), 0);
  const winCount = revealed.filter(c => c.prize_won && c.prize_won > 0).length;

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="h-[500px] w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <Skeleton className="h-[150px] w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================================================
  // NOT FOUND STATE
  // ==========================================================================

  if (!scratchCard) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <Sparkles className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Raspadinha não encontrada</h1>
            <p className="text-muted-foreground">
              Esta raspadinha pode ter sido removida ou não existe.
            </p>
            <Button asChild>
              <Link to="/raspadinhas">Ver Raspadinhas Disponíveis</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 lg:py-8">
        <BackButton className="mb-6" />

        {/* Header da Raspadinha */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">{scratchCard.title}</h1>
              {scratchCard.description && (
                <p className="text-muted-foreground">{scratchCard.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Preço por chance</p>
              <p className="text-2xl font-bold text-primary">
                R$ {scratchCard.price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Área de Jogo (3 colunas) */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  {activeChance ? 'Raspe para Revelar!' : 'Comprar Raspadinha'}
                </CardTitle>
                <CardDescription>
                  {activeChance
                    ? 'Use o dedo ou mouse para raspar e descobrir se você ganhou!'
                    : 'Compre uma chance e tente a sorte!'
                  }
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col items-center py-8">
                {activeChance ? (
                  <ScratchCard
                    symbols={activeChance.symbols}
                    coverImage={scratchCard.cover_image_url || undefined}
                    onReveal={handleReveal}
                    isRevealed={activeChance.is_revealed}
                    prizeWon={activeChance.prize_won}
                    onBuyAgain={handleBuyChance}
                    isBuying={isBuying}
                    canBuyAgain={balance >= scratchCard.price}
                    price={scratchCard.price}
                  />
                ) : (
                  <div className="text-center space-y-6 py-4 w-full max-w-[320px]">
                    {/* Preview Card */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="w-[300px] h-[300px] mx-auto rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-xl flex items-center justify-center cursor-pointer"
                      onClick={user ? handleBuyChance : undefined}
                    >
                      <div className="text-white text-center">
                        <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-90" />
                        <p className="text-2xl font-bold">RASPADINHA</p>
                        <p className="text-sm opacity-80 mt-2">
                          {user ? 'Clique para comprar' : 'Faça login para jogar'}
                        </p>
                      </div>
                    </motion.div>

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
                          className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                        >
                          {isBuying ? 'Comprando...' : (
                            <>
                              <Sparkles className="h-5 w-5" />
                              Comprar por R$ {scratchCard.price.toFixed(2)}
                            </>
                          )}
                        </Button>

                        {balance < scratchCard.price && (
                          <Button variant="outline" className="w-full" asChild>
                            <Link to="/carteira">
                              <Wallet className="h-4 w-4 mr-2" />
                              Adicionar Créditos
                            </Link>
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

            {/* Estatísticas do Usuário */}
            {user && revealed.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{revealed.length}</div>
                  <div className="text-xs text-muted-foreground">Jogadas</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{winCount}</div>
                  <div className="text-xs text-muted-foreground">Vitórias</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    R$ {totalWon.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Ganho</div>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar (2 colunas) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabela de Prêmios */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gift className="h-5 w-5 text-amber-500" />
                  Tabela de Prêmios
                </CardTitle>
                <CardDescription>
                  Encontre 3 símbolos iguais para ganhar!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {symbols.length > 0 ? (
                  <div className="space-y-2">
                    {symbols
                      .sort((a, b) => b.prize_value - a.prize_value)
                      .map((symbol) => (
                        <div
                          key={symbol.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {symbol.image_url ? (
                              <img
                                src={symbol.image_url}
                                alt={symbol.name}
                                className="w-10 h-10 object-contain rounded"
                              />
                            ) : (
                              <span className="text-3xl">{symbol.name}</span>
                            )}
                            <span className="font-medium text-sm">{symbol.name}</span>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="text-base font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          >
                            R$ {symbol.prize_value.toFixed(2)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Prêmios surpresa! 🎁
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Raspadinhas Pendentes */}
            <AnimatePresence mode="wait">
              {unrevealed.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-blue-500" />
                        Pendentes ({unrevealed.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {unrevealed.map((chance) => (
                          <Button
                            key={chance.id}
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => {
                              hasRevealedRef.current = false;
                              setActiveChance(chance);
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              Raspadinha pendente
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatInSaoPaulo(new Date(chance.created_at), 'dd/MM HH:mm')}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Histórico */}
            {revealed.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5 text-muted-foreground" />
                    Histórico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                    {revealed.slice(0, 15).map((chance) => (
                      <div
                        key={chance.id}
                        className={`
                          flex items-center justify-between p-3 rounded-lg
                          ${chance.prize_won ? 'bg-green-50 dark:bg-green-900/20' : 'bg-muted/30'}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          {chance.prize_won ? (
                            <Trophy className="h-4 w-4 text-amber-500" />
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {formatInSaoPaulo(
                              new Date(chance.revealed_at || chance.created_at),
                              "dd/MM 'às' HH:mm"
                            )}
                          </span>
                        </div>
                        {chance.prize_won ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            + R$ {chance.prize_won.toFixed(2)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
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

      {/* Celebração de Vitória */}
      <WinCelebration
        isVisible={showCelebration}
        prize={celebrationPrize}
        onClose={handleCloseCelebration}
      />
    </div>
  );
}

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { RouletteWheel } from '@/components/games/RouletteWheel';
import { useRaffle } from '@/hooks/useRaffles';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Users, 
  Ticket, 
  ArrowLeft, 
  Check, 
  X,
  Wallet,
  Trophy,
  Zap,
  Clock,
  Sparkles,
  Gift
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import confetti from 'canvas-confetti';

export default function SorteioDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { raffle, participants, myTickets, soldNumbers, isLoading, buyMultipleTickets } = useRaffle(id || '');
  const { balance, purchase } = useWallet();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  const { playPurchase, playSuccess, playClick, playError } = useSoundEffects();
  
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isBuying, setIsBuying] = useState(false);
  const [recentlyBought, setRecentlyBought] = useState<number[]>([]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleNumber = (num: number) => {
    if (soldNumbers.includes(num)) return;
    
    playClick();
    setSelectedNumbers(prev => 
      prev.includes(num) 
        ? prev.filter(n => n !== num)
        : [...prev, num]
    );
  };

  const totalPrice = selectedNumbers.length * (raffle?.price || 0);

  const handleBuyTickets = async () => {
    if (!user) {
      playError();
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para comprar números',
        variant: 'destructive',
      });
      return;
    }

    if (balance < totalPrice) {
      playError();
      toast({
        title: 'Saldo insuficiente',
        description: 'Adicione mais créditos à sua carteira',
        variant: 'destructive',
      });
      return;
    }

    setIsBuying(true);
    playPurchase();

    // Primeiro debitar da carteira
    const { error: walletError } = await purchase(
      totalPrice, 
      `Compra de ${selectedNumbers.length} número(s) - ${raffle?.title}`,
      raffle?.id
    );

    if (walletError) {
      playError();
      toast({
        title: 'Erro',
        description: walletError.message,
        variant: 'destructive',
      });
      setIsBuying(false);
      return;
    }

    // Depois comprar os tickets
    const { error } = await buyMultipleTickets(selectedNumbers);

    if (error) {
      playError();
      toast({
        title: 'Erro',
        description: 'Não foi possível comprar os números. Tente novamente.',
        variant: 'destructive',
      });
    } else {
      // Animação de sucesso
      playSuccess();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#8b5cf6', '#6366f1', '#a855f7'],
      });

      toast({
        title: '🎉 Sucesso!',
        description: `Você comprou ${selectedNumbers.length} número(s) com sucesso!`,
      });

      addNotification({
        type: 'system',
        title: 'Números Comprados!',
        message: `Você adquiriu ${selectedNumbers.length} número(s) no sorteio "${raffle?.title}"`,
        link: `/sorteio/${raffle?.id}`,
      });

      setRecentlyBought(selectedNumbers);
      setSelectedNumbers([]);

      // Limpar animação após um tempo
      setTimeout(() => setRecentlyBought([]), 3000);
    }

    setIsBuying(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 md:py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <div className="max-w-md mx-auto">
            <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-xl font-medium mb-2">Sorteio não encontrado</p>
            <p className="text-muted-foreground mb-6">O sorteio que você procura não existe ou foi removido.</p>
            <Button asChild>
              <Link to="/sorteios">Voltar aos Sorteios</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const isOpen = raffle.status === 'open';
  const isCompleted = raffle.status === 'completed';
  const isDrawing = raffle.status === 'drawing';
  const winner = participants.find(p => p.id === raffle.winner_id);
  const progress = (soldNumbers.length / raffle.total_numbers) * 100;
  const timeUntilDraw = formatDistanceToNow(new Date(raffle.draw_date), { locale: ptBR, addSuffix: true });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 md:py-8">
        {/* Voltar */}
        <Link 
          to="/sorteios" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos sorteios
        </Link>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-primary p-6 md:p-8 mb-6 md:mb-8">
          <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge 
                  className={`${
                    isOpen 
                      ? 'bg-success/90 text-white' 
                      : isDrawing 
                        ? 'bg-warning text-warning-foreground animate-pulse' 
                        : 'bg-secondary'
                  } gap-1`}
                >
                  {isOpen && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-white" /></span>}
                  {isDrawing && <Zap className="h-3 w-3" />}
                  {isCompleted && <Trophy className="h-3 w-3" />}
                  {isOpen ? 'Aberto' : isDrawing ? 'Ao Vivo' : 'Finalizado'}
                </Badge>
                {isOpen && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    <Clock className="h-3 w-3 mr-1" />
                    {timeUntilDraw}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">{raffle.title}</h1>
              {raffle.description && (
                <p className="text-white/70 text-sm md:text-base max-w-xl">{raffle.description}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-white/70 text-xs mb-0.5">Por número</p>
                <p className="text-2xl md:text-3xl font-bold text-white">R$ {raffle.price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm text-white/70 mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {soldNumbers.length} de {raffle.total_numbers} vendidos
              </span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Roleta - Mostrar se tiver participantes */}
            {(isDrawing || isCompleted) && participants.length > 0 && (
              <Card className="overflow-hidden border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    {isCompleted ? 'Resultado do Sorteio' : 'Sorteio em Andamento'}
                  </CardTitle>
                  {isDrawing && (
                    <CardDescription className="flex items-center gap-2 text-yellow-600">
                      <Zap className="h-4 w-4 animate-pulse" />
                      O sorteio está acontecendo ao vivo! Acompanhe em tempo real.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <RouletteWheel 
                    participants={participants}
                    winner={winner}
                    autoSpin={isDrawing}
                    raffleTitle={raffle.title}
                  />
                </CardContent>
              </Card>
            )}

            {/* Grid de Números */}
            {isOpen && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Escolha seus números da sorte
                  </CardTitle>
                  <CardDescription>
                    Clique nos números disponíveis para selecioná-los
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 md:gap-2">
                    {Array.from({ length: raffle.total_numbers }, (_, i) => i + 1).map((num) => {
                      const isSold = soldNumbers.includes(num);
                      const isMyNumber = myTickets.some(t => t.ticket_number === num);
                      const isSelected = selectedNumbers.includes(num);
                      const wasRecentlyBought = recentlyBought.includes(num);

                      return (
                        <button
                          key={num}
                          onClick={() => toggleNumber(num)}
                          disabled={isSold}
                          className={`
                            aspect-square rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all duration-200
                            flex items-center justify-center relative
                            ${wasRecentlyBought 
                              ? 'bg-success text-white animate-bounce-in ring-2 ring-success ring-offset-2'
                              : isSold 
                                ? isMyNumber 
                                  ? 'bg-primary text-primary-foreground cursor-default shadow-md' 
                                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                                : isSelected
                                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 scale-105 shadow-lg'
                                  : 'bg-card border-2 hover:border-primary hover:scale-105 hover:shadow-md'
                            }
                          `}
                        >
                          {num}
                          {isMyNumber && !wasRecentlyBought && (
                            <Check className="absolute -top-1 -right-1 h-3.5 w-3.5 md:h-4 md:w-4 bg-success rounded-full p-0.5 text-white" />
                          )}
                          {isSold && !isMyNumber && (
                            <X className="absolute inset-0 m-auto h-3 w-3 md:h-4 md:w-4 text-muted-foreground/50" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legenda */}
                  <div className="flex flex-wrap gap-3 md:gap-4 mt-6 text-xs md:text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-card border-2" />
                      <span>Disponível</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-primary" />
                      <span>Selecionado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-muted" />
                      <span>Vendido</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-primary relative">
                        <Check className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-success rounded-full p-0.5 text-white" />
                      </div>
                      <span>Meu número</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participantes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Participantes ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length > 0 ? (
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {participants.map((participant) => {
                      const isWinner = winner?.id === participant.id;
                      return (
                        <div 
                          key={participant.id} 
                          className={`flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-all ${
                            isWinner 
                              ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50' 
                              : 'bg-muted/50'
                          }`}
                        >
                          <Avatar className={`h-7 w-7 md:h-8 md:w-8 ${isWinner ? 'ring-2 ring-yellow-500' : ''}`}>
                            <AvatarImage src={participant.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(participant.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs md:text-sm font-medium">{participant.full_name}</span>
                          {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Nenhum participante ainda. Seja o primeiro!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Card de Compra */}
            {isOpen && (
              <Card className="sticky top-24 border-2 border-primary/20 shadow-lg shadow-primary/5">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    Resumo da Compra
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Números selecionados</span>
                    <Badge variant={selectedNumbers.length > 0 ? 'default' : 'secondary'}>
                      {selectedNumbers.length}
                    </Badge>
                  </div>
                  
                  {selectedNumbers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-3 bg-muted/50 rounded-xl">
                      {selectedNumbers.sort((a, b) => a - b).map(num => (
                        <Badge key={num} variant="outline" className="tabular-nums">
                          {num}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preço unitário</span>
                    <span>R$ {raffle.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-primary">R$ {totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {user ? (
                    <>
                      <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-xl p-3">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Saldo:</span>
                        <span className="font-semibold ml-auto">R$ {balance.toFixed(2)}</span>
                      </div>

                      <Button 
                        className="w-full h-12 text-base font-semibold bg-gradient-primary hover:opacity-90 shadow-lg shadow-primary/25" 
                        disabled={selectedNumbers.length === 0 || isBuying || balance < totalPrice}
                        onClick={handleBuyTickets}
                      >
                        {isBuying ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                            Comprando...
                          </span>
                        ) : (
                          <>
                            <Ticket className="h-5 w-5 mr-2" />
                            Comprar Números
                          </>
                        )}
                      </Button>

                      {balance < totalPrice && selectedNumbers.length > 0 && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link to="/carteira">
                            <Wallet className="h-4 w-4 mr-2" />
                            Adicionar Créditos
                          </Link>
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button className="w-full h-12" asChild>
                      <Link to="/login">Fazer Login para Comprar</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Informações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações do Sorteio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data do Sorteio</p>
                    <p className="font-medium text-sm">
                      {format(new Date(raffle.draw_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      às {format(new Date(raffle.draw_date), 'HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium text-sm text-green-500">
                      {soldNumbers.length < raffle.total_numbers ? 'Disponível' : 'Esgotado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Participantes</p>
                    <p className="font-medium text-sm">{participants.length} pessoas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meus Números */}
            {myTickets.length > 0 && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Ticket className="h-5 w-5 text-primary" />
                    Meus Números ({myTickets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {myTickets
                      .sort((a, b) => a.ticket_number - b.ticket_number)
                      .map((ticket) => (
                        <Badge 
                          key={ticket.id} 
                          className="text-base px-3 py-1.5 bg-primary text-primary-foreground"
                        >
                          {ticket.ticket_number}
                        </Badge>
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

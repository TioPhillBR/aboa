import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { RouletteWheel } from '@/components/games/RouletteWheel';
import { useRaffle } from '@/hooks/useRaffles';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Users, 
  Ticket, 
  ArrowLeft, 
  Check, 
  X,
  Wallet,
  Trophy
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SorteioDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { raffle, participants, myTickets, soldNumbers, isLoading, buyMultipleTickets } = useRaffle(id || '');
  const { balance, purchase } = useWallet();
  const { toast } = useToast();
  
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isBuying, setIsBuying] = useState(false);

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
    
    setSelectedNumbers(prev => 
      prev.includes(num) 
        ? prev.filter(n => n !== num)
        : [...prev, num]
    );
  };

  const totalPrice = selectedNumbers.length * (raffle?.price || 0);

  const handleBuyTickets = async () => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para comprar números',
        variant: 'destructive',
      });
      return;
    }

    if (balance < totalPrice) {
      toast({
        title: 'Saldo insuficiente',
        description: 'Adicione mais créditos à sua carteira',
        variant: 'destructive',
      });
      return;
    }

    setIsBuying(true);

    // Primeiro debitar da carteira
    const { error: walletError } = await purchase(
      totalPrice, 
      `Compra de ${selectedNumbers.length} número(s) - ${raffle?.title}`,
      raffle?.id
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

    // Depois comprar os tickets
    const { error } = await buyMultipleTickets(selectedNumbers);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível comprar os números. Tente novamente.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso!',
        description: `Você comprou ${selectedNumbers.length} número(s) com sucesso!`,
      });
      setSelectedNumbers([]);
    }

    setIsBuying(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
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
          <p className="text-muted-foreground">Sorteio não encontrado</p>
          <Button asChild className="mt-4">
            <Link to="/sorteios">Voltar aos Sorteios</Link>
          </Button>
        </main>
      </div>
    );
  }

  const isOpen = raffle.status === 'open';
  const isCompleted = raffle.status === 'completed';
  const isDrawing = raffle.status === 'drawing';
  const winner = participants.find(p => p.id === raffle.winner_id);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Voltar */}
        <Link 
          to="/sorteios" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos sorteios
        </Link>

        {/* Header do Sorteio */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{raffle.title}</h1>
              <Badge variant={isOpen ? 'default' : 'secondary'}>
                {isOpen ? 'Aberto' : isDrawing ? 'Em Sorteio' : 'Finalizado'}
              </Badge>
            </div>
            {raffle.description && (
              <p className="text-muted-foreground">{raffle.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor por número</p>
              <p className="text-2xl font-bold text-primary">R$ {raffle.price.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Roleta - Mostrar se tiver participantes */}
            {(isDrawing || isCompleted) && participants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    {isCompleted ? 'Resultado do Sorteio' : 'Sorteio em Andamento'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RouletteWheel 
                    participants={participants}
                    winner={winner}
                    autoSpin={isDrawing}
                  />
                </CardContent>
              </Card>
            )}

            {/* Grid de Números */}
            {isOpen && (
              <Card>
                <CardHeader>
                  <CardTitle>Escolha seus números</CardTitle>
                  <CardDescription>
                    Clique nos números disponíveis para selecioná-los
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {Array.from({ length: raffle.total_numbers }, (_, i) => i + 1).map((num) => {
                      const isSold = soldNumbers.includes(num);
                      const isMyNumber = myTickets.some(t => t.ticket_number === num);
                      const isSelected = selectedNumbers.includes(num);

                      return (
                        <button
                          key={num}
                          onClick={() => toggleNumber(num)}
                          disabled={isSold}
                          className={`
                            aspect-square rounded-lg font-semibold text-sm transition-all
                            flex items-center justify-center relative
                            ${isSold 
                              ? isMyNumber 
                                ? 'bg-primary text-primary-foreground cursor-default' 
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                              : isSelected
                                ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 scale-105'
                                : 'bg-card border-2 hover:border-primary hover:scale-105'
                            }
                          `}
                        >
                          {num}
                          {isMyNumber && (
                            <Check className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full p-0.5 text-white" />
                          )}
                          {isSold && !isMyNumber && (
                            <X className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground/50" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legenda */}
                  <div className="flex flex-wrap gap-4 mt-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-card border-2" />
                      <span>Disponível</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary" />
                      <span>Selecionado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-muted" />
                      <span>Vendido</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary relative">
                        <Check className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full p-0.5 text-white" />
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
                  <Users className="h-5 w-5" />
                  Participantes ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {participants.map((participant) => (
                      <div 
                        key={participant.id} 
                        className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={participant.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(participant.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{participant.full_name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum participante ainda. Seja o primeiro!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Card de Compra */}
            {isOpen && (
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Resumo da Compra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Números selecionados</span>
                    <span className="font-semibold">{selectedNumbers.length}</span>
                  </div>
                  <div className="flex justify-between">
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                        <Wallet className="h-4 w-4" />
                        <span>Saldo: R$ {balance.toFixed(2)}</span>
                      </div>

                      <Button 
                        className="w-full" 
                        size="lg"
                        disabled={selectedNumbers.length === 0 || isBuying}
                        onClick={handleBuyTickets}
                      >
                        {isBuying ? 'Comprando...' : 'Comprar Números'}
                      </Button>

                      {balance < totalPrice && selectedNumbers.length > 0 && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link to="/carteira">Adicionar Créditos</Link>
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button className="w-full" size="lg" asChild>
                      <Link to="/login">Fazer Login para Comprar</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Informações */}
            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data do Sorteio</p>
                    <p className="font-medium">
                      {format(new Date(raffle.draw_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      às {format(new Date(raffle.draw_date), 'HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Ticket className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Números</p>
                    <p className="font-medium">
                      {soldNumbers.length} / {raffle.total_numbers} vendidos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Participantes</p>
                    <p className="font-medium">{participants.length} pessoas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meus Números */}
            {myTickets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    Meus Números
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {myTickets
                      .sort((a, b) => a.ticket_number - b.ticket_number)
                      .map((ticket) => (
                        <Badge 
                          key={ticket.id} 
                          variant="secondary"
                          className="text-lg px-3 py-1"
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

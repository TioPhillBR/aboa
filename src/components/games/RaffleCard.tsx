import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Raffle } from '@/types';
import { Calendar, Users, Ticket, ArrowRight, Clock, Trophy } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RaffleCardProps {
  raffle: Raffle & { tickets_sold?: number };
}

export function RaffleCard({ raffle }: RaffleCardProps) {
  const ticketsSold = raffle.tickets_sold || 0;
  const progress = (ticketsSold / raffle.total_numbers) * 100;
  const isCompleted = raffle.status === 'completed';
  const isDrawing = raffle.status === 'drawing';
  const isOpen = raffle.status === 'open';
  
  const drawDate = new Date(raffle.draw_date);
  const timeUntilDraw = formatDistanceToNow(drawDate, { locale: ptBR, addSuffix: true });

  const getStatusBadge = () => {
    switch (raffle.status) {
      case 'open':
        return (
          <Badge className="bg-success/90 hover:bg-success border-0 gap-1 shadow-lg shadow-success/25">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            Aberto
          </Badge>
        );
      case 'drawing':
        return (
          <Badge className="bg-warning hover:bg-warning/90 border-0 gap-1 animate-pulse shadow-lg shadow-warning/25">
            <Clock className="h-3 w-3" />
            Ao Vivo
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="gap-1">
            <Trophy className="h-3 w-3" />
            Finalizado
          </Badge>
        );
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="group overflow-hidden border hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 card-hover bg-card">
      {/* Imagem */}
      <div className="relative h-52 overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
        
        {raffle.image_url ? (
          <img
            src={raffle.image_url}
            alt={raffle.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
            <Ticket className="h-20 w-20 text-white/30" />
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-4 right-4 z-20">
          {getStatusBadge()}
        </div>
        
        {/* Price tag */}
        <div className="absolute bottom-4 left-4 z-20">
          <div className="px-4 py-2 rounded-xl bg-white/95 dark:bg-black/80 backdrop-blur-sm shadow-xl">
            <p className="text-xs text-muted-foreground">Por número</p>
            <p className="text-2xl font-bold text-primary">
              R$ {raffle.price.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">
          {raffle.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {raffle.description || 'Participe deste sorteio incrível!'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progresso de vendas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Números vendidos
            </span>
            <span className="font-semibold tabular-nums">
              {ticketsSold} <span className="text-muted-foreground font-normal">/ {raffle.total_numbers}</span>
            </span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-2.5" />
            {progress > 80 && (
              <span className="absolute -top-6 right-0 text-xs font-medium text-destructive animate-pulse">
                🔥 Quase esgotando!
              </span>
            )}
          </div>
        </div>

        {/* Data do sorteio */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sorteio</p>
            <p className="text-sm font-medium">
              {isOpen ? (
                <span className="text-primary">{timeUntilDraw}</span>
              ) : (
                format(drawDate, "dd/MM/yyyy 'às' HH:mm")
              )}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button 
          asChild 
          className={`w-full gap-2 h-12 text-base font-semibold transition-all duration-300 ${
            isDrawing 
              ? 'bg-warning hover:bg-warning/90 text-warning-foreground animate-pulse' 
              : isCompleted 
                ? 'bg-secondary hover:bg-secondary/80' 
                : 'bg-gradient-primary hover:opacity-90 shadow-lg shadow-primary/25'
          }`}
          disabled={isCompleted}
        >
          <Link to={`/sorteio/${raffle.id}`}>
            {isDrawing ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                Ver Sorteio Ao Vivo
              </>
            ) : isCompleted ? (
              <>
                <Trophy className="h-4 w-4" />
                Ver Resultado
              </>
            ) : (
              <>
                Comprar Números
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Raffle } from '@/types';
import { Calendar, Users, Ticket, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RaffleCardProps {
  raffle: Raffle & { tickets_sold?: number };
}

export function RaffleCard({ raffle }: RaffleCardProps) {
  const ticketsSold = raffle.tickets_sold || 0;
  const progress = (ticketsSold / raffle.total_numbers) * 100;
  const isCompleted = raffle.status === 'completed';
  const isDrawing = raffle.status === 'drawing';

  const getStatusBadge = () => {
    switch (raffle.status) {
      case 'open':
        return <Badge className="bg-green-500 hover:bg-green-600">Aberto</Badge>;
      case 'drawing':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 animate-pulse">Em Sorteio</Badge>;
      case 'completed':
        return <Badge variant="secondary">Finalizado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover-scale">
      {/* Imagem */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
        {raffle.image_url ? (
          <img
            src={raffle.image_url}
            alt={raffle.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ticket className="h-16 w-16 text-primary/30" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1">{raffle.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {raffle.description || 'Participe deste sorteio incrível!'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preço */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Valor por número:</span>
          <span className="text-xl font-bold text-primary">
            R$ {raffle.price.toFixed(2)}
          </span>
        </div>

        {/* Progresso de vendas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" />
              Números vendidos
            </span>
            <span className="font-medium">
              {ticketsSold} / {raffle.total_numbers}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Data do sorteio */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Sorteio: {format(new Date(raffle.draw_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full gap-2" disabled={isCompleted}>
          <Link to={`/sorteio/${raffle.id}`}>
            {isDrawing ? 'Ver Sorteio Ao Vivo' : isCompleted ? 'Ver Resultado' : 'Comprar Números'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

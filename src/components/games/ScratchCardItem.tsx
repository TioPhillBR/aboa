import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScratchCard as ScratchCardType } from '@/types';
import { Sparkles, ArrowRight, Coins, Zap } from 'lucide-react';

interface ScratchCardItemProps {
  scratchCard: ScratchCardType;
}

export function ScratchCardItem({ scratchCard }: ScratchCardItemProps) {
  return (
    <Card className="group overflow-hidden border hover:border-warning/30 transition-all duration-500 hover:shadow-2xl hover:shadow-warning/10 card-hover bg-card">
      {/* Imagem */}
      <div className="relative h-40 sm:h-48 md:h-52 overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />
        
        {scratchCard.cover_image_url ? (
          <img
            src={scratchCard.cover_image_url}
            alt={scratchCard.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-sunset flex flex-col items-center justify-center">
            <div className="relative">
              <Sparkles className="h-16 w-16 md:h-20 md:w-20 text-white/80 animate-float" />
              <div className="absolute inset-0 animate-ping">
                <Sparkles className="h-16 w-16 md:h-20 md:w-20 text-white/30" />
              </div>
            </div>
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20">
          <Badge className="bg-success/90 hover:bg-success border-0 gap-1 shadow-lg shadow-success/25 text-xs">
            <Zap className="h-3 w-3" />
            Disponível
          </Badge>
        </div>
        
        {/* Price tag */}
        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-20">
          <div className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl bg-white/95 dark:bg-black/80 backdrop-blur-sm shadow-xl">
            <p className="text-[10px] md:text-xs text-muted-foreground">Por chance</p>
            <p className="text-xl md:text-2xl font-bold text-gradient-gold">
              R$ {scratchCard.price.toFixed(2)}
            </p>
          </div>
        </div>
        
        {/* Sparkle effect overlay */}
        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-ping" />
          <div className="absolute top-1/3 right-1/3 w-1 h-1 md:w-1.5 md:h-1.5 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
          <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0.6s' }} />
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>
      </div>

      <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
        <CardTitle className="text-lg md:text-xl line-clamp-1 group-hover:text-warning transition-colors">
          {scratchCard.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-xs md:text-sm">
          {scratchCard.description || 'Raspe e descubra se você ganhou!'}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 md:px-6">
        {/* Info boxes */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <div className="flex items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-lg md:rounded-xl bg-muted/50">
            <div className="p-1.5 md:p-2 rounded-md md:rounded-lg bg-warning/10">
              <Coins className="h-3.5 w-3.5 md:h-4 md:w-4 text-warning" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-muted-foreground">Prêmio máx.</p>
              <p className="text-xs md:text-sm font-semibold text-warning">Variável</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-lg md:rounded-xl bg-muted/50">
            <div className="p-1.5 md:p-2 rounded-md md:rounded-lg bg-success/10">
              <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-success" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-muted-foreground">Tipo</p>
              <p className="text-xs md:text-sm font-semibold">Instantâneo</p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 md:px-6 pb-4 md:pb-6 pt-0">
        <Button 
          asChild 
          className="w-full gap-1.5 md:gap-2 h-10 md:h-12 text-sm md:text-base font-semibold bg-gradient-sunset hover:opacity-90 transition-all duration-300 shadow-lg shadow-orange-500/25 border-0"
        >
          <Link to={`/raspadinha/${scratchCard.id}`}>
            <Sparkles className="h-4 w-4" />
            Jogar Agora
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

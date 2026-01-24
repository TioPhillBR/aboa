import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScratchCard as ScratchCardType } from '@/types';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ScratchCardItemProps {
  scratchCard: ScratchCardType;
}

export function ScratchCardItem({ scratchCard }: ScratchCardItemProps) {
  return (
    <Card className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover-scale">
      {/* Imagem */}
      <div className="relative h-48 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 overflow-hidden">
        {scratchCard.cover_image_url ? (
          <img
            src={scratchCard.cover_image_url}
            alt={scratchCard.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white">
            <Sparkles className="h-16 w-16 mb-2 opacity-80" />
            <span className="text-2xl font-bold opacity-90">RASPADINHA</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className="bg-green-500 hover:bg-green-600">Disponível</Badge>
        </div>
        
        {/* Efeito de brilho */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1">{scratchCard.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {scratchCard.description || 'Raspe e descubra se você ganhou!'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Preço */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Preço por chance:</span>
          <span className="text-xl font-bold text-primary">
            R$ {scratchCard.price.toFixed(2)}
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
          <Link to={`/raspadinha/${scratchCard.id}`}>
            Jogar Agora
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

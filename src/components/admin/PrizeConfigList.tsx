import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Gift, Percent, Hash, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PrizeConfig {
  id: string;
  name: string;
  value: number;
  quantity: number;
  probability: number;
  image_url?: string;
  description?: string;
}

interface PrizeConfigListProps {
  prizes: PrizeConfig[];
  onChange: (prizes: PrizeConfig[]) => void;
  type: 'scratch' | 'raffle';
  showImage?: boolean;
  totalItems?: number; // Total de raspadinhas ou números para validação
}

export function PrizeConfigList({ 
  prizes, 
  onChange, 
  type, 
  showImage = true,
  totalItems 
}: PrizeConfigListProps) {
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addPrize = () => {
    const newPrize: PrizeConfig = {
      id: generateId(),
      name: '',
      value: 0,
      quantity: 1,
      probability: type === 'scratch' ? 1 : 0,
      image_url: '',
      description: '',
    };
    onChange([...prizes, newPrize]);
  };

  const updatePrize = (id: string, field: keyof PrizeConfig, value: string | number) => {
    onChange(
      prizes.map(prize => 
        prize.id === id ? { ...prize, [field]: value } : prize
      )
    );
  };

  const removePrize = (id: string) => {
    onChange(prizes.filter(prize => prize.id !== id));
  };

  // Calcular resumo
  const totalPrizes = prizes.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = prizes.reduce((sum, p) => sum + (p.value * p.quantity), 0);
  const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);

  const isProbabilityValid = type === 'scratch' 
    ? totalProbability <= 100 
    : true;

  const isQuantityValid = totalItems 
    ? totalPrizes <= totalItems 
    : true;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Gift className="h-4 w-4" />
          {type === 'scratch' ? 'Prêmios do Lote' : 'Prêmios do Sorteio'}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addPrize} className="gap-1">
          <Plus className="h-3 w-3" />
          Adicionar Prêmio
        </Button>
      </div>

      {prizes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-muted-foreground">
            <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum prêmio configurado</p>
            <Button type="button" variant="link" size="sm" onClick={addPrize}>
              Adicionar primeiro prêmio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {prizes.map((prize, index) => (
            <Card key={prize.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {/* Número do prêmio */}
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex-shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Linha 1: Nome e Descrição */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`prize-name-${prize.id}`} className="text-xs">
                          Nome do Prêmio *
                        </Label>
                        <Input
                          id={`prize-name-${prize.id}`}
                          value={prize.name}
                          onChange={(e) => updatePrize(prize.id, 'name', e.target.value)}
                          placeholder="Ex: iPhone 15, R$ 100..."
                          className="h-8 text-sm"
                        />
                      </div>
                      
                      {type === 'raffle' && (
                        <div className="space-y-1">
                          <Label htmlFor={`prize-desc-${prize.id}`} className="text-xs">
                            Descrição
                          </Label>
                          <Input
                            id={`prize-desc-${prize.id}`}
                            value={prize.description || ''}
                            onChange={(e) => updatePrize(prize.id, 'description', e.target.value)}
                            placeholder="Descrição do prêmio..."
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Linha 2: Valor, Quantidade, Probabilidade */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`prize-value-${prize.id}`} className="text-xs flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Valor (R$)
                        </Label>
                        <Input
                          id={`prize-value-${prize.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={prize.value || ''}
                          onChange={(e) => updatePrize(prize.id, 'value', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-8 text-sm"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor={`prize-qty-${prize.id}`} className="text-xs flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Quantidade
                        </Label>
                        <Input
                          id={`prize-qty-${prize.id}`}
                          type="number"
                          min="1"
                          value={prize.quantity || ''}
                          onChange={(e) => updatePrize(prize.id, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="1"
                          className="h-8 text-sm"
                        />
                      </div>
                      
                      {type === 'scratch' && (
                        <div className="space-y-1">
                          <Label htmlFor={`prize-prob-${prize.id}`} className="text-xs flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Probabilidade (%)
                          </Label>
                          <Input
                            id={`prize-prob-${prize.id}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={prize.probability || ''}
                            onChange={(e) => updatePrize(prize.id, 'probability', parseFloat(e.target.value) || 0)}
                            placeholder="1"
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Imagem (opcional) */}
                    {showImage && (
                      <ImageUpload
                        label="Imagem do Prêmio"
                        value={prize.image_url || ''}
                        onChange={(url) => updatePrize(prize.id, 'image_url', url)}
                        bucket="images"
                        folder={type === 'scratch' ? 'scratch-prizes' : 'raffle-prizes'}
                        aspectRatio="square"
                      />
                    )}
                  </div>

                  {/* Botão remover */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrize(prize.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resumo */}
      {prizes.length > 0 && (
        <Card className={cn(
          "bg-muted/50",
          !isProbabilityValid && "border-destructive",
          !isQuantityValid && "border-destructive"
        )}>
          <CardContent className="py-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total de Prêmios</p>
                <p className={cn(
                  "font-semibold",
                  !isQuantityValid && "text-destructive"
                )}>
                  {totalPrizes} {totalItems ? `/ ${totalItems}` : ''}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor Total</p>
                <p className="font-semibold text-green-600">
                  R$ {totalValue.toFixed(2)}
                </p>
              </div>
              {type === 'scratch' && (
                <div>
                  <p className="text-muted-foreground">Prob. Total</p>
                  <p className={cn(
                    "font-semibold",
                    !isProbabilityValid && "text-destructive"
                  )}>
                    {totalProbability.toFixed(2)}%
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Prêmios Únicos</p>
                <p className="font-semibold">{prizes.length}</p>
              </div>
            </div>
            
            {!isProbabilityValid && (
              <p className="text-destructive text-xs mt-2">
                ⚠️ A soma das probabilidades não pode ultrapassar 100%
              </p>
            )}
            {!isQuantityValid && (
              <p className="text-destructive text-xs mt-2">
                ⚠️ O total de prêmios não pode ultrapassar a quantidade de {type === 'scratch' ? 'raspadinhas' : 'números'}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

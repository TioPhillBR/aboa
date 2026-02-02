import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScratchSymbol } from '@/types';
import { 
  Save, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2,
  Coins,
  Percent
} from 'lucide-react';

interface SymbolProbabilityEditorProps {
  symbols: ScratchSymbol[];
  onUpdate: () => void;
}

interface EditableSymbol extends ScratchSymbol {
  newProbability: number;
  newPrizeValue: number;
  hasChanges: boolean;
}

export function SymbolProbabilityEditor({ symbols, onUpdate }: SymbolProbabilityEditorProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [editableSymbols, setEditableSymbols] = useState<EditableSymbol[]>(
    symbols.map(s => ({
      ...s,
      newProbability: s.probability * 100,
      newPrizeValue: s.prize_value,
      hasChanges: false,
    }))
  );

  const totalProbability = editableSymbols.reduce((sum, s) => sum + s.newProbability, 0);
  const isHighRisk = totalProbability > 30;
  const isVeryHighRisk = totalProbability > 50;
  const hasAnyChanges = editableSymbols.some(s => s.hasChanges);

  const handleProbabilityChange = (symbolId: string, value: number) => {
    setEditableSymbols(prev => prev.map(s => {
      if (s.id === symbolId) {
        return {
          ...s,
          newProbability: value,
          hasChanges: value !== s.probability * 100 || s.newPrizeValue !== s.prize_value,
        };
      }
      return s;
    }));
  };

  const handlePrizeValueChange = (symbolId: string, value: number) => {
    setEditableSymbols(prev => prev.map(s => {
      if (s.id === symbolId) {
        return {
          ...s,
          newPrizeValue: value,
          hasChanges: s.newProbability !== s.probability * 100 || value !== s.prize_value,
        };
      }
      return s;
    }));
  };

  const handleSaveAll = async () => {
    const changedSymbols = editableSymbols.filter(s => s.hasChanges);
    
    if (changedSymbols.length === 0) {
      toast({
        title: 'Nenhuma alteração',
        description: 'Não há alterações para salvar.',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Update each changed symbol
      for (const symbol of changedSymbols) {
        const { error } = await supabase
          .from('scratch_symbols')
          .update({
            probability: symbol.newProbability / 100,
            prize_value: symbol.newPrizeValue,
          })
          .eq('id', symbol.id);

        if (error) throw error;
      }

      toast({
        title: 'Probabilidades atualizadas!',
        description: `${changedSymbols.length} símbolo(s) atualizado(s) com sucesso.`,
      });

      // Reset hasChanges
      setEditableSymbols(prev => prev.map(s => ({ ...s, hasChanges: false })));
      
      onUpdate();
    } catch (error) {
      console.error('Error updating probabilities:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDistributeEvenly = () => {
    const targetProbability = 15 / editableSymbols.length; // Target 15% total
    setEditableSymbols(prev => prev.map(s => ({
      ...s,
      newProbability: Math.round(targetProbability * 10) / 10,
      hasChanges: true,
    })));
  };

  if (symbols.length === 0) {
    return (
      <div className="text-center py-6 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Nenhum símbolo configurado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com total */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 font-medium ${
            isVeryHighRisk ? 'text-red-600' : 
            isHighRisk ? 'text-amber-600' : 
            'text-green-600'
          }`}>
            {isVeryHighRisk ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            <span className="text-lg">{totalProbability.toFixed(1)}%</span>
          </div>
          <span className="text-sm text-muted-foreground">chance total de vitória</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDistributeEvenly}
            className="text-xs"
          >
            Distribuir (15% total)
          </Button>
          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={!hasAnyChanges || isSaving}
            className="gap-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {isVeryHighRisk && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Probabilidade muito alta!</p>
            <p className="text-xs opacity-80">
              Com {totalProbability.toFixed(1)}% de chance de vitória, você terá muitos vencedores.
              Recomendamos manter abaixo de 15%.
            </p>
          </div>
        </div>
      )}

      {/* Lista de símbolos */}
      <div className="space-y-3">
        {editableSymbols.map((symbol) => (
          <div 
            key={symbol.id}
            className={`p-4 rounded-lg border transition-colors ${
              symbol.hasChanges 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-muted/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <img 
                src={symbol.image_url} 
                alt={symbol.name}
                className="h-14 w-14 rounded-lg object-cover shrink-0"
              />
              
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{symbol.name}</span>
                  {symbol.hasChanges && (
                    <Badge variant="secondary" className="text-xs">
                      Modificado
                    </Badge>
                  )}
                </div>

                {/* Probabilidade */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Probabilidade
                    </Label>
                    <span className="text-sm font-mono">
                      {symbol.newProbability.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[symbol.newProbability]}
                      onValueChange={([value]) => handleProbabilityChange(symbol.id, value)}
                      min={0}
                      max={50}
                      step={0.5}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={symbol.newProbability}
                      onChange={(e) => handleProbabilityChange(symbol.id, parseFloat(e.target.value) || 0)}
                      className="w-20 h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Valor do Prêmio */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    Valor do Prêmio (R$)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={symbol.newPrizeValue}
                    onChange={(e) => handlePrizeValueChange(symbol.id, parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Info adicional */}
                {symbol.total_quantity && (
                  <p className="text-xs text-muted-foreground">
                    Quantidade: {symbol.remaining_quantity}/{symbol.total_quantity} disponíveis
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

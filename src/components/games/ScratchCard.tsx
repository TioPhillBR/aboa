import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScratchSymbolResult } from '@/types';
import { Trophy, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScratchCardProps {
  symbols: ScratchSymbolResult[];
  coverImage?: string;
  onReveal?: (isWinner: boolean, prize: number) => void;
  isRevealed?: boolean;
  prizeWon?: number | null;
}

const CARD_WIDTH = 300;
const CARD_HEIGHT = 300;
const GRID_SIZE = 3;
const CELL_SIZE = CARD_WIDTH / GRID_SIZE;
const SCRATCH_RADIUS = 25;
const REVEAL_THRESHOLD = 0.6; // 60% raspado para revelar

export function ScratchCard({
  symbols,
  coverImage,
  onReveal,
  isRevealed: externalRevealed = false,
  prizeWon,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isRevealed, setIsRevealed] = useState(externalRevealed);
  const [hasCheckedWin, setHasCheckedWin] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Verificar se há 3 símbolos iguais
  const checkWin = useCallback(() => {
    if (symbols.length !== 9) return { isWinner: false, prize: 0 };

    // Contar ocorrências de cada símbolo
    const symbolCounts: Record<string, { count: number; prize: number }> = {};
    
    symbols.forEach(s => {
      if (!symbolCounts[s.symbol_id]) {
        symbolCounts[s.symbol_id] = { count: 0, prize: 0 };
      }
      symbolCounts[s.symbol_id].count++;
    });

    // Verificar se algum símbolo aparece 3+ vezes
    for (const [symbolId, data] of Object.entries(symbolCounts)) {
      if (data.count >= 3) {
        const symbol = symbols.find(s => s.symbol_id === symbolId);
        // Encontrar o prêmio associado (vamos assumir que está nos símbolos)
        return { isWinner: true, prize: prizeWon || 0, symbolId };
      }
    }

    return { isWinner: false, prize: 0 };
  }, [symbols, prizeWon]);

  // Inicializar canvas com cobertura
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Preencher com cor/pattern de cobertura
    if (coverImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CARD_WIDTH, CARD_HEIGHT);
      };
      img.src = coverImage;
    } else {
      // Gradiente padrão
      const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(0.5, '#8b5cf6');
      gradient.addColorStop(1, '#a855f7');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

      // Adicionar texto
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('RASPE AQUI', CARD_WIDTH / 2, CARD_HEIGHT / 2 - 20);
      
      ctx.font = '16px sans-serif';
      ctx.fillText('🎰 🎰 🎰', CARD_WIDTH / 2, CARD_HEIGHT / 2 + 20);

      // Adicionar partículas decorativas
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(
          Math.random() * CARD_WIDTH,
          Math.random() * CARD_HEIGHT,
          Math.random() * 3 + 1,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  }, [coverImage, isRevealed]);

  // Calcular porcentagem raspada
  const calculateScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, CARD_WIDTH, CARD_HEIGHT);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    return transparentPixels / (pixels.length / 4);
  }, []);

  // Função de raspar
  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    
    // Se temos posição anterior, desenhar linha
    if (lastPosRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.lineWidth = SCRATCH_RADIUS * 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Desenhar círculo na posição atual
    ctx.beginPath();
    ctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    lastPosRef.current = { x, y };

    // Calcular porcentagem
    const percentage = calculateScratchPercentage();
    setScratchPercentage(percentage);

    // Verificar se deve revelar
    if (percentage >= REVEAL_THRESHOLD && !hasCheckedWin) {
      setHasCheckedWin(true);
      setIsRevealed(true);
      
      const result = checkWin();
      if (result.isWinner) {
        // Animação de vitória
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#ffb700', '#ff9500', '#ffffff'],
        });
      }
      onReveal?.(result.isWinner, result.prize);
    }
  }, [isRevealed, hasCheckedWin, calculateScratchPercentage, checkWin, onReveal]);

  // Event handlers
  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = CARD_WIDTH / rect.width;
    const scaleY = CARD_HEIGHT / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(true);
    const pos = getPosition(e);
    lastPosRef.current = pos;
    scratch(pos.x, pos.y);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching) return;
    e.preventDefault();
    const pos = getPosition(e);
    scratch(pos.x, pos.y);
  };

  const handleEnd = () => {
    setIsScratching(false);
    lastPosRef.current = null;
  };

  const revealAll = () => {
    setIsRevealed(true);
    if (!hasCheckedWin) {
      setHasCheckedWin(true);
      const result = checkWin();
      if (result.isWinner) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      onReveal?.(result.isWinner, result.prize);
    }
  };

  // Encontrar símbolos que formam trio vencedor
  const winResult = checkWin();
  const winningSymbolId = winResult.isWinner ? 
    symbols.find((_, i, arr) => {
      const count = arr.filter(s => s.symbol_id === arr[i].symbol_id).length;
      return count >= 3;
    })?.symbol_id : null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Card da Raspadinha */}
      <Card className="relative overflow-hidden p-1 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500">
        <div 
          className="relative rounded-lg overflow-hidden"
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
        >
          {/* Camada de símbolos (por baixo) */}
          <div 
            className="absolute inset-0 grid grid-cols-3 grid-rows-3 bg-white"
            style={{ 
              opacity: isRevealed ? 1 : 1,
              pointerEvents: 'none',
            }}
          >
            {symbols.map((symbol, index) => {
              const isWinningSymbol = symbol.symbol_id === winningSymbolId;
              
              return (
                <div
                  key={index}
                  className={`
                    flex items-center justify-center p-2 border border-gray-100
                    transition-all duration-300
                    ${isRevealed && isWinningSymbol ? 'bg-yellow-100 animate-pulse' : 'bg-white'}
                  `}
                >
                  {symbol.image_url ? (
                    <img 
                      src={symbol.image_url} 
                      alt={symbol.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-4xl">{symbol.name}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Camada de raspar (por cima) */}
          {!isRevealed && (
            <canvas
              ref={canvasRef}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              className="absolute inset-0 cursor-crosshair touch-none"
              style={{ width: '100%', height: '100%' }}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />
          )}

          {/* Overlay de vitória */}
          {isRevealed && winResult.isWinner && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-yellow-500/90 text-white px-6 py-3 rounded-full font-bold text-xl animate-scale-in shadow-lg flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                GANHOU!
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Barra de progresso */}
      {!isRevealed && (
        <div className="w-full max-w-[300px] space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Raspado</span>
            <span>{Math.round(scratchPercentage * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${scratchPercentage * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Resultado */}
      {isRevealed && (
        <Card className={`
          w-full max-w-[300px] p-4 text-center animate-fade-in
          ${winResult.isWinner 
            ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-400' 
            : 'bg-muted/50'
          }
        `}>
          {winResult.isWinner ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-yellow-600">
                <Sparkles className="h-5 w-5" />
                <span className="font-bold text-lg">Parabéns!</span>
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-yellow-700">
                R$ {(prizeWon || 0).toFixed(2)}
              </p>
              <p className="text-sm text-yellow-600/80">
                Prêmio creditado na sua carteira!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground">Não foi dessa vez...</p>
              <p className="text-sm text-muted-foreground">
                Tente novamente! A sorte pode estar no próximo!
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Botão revelar tudo */}
      {!isRevealed && scratchPercentage > 0.1 && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={revealAll}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Revelar Tudo
        </Button>
      )}
    </div>
  );
}

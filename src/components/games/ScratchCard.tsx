import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScratchSymbolResult } from '@/types';
import { Trophy, Sparkles, Plus, Wallet, RotateCcw } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

// =============================================================================
// TYPES
// =============================================================================

interface ScratchCardProps {
  symbols: ScratchSymbolResult[];
  coverImage?: string;
  onReveal?: (isWinner: boolean, prize: number) => void;
  isRevealed?: boolean;
  prizeWon?: number | null;
  onBuyAgain?: () => void;
  isBuying?: boolean;
  canBuyAgain?: boolean;
  price?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CARD_WIDTH = 300;
const CARD_HEIGHT = 300;
const GRID_SIZE = 3;
const SCRATCH_RADIUS = 30;
const REVEAL_THRESHOLD = 0.55; // 55% raspado para revelar automaticamente

// =============================================================================
// COMPONENT
// =============================================================================

export function ScratchCard({
  symbols,
  coverImage,
  onReveal,
  isRevealed: externalRevealed = false,
  prizeWon,
  onBuyAgain,
  isBuying = false,
  canBuyAgain = true,
  price,
}: ScratchCardProps) {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasCalledRevealRef = useRef(false);
  const lastScratchSoundRef = useRef(0);
  
  // State
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isRevealed, setIsRevealed] = useState(externalRevealed);
  
  // Hooks
  const { playScratch, playReveal, playWin, playBigWin } = useSoundEffects();

  // Determinar se é vitória baseado no prize_won (fonte da verdade do servidor)
  const isWinner = prizeWon !== null && prizeWon !== undefined && prizeWon > 0;

  // ==========================================================================
  // RESET quando uma nova chance é carregada
  // ==========================================================================
  useEffect(() => {
    setIsRevealed(externalRevealed);
    setScratchPercentage(0);
    hasCalledRevealRef.current = externalRevealed;
    lastPosRef.current = null;
  }, [externalRevealed, symbols]);

  // ==========================================================================
  // INICIALIZAR CANVAS com cobertura
  // ==========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';

    if (coverImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, 0, CARD_WIDTH, CARD_HEIGHT);
      };
      img.src = coverImage;
    } else {
      // Gradiente padrão moderno
      const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
      gradient.addColorStop(0, '#f59e0b');
      gradient.addColorStop(0.5, '#f97316');
      gradient.addColorStop(1, '#ea580c');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

      // Texto principal
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('RASPE AQUI', CARD_WIDTH / 2, CARD_HEIGHT / 2 - 20);

      // Subtexto
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('🎰 Boa sorte! 🎰', CARD_WIDTH / 2, CARD_HEIGHT / 2 + 20);

      // Partículas decorativas
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.4})`;
        ctx.beginPath();
        ctx.arc(
          Math.random() * CARD_WIDTH,
          Math.random() * CARD_HEIGHT,
          Math.random() * 4 + 1,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  }, [coverImage, isRevealed, symbols]);

  // ==========================================================================
  // CALCULAR porcentagem raspada
  // ==========================================================================
  const calculateScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, CARD_WIDTH, CARD_HEIGHT);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentPixels++;
    }

    return transparentPixels / (pixels.length / 4);
  }, []);

  // ==========================================================================
  // FUNÇÃO DE RASPAR
  // ==========================================================================
  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';

    // Desenhar linha se houver posição anterior
    if (lastPosRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.lineWidth = SCRATCH_RADIUS * 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Círculo na posição atual
    ctx.beginPath();
    ctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    lastPosRef.current = { x, y };

    // Som de raspar (throttled)
    const now = Date.now();
    if (now - lastScratchSoundRef.current > 80) {
      playScratch();
      lastScratchSoundRef.current = now;
    }

    // Calcular porcentagem
    const percentage = calculateScratchPercentage();
    setScratchPercentage(percentage);

    // Auto-revelar quando atingir threshold
    if (percentage >= REVEAL_THRESHOLD && !hasCalledRevealRef.current) {
      hasCalledRevealRef.current = true;
      setIsRevealed(true);
      triggerReveal();
    }
  }, [isRevealed, calculateScratchPercentage, playScratch]);

  // ==========================================================================
  // TRIGGER REVEAL
  // ==========================================================================
  const triggerReveal = useCallback(() => {
    playReveal();
    
    if (isWinner) {
      setTimeout(() => {
        if ((prizeWon || 0) >= 50) {
          playBigWin();
        } else {
          playWin();
        }
      }, 300);
    }
    
    onReveal?.(isWinner, prizeWon || 0);
  }, [isWinner, prizeWon, onReveal, playReveal, playWin, playBigWin]);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================
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
    }
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
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

  const handleRevealAll = () => {
    if (hasCalledRevealRef.current) return;
    hasCalledRevealRef.current = true;
    setIsRevealed(true);
    triggerReveal();
  };

  // Encontrar símbolo vencedor para highlight visual
  const winningSymbolId = isWinner ? (() => {
    const counts: Record<string, number> = {};
    for (const s of symbols) {
      counts[s.symbol_id] = (counts[s.symbol_id] || 0) + 1;
    }
    return Object.entries(counts).find(([_, count]) => count >= 3)?.[0] || null;
  })() : null;

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[320px]">
      {/* Card Principal */}
      <Card className="relative overflow-hidden p-1.5 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-xl">
        <div
          className="relative rounded-lg overflow-hidden bg-white"
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
        >
          {/* Grid de Símbolos */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            {symbols.map((symbol, index) => {
              const isWinningSymbol = symbol.symbol_id === winningSymbolId;

              return (
                <motion.div
                  key={`${symbol.symbol_id}-${index}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: isRevealed ? 1 : 0.9, 
                    opacity: 1,
                  }}
                  transition={{ delay: isRevealed ? index * 0.05 : 0, duration: 0.3 }}
                  className={`
                    flex items-center justify-center p-2 border border-gray-100
                    transition-all duration-300
                    ${isRevealed && isWinningSymbol 
                      ? 'bg-gradient-to-br from-yellow-100 to-amber-200 ring-2 ring-yellow-400' 
                      : 'bg-white'
                    }
                  `}
                >
                  {symbol.image_url ? (
                    <img
                      src={symbol.image_url}
                      alt={symbol.name}
                      className={`w-full h-full object-contain ${
                        isRevealed && isWinningSymbol ? 'animate-pulse' : ''
                      }`}
                    />
                  ) : (
                    <span className="text-4xl">{symbol.name}</span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Canvas de Raspar */}
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

          {/* Badge de Vitória */}
          <AnimatePresence>
            {isRevealed && isWinner && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-6 py-3 rounded-full font-bold text-xl shadow-lg flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  GANHOU!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Barra de Progresso */}
      {!isRevealed && (
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progresso</span>
            <span>{Math.round(scratchPercentage * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${scratchPercentage * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          
          {/* Botão Revelar Tudo */}
          {scratchPercentage > 0.15 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevealAll}
                className="w-full gap-2 mt-2"
              >
                <RotateCcw className="h-4 w-4" />
                Revelar Tudo
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* Resultado */}
      <AnimatePresence mode="wait">
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <Card className={`
              p-5 text-center
              ${isWinner
                ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-300'
                : 'bg-muted/50 border-muted'
              }
            `}>
              {isWinner ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-amber-600">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-bold text-lg">Parabéns!</span>
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold text-amber-700">
                    R$ {(prizeWon || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-amber-600/80">
                    Prêmio creditado na sua carteira!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-muted-foreground">
                    Não foi dessa vez...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tente novamente! A sorte pode estar na próxima!
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão Comprar Novamente */}
      <AnimatePresence>
        {isRevealed && onBuyAgain && price !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="w-full space-y-3"
          >
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            >
              <Button
                onClick={onBuyAgain}
                disabled={isBuying || !canBuyAgain}
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg text-white font-semibold"
              >
                {isBuying ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      ⏳
                    </motion.span>
                    Comprando...
                  </span>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Comprar Novamente - R$ {price.toFixed(2)}
                  </>
                )}
              </Button>
            </motion.div>

            {!canBuyAgain && (
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link to="/carteira">
                  <Wallet className="h-4 w-4" />
                  Adicionar Créditos
                </Link>
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

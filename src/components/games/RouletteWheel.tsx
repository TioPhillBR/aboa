import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@/types';
import { Trophy, Play, Sparkles, Zap } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface RouletteWheelProps {
  participants: Profile[];
  onWinnerSelected?: (winner: Profile) => void;
  isSpinning?: boolean;
  onSpinStart?: () => void;
  winner?: Profile | null;
  autoSpin?: boolean;
  raffleTitle?: string;
}

const ITEM_HEIGHT = 100;
const VISIBLE_ITEMS = 5;

export function RouletteWheel({
  participants,
  onWinnerSelected,
  isSpinning: externalSpinning,
  onSpinStart,
  winner: externalWinner,
  autoSpin = false,
  raffleTitle = 'Sorteio',
}: RouletteWheelProps) {
  const [internalSpinning, setInternalSpinning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [winner, setWinner] = useState<Profile | null>(externalWinner || null);
  const [offset, setOffset] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'accelerating' | 'spinning' | 'slowing' | 'countdown' | 'reveal'>('idle');
  const [glowIntensity, setGlowIntensity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const { playClick, playSuccess, playBigWin, playNotification } = useSoundEffects();

  const isSpinning = externalSpinning ?? internalSpinning;

  // Duplicar participantes para efeito infinito
  const extendedParticipants = [...participants, ...participants, ...participants, ...participants, ...participants];
  const totalHeight = participants.length * ITEM_HEIGHT;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const triggerEpicConfetti = useCallback(() => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 100, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    // Primeira explosão
    confetti({
      ...defaults,
      particleCount: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
    });

    // Explosões contínuas
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        ...defaults,
        particleCount: 3,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500'],
      });
      confetti({
        ...defaults,
        particleCount: 3,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FF6B6B', '#4ECDC4'],
      });
    }, 100);

    // Fogos finais
    setTimeout(() => {
      const count = 200;
      const defaults2 = { origin: { y: 0.7 } };

      confetti({
        ...defaults2,
        spread: 100,
        particleCount: count,
        origin: { x: 0.5, y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
      });
    }, 500);
  }, []);

  const startSpin = useCallback(() => {
    if (participants.length < 2) return;

    setWinner(null);
    setCountdown(null);
    setPhase('accelerating');
    onSpinStart?.();
    setInternalSpinning(true);
    playClick();

    // Selecionar vencedor aleatório
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const selectedWinner = participants[winnerIndex];

    let currentOffset = offset;
    let currentSpeed = 0;
    const startTime = Date.now();
    const totalDuration = 10000; // 10 segundos total
    const accelerationTime = 1500; // 1.5s para acelerar
    const maxSpeedTime = 4000; // 4s em velocidade máxima
    const slowDownStart = accelerationTime + maxSpeedTime;
    const countdownStart = totalDuration - 5000; // 5 segundos finais
    const maxSpeed = 60;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < accelerationTime) {
        // Fase de aceleração
        const progress = elapsed / accelerationTime;
        currentSpeed = maxSpeed * easeOutCubic(progress);
        setGlowIntensity(progress * 0.5);
        if (phase !== 'accelerating') setPhase('accelerating');
      } else if (elapsed < slowDownStart) {
        // Velocidade máxima
        currentSpeed = maxSpeed;
        setGlowIntensity(0.5 + Math.sin(elapsed / 100) * 0.1);
        if (phase !== 'spinning') setPhase('spinning');
      } else if (elapsed < countdownStart) {
        // Começando a desacelerar
        const slowProgress = (elapsed - slowDownStart) / (countdownStart - slowDownStart);
        currentSpeed = maxSpeed * (1 - easeInCubic(slowProgress) * 0.6);
        setGlowIntensity(0.5 - slowProgress * 0.2);
        if (phase !== 'slowing') setPhase('slowing');
      } else if (elapsed < totalDuration) {
        // Contagem regressiva - últimos 5 segundos
        const remaining = Math.ceil((totalDuration - elapsed) / 1000);
        if (remaining !== countdown) {
          setCountdown(remaining);
          playNotification();
        }
        
        const countdownProgress = (elapsed - countdownStart) / (totalDuration - countdownStart);
        currentSpeed = maxSpeed * 0.4 * (1 - easeInCubic(countdownProgress));
        setGlowIntensity(0.8 + Math.sin(elapsed / 50) * 0.2);
        if (phase !== 'countdown') setPhase('countdown');
      } else {
        // Revelar vencedor
        setCountdown(null);
        setPhase('reveal');
        setGlowIntensity(1);
        setInternalSpinning(false);

        // Ajustar para centralizar o vencedor
        const finalOffset = winnerIndex * ITEM_HEIGHT;
        setOffset(finalOffset);
        setWinner(selectedWinner);
        
        // Efeitos de vitória
        playBigWin();
        triggerEpicConfetti();
        
        setTimeout(() => {
          onWinnerSelected?.(selectedWinner);
        }, 500);
        
        return;
      }

      currentOffset += currentSpeed;
      
      // Loop infinito
      if (currentOffset >= totalHeight * 2) {
        currentOffset = currentOffset % totalHeight;
      }
      
      setOffset(currentOffset);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [participants, offset, totalHeight, countdown, phase, onSpinStart, onWinnerSelected, triggerEpicConfetti, playClick, playNotification, playBigWin]);

  // Easing functions
  const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
  const easeInCubic = (x: number): number => x * x * x;

  useEffect(() => {
    if (autoSpin && participants.length >= 2) {
      setTimeout(startSpin, 1000);
    }
  }, [autoSpin, participants.length]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (externalWinner) {
      setWinner(externalWinner);
      setPhase('reveal');
    }
  }, [externalWinner]);

  if (participants.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum participante ainda</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Título do Sorteio */}
      {isSpinning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Badge className="mb-2 bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse">
            <Zap className="w-3 h-3 mr-1" />
            AO VIVO
          </Badge>
          <h3 className="text-xl font-bold">{raffleTitle}</h3>
        </motion.div>
      )}

      {/* Container da Roleta */}
      <div className="relative w-full max-w-md">
        {/* Efeito de brilho animado */}
        <motion.div
          className="absolute inset-0 -m-4 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: isSpinning
              ? [
                  `0 0 ${20 * glowIntensity}px ${10 * glowIntensity}px rgba(139, 92, 246, ${glowIntensity * 0.3})`,
                  `0 0 ${30 * glowIntensity}px ${15 * glowIntensity}px rgba(236, 72, 153, ${glowIntensity * 0.3})`,
                  `0 0 ${20 * glowIntensity}px ${10 * glowIntensity}px rgba(139, 92, 246, ${glowIntensity * 0.3})`,
                ]
              : 'none',
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />

        {/* Indicador central com animação */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="flex items-center">
            <motion.div 
              className="flex-1 h-1 rounded-full"
              style={{
                background: 'linear-gradient(to right, transparent, hsl(var(--primary)))',
              }}
              animate={isSpinning ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            <motion.div 
              className="w-6 h-6 rotate-45 bg-gradient-to-br from-primary to-purple-600 shadow-lg"
              animate={isSpinning ? { 
                scale: [1, 1.2, 1],
                rotate: [45, 45, 45],
              } : {}}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            <motion.div 
              className="flex-1 h-1 rounded-full"
              style={{
                background: 'linear-gradient(to left, transparent, hsl(var(--primary)))',
              }}
              animate={isSpinning ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Sombras superior e inferior */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background via-background/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/80 to-transparent z-10 pointer-events-none" />

        {/* Container dos itens */}
        <motion.div
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-b from-card to-card/50"
          style={{ height: VISIBLE_ITEMS * ITEM_HEIGHT }}
          animate={{
            borderColor: isSpinning 
              ? ['hsl(var(--primary) / 0.3)', 'hsl(var(--primary) / 0.8)', 'hsl(var(--primary) / 0.3)']
              : 'hsl(var(--primary) / 0.3)',
          }}
          transition={{ duration: 0.5, repeat: isSpinning ? Infinity : 0 }}
        >
          <div
            className="absolute inset-x-0"
            style={{
              transform: `translateY(${(VISIBLE_ITEMS / 2) * ITEM_HEIGHT - offset - ITEM_HEIGHT / 2}px)`,
            }}
          >
            {extendedParticipants.map((participant, index) => {
              const itemPosition = index * ITEM_HEIGHT;
              const centerOffset = (VISIBLE_ITEMS / 2) * ITEM_HEIGHT;
              const relativePosition = itemPosition - offset;
              const distanceFromCenter = Math.abs(relativePosition - centerOffset + ITEM_HEIGHT / 2);
              const isCenter = distanceFromCenter < ITEM_HEIGHT / 2;
              const normalizedDistance = Math.min(distanceFromCenter / (ITEM_HEIGHT * 2.5), 1);
              const scale = isCenter && !isSpinning ? 1.15 : 1 - normalizedDistance * 0.15;
              const opacity = 1 - normalizedDistance * 0.7;
              const blur = normalizedDistance * 2;

              return (
                <div
                  key={`${participant.id}-${index}`}
                  className="flex items-center gap-4 px-6"
                  style={{
                    height: ITEM_HEIGHT,
                    transform: `scale(${scale})`,
                    opacity,
                    filter: isSpinning && !isCenter ? `blur(${blur}px)` : 'none',
                    transition: isSpinning ? 'none' : 'all 0.3s ease',
                  }}
                >
                  <div className={`relative ${isCenter && phase === 'reveal' ? 'animate-pulse' : ''}`}>
                    <Avatar className={`h-16 w-16 border-3 shadow-xl transition-all ${
                      isCenter 
                        ? 'border-primary ring-4 ring-primary/20' 
                        : 'border-primary/20'
                    }`}>
                      <AvatarImage src={participant.avatar_url || undefined} alt={participant.full_name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground text-lg font-bold">
                        {getInitials(participant.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {isCenter && isSpinning && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-yellow-400"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-lg truncate transition-all ${
                      isCenter ? 'text-primary' : ''
                    }`}>
                      {participant.full_name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Contagem regressiva épica */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            >
              <motion.div
                className="relative"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {/* Círculos de pulso */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/20"
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ width: 120, height: 120, margin: 'auto', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/30"
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                  style={{ width: 120, height: 120, margin: 'auto', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                
                {/* Número */}
                <div className="bg-gradient-to-br from-primary to-purple-600 backdrop-blur-sm rounded-full w-28 h-28 flex items-center justify-center shadow-2xl border-4 border-white/20">
                  <motion.span
                    key={countdown}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-bold text-white"
                  >
                    {countdown}
                  </motion.span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicador de fase */}
        {isSpinning && phase !== 'countdown' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
          >
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {phase === 'accelerating' && 'Acelerando...'}
              {phase === 'spinning' && 'Girando!'}
              {phase === 'slowing' && 'Desacelerando...'}
            </Badge>
          </motion.div>
        )}
      </div>

      {/* Vencedor */}
      <AnimatePresence>
        {winner && !isSpinning && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="w-full max-w-md"
          >
            <Card className="p-6 bg-gradient-to-br from-yellow-500/20 via-primary/10 to-purple-500/20 border-2 border-yellow-500/50 shadow-xl overflow-hidden relative">
              {/* Partículas decorativas */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400/30 rounded-full"
                    initial={{ 
                      x: Math.random() * 400, 
                      y: Math.random() * 200,
                      scale: 0 
                    }}
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{ 
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-4 relative">
                <motion.div 
                  className="relative"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Avatar className="h-24 w-24 border-4 border-yellow-500 shadow-xl ring-4 ring-yellow-500/30">
                    <AvatarImage src={winner.avatar_url || undefined} alt={winner.full_name} />
                    <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white text-3xl font-bold">
                      {getInitials(winner.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div 
                    className="absolute -top-3 -right-3 bg-yellow-500 rounded-full p-2 shadow-lg"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Trophy className="h-6 w-6 text-white" />
                  </motion.div>
                </motion.div>
                <div>
                  <motion.div
                    className="flex items-center gap-2 mb-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-600">VENCEDOR!</span>
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                  </motion.div>
                  <motion.p 
                    className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {winner.full_name}
                  </motion.p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão de girar */}
      {!isSpinning && !winner && participants.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            onClick={startSpin}
            className="gap-3 text-xl px-10 py-7 bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-pink-600/90 shadow-xl hover:shadow-2xl transition-all border-0"
          >
            <Play className="h-7 w-7" />
            Iniciar Sorteio
          </Button>
        </motion.div>
      )}

      {/* Contador de participantes */}
      {!isSpinning && !winner && (
        <p className="text-muted-foreground text-center flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {participants.length}
          </span>
          participantes no sorteio
        </p>
      )}

      {participants.length < 2 && (
        <p className="text-muted-foreground text-center">
          Mínimo de 2 participantes necessários para iniciar o sorteio
        </p>
      )}
    </div>
  );
}

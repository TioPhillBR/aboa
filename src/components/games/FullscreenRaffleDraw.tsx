import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Profile, RafflePrize } from '@/types';
import { Trophy, Play, Sparkles, Zap, X, Crown, Gift, ArrowRight } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import logoABoa from '@/assets/logo-a-boa.png';

interface FullscreenRaffleDrawProps {
  participants: Profile[];
  raffleTitle: string;
  ticketsSold: number;
  open: boolean;
  onClose: () => void;
  onWinnerSelected: (winner: Profile, prize: RafflePrize) => void;
  onAllPrizesDrawn?: () => void;
  prizes: RafflePrize[];
  winner?: Profile | null;
}

const ITEM_HEIGHT = 120;
const VISIBLE_ITEMS = 5;

export function FullscreenRaffleDraw({
  participants,
  raffleTitle,
  ticketsSold,
  open,
  onClose,
  onWinnerSelected,
  onAllPrizesDrawn,
  prizes,
  winner: externalWinner,
}: FullscreenRaffleDrawProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [winner, setWinner] = useState<Profile | null>(externalWinner || null);
  const [offset, setOffset] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'accelerating' | 'spinning' | 'slowing' | 'countdown' | 'reveal'>('idle');
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [drawnWinners, setDrawnWinners] = useState<Map<string, Profile>>(new Map());
  const [allDone, setAllDone] = useState(false);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const animationRef = useRef<number>();
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout>();
  const autoAdvanceCountdownRef = useRef<NodeJS.Timeout>();
  const { playClick, playBigWin, playDrumHit } = useSoundEffects();

  // Filter out prizes that already have winners (from DB)
  const undrawnPrizes = prizes.filter(p => !p.winner_id && !drawnWinners.has(p.id));
  const currentPrize = undrawnPrizes.length > 0 ? undrawnPrizes[0] : null;
  const totalPrizes = prizes.length;
  const drawnCount = prizes.filter(p => p.winner_id).length + drawnWinners.size;

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
    const duration = 8000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 10000 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    confetti({
      ...defaults,
      particleCount: 200,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
    });

    setTimeout(() => {
      confetti({ ...defaults, particleCount: 100, origin: { x: 0, y: 0 } });
      confetti({ ...defaults, particleCount: 100, origin: { x: 1, y: 0 } });
      confetti({ ...defaults, particleCount: 100, origin: { x: 0, y: 1 } });
      confetti({ ...defaults, particleCount: 100, origin: { x: 1, y: 1 } });
    }, 300);

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) { clearInterval(interval); return; }
      confetti({ ...defaults, particleCount: 5, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#FFD700', '#FFA500'] });
      confetti({ ...defaults, particleCount: 5, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#FF6B6B', '#4ECDC4'] });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
  const easeInCubic = (x: number): number => x * x * x;

  const startSpin = useCallback(() => {
    if (participants.length < 2 || !currentPrize) return;

    setWinner(null);
    setCountdown(null);
    setPhase('accelerating');
    setIsSpinning(true);
    playClick();

    const winnerIndex = Math.floor(Math.random() * participants.length);
    const selectedWinner = participants[winnerIndex];

    let currentOffset = offset;
    let currentSpeed = 0;
    const startTime = Date.now();
    const totalDuration = 10000;
    const accelerationTime = 1500;
    const maxSpeedTime = 4000;
    const slowDownStart = accelerationTime + maxSpeedTime;
    const countdownStart = totalDuration - 5000;
    const maxSpeed = 70;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < accelerationTime) {
        const progress = elapsed / accelerationTime;
        currentSpeed = maxSpeed * easeOutCubic(progress);
        setGlowIntensity(progress * 0.5);
      } else if (elapsed < slowDownStart) {
        currentSpeed = maxSpeed;
        setGlowIntensity(0.5 + Math.sin(elapsed / 100) * 0.1);
      } else if (elapsed < countdownStart) {
        const slowProgress = (elapsed - slowDownStart) / (countdownStart - slowDownStart);
        currentSpeed = maxSpeed * (1 - easeInCubic(slowProgress) * 0.6);
        setGlowIntensity(0.5 - slowProgress * 0.2);
      } else if (elapsed < totalDuration) {
        const remaining = Math.ceil((totalDuration - elapsed) / 1000);
        if (remaining !== countdown) {
          setCountdown(remaining);
          playDrumHit();
        }
        
        const countdownProgress = (elapsed - countdownStart) / (totalDuration - countdownStart);
        currentSpeed = maxSpeed * 0.4 * (1 - easeInCubic(countdownProgress));
        setGlowIntensity(0.8 + Math.sin(elapsed / 50) * 0.2);
      } else {
        setCountdown(null);
        setPhase('reveal');
        setGlowIntensity(1);
        setIsSpinning(false);

        const finalOffset = winnerIndex * ITEM_HEIGHT;
        setOffset(finalOffset);
        setWinner(selectedWinner);
        
        playBigWin();
        triggerEpicConfetti();
        
        // Save winner for this prize
        setDrawnWinners(prev => new Map(prev).set(currentPrize!.id, selectedWinner));
        
        setTimeout(() => {
          onWinnerSelected(selectedWinner, currentPrize!);
        }, 500);

        // Auto-advance after 5 seconds
        const remainingPrizes = prizes.filter(p => !p.winner_id && !drawnWinners.has(p.id) && p.id !== currentPrize!.id);
        setAutoAdvanceCountdown(5);
        let count = 5;
        autoAdvanceCountdownRef.current = setInterval(() => {
          count--;
          setAutoAdvanceCountdown(count);
          if (count <= 0) {
            clearInterval(autoAdvanceCountdownRef.current!);
            setAutoAdvanceCountdown(null);
            if (remainingPrizes.length > 0) {
              // Go to next prize
              setWinner(null);
              setPhase('idle');
              setOffset(0);
            } else {
              // Last prize - finalize
              setAllDone(true);
              onAllPrizesDrawn?.();
            }
          }
        }, 1000);
        
        return;
      }

      currentOffset += currentSpeed;
      
      if (currentOffset >= totalHeight * 2) {
        currentOffset = currentOffset % totalHeight;
      }
      
      setOffset(currentOffset);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [participants, offset, totalHeight, countdown, currentPrize, triggerEpicConfetti, playClick, playDrumHit, playBigWin, onWinnerSelected]);

  const goToNextPrize = useCallback(() => {
    setWinner(null);
    setPhase('idle');
    setOffset(0);
    
    // Check if all prizes are drawn
    const remainingAfterCurrent = prizes.filter(p => !p.winner_id && !drawnWinners.has(p.id));
    if (remainingAfterCurrent.length === 0) {
      setAllDone(true);
      onAllPrizesDrawn?.();
    }
  }, [prizes, drawnWinners, onAllPrizesDrawn]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      if (autoAdvanceCountdownRef.current) {
        clearInterval(autoAdvanceCountdownRef.current);
      }
    };
  }, []);

  // Auto-start spin when returning to idle after auto-advance
  const autoStartRef = useRef(false);
  useEffect(() => {
    if (phase === 'idle' && !winner && !allDone && drawnWinners.size > 0 && currentPrize) {
      // This means we just auto-advanced; auto-start the next spin
      const timer = setTimeout(() => {
        startSpin();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, winner, allDone, drawnWinners.size, currentPrize]);

  useEffect(() => {
    if (externalWinner) {
      setWinner(externalWinner);
      setPhase('reveal');
    }
  }, [externalWinner]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-background via-background to-primary/10 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Fundo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
            }}
            animate={{ 
              y: [null, -100],
              opacity: [0, 1, 0],
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <img src={logoABoa} alt="A Boa" className="h-12 w-auto" />
        </div>
        
        {!isSpinning && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-12 w-12 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
          >
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Badge AO VIVO + Prize Counter */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        {isSpinning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="px-6 py-2 text-lg bg-gradient-to-r from-red-500 to-orange-500 animate-pulse shadow-lg">
              <Zap className="w-5 h-5 mr-2" />
              AO VIVO
            </Badge>
          </motion.div>
        )}
        
        {/* Prize progress indicator */}
        {totalPrizes > 1 && (
          <Badge variant="secondary" className="px-4 py-1.5 text-sm bg-background/80 backdrop-blur-sm">
            <Gift className="w-4 h-4 mr-2" />
            Prêmio {drawnCount + (allDone ? 0 : 1)} de {totalPrizes}
          </Badge>
        )}
      </div>

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4 mt-24"
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
          {raffleTitle}
        </h1>
        <p className="text-muted-foreground text-lg">
          {participants.length} participantes • {ticketsSold} tickets vendidos
        </p>
      </motion.div>

      {/* Current Prize Info */}
      {currentPrize && !allDone && (
        <motion.div
          key={currentPrize.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <div className="bg-card/80 backdrop-blur-sm border border-primary/30 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Sorteando</p>
              <p className="font-bold text-lg">{currentPrize.name}</p>
              {currentPrize.estimated_value && (
                <p className="text-sm text-primary font-medium">R$ {currentPrize.estimated_value.toFixed(2)}</p>
              )}
            </div>
            {currentPrize.image_url && (
              <img src={currentPrize.image_url} alt={currentPrize.name} className="h-14 w-14 rounded-lg object-cover ml-2" />
            )}
          </div>
        </motion.div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 flex items-center justify-center w-full max-w-4xl px-4">
        <AnimatePresence mode="wait">
          {/* All prizes drawn - final summary */}
          {allDone && (
            <motion.div
              key="all-done"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center w-full max-w-2xl space-y-8"
            >
              <motion.div
                animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Trophy className="h-20 w-20 text-yellow-500 mx-auto" />
              </motion.div>
              
              <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
                Todos os prêmios sorteados!
              </h2>
              
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {prizes.map((prize) => {
                  const prizeWinner = drawnWinners.get(prize.id);
                  return (
                    <div key={prize.id} className="flex items-center gap-4 bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-primary/20">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Gift className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-bold truncate">{prize.name}</p>
                        {prize.estimated_value && (
                          <p className="text-sm text-primary">R$ {prize.estimated_value.toFixed(2)}</p>
                        )}
                      </div>
                      {prizeWinner && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Avatar className="h-10 w-10 border-2 border-yellow-500">
                            <AvatarImage src={prizeWinner.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white text-xs font-bold">
                              {getInitials(prizeWinner.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="text-sm font-medium">{prizeWinner.full_name}</p>
                            <p className="text-xs text-yellow-500 flex items-center gap-1">
                              <Crown className="h-3 w-3" /> Vencedor
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button
                size="lg"
                onClick={onClose}
                className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-xl rounded-xl"
              >
                Fechar
              </Button>
            </motion.div>
          )}

          {/* Estado inicial - Botão de iniciar */}
          {!isSpinning && !winner && !allDone && (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-8"
            >
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4 max-w-lg mx-auto">
                {participants.slice(0, 10).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Avatar className="h-14 w-14 md:h-16 md:w-16 mx-auto border-2 border-primary/30">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-bold">
                        {getInitials(p.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                ))}
              </div>
              
              {participants.length > 10 && (
                <p className="text-muted-foreground">
                  +{participants.length - 10} participantes
                </p>
              )}

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={startSpin}
                  className="gap-4 text-2xl px-12 py-8 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 shadow-2xl transition-all rounded-2xl"
                >
                  <Play className="h-8 w-8" />
                  {drawnCount > 0 ? 'SORTEAR PRÓXIMO PRÊMIO' : 'INICIAR SORTEIO'}
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Roleta girando */}
          {isSpinning && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-xl"
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 -m-8 rounded-3xl pointer-events-none"
                  animate={{
                    boxShadow: [
                      `0 0 ${40 * glowIntensity}px ${20 * glowIntensity}px rgba(139, 92, 246, ${glowIntensity * 0.4})`,
                      `0 0 ${60 * glowIntensity}px ${30 * glowIntensity}px rgba(236, 72, 153, ${glowIntensity * 0.4})`,
                      `0 0 ${40 * glowIntensity}px ${20 * glowIntensity}px rgba(139, 92, 246, ${glowIntensity * 0.4})`,
                    ],
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />

                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <div className="flex items-center">
                    <motion.div 
                      className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-transparent via-primary to-primary"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    />
                    <motion.div 
                      className="w-8 h-8 rotate-45 bg-gradient-to-br from-primary to-purple-600 shadow-lg border-2 border-white/20"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    />
                    <motion.div 
                      className="flex-1 h-1.5 rounded-full bg-gradient-to-l from-transparent via-primary to-primary"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    />
                  </div>
                </div>

                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent z-10 pointer-events-none" />

                <motion.div
                  className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm"
                  style={{ height: VISIBLE_ITEMS * ITEM_HEIGHT }}
                  animate={{
                    borderColor: ['hsl(var(--primary) / 0.4)', 'hsl(var(--primary) / 0.9)', 'hsl(var(--primary) / 0.4)'],
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
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
                      const scale = 1 - normalizedDistance * 0.15;
                      const opacity = 1 - normalizedDistance * 0.7;
                      const blur = normalizedDistance * 3;

                      return (
                        <div
                          key={`${participant.id}-${index}`}
                          className="flex items-center gap-6 px-8"
                          style={{
                            height: ITEM_HEIGHT,
                            transform: `scale(${scale})`,
                            opacity,
                            filter: !isCenter ? `blur(${blur}px)` : 'none',
                          }}
                        >
                          <div className={`relative ${isCenter ? 'animate-pulse' : ''}`}>
                            <Avatar className={`h-20 w-20 border-4 shadow-xl transition-all ${
                              isCenter 
                                ? 'border-primary ring-4 ring-primary/30' 
                                : 'border-primary/20'
                            }`}>
                              <AvatarImage src={participant.avatar_url || undefined} alt={participant.full_name} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground text-xl font-bold">
                                {getInitials(participant.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            {isCenter && (
                              <motion.div
                                className="absolute inset-0 rounded-full border-2 border-yellow-400"
                                animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                              />
                            )}
                          </div>
                          <p className={`font-bold text-2xl truncate transition-all ${
                            isCenter ? 'text-primary' : ''
                          }`}>
                            {participant.full_name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Contagem regressiva */}
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
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <motion.div
                          className="absolute inset-0 rounded-full bg-primary/20"
                          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          style={{ width: 160, height: 160, margin: 'auto', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full bg-primary/30"
                          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                          style={{ width: 160, height: 160, margin: 'auto', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        
                        <div className="bg-gradient-to-br from-primary to-purple-600 backdrop-blur-sm rounded-full w-40 h-40 flex items-center justify-center shadow-2xl border-4 border-white/30">
                          <motion.span
                            key={countdown}
                            initial={{ scale: 2.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-8xl font-black text-white"
                          >
                            {countdown}
                          </motion.span>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {phase !== 'countdown' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -bottom-12 left-1/2 -translate-x-1/2"
                  >
                    <Badge variant="secondary" className="text-lg px-6 py-2 bg-background/80 backdrop-blur-sm">
                      {phase === 'accelerating' && '⚡ Acelerando...'}
                      {phase === 'spinning' && '🎰 Girando!'}
                      {phase === 'slowing' && '🎯 Desacelerando...'}
                    </Badge>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Vencedor revelado */}
          {winner && !isSpinning && !allDone && (
            <motion.div
              key="winner"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.8 }}
              className="text-center w-full max-w-2xl"
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="w-[600px] h-[600px] bg-gradient-radial from-yellow-500/30 via-primary/10 to-transparent rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>

              <div className="relative z-10 space-y-6">
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center"
                >
                  <motion.div
                    animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Crown className="h-16 w-16 text-yellow-500 drop-shadow-lg" />
                  </motion.div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                  className="relative mx-auto w-fit"
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400"
                    style={{ margin: -8 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  />
                  <Avatar className="h-40 w-40 border-8 border-yellow-500 shadow-2xl relative ring-8 ring-yellow-500/30">
                    <AvatarImage src={winner.avatar_url || undefined} alt={winner.full_name} />
                    <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white text-5xl font-black">
                      {getInitials(winner.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div 
                    className="absolute -bottom-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-3 shadow-2xl"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Trophy className="h-8 w-8 text-white" />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                    <span className="text-xl font-bold text-yellow-500 uppercase tracking-widest">
                      VENCEDOR
                    </span>
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
                    {winner.full_name}
                  </h2>

                  {currentPrize && (
                    <p className="text-lg text-muted-foreground">
                      Ganhou: <span className="font-bold text-foreground">{currentPrize.name}</span>
                    </p>
                  )}
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex flex-col items-center justify-center gap-3"
                >
                  {autoAdvanceCountdown !== null && autoAdvanceCountdown > 0 ? (
                    <p className="text-lg text-muted-foreground">
                      {undrawnPrizes.length > 1
                        ? <>Próximo prêmio em <span className="font-bold text-primary text-2xl">{autoAdvanceCountdown}s</span></>
                        : <>Finalizando em <span className="font-bold text-primary text-2xl">{autoAdvanceCountdown}s</span></>
                      }
                    </p>
                  ) : null}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {!winner && !allDone && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <p className="text-muted-foreground text-sm">
            Sorteio justo e transparente • A Boa
          </p>
        </div>
      )}

      {/* Drawn prizes sidebar */}
      {drawnWinners.size > 0 && !allDone && (
        <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:bottom-auto md:top-24 md:w-72 z-10">
          <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-3 space-y-2 max-h-[30vh] overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prêmios Sorteados</p>
            {prizes.filter(p => drawnWinners.has(p.id)).map((prize) => {
              const w = drawnWinners.get(prize.id)!;
              return (
                <div key={prize.id} className="flex items-center gap-2 text-sm">
                  <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                  <span className="truncate font-medium">{prize.name}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="truncate text-primary">{w.full_name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

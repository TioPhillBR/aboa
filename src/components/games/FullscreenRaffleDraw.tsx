import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@/types';
import { Trophy, Play, Sparkles, Zap, X, Crown } from 'lucide-react';
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
  onWinnerSelected: (winner: Profile) => void;
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
  winner: externalWinner,
}: FullscreenRaffleDrawProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [winner, setWinner] = useState<Profile | null>(externalWinner || null);
  const [offset, setOffset] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'accelerating' | 'spinning' | 'slowing' | 'countdown' | 'reveal'>('idle');
  const [glowIntensity, setGlowIntensity] = useState(0);
  const animationRef = useRef<number>();
  const { playClick, playBigWin, playDrumHit } = useSoundEffects();

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

    // Explosão massiva inicial
    confetti({
      ...defaults,
      particleCount: 200,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
    });

    // Explosões dos cantos
    setTimeout(() => {
      confetti({ ...defaults, particleCount: 100, origin: { x: 0, y: 0 } });
      confetti({ ...defaults, particleCount: 100, origin: { x: 1, y: 0 } });
      confetti({ ...defaults, particleCount: 100, origin: { x: 0, y: 1 } });
      confetti({ ...defaults, particleCount: 100, origin: { x: 1, y: 1 } });
    }, 300);

    // Explosões contínuas
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        ...defaults,
        particleCount: 5,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500'],
      });
      confetti({
        ...defaults,
        particleCount: 5,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FF6B6B', '#4ECDC4'],
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
  const easeInCubic = (x: number): number => x * x * x;

  const startSpin = useCallback(() => {
    if (participants.length < 2) return;

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
        if (phase !== 'accelerating') setPhase('accelerating');
      } else if (elapsed < slowDownStart) {
        currentSpeed = maxSpeed;
        setGlowIntensity(0.5 + Math.sin(elapsed / 100) * 0.1);
        if (phase !== 'spinning') setPhase('spinning');
      } else if (elapsed < countdownStart) {
        const slowProgress = (elapsed - slowDownStart) / (countdownStart - slowDownStart);
        currentSpeed = maxSpeed * (1 - easeInCubic(slowProgress) * 0.6);
        setGlowIntensity(0.5 - slowProgress * 0.2);
        if (phase !== 'slowing') setPhase('slowing');
      } else if (elapsed < totalDuration) {
        const remaining = Math.ceil((totalDuration - elapsed) / 1000);
        if (remaining !== countdown) {
          setCountdown(remaining);
          playDrumHit(); // Som de tambor na contagem regressiva
        }
        
        const countdownProgress = (elapsed - countdownStart) / (totalDuration - countdownStart);
        currentSpeed = maxSpeed * 0.4 * (1 - easeInCubic(countdownProgress));
        setGlowIntensity(0.8 + Math.sin(elapsed / 50) * 0.2);
        if (phase !== 'countdown') setPhase('countdown');
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
        
        setTimeout(() => {
          onWinnerSelected(selectedWinner);
        }, 500);
        
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
  }, [participants, offset, totalHeight, countdown, phase, triggerEpicConfetti, playClick, playDrumHit, playBigWin, onWinnerSelected]);

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

  // Prevent body scroll when fullscreen is open
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

      {/* Badge AO VIVO */}
      {isSpinning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-1/2 -translate-x-1/2"
        >
          <Badge className="px-6 py-2 text-lg bg-gradient-to-r from-red-500 to-orange-500 animate-pulse shadow-lg">
            <Zap className="w-5 h-5 mr-2" />
            AO VIVO
          </Badge>
        </motion.div>
      )}

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 mt-20"
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
          {raffleTitle}
        </h1>
        <p className="text-muted-foreground text-lg">
          {participants.length} participantes • {ticketsSold} tickets vendidos
        </p>
      </motion.div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex items-center justify-center w-full max-w-4xl px-4">
        <AnimatePresence mode="wait">
          {/* Estado inicial - Botão de iniciar */}
          {!isSpinning && !winner && (
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
                  INICIAR SORTEIO
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
              {/* Container da Roleta */}
              <div className="relative">
                {/* Efeito de brilho */}
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

                {/* Indicador central */}
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

                {/* Gradientes de fade */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent z-10 pointer-events-none" />

                {/* Container dos itens */}
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

                {/* Indicador de fase */}
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
          {winner && !isSpinning && (
            <motion.div
              key="winner"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.8 }}
              className="text-center w-full max-w-2xl"
            >
              {/* Fundo brilhante */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="w-[600px] h-[600px] bg-gradient-radial from-yellow-500/30 via-primary/10 to-transparent rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>

              <div className="relative z-10 space-y-8">
                {/* Coroa animada */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center"
                >
                  <motion.div
                    animate={{ 
                      rotate: [-5, 5, -5],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Crown className="h-20 w-20 text-yellow-500 drop-shadow-lg" />
                  </motion.div>
                </motion.div>

                {/* Avatar do vencedor */}
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
                  <Avatar className="h-48 w-48 border-8 border-yellow-500 shadow-2xl relative ring-8 ring-yellow-500/30">
                    <AvatarImage src={winner.avatar_url || undefined} alt={winner.full_name} />
                    <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white text-6xl font-black">
                      {getInitials(winner.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div 
                    className="absolute -bottom-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-4 shadow-2xl"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Trophy className="h-10 w-10 text-white" />
                  </motion.div>
                </motion.div>

                {/* Texto do vencedor */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="h-8 w-8 text-yellow-500" />
                    <span className="text-2xl font-bold text-yellow-500 uppercase tracking-widest">
                      VENCEDOR
                    </span>
                    <Sparkles className="h-8 w-8 text-yellow-500" />
                  </div>
                  
                  <motion.h2 
                    className="text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent"
                    animate={{ 
                      backgroundPosition: ['0%', '100%', '0%'],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ backgroundSize: '200% 100%' }}
                  >
                    {winner.full_name}
                  </motion.h2>

                  <p className="text-xl text-muted-foreground">
                    Parabéns! Você foi o grande ganhador do sorteio!
                  </p>
                </motion.div>

                {/* Botão de fechar */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <Button
                    size="lg"
                    onClick={onClose}
                    className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-xl rounded-xl"
                  >
                    Fechar
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer com infos */}
      {!winner && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <p className="text-muted-foreground text-sm">
            Sorteio justo e transparente • A Boa
          </p>
        </div>
      )}
    </motion.div>
  );
}

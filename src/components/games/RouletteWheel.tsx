import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Profile } from '@/types';
import { Trophy, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RouletteWheelProps {
  participants: Profile[];
  onWinnerSelected?: (winner: Profile) => void;
  isSpinning?: boolean;
  onSpinStart?: () => void;
  winner?: Profile | null;
  autoSpin?: boolean;
}

const ITEM_HEIGHT = 100; // altura de cada item em pixels
const VISIBLE_ITEMS = 5; // quantidade de itens visíveis

export function RouletteWheel({
  participants,
  onWinnerSelected,
  isSpinning: externalSpinning,
  onSpinStart,
  winner: externalWinner,
  autoSpin = false,
}: RouletteWheelProps) {
  const [internalSpinning, setInternalSpinning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [winner, setWinner] = useState<Profile | null>(externalWinner || null);
  const [offset, setOffset] = useState(0);
  const [speed, setSpeed] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const isSpinning = externalSpinning ?? internalSpinning;

  // Duplicar participantes para criar efeito infinito
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

  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#bb0000', '#ffffff', '#00bb00', '#0000bb', '#bbbb00'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#bb0000', '#ffffff', '#00bb00', '#0000bb', '#bbbb00'],
      });
    }, 50);
  }, []);

  const startSpin = useCallback(() => {
    if (participants.length < 2) return;

    setWinner(null);
    setCountdown(null);
    onSpinStart?.();
    setInternalSpinning(true);

    // Velocidade inicial alta
    setSpeed(50);

    // Selecionar vencedor aleatório
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const selectedWinner = participants[winnerIndex];

    // Calcular posição final
    const targetOffset = (winnerIndex * ITEM_HEIGHT) + (totalHeight * 3); // 3 voltas completas

    let currentOffset = offset;
    let currentSpeed = 50;
    const startTime = Date.now();
    const totalDuration = 8000; // 8 segundos total
    const slowDownStart = 5000; // começar a desacelerar após 5 segundos

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < slowDownStart) {
        // Fase rápida
        currentSpeed = 50;
      } else if (elapsed < totalDuration - 3000) {
        // Desacelerando
        const slowProgress = (elapsed - slowDownStart) / (totalDuration - slowDownStart - 3000);
        currentSpeed = 50 * (1 - slowProgress * 0.7);
      } else if (elapsed < totalDuration) {
        // Contagem regressiva nos últimos 3 segundos
        const remaining = Math.ceil((totalDuration - elapsed) / 1000);
        if (remaining !== countdown) {
          setCountdown(remaining);
        }
        currentSpeed = 50 * 0.3 * (1 - ((elapsed - (totalDuration - 3000)) / 3000) * 0.8);
      } else {
        // Parar na posição do vencedor
        setCountdown(null);
        setSpeed(0);
        setInternalSpinning(false);

        // Ajustar para centralizar o vencedor
        const finalOffset = (winnerIndex * ITEM_HEIGHT);
        setOffset(finalOffset);
        setWinner(selectedWinner);
        onWinnerSelected?.(selectedWinner);
        triggerConfetti();
        return;
      }

      setSpeed(currentSpeed);
      currentOffset += currentSpeed;
      
      // Loop infinito
      if (currentOffset >= totalHeight * 2) {
        currentOffset = currentOffset % totalHeight;
      }
      
      setOffset(currentOffset);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [participants, offset, totalHeight, countdown, onSpinStart, onWinnerSelected, triggerConfetti]);

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
      {/* Container da Roleta */}
      <div className="relative w-full max-w-md">
        {/* Indicador central */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="flex items-center">
            <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent to-primary" />
            <div className="w-4 h-4 rotate-45 bg-primary" />
            <div className="flex-1 h-0.5 bg-gradient-to-l from-transparent to-primary" />
          </div>
        </div>

        {/* Sombras superior e inferior */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

        {/* Container dos itens */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-card"
          style={{ height: VISIBLE_ITEMS * ITEM_HEIGHT }}
        >
          <div
            className="absolute inset-x-0 transition-none"
            style={{
              transform: `translateY(${(VISIBLE_ITEMS / 2) * ITEM_HEIGHT - offset - ITEM_HEIGHT / 2}px)`,
            }}
          >
            {extendedParticipants.map((participant, index) => {
              // Calcular se este item está no centro
              const itemPosition = index * ITEM_HEIGHT;
              const centerOffset = (VISIBLE_ITEMS / 2) * ITEM_HEIGHT;
              const relativePosition = itemPosition - offset;
              const distanceFromCenter = Math.abs(relativePosition - centerOffset + ITEM_HEIGHT / 2);
              const isCenter = distanceFromCenter < ITEM_HEIGHT / 2;
              const scale = isCenter && !isSpinning ? 1.1 : 1;
              const opacity = isCenter ? 1 : 0.5 + (1 - Math.min(distanceFromCenter / (ITEM_HEIGHT * 2), 1)) * 0.3;

              return (
                <div
                  key={`${participant.id}-${index}`}
                  className="flex items-center gap-4 px-6 transition-all duration-100"
                  style={{
                    height: ITEM_HEIGHT,
                    transform: `scale(${scale})`,
                    opacity,
                  }}
                >
                  <Avatar className="h-16 w-16 border-2 border-primary/30 shadow-lg">
                    <AvatarImage src={participant.avatar_url || undefined} alt={participant.full_name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                      {getInitials(participant.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg truncate">{participant.full_name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contagem regressiva */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="bg-background/90 backdrop-blur-sm rounded-full w-24 h-24 flex items-center justify-center shadow-2xl border-4 border-primary animate-scale-in">
              <span className="text-5xl font-bold text-primary">{countdown}</span>
            </div>
          </div>
        )}
      </div>

      {/* Vencedor */}
      {winner && !isSpinning && (
        <Card className="w-full max-w-md p-6 bg-gradient-to-r from-yellow-500/10 via-primary/10 to-yellow-500/10 border-2 border-yellow-500/50 animate-scale-in">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-yellow-500 shadow-xl">
                <AvatarImage src={winner.avatar_url || undefined} alt={winner.full_name} />
                <AvatarFallback className="bg-yellow-500 text-white text-2xl font-bold">
                  {getInitials(winner.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1.5">
                <Trophy className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">🎉 Vencedor!</p>
              <p className="text-2xl font-bold">{winner.full_name}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Botão de girar */}
      {!isSpinning && !winner && participants.length >= 2 && (
        <Button
          size="lg"
          onClick={startSpin}
          className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
        >
          <Play className="h-6 w-6" />
          Girar Roleta
        </Button>
      )}

      {participants.length < 2 && (
        <p className="text-muted-foreground text-center">
          Mínimo de 2 participantes necessários para iniciar o sorteio
        </p>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Profile } from '@/types';
import { Trophy, Zap, Crown, Home, Users, Ticket } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import logoABoa from '@/assets/logo-a-boa.png';

interface Raffle {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  total_numbers: number;
  draw_date: string;
  status: 'open' | 'drawing' | 'completed' | 'cancelled';
  winner_id: string | null;
  winner_ticket_number: number | null;
}

const ITEM_HEIGHT = 120;
const VISIBLE_ITEMS = 5;

export default function SorteioAoVivo() {
  const { id } = useParams<{ id: string }>();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [ticketsSold, setTicketsSold] = useState(0);
  const [winner, setWinner] = useState<Profile | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [loading, setLoading] = useState(true);
  const { playDrumHit, playBigWin } = useSoundEffects();

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

  // Fetch raffle data
  useEffect(() => {
    async function fetchRaffle() {
      if (!id) return;

      const { data: raffleData, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !raffleData) {
        setLoading(false);
        return;
      }

      setRaffle(raffleData);

      // Fetch tickets and participants
      const { data: tickets } = await supabase
        .from('raffle_tickets')
        .select('user_id, profiles:user_id(id, full_name, avatar_url)')
        .eq('raffle_id', id);

      if (tickets) {
        setTicketsSold(tickets.length);
        const uniqueProfiles = new Map<string, Profile>();
        tickets.forEach((t: any) => {
          if (t.profiles && !uniqueProfiles.has(t.profiles.id)) {
            uniqueProfiles.set(t.profiles.id, t.profiles);
          }
        });
        setParticipants(Array.from(uniqueProfiles.values()));
      }

      // If already completed, fetch winner
      if (raffleData.winner_id) {
        const { data: winnerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', raffleData.winner_id)
          .single();
        
        if (winnerData) {
          setWinner(winnerData);
        }
      }

      setLoading(false);
    }

    fetchRaffle();
  }, [id]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`raffle-live-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'raffles', filter: `id=eq.${id}` },
        async (payload) => {
          const updated = payload.new as Raffle;
          setRaffle(updated);

          // Se mudou para 'drawing', inicia animação
          if (updated.status === 'drawing' && !isDrawing) {
            startDrawAnimation(updated);
          }

          // Se completou e tem ganhador
          if (updated.status === 'completed' && updated.winner_id && !winner) {
            const { data: winnerData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', updated.winner_id)
              .single();
            
            if (winnerData) {
              setWinner(winnerData);
              playBigWin();
              triggerEpicConfetti();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, isDrawing, winner, playBigWin, triggerEpicConfetti]);

  const startDrawAnimation = useCallback((raffleData: Raffle) => {
    if (participants.length < 2) return;

    setIsDrawing(true);

    let currentOffset = 0;
    let currentSpeed = 0;
    const startTime = Date.now();
    const totalDuration = 10000;
    const accelerationTime = 1500;
    const maxSpeedTime = 4000;
    const slowDownStart = accelerationTime + maxSpeedTime;
    const countdownStart = totalDuration - 5000;
    const maxSpeed = 70;

    const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
    const easeInCubic = (x: number): number => x * x * x;

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
        setCountdown(prev => {
          if (prev !== remaining) {
            playDrumHit();
          }
          return remaining;
        });
        
        const countdownProgress = (elapsed - countdownStart) / (totalDuration - countdownStart);
        currentSpeed = maxSpeed * 0.4 * (1 - easeInCubic(countdownProgress));
        setGlowIntensity(0.8 + Math.sin(elapsed / 50) * 0.2);
      } else {
        setCountdown(null);
        setIsDrawing(false);
        return;
      }

      currentOffset += currentSpeed;
      
      if (totalHeight > 0 && currentOffset >= totalHeight * 2) {
        currentOffset = currentOffset % totalHeight;
      }
      
      setOffset(currentOffset);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [participants, totalHeight, playDrumHit]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={logoABoa} alt="A Boa" className="h-20 w-auto mx-auto animate-pulse" />
          <p className="text-muted-foreground">Carregando sorteio...</p>
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Sorteio não encontrado</h1>
          <Button asChild>
            <Link to="/sorteios">Ver sorteios disponíveis</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-background via-background to-primary/10 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Fundo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
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
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <img src={logoABoa} alt="A Boa" className="h-10 md:h-12 w-auto" />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="bg-background/50 backdrop-blur-sm hover:bg-background/80"
        >
          <Link to="/">
            <Home className="h-4 w-4 mr-2" />
            Início
          </Link>
        </Button>
      </div>

      {/* Badge AO VIVO */}
      {(raffle.status === 'drawing' || isDrawing) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2"
        >
          <Badge className="px-4 md:px-6 py-1.5 md:py-2 text-sm md:text-lg bg-gradient-to-r from-red-500 to-orange-500 animate-pulse shadow-lg">
            <Zap className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            AO VIVO
          </Badge>
        </motion.div>
      )}

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 md:mb-8 mt-20 md:mt-24 px-4"
      >
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
          {raffle.title}
        </h1>
        <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm md:text-lg">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {participants.length} participantes
          </span>
          <span className="flex items-center gap-1">
            <Ticket className="h-4 w-4" />
            {ticketsSold} tickets
          </span>
        </div>
      </motion.div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex items-center justify-center w-full max-w-4xl px-4">
        <AnimatePresence mode="wait">
          {/* Aguardando sorteio */}
          {raffle.status === 'open' && !winner && !isDrawing && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-6 md:space-y-8"
            >
              <div className="grid grid-cols-4 md:grid-cols-5 gap-3 md:gap-4 max-w-lg mx-auto">
                {participants.slice(0, 10).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Avatar className="h-12 w-12 md:h-16 md:w-16 mx-auto border-2 border-primary/30">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-xs md:text-sm">
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

              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-primary/20">
                <p className="text-lg md:text-xl text-muted-foreground">
                  Aguardando início do sorteio...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Fique nesta página para acompanhar ao vivo!
                </p>
              </div>
            </motion.div>
          )}

          {/* Roleta girando */}
          {(raffle.status === 'drawing' || isDrawing) && !winner && (
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
                          className="flex items-center gap-4 md:gap-6 px-4 md:px-8"
                          style={{
                            height: ITEM_HEIGHT,
                            transform: `scale(${scale})`,
                            opacity,
                            filter: !isCenter ? `blur(${blur}px)` : 'none',
                          }}
                        >
                          <div className={`relative ${isCenter ? 'animate-pulse' : ''}`}>
                            <Avatar className={`h-16 w-16 md:h-20 md:w-20 border-4 shadow-xl transition-all ${
                              isCenter 
                                ? 'border-primary ring-4 ring-primary/30' 
                                : 'border-primary/20'
                            }`}>
                              <AvatarImage src={participant.avatar_url || undefined} alt={participant.full_name} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground text-lg md:text-xl font-bold">
                                {getInitials(participant.full_name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold truncate transition-all text-base md:text-xl ${
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

                {/* Contagem regressiva */}
                {countdown !== null && (
                  <motion.div
                    key={countdown}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                  >
                    <div className="text-[120px] md:text-[180px] font-black text-primary drop-shadow-[0_0_60px_rgba(139,92,246,0.8)]">
                      {countdown}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Vencedor revelado */}
          {winner && (
            <motion.div
              key="winner"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="text-center space-y-6 md:space-y-8"
            >
              {/* Coroa animada */}
              <motion.div
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [-5, 5, -5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="h-16 w-16 md:h-24 md:w-24 text-yellow-400 mx-auto drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" />
              </motion.div>

              {/* Avatar do vencedor */}
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 60px 20px rgba(250, 204, 21, 0.3)',
                    '0 0 100px 40px rgba(250, 204, 21, 0.5)',
                    '0 0 60px 20px rgba(250, 204, 21, 0.3)',
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-block rounded-full"
              >
                <Avatar className="h-32 w-32 md:h-48 md:w-48 border-8 border-yellow-400 shadow-2xl mx-auto">
                  <AvatarImage src={winner.avatar_url || undefined} alt={winner.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white text-4xl md:text-6xl font-black">
                    {getInitials(winner.full_name)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              {/* Nome e prêmio */}
              <div className="space-y-4">
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent"
                >
                  {winner.full_name}
                </motion.h2>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2"
                >
                  <Trophy className="h-6 w-6 md:h-8 md:w-8 text-yellow-400" />
                  <span className="text-xl md:text-3xl font-bold text-muted-foreground">
                    GANHADOR DO SORTEIO
                  </span>
                  <Trophy className="h-6 w-6 md:h-8 md:w-8 text-yellow-400" />
                </motion.div>

                {raffle.winner_ticket_number && (
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-lg md:text-xl text-muted-foreground"
                  >
                    Número sorteado: <span className="font-bold text-primary">{String(raffle.winner_ticket_number).padStart(6, '0')}</span>
                  </motion.p>
                )}
              </div>

              {/* Botão para voltar */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <Button asChild size="lg" className="gap-2">
                  <Link to="/sorteios">
                    <Trophy className="h-5 w-5" />
                    Ver mais sorteios
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-muted-foreground text-xs md:text-sm">
        © {new Date().getFullYear()} A Boa • Sorteios com transparência
      </div>
    </motion.div>
  );
}

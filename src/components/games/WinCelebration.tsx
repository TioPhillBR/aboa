import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Star, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WinCelebrationProps {
  isVisible: boolean;
  prize: number;
  onClose?: () => void;
}

export function WinCelebration({ isVisible, prize, onClose }: WinCelebrationProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Mostrar conteúdo após um breve delay
      setTimeout(() => setShowContent(true), 200);
      
      // Confetti em múltiplas etapas para efeito mais impactante
      const duration = 3000;
      const end = Date.now() + duration;

      // Primeiro disparo - explosão central
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6, x: 0.5 },
        colors: ['#ffd700', '#ffb700', '#ff9500', '#ffffff', '#ff6b6b'],
        startVelocity: 45,
      });

      // Confetti lateral esquerda
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#ffd700', '#ff9500', '#ff6b6b'],
        });
      }, 250);

      // Confetti lateral direita
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#ffd700', '#ff9500', '#ff6b6b'],
        });
      }, 400);

      // Estrelas cadentes
      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 25,
          origin: { x: 0 },
          colors: ['#ffd700', '#ffffff'],
          shapes: ['star'],
          scalar: 1.5,
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 25,
          origin: { x: 1 },
          colors: ['#ffd700', '#ffffff'],
          shapes: ['star'],
          scalar: 1.5,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      setTimeout(frame, 600);

      // Segundo disparo - explosão final
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 180,
          origin: { y: 0.5 },
          colors: ['#ffd700', '#ffb700', '#ff9500', '#ffffff', '#00ff88'],
          startVelocity: 30,
          gravity: 0.8,
        });
      }, 1500);
    } else {
      setShowContent(false);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && showContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ 
              type: 'spring', 
              damping: 15, 
              stiffness: 300,
              delay: 0.1,
            }}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur-3xl opacity-50 animate-pulse" />
            
            {/* Card principal */}
            <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-3xl p-1 shadow-2xl">
              <div className="bg-background rounded-[22px] p-8 text-center min-w-[300px]">
                {/* Ícone animado */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="relative inline-block mb-4"
                >
                  <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-6">
                    <Trophy className="h-12 w-12 text-white" />
                  </div>
                  
                  {/* Estrelas decorativas */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-2 -right-2"
                  >
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute -bottom-1 -left-3"
                  >
                    <Sparkles className="h-5 w-5 text-orange-400" />
                  </motion.div>
                </motion.div>

                {/* Título */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <PartyPopper className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                      PARABÉNS!
                    </h2>
                    <PartyPopper className="h-5 w-5 text-yellow-500 scale-x-[-1]" />
                  </div>
                  <p className="text-muted-foreground mb-4">Você é um vencedor!</p>
                </motion.div>

                {/* Valor do prêmio */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                  className="mb-6"
                >
                  <div className="inline-block bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl px-6 py-3 shadow-lg shadow-green-500/30">
                    <p className="text-sm text-white/80 mb-1">Você ganhou</p>
                    <p className="text-4xl font-bold text-white">
                      R$ {prize.toFixed(2)}
                    </p>
                  </div>
                </motion.div>

                {/* Mensagem */}
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-sm text-muted-foreground mb-4"
                >
                  O prêmio foi creditado na sua carteira!
                </motion.p>

                {/* Botão fechar */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={onClose}
                  className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-medium hover:from-yellow-600 hover:to-orange-600 transition-colors"
                >
                  Continuar Jogando
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

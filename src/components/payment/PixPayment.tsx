import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { supabase } from '@/integrations/supabase/client';
import { 
  Copy, 
  Check, 
  Clock, 
  QrCode, 
  Loader2,
  CheckCircle2,
  XCircle,
  Smartphone,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

interface PixPaymentProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PixData {
  transactionId: string;
  qrCodeBase64: string;
  copyPasteCode: string;
  expiresAt: string;
  externalId?: string;
  useGatebox?: boolean;
}

type PaymentStatus = 'generating' | 'waiting' | 'processing' | 'success' | 'expired' | 'error';

export function PixPayment({ amount, onSuccess, onCancel }: PixPaymentProps) {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('generating');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const { toast } = useToast();
  const { playSuccess, playPurchase } = useSoundEffects();

  // Generate PIX on mount
  useEffect(() => {
    generatePix();
  }, [amount]);

  // Countdown timer
  useEffect(() => {
    if (status !== 'waiting' || !pixData) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus('expired');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, pixData]);

  // Polling para verificar pagamento quando usar Gatebox
  useEffect(() => {
    if (status !== 'waiting' || !pixData?.useGatebox || !pixData?.externalId) return;

    const checkStatus = async () => {
      try {
        const { data } = await supabase.functions.invoke('check-deposit-status', {
          body: { externalId: pixData.externalId, transactionId: pixData.transactionId },
        });
        if (data?.paid) {
          setStatus('success');
          playSuccess();
          toast({
            title: '🎉 Pagamento confirmado!',
            description: `R$ ${amount.toFixed(2)} adicionados à sua carteira`,
          });
          setTimeout(onSuccess, 2000);
        }
      } catch {
        // Ignora erros de polling
      }
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [status, pixData?.useGatebox, pixData?.externalId, pixData?.transactionId, amount, onSuccess, playSuccess, toast]);

  const generatePix = async () => {
    setStatus('generating');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('generate-pix', {
        body: { amount },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setPixData(response.data);
      setStatus('waiting');
      setTimeLeft(900);
    } catch (error) {
      console.error('Error generating PIX:', error);
      setStatus('error');
      toast({
        title: 'Erro ao gerar PIX',
        description: 'Tente novamente em alguns instantes',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = async () => {
    if (!pixData) return;

    try {
      await navigator.clipboard.writeText(pixData.copyPasteCode);
      setCopied(true);
      toast({
        title: 'Código copiado!',
        description: 'Cole no app do seu banco para pagar',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Tente copiar manualmente',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmPayment = async () => {
    if (!pixData) return;
    
    setStatus('processing');
    playPurchase();

    try {
      const response = await supabase.functions.invoke('confirm-pix', {
        body: { 
          transactionId: pixData.transactionId,
          amount 
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setStatus('success');
      playSuccess();
      
      toast({
        title: '🎉 Pagamento confirmado!',
        description: `R$ ${amount.toFixed(2)} adicionados à sua carteira`,
      });

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error confirming PIX:', error);
      setStatus('error');
      toast({
        title: 'Erro ao confirmar',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerPercent = (timeLeft / 900) * 100;

  return (
    <div className="space-y-5">
      {/* Header with animated icon */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3"
          animate={{ boxShadow: ['0 0 0 0px hsl(var(--primary) / 0.2)', '0 0 0 12px hsl(var(--primary) / 0)', '0 0 0 0px hsl(var(--primary) / 0.2)'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <QrCode className="w-8 h-8 text-primary" />
        </motion.div>
        <h3 className="text-xl font-bold text-foreground">Pagamento via PIX</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Escaneie o QR Code ou copie o código
        </p>
      </motion.div>

      {/* Amount card with gradient */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card className="border-primary/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-[var(--gradient-primary)] opacity-[0.07]" />
          <CardContent className="py-4 text-center relative">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor do depósito</p>
            <motion.p
              className="text-3xl font-extrabold text-primary mt-1"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
            >
              R$ {amount.toFixed(2)}
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Content */}
      <AnimatePresence mode="wait">
        {status === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center py-10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-12 h-12 text-primary" />
            </motion.div>
            <p className="text-muted-foreground mt-4 text-sm">Gerando código PIX...</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground/60">
              <ShieldCheck className="w-3 h-3" />
              <span>Transação segura</span>
            </div>
          </motion.div>
        )}

        {status === 'waiting' && pixData && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Timer bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Tempo restante</span>
                </div>
                <motion.span
                  className={`font-mono font-bold text-sm ${timeLeft < 60 ? 'text-destructive' : timeLeft < 180 ? 'text-accent' : 'text-foreground'}`}
                  animate={timeLeft < 60 ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {formatTime(timeLeft)}
                </motion.span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-colors duration-500 ${
                    timeLeft < 60 ? 'bg-destructive' : timeLeft < 180 ? 'bg-accent' : 'bg-primary'
                  }`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${timerPercent}%` }}
                  transition={{ duration: 0.5, ease: 'linear' }}
                />
              </div>
            </motion.div>

            {/* QR Code with glow */}
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', bounce: 0.3 }}
            >
              <div className="p-5 bg-white rounded-2xl shadow-lg ring-1 ring-border/50 relative">
                <div className="absolute -inset-1 rounded-2xl bg-primary/5 blur-md -z-10" />
                {pixData.copyPasteCode ? (
                  <QRCodeSVG 
                    value={pixData.copyPasteCode} 
                    size={200}
                    level="M"
                    fgColor="#1a1a1a"
                  />
                ) : pixData.qrCodeBase64 ? (
                  <img 
                    src={pixData.qrCodeBase64} 
                    alt="QR Code PIX" 
                    className="w-[200px] h-[200px]"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center text-muted-foreground">
                    <QrCode className="w-16 h-16 opacity-30" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Copy Paste Code */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-xs text-center text-muted-foreground font-medium">
                Ou copie o código PIX Copia e Cola
              </p>
              <div className="relative group">
                <div className="p-3 bg-muted/80 rounded-xl text-[11px] font-mono break-all max-h-16 overflow-y-auto border border-border/50 pr-20 leading-relaxed">
                  {pixData.copyPasteCode}
                </div>
                <Button
                  size="sm"
                  variant={copied ? 'default' : 'outline'}
                  className={`absolute top-1.5 right-1.5 gap-1.5 text-xs transition-all duration-300 ${
                    copied
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'hover:bg-primary/10 hover:text-primary hover:border-primary/30'
                  }`}
                  onClick={handleCopyCode}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="copied"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Copiado!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </motion.div>

            {/* Instructions - collapsible style */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-muted/30 border-border/50">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5">
                      <Smartphone className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-xs space-y-1.5 flex-1">
                      <p className="font-semibold text-foreground">Como pagar:</p>
                      <ol className="text-muted-foreground space-y-1 list-none">
                        {[
                          'Abra o app do seu banco',
                          'Escolha pagar com PIX',
                          'Escaneie o QR Code ou cole o código',
                          'Confirme o pagamento',
                        ].map((step, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 0.1 }}
                            className="flex items-center gap-2"
                          >
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                              {i + 1}
                            </span>
                            {step}
                          </motion.li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
              className="flex gap-3 pt-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button 
                variant="outline" 
                className="flex-1 border-border/60"
                onClick={onCancel}
              >
                Cancelar
              </Button>
              {pixData?.useGatebox ? (
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-md"
                  onClick={async () => {
                    setStatus('processing');
                    try {
                      const { data } = await supabase.functions.invoke('check-deposit-status', {
                        body: { externalId: pixData.externalId, transactionId: pixData.transactionId },
                      });
                      if (data?.paid) {
                        setStatus('success');
                        playSuccess();
                        toast({
                          title: '🎉 Pagamento confirmado!',
                          description: `R$ ${amount.toFixed(2)} adicionados à sua carteira`,
                        });
                        setTimeout(onSuccess, 2000);
                      } else {
                        setStatus('waiting');
                        toast({
                          title: 'Pagamento ainda não identificado',
                          description: 'Aguarde alguns segundos e tente novamente',
                          variant: 'default',
                        });
                      }
                    } catch {
                      setStatus('waiting');
                      toast({
                        title: 'Erro ao verificar',
                        description: 'Tente novamente',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Verificar pagamento
                </Button>
              ) : (
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-md"
                  onClick={handleConfirmPayment}
                >
                  <Check className="w-4 h-4" />
                  Já Paguei
                </Button>
              )}
            </motion.div>

            {!pixData?.useGatebox && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-[10px] text-center text-muted-foreground/60"
              >
                Ambiente de simulação – clique em &quot;Já Paguei&quot; para simular
              </motion.p>
            )}
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center py-10"
          >
            <motion.div
              className="relative"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-14 h-14 rounded-full border-4 border-muted border-t-primary" />
            </motion.div>
            <p className="text-muted-foreground mt-5 text-sm font-medium">Confirmando pagamento...</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Isso pode levar alguns segundos</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-[hsl(var(--success))]/20 blur-xl scale-150" />
              <CheckCircle2 className="w-20 h-20 text-[hsl(var(--success))] relative" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-[hsl(var(--success))] mt-4"
            >
              Pagamento Confirmado!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-sm mt-1"
            >
              R$ {amount.toFixed(2)} adicionados à sua carteira
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              <Badge className="mt-4 bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] px-4 py-1">
                ✓ Sucesso
              </Badge>
            </motion.div>
          </motion.div>
        )}

        {status === 'expired' && (
          <motion.div
            key="expired"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
            >
              <Clock className="w-16 h-16 text-muted-foreground/40 mb-3" />
            </motion.div>
            <h3 className="text-lg font-semibold text-foreground">Código expirado</h3>
            <p className="text-muted-foreground text-sm text-center mt-1 mb-5">
              O tempo para pagamento acabou
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button className="gap-2" onClick={generatePix}>
                <RefreshCw className="w-4 h-4" />
                Gerar Novo Código
              </Button>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
            >
              <XCircle className="w-16 h-16 text-destructive mb-3" />
            </motion.div>
            <h3 className="text-lg font-semibold text-foreground">Erro ao processar</h3>
            <p className="text-muted-foreground text-sm text-center mt-1 mb-5">
              Ocorreu um erro. Tente novamente.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button className="gap-2" onClick={generatePix}>
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

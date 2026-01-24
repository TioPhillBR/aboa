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
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

type PaymentStatus = 'generating' | 'waiting' | 'processing' | 'success' | 'expired' | 'error';

export function PixPayment({ amount, onSuccess, onCancel }: PixPaymentProps) {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('generating');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#32BCAD]/10 mb-4">
          <QrCode className="w-8 h-8 text-[#32BCAD]" />
        </div>
        <h3 className="text-xl font-bold">Pagamento via PIX</h3>
        <p className="text-muted-foreground">
          Escaneie o QR Code ou copie o código
        </p>
      </div>

      {/* Amount */}
      <Card className="bg-gradient-to-r from-[#32BCAD]/10 to-[#32BCAD]/5 border-[#32BCAD]/20">
        <CardContent className="py-4 text-center">
          <p className="text-sm text-muted-foreground">Valor do depósito</p>
          <p className="text-3xl font-bold text-[#32BCAD]">
            R$ {amount.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Status Content */}
      <AnimatePresence mode="wait">
        {status === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8"
          >
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Gerando código PIX...</p>
          </motion.div>
        )}

        {status === 'waiting' && pixData && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Expira em: <strong className={timeLeft < 60 ? 'text-destructive' : ''}>{formatTime(timeLeft)}</strong></span>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-xl shadow-lg">
                <img 
                  src={pixData.qrCodeBase64} 
                  alt="QR Code PIX" 
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Copy Paste Code */}
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Ou copie o código PIX Copia e Cola:
              </p>
              <div className="relative">
                <div className="p-3 bg-muted rounded-lg text-xs font-mono break-all max-h-20 overflow-y-auto">
                  {pixData.copyPasteCode}
                </div>
                <Button
                  size="sm"
                  variant={copied ? 'default' : 'secondary'}
                  className="absolute top-2 right-2 gap-1"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <Card className="bg-muted/50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-primary mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium">Como pagar:</p>
                    <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Abra o app do seu banco</li>
                      <li>Escolha pagar com PIX</li>
                      <li>Escaneie o QR Code ou cole o código</li>
                      <li>Confirme o pagamento</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-[#32BCAD] hover:bg-[#2aa99b] gap-2"
                onClick={handleConfirmPayment}
              >
                <Check className="w-4 h-4" />
                Já Paguei
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Ambiente de simulação - clique em "Já Paguei" para simular a confirmação
            </p>
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8"
          >
            <Loader2 className="w-12 h-12 animate-spin text-[#32BCAD] mb-4" />
            <p className="text-muted-foreground">Confirmando pagamento...</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
            </motion.div>
            <h3 className="text-xl font-bold text-green-600 mb-2">Pagamento Confirmado!</h3>
            <p className="text-muted-foreground">
              R$ {amount.toFixed(2)} adicionados à sua carteira
            </p>
            <Badge className="mt-4 bg-green-500">
              Sucesso
            </Badge>
          </motion.div>
        )}

        {status === 'expired' && (
          <motion.div
            key="expired"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8"
          >
            <XCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Código expirado</h3>
            <p className="text-muted-foreground text-center mb-4">
              O tempo para pagamento acabou
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button onClick={generatePix}>
                Gerar Novo Código
              </Button>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8"
          >
            <XCircle className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao processar</h3>
            <p className="text-muted-foreground text-center mb-4">
              Ocorreu um erro. Tente novamente.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button onClick={generatePix}>
                Tentar Novamente
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

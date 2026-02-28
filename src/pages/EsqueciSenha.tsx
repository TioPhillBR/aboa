import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft, CheckCircle, KeyRound, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const redirectUrl = window.location.hostname.includes('localhost') || window.location.hostname.includes('lovable.app')
      ? `${window.location.origin}/redefinir-senha`
      : 'https://aboaloteria.com.br/redefinir-senha';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      setError('Erro ao enviar email de recuperação. Tente novamente.');
    } else {
      setSent(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="rounded-2xl border bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
          {/* Header with icon */}
          <div className="pt-8 pb-4 px-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="mx-auto w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-lg"
              style={{ boxShadow: 'var(--shadow-glow-primary)' }}
            >
              <KeyRound className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground">Recuperar senha</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Sem problemas! Informe seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 pb-8 space-y-4 text-center"
            >
              <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <CheckCircle className="h-10 w-10 text-success" />
                </motion.div>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Email enviado!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enviamos um link de redefinição para{' '}
                  <strong className="text-foreground">{email}</strong>.
                </p>
                <p className="text-xs text-muted-foreground">
                  Verifique também sua caixa de spam caso não encontre o email.
                </p>
              </div>
              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Sparkles className="h-4 w-4 text-accent flex-shrink-0" />
                <span>O link expira em poucos minutos. Redefina sua senha o quanto antes.</span>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="px-6 pb-6 space-y-5">
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Endereço de email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar link de recuperação
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 border-t border-border/50">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

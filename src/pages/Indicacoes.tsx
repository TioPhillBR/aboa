import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useReferral } from '@/hooks/useReferral';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { 
  Users, 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Sparkles,
  Trophy,
  ArrowRight,
  Link as LinkIcon,
  Coins
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function Indicacoes() {
  const { user } = useAuth();
  const { 
    referralCode, 
    referrals, 
    isLoading, 
    totalEarnings,
    bonusPerReferral,
    getReferralLink,
    copyReferralLink,
    copyReferralCode 
  } = useReferral();
  const { toast } = useToast();
  const { playSuccess } = useSoundEffects();
  
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = async () => {
    const success = await copyReferralCode();
    if (success) {
      playSuccess();
      setCopiedCode(true);
      toast({
        title: 'Código copiado!',
        description: 'Compartilhe com seus amigos',
      });
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      playSuccess();
      setCopiedLink(true);
      toast({
        title: 'Link copiado!',
        description: 'Compartilhe nas redes sociais',
      });
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleShare = async () => {
    const link = getReferralLink();
    if (navigator.share && link) {
      try {
        await navigator.share({
          title: 'A Boa - Convite',
          text: `Use meu código ${referralCode?.code} e ganhe bônus! 🎉`,
          url: link,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Programa de Indicação</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para acessar seu código de indicação
          </p>
          <Button asChild>
            <Link to="/login">Fazer Login</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Users className="h-8 w-8 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Programa de Indicação</h1>
            <p className="text-muted-foreground">
              Convide amigos e ganhe R$ {bonusPerReferral.toFixed(2)} por cada indicação!
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card do Código */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="h-6 w-6" />
                  <span className="font-semibold">Seu Código de Indicação</span>
                </div>
                
                <motion.div 
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <p className="text-4xl md:text-5xl font-bold tracking-wider mb-4">
                    {referralCode?.code || 'XXXXXX'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={handleCopyCode}
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar Código
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                      Compartilhar
                    </Button>
                  </div>
                </motion.div>
              </div>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Link de Convite
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono truncate">
                        {getReferralLink()}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyLink}
                      >
                        {copiedLink ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <LinkIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Como Funciona */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Como Funciona
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                      <Share2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold mb-1">1. Compartilhe</h4>
                    <p className="text-sm text-muted-foreground">
                      Envie seu código para amigos e família
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-pink-600" />
                    </div>
                    <h4 className="font-semibold mb-1">2. Eles se Cadastram</h4>
                    <p className="text-sm text-muted-foreground">
                      Usando seu código no cadastro
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-3">
                      <Gift className="h-6 w-6 text-orange-600" />
                    </div>
                    <h4 className="font-semibold mb-1">3. Vocês Ganham</h4>
                    <p className="text-sm text-muted-foreground">
                      Ambos recebem bônus em créditos!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Indicados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Seus Indicados
                </CardTitle>
                <CardDescription>
                  Pessoas que se cadastraram com seu código
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referrals.length > 0 ? (
                  <div className="space-y-3">
                    {referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={referral.referred_profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {getInitials(referral.referred_profile?.full_name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {referral.referred_profile?.full_name || 'Usuário'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(referral.created_at), "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={referral.bonus_awarded > 0 ? 'default' : 'secondary'}
                          className={referral.bonus_awarded > 0 ? 'bg-green-500' : ''}
                        >
                          {referral.bonus_awarded > 0 
                            ? `+R$ ${referral.bonus_awarded.toFixed(2)}`
                            : 'Pendente'
                          }
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Nenhum indicado ainda
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Compartilhe seu código e comece a ganhar!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Suas Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span>Total Indicados</span>
                  </div>
                  <span className="text-2xl font-bold">{referrals.length}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <span>Total Ganho</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {totalEarnings.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-pink-500" />
                    <span>Bônus por Indicação</span>
                  </div>
                  <span className="text-xl font-semibold">
                    R$ {bonusPerReferral.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card>
              <CardContent className="p-6 text-center">
                <Sparkles className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">
                  Quanto mais indicar, mais ganha!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Não há limite para suas indicações. Compartilhe agora!
                </p>
                <Button className="w-full gap-2" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  Compartilhar Código
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

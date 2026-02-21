import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import { Header } from '@/components/layout/Header';
import { useReferral } from '@/hooks/useReferral';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Link as LinkIcon,
  Coins,
  MessageCircle,
  Instagram,
  Facebook,
  Send,
  Mail
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
    copyReferralLink
  } = useReferral();
  const { toast } = useToast();
  const { playSuccess } = useSoundEffects();
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);

  const handleCopyLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      playSuccess();
      setCopiedLink(true);
      toast({
        title: 'Link copiado!',
        description: 'Compartilhe com seus amigos',
      });
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const shareMessage = `Entre no A Boa usando meu link e ganhe bônus! 🎉`;
  const referralLink = getReferralLink() || '';
  const encodedMessage = encodeURIComponent(shareMessage);
  const encodedLink = encodeURIComponent(referralLink);
  const fullEncodedMessage = encodeURIComponent(`${shareMessage}\n${referralLink}`);

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${fullEncodedMessage}`,
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:opacity-90',
      action: () => {
        navigator.clipboard.writeText(referralLink);
        toast({
          title: 'Link copiado!',
          description: 'Cole o link nos seus stories ou DMs do Instagram',
        });
        setSharePopoverOpen(false);
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedMessage}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://t.me/share/url?url=${encodedLink}&text=${encodedMessage}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodeURIComponent('Convite para A Boa!')}&body=${fullEncodedMessage}`,
    },
  ];

  const handleShareOption = (option: typeof shareOptions[0]) => {
    if (option.action) {
      option.action();
    } else if (option.url) {
      window.open(option.url, '_blank', 'noopener,noreferrer');
      setSharePopoverOpen(false);
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
        <main className="container py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  const SharePopoverContent = () => (
    <PopoverContent className="w-56 p-2" align="center" side="top">
      <div className="grid gap-1">
        {shareOptions.map((option) => (
          <Button
            key={option.name}
            variant="ghost"
            className="w-full justify-start gap-3 h-10 text-sm"
            onClick={() => handleShareOption(option)}
          >
            <div className={`p-1 rounded-md text-white ${option.color}`}>
              <option.icon className="h-3.5 w-3.5" />
            </div>
            {option.name}
          </Button>
        ))}
        <div className="border-t my-1" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 text-sm"
          onClick={() => {
            handleCopyLink();
            setSharePopoverOpen(false);
          }}
        >
          <div className="p-1 rounded-md bg-muted">
            <Copy className="h-3.5 w-3.5" />
          </div>
          Copiar Link
        </Button>
      </div>
    </PopoverContent>
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      <main className="container py-4 pb-24 md:py-8 space-y-4 md:space-y-6">
        <BackButton className="mb-2" />

        {/* Page Header */}
        <div className="flex items-start gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold leading-tight">Programa de Indicação</h1>
            <p className="text-muted-foreground text-xs md:text-base mt-0.5">
              Convide amigos e ganhe R$ {bonusPerReferral.toFixed(2)} por cada indicação!
            </p>
          </div>
        </div>

        {/* Stats Row - Mobile: horizontal scroll-free grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card className="p-3 md:p-4 text-center">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-primary mx-auto mb-1" />
            <p className="text-lg md:text-2xl font-bold">{referrals.length}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">Indicados</p>
          </Card>
          <Card className="p-3 md:p-4 text-center">
            <Coins className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-lg md:text-2xl font-bold text-green-600">R$ {totalEarnings.toFixed(2)}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">Total Ganho</p>
          </Card>
          <Card className="p-3 md:p-4 text-center">
            <Gift className="h-4 w-4 md:h-5 md:w-5 text-pink-500 mx-auto mb-1" />
            <p className="text-lg md:text-2xl font-bold">R$ {bonusPerReferral.toFixed(2)}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">Bônus/Indicação</p>
          </Card>
        </div>

        {/* Referral Link Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/70 p-4 md:p-6 text-primary-foreground">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
              <span className="font-semibold text-sm md:text-base">Seu Link de Indicação</span>
            </div>

            <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 md:p-4 space-y-3">
              <p className="text-xs opacity-80">Compartilhe este link:</p>
              <div className="flex gap-2 items-center min-w-0">
                <div className="flex-1 min-w-0 p-2.5 bg-white/15 rounded-md text-xs md:text-sm font-mono truncate">
                  {getReferralLink()}
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0 h-9 w-9"
                >
                  {copiedLink ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 text-xs md:text-sm w-full"
                  onClick={handleCopyLink}
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-3.5 w-3.5" />
                      Copiar
                    </>
                  )}
                </Button>
                <Popover open={sharePopoverOpen} onOpenChange={setSharePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1.5 text-xs md:text-sm w-full"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Compartilhar
                    </Button>
                  </PopoverTrigger>
                  <SharePopoverContent />
                </Popover>
              </div>
            </div>
          </div>

          <CardContent className="p-3 md:p-6">
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Gift className="h-6 w-6 md:h-8 md:w-8 text-green-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-green-700 dark:text-green-400 text-sm md:text-base">
                  Ganhe R$ {bonusPerReferral.toFixed(2)} por indicação!
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Vocês dois ganham bônus ao se cadastrar pelo link.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Como Funciona */}
        <Card>
          <CardHeader className="pb-3 px-4 md:px-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {[
                { icon: Share2, title: '1. Compartilhe', desc: 'Envie seu link para amigos', colorClass: 'bg-primary/10 text-primary' },
                { icon: Users, title: '2. Cadastram-se', desc: 'Acessam pelo seu link', colorClass: 'bg-accent text-accent-foreground' },
                { icon: Gift, title: '3. Vocês Ganham', desc: 'Bônus em créditos!', colorClass: 'bg-primary/10 text-primary' },
              ].map((step) => (
                <div key={step.title} className="flex sm:flex-col items-center sm:text-center gap-3 sm:flex-1">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${step.colorClass} flex items-center justify-center shrink-0`}>
                    <step.icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm md:text-base">{step.title}</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Indicados */}
        <Card>
          <CardHeader className="pb-3 px-4 md:px-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
              Seus Indicados
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Pessoas que se cadastraram pelo seu link
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            {referrals.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                        <AvatarImage src={referral.referred_profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs md:text-sm">
                          {getInitials(referral.referred_profile?.full_name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base truncate">
                          {referral.referred_profile?.full_name || 'Usuário'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(referral.created_at), "dd 'de' MMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={referral.bonus_awarded > 0 ? 'default' : 'secondary'}
                      className={`shrink-0 text-xs ${referral.bonus_awarded > 0 ? 'bg-green-500' : ''}`}
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
              <div className="text-center py-8 md:py-12">
                <Users className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm mb-1">
                  Nenhum indicado ainda
                </p>
                <p className="text-xs text-muted-foreground">
                  Compartilhe seu código e comece a ganhar!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA Card */}
        <Card>
          <CardContent className="p-4 md:p-6 text-center">
            <Sparkles className="h-8 w-8 md:h-10 md:w-10 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-bold text-base md:text-lg mb-1">
              Quanto mais indicar, mais ganha!
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-4">
              Não há limite para suas indicações. Compartilhe agora!
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button className="w-full gap-2" size="sm">
                  <Share2 className="h-4 w-4" />
                  Compartilhar Link
                </Button>
              </PopoverTrigger>
              <SharePopoverContent />
            </Popover>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

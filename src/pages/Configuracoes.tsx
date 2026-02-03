import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/back-button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor,
  Bell, 
  BellOff,
  Shield,
  Key,
  Trash2,
  LogOut,
  Loader2,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Volume2,
  VolumeX,
  Palette
} from 'lucide-react';

export default function Configuracoes() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  // Estado para alteração de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Estado para preferências de notificação (localStorage)
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem('pref_email_notifications') !== 'false';
  });
  const [pushNotifications, setPushNotifications] = useState(() => {
    return localStorage.getItem('pref_push_notifications') !== 'false';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('pref_sound_enabled') !== 'false';
  });
  const [winNotifications, setWinNotifications] = useState(() => {
    return localStorage.getItem('pref_win_notifications') !== 'false';
  });
  const [promoNotifications, setPromoNotifications] = useState(() => {
    return localStorage.getItem('pref_promo_notifications') !== 'false';
  });

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast({
      title: 'Tema alterado',
      description: `O tema foi alterado para ${newTheme === 'dark' ? 'escuro' : newTheme === 'light' ? 'claro' : 'automático'}.`,
    });
  };

  const handleNotificationChange = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(`pref_${key}`, String(value));
    toast({
      title: 'Preferência salva',
      description: 'Sua preferência de notificação foi atualizada.',
    });
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos de senha.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A nova senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'A nova senha e a confirmação devem ser iguais.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi atualizada com sucesso.',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'Erro ao alterar senha',
        description: error.message || 'Não foi possível alterar sua senha.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado com sucesso.',
    });
  };

  const handleDeleteAccount = async () => {
    // Por segurança, apenas sinalizamos a solicitação
    toast({
      title: 'Solicitação enviada',
      description: 'Sua solicitação de exclusão foi registrada. Entraremos em contato em até 48h.',
    });
  };

  if (!user || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para acessar as configurações
          </p>
          <Button asChild>
            <Link to="/login">Fazer Login</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-3xl">
        <BackButton className="mb-4" />
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">
              Personalize sua experiência e gerencie sua conta
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Card de Aparência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize a aparência do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Tema</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun className="h-5 w-5" />
                    <span className="text-xs">Claro</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon className="h-5 w-5" />
                    <span className="text-xs">Escuro</span>
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => handleThemeChange('system')}
                  >
                    <Monitor className="h-5 w-5" />
                    <span className="text-xs">Sistema</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="font-medium">Notificações por Email</Label>
                    <p className="text-xs text-muted-foreground">
                      Receba atualizações sobre sorteios e prêmios
                    </p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={(v) => handleNotificationChange('email_notifications', v, setEmailNotifications)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="font-medium">Notificações Push</Label>
                    <p className="text-xs text-muted-foreground">
                      Notificações no navegador
                    </p>
                  </div>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={(v) => handleNotificationChange('push_notifications', v, setPushNotifications)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <Label className="font-medium">Sons</Label>
                    <p className="text-xs text-muted-foreground">
                      Efeitos sonoros ao raspar e ganhar
                    </p>
                  </div>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={(v) => handleNotificationChange('sound_enabled', v, setSoundEnabled)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="font-medium">Alertas de Vitória</Label>
                    <p className="text-xs text-muted-foreground">
                      Ser notificado quando ganhar um prêmio
                    </p>
                  </div>
                </div>
                <Switch
                  checked={winNotifications}
                  onCheckedChange={(v) => handleNotificationChange('win_notifications', v, setWinNotifications)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="font-medium">Promoções</Label>
                    <p className="text-xs text-muted-foreground">
                      Ofertas especiais e novos sorteios
                    </p>
                  </div>
                </div>
                <Switch
                  checked={promoNotifications}
                  onCheckedChange={(v) => handleNotificationChange('promo_notifications', v, setPromoNotifications)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card de Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Gerencie a segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <Label className="font-medium">Alterar Senha</Label>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite a nova senha"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                    className="gap-2"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        Alterar Senha
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações irreversíveis da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da Conta
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Excluir Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Todos os seus dados, incluindo
                        saldo na carteira, histórico de compras e prêmios serão
                        permanentemente removidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sim, excluir minha conta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <p className="text-xs text-muted-foreground">
                Ao excluir sua conta, você perderá acesso a todos os seus dados,
                incluindo saldo na carteira e histórico de participações.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

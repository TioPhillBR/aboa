import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  CreditCard, 
  Gamepad2, 
  Users, 
  Bell, 
  Shield, 
  Save,
  Globe,
  Mail,
  Phone,
  Percent,
  Clock,
  Lock,
  Key,
  AlertTriangle,
  Loader2,
  Building,
  DollarSign,
  Sparkles,
  Ticket,
  Gift,
  Share2,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Configurações gerais da plataforma
interface GeneralSettings {
  platformName: string;
  platformDescription: string;
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

// Configurações de pagamento
interface PaymentSettings {
  pixEnabled: boolean;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pixReceiverName: string;
  pixCity: string;
  minimumDeposit: number;
  maximumDeposit: number;
  minimumWithdrawal: number;
  withdrawalFee: number;
  autoApproveWithdrawals: boolean;
  autoApproveLimit: number;
}

// Configurações de jogos
interface GameSettings {
  // Raspadinhas
  scratchCardEnabled: boolean;
  scratchCardMinPrice: number;
  scratchCardMaxPrice: number;
  scratchCardDefaultProbability: number;
  scratchCardMaxWinRate: number;
  
  // Sorteios
  raffleEnabled: boolean;
  raffleMinPrice: number;
  raffleMaxPrice: number;
  raffleMinNumbers: number;
  raffleMaxNumbers: number;
  raffleAutoDrawEnabled: boolean;
}

// Configurações de comissões
interface CommissionSettings {
  affiliateEnabled: boolean;
  defaultAffiliateCommission: number;
  maxAffiliateCommission: number;
  affiliateMinWithdrawal: number;
  referralEnabled: boolean;
  referralBonusAmount: number;
  referralBonusType: 'fixed' | 'percentage';
  shareRewardEnabled: boolean;
  shareRewardAmount: number;
}

// Configurações de notificações
interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  notifyOnPurchase: boolean;
  notifyOnWin: boolean;
  notifyOnDeposit: boolean;
  notifyOnWithdrawal: boolean;
  notifyOnRaffleDraw: boolean;
  marketingEmails: boolean;
}

// Configurações de segurança
interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  ipWhitelist: string;
  adminIpRestriction: boolean;
}

export default function AdminConfiguracoes() {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Estados para cada grupo de configurações
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    platformName: 'A Boa',
    platformDescription: 'Plataforma de sorteios e raspadinhas premiadas',
    contactEmail: 'contato@aboa.com.br',
    contactPhone: '(11) 99999-9999',
    supportEmail: 'suporte@aboa.com.br',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#8B5CF6',
    maintenanceMode: false,
    maintenanceMessage: 'Estamos em manutenção. Voltamos em breve!',
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    pixEnabled: true,
    pixKey: '',
    pixKeyType: 'cpf',
    pixReceiverName: '',
    pixCity: 'São Paulo',
    minimumDeposit: 10,
    maximumDeposit: 5000,
    minimumWithdrawal: 20,
    withdrawalFee: 0,
    autoApproveWithdrawals: false,
    autoApproveLimit: 100,
  });

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    scratchCardEnabled: true,
    scratchCardMinPrice: 1,
    scratchCardMaxPrice: 50,
    scratchCardDefaultProbability: 15,
    scratchCardMaxWinRate: 30,
    raffleEnabled: true,
    raffleMinPrice: 1,
    raffleMaxPrice: 100,
    raffleMinNumbers: 100,
    raffleMaxNumbers: 100000,
    raffleAutoDrawEnabled: true,
  });

  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings>({
    affiliateEnabled: true,
    defaultAffiliateCommission: 10,
    maxAffiliateCommission: 30,
    affiliateMinWithdrawal: 50,
    referralEnabled: true,
    referralBonusAmount: 5,
    referralBonusType: 'fixed',
    shareRewardEnabled: true,
    shareRewardAmount: 1,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    notifyOnPurchase: true,
    notifyOnWin: true,
    notifyOnDeposit: true,
    notifyOnWithdrawal: true,
    notifyOnRaffleDraw: true,
    marketingEmails: false,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    ipWhitelist: '',
    adminIpRestriction: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simular salvamento (futuramente salvar no Supabase)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Configurações salvas com sucesso!');
    setIsSaving(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Configurações
            </h1>
            <p className="text-muted-foreground">
              Gerencie todas as configurações da plataforma
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>

        {/* Tabs de Configurações */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-2 bg-transparent p-0">
            <TabsTrigger 
              value="general" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-3"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payment"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-3"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Pagamentos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="games"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-3"
            >
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Jogos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="commissions"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-3"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Comissões</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-3"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-3"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
          </TabsList>

          {/* Configurações Gerais */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informações da Plataforma
                </CardTitle>
                <CardDescription>
                  Configure as informações básicas da sua plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Nome da Plataforma</Label>
                    <Input
                      id="platformName"
                      value={generalSettings.platformName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Cor Principal</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={generalSettings.primaryColor}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, primaryColor: e.target.value })}
                        className="w-14 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={generalSettings.primaryColor}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, primaryColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platformDescription">Descrição</Label>
                  <Textarea
                    id="platformDescription"
                    value={generalSettings.platformDescription}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, platformDescription: e.target.value })}
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email de Contato
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={generalSettings.contactEmail}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email de Suporte
                    </Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone de Contato
                  </Label>
                  <Input
                    id="contactPhone"
                    value={generalSettings.contactPhone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Modo Manutenção
                </CardTitle>
                <CardDescription>
                  Ative para colocar a plataforma em modo manutenção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ativar Modo Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                      Os usuários não poderão acessar a plataforma
                    </p>
                  </div>
                  <Switch
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, maintenanceMode: checked })}
                  />
                </div>
                {generalSettings.maintenanceMode && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceMessage">Mensagem de Manutenção</Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={generalSettings.maintenanceMessage}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, maintenanceMessage: e.target.value })}
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Pagamentos */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Configurações PIX
                </CardTitle>
                <CardDescription>
                  Configure sua chave PIX para receber pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>PIX Ativado</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir pagamentos via PIX
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.pixEnabled}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, pixEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pixKeyType">Tipo da Chave PIX</Label>
                    <Select
                      value={paymentSettings.pixKeyType}
                      onValueChange={(value: PaymentSettings['pixKeyType']) => 
                        setPaymentSettings({ ...paymentSettings, pixKeyType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="phone">Telefone</SelectItem>
                        <SelectItem value="random">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pixKey">Chave PIX</Label>
                    <Input
                      id="pixKey"
                      value={paymentSettings.pixKey}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, pixKey: e.target.value })}
                      placeholder="Digite sua chave PIX"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pixReceiverName">Nome do Recebedor</Label>
                    <Input
                      id="pixReceiverName"
                      value={paymentSettings.pixReceiverName}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, pixReceiverName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pixCity">Cidade</Label>
                    <Input
                      id="pixCity"
                      value={paymentSettings.pixCity}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, pixCity: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Limites de Transação
                </CardTitle>
                <CardDescription>
                  Defina os limites para depósitos e saques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minimumDeposit">Depósito Mínimo (R$)</Label>
                    <Input
                      id="minimumDeposit"
                      type="number"
                      min="1"
                      value={paymentSettings.minimumDeposit}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, minimumDeposit: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maximumDeposit">Depósito Máximo (R$)</Label>
                    <Input
                      id="maximumDeposit"
                      type="number"
                      min="1"
                      value={paymentSettings.maximumDeposit}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, maximumDeposit: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minimumWithdrawal">Saque Mínimo (R$)</Label>
                    <Input
                      id="minimumWithdrawal"
                      type="number"
                      min="1"
                      value={paymentSettings.minimumWithdrawal}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, minimumWithdrawal: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawalFee">Taxa de Saque (R$)</Label>
                    <Input
                      id="withdrawalFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentSettings.withdrawalFee}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, withdrawalFee: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aprovar Saques Automaticamente</Label>
                    <p className="text-sm text-muted-foreground">
                      Saques até o limite definido serão aprovados automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.autoApproveWithdrawals}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, autoApproveWithdrawals: checked })}
                  />
                </div>

                {paymentSettings.autoApproveWithdrawals && (
                  <div className="space-y-2">
                    <Label htmlFor="autoApproveLimit">Limite de Aprovação Automática (R$)</Label>
                    <Input
                      id="autoApproveLimit"
                      type="number"
                      min="1"
                      value={paymentSettings.autoApproveLimit}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, autoApproveLimit: Number(e.target.value) })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Jogos */}
          <TabsContent value="games" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Raspadinhas
                </CardTitle>
                <CardDescription>
                  Configure os parâmetros das raspadinhas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Raspadinhas Ativadas</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir compra de raspadinhas
                    </p>
                  </div>
                  <Switch
                    checked={gameSettings.scratchCardEnabled}
                    onCheckedChange={(checked) => setGameSettings({ ...gameSettings, scratchCardEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scratchCardMinPrice">Preço Mínimo (R$)</Label>
                    <Input
                      id="scratchCardMinPrice"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={gameSettings.scratchCardMinPrice}
                      onChange={(e) => setGameSettings({ ...gameSettings, scratchCardMinPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scratchCardMaxPrice">Preço Máximo (R$)</Label>
                    <Input
                      id="scratchCardMaxPrice"
                      type="number"
                      min="1"
                      value={gameSettings.scratchCardMaxPrice}
                      onChange={(e) => setGameSettings({ ...gameSettings, scratchCardMaxPrice: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scratchCardDefaultProbability">Probabilidade Padrão (%)</Label>
                    <Input
                      id="scratchCardDefaultProbability"
                      type="number"
                      min="1"
                      max="100"
                      value={gameSettings.scratchCardDefaultProbability}
                      onChange={(e) => setGameSettings({ ...gameSettings, scratchCardDefaultProbability: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Chance padrão de vitória ao criar nova raspadinha
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scratchCardMaxWinRate">Taxa Máxima de Vitória (%)</Label>
                    <Input
                      id="scratchCardMaxWinRate"
                      type="number"
                      min="1"
                      max="100"
                      value={gameSettings.scratchCardMaxWinRate}
                      onChange={(e) => setGameSettings({ ...gameSettings, scratchCardMaxWinRate: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Limite máximo permitido para chance de vitória
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Sorteios
                </CardTitle>
                <CardDescription>
                  Configure os parâmetros dos sorteios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sorteios Ativados</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir compra de tickets de sorteio
                    </p>
                  </div>
                  <Switch
                    checked={gameSettings.raffleEnabled}
                    onCheckedChange={(checked) => setGameSettings({ ...gameSettings, raffleEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="raffleMinPrice">Preço Mínimo por Número (R$)</Label>
                    <Input
                      id="raffleMinPrice"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={gameSettings.raffleMinPrice}
                      onChange={(e) => setGameSettings({ ...gameSettings, raffleMinPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="raffleMaxPrice">Preço Máximo por Número (R$)</Label>
                    <Input
                      id="raffleMaxPrice"
                      type="number"
                      min="1"
                      value={gameSettings.raffleMaxPrice}
                      onChange={(e) => setGameSettings({ ...gameSettings, raffleMaxPrice: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="raffleMinNumbers">Mínimo de Números</Label>
                    <Input
                      id="raffleMinNumbers"
                      type="number"
                      min="10"
                      value={gameSettings.raffleMinNumbers}
                      onChange={(e) => setGameSettings({ ...gameSettings, raffleMinNumbers: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="raffleMaxNumbers">Máximo de Números</Label>
                    <Input
                      id="raffleMaxNumbers"
                      type="number"
                      min="100"
                      value={gameSettings.raffleMaxNumbers}
                      onChange={(e) => setGameSettings({ ...gameSettings, raffleMaxNumbers: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sorteio Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Realizar sorteio automaticamente quando esgotarem os números
                    </p>
                  </div>
                  <Switch
                    checked={gameSettings.raffleAutoDrawEnabled}
                    onCheckedChange={(checked) => setGameSettings({ ...gameSettings, raffleAutoDrawEnabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Comissões */}
          <TabsContent value="commissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Programa de Afiliados
                </CardTitle>
                <CardDescription>
                  Configure as comissões dos afiliados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Programa de Afiliados Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir cadastro de afiliados
                    </p>
                  </div>
                  <Switch
                    checked={commissionSettings.affiliateEnabled}
                    onCheckedChange={(checked) => setCommissionSettings({ ...commissionSettings, affiliateEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="defaultAffiliateCommission">Comissão Padrão (%)</Label>
                    <Input
                      id="defaultAffiliateCommission"
                      type="number"
                      min="1"
                      max="100"
                      value={commissionSettings.defaultAffiliateCommission}
                      onChange={(e) => setCommissionSettings({ ...commissionSettings, defaultAffiliateCommission: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAffiliateCommission">Comissão Máxima (%)</Label>
                    <Input
                      id="maxAffiliateCommission"
                      type="number"
                      min="1"
                      max="100"
                      value={commissionSettings.maxAffiliateCommission}
                      onChange={(e) => setCommissionSettings({ ...commissionSettings, maxAffiliateCommission: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="affiliateMinWithdrawal">Saque Mínimo (R$)</Label>
                    <Input
                      id="affiliateMinWithdrawal"
                      type="number"
                      min="1"
                      value={commissionSettings.affiliateMinWithdrawal}
                      onChange={(e) => setCommissionSettings({ ...commissionSettings, affiliateMinWithdrawal: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Programa de Indicação
                </CardTitle>
                <CardDescription>
                  Configure bônus para indicações de novos usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Programa de Indicação Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      Recompensar usuários por indicações
                    </p>
                  </div>
                  <Switch
                    checked={commissionSettings.referralEnabled}
                    onCheckedChange={(checked) => setCommissionSettings({ ...commissionSettings, referralEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="referralBonusType">Tipo de Bônus</Label>
                    <Select
                      value={commissionSettings.referralBonusType}
                      onValueChange={(value: 'fixed' | 'percentage') => 
                        setCommissionSettings({ ...commissionSettings, referralBonusType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referralBonusAmount">
                      Valor do Bônus {commissionSettings.referralBonusType === 'fixed' ? '(R$)' : '(%)'}
                    </Label>
                    <Input
                      id="referralBonusAmount"
                      type="number"
                      min="0"
                      step={commissionSettings.referralBonusType === 'fixed' ? '1' : '0.5'}
                      value={commissionSettings.referralBonusAmount}
                      onChange={(e) => setCommissionSettings({ ...commissionSettings, referralBonusAmount: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Recompensa por Compartilhamento
                </CardTitle>
                <CardDescription>
                  Configure bônus por compartilhamentos nas redes sociais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Recompensa por Compartilhamento</Label>
                    <p className="text-sm text-muted-foreground">
                      Dar créditos quando usuários compartilham
                    </p>
                  </div>
                  <Switch
                    checked={commissionSettings.shareRewardEnabled}
                    onCheckedChange={(checked) => setCommissionSettings({ ...commissionSettings, shareRewardEnabled: checked })}
                  />
                </div>

                {commissionSettings.shareRewardEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="shareRewardAmount">Crédito por Compartilhamento (R$)</Label>
                    <Input
                      id="shareRewardAmount"
                      type="number"
                      min="0"
                      step="0.5"
                      value={commissionSettings.shareRewardAmount}
                      onChange={(e) => setCommissionSettings({ ...commissionSettings, shareRewardAmount: Number(e.target.value) })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Notificações */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Canais de Notificação
                </CardTitle>
                <CardDescription>
                  Escolha os canais para enviar notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-mail
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações por e-mail
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailEnabled}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      SMS
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações por SMS
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Em breve</Badge>
                    <Switch
                      checked={notificationSettings.smsEnabled}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, smsEnabled: checked })}
                      disabled
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações no navegador/app
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushEnabled}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, pushEnabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Eventos de Notificação
                </CardTitle>
                <CardDescription>
                  Escolha quando enviar notificações aos usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Notificar em Compras</Label>
                  <Switch
                    checked={notificationSettings.notifyOnPurchase}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notifyOnPurchase: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Notificar em Vitórias</Label>
                  <Switch
                    checked={notificationSettings.notifyOnWin}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notifyOnWin: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Notificar em Depósitos</Label>
                  <Switch
                    checked={notificationSettings.notifyOnDeposit}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notifyOnDeposit: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Notificar em Saques</Label>
                  <Switch
                    checked={notificationSettings.notifyOnWithdrawal}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notifyOnWithdrawal: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Notificar Sorteios</Label>
                  <Switch
                    checked={notificationSettings.notifyOnRaffleDraw}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notifyOnRaffleDraw: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-mails de Marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar promoções e novidades
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, marketingEmails: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Segurança */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Autenticação
                </CardTitle>
                <CardDescription>
                  Configure as opções de segurança de autenticação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Autenticação em Dois Fatores (2FA)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir 2FA para todos os usuários
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Em breve</Badge>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: checked })}
                      disabled
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Tempo de Sessão (minutos)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      max="1440"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Máximo de Tentativas de Login</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      min="3"
                      max="10"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Política de Senhas
                </CardTitle>
                <CardDescription>
                  Defina os requisitos mínimos para senhas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Comprimento Mínimo</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="32"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Exigir Letras Maiúsculas</Label>
                    <Switch
                      checked={securitySettings.requireUppercase}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireUppercase: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Exigir Números</Label>
                    <Switch
                      checked={securitySettings.requireNumbers}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireNumbers: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Exigir Caracteres Especiais</Label>
                    <Switch
                      checked={securitySettings.requireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireSpecialChars: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Restrições de IP
                </CardTitle>
                <CardDescription>
                  Configure restrições de acesso por IP para área administrativa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Restringir Acesso Admin por IP</Label>
                    <p className="text-sm text-muted-foreground">
                      Apenas IPs autorizados podem acessar o admin
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.adminIpRestriction}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, adminIpRestriction: checked })}
                  />
                </div>

                {securitySettings.adminIpRestriction && (
                  <div className="space-y-2">
                    <Label htmlFor="ipWhitelist">IPs Autorizados (um por linha)</Label>
                    <Textarea
                      id="ipWhitelist"
                      placeholder="192.168.1.1&#10;10.0.0.1"
                      value={securitySettings.ipWhitelist}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, ipWhitelist: e.target.value })}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para permitir qualquer IP
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

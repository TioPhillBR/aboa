import { useState, useRef } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Wallet,
  Upload,
  Image,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { cn } from '@/lib/utils';

// Field wrapper with validation error display
function FormField({ 
  label, 
  error, 
  children,
  icon: Icon,
  description,
  required
}: { 
  label: string; 
  error?: string; 
  children: React.ReactNode;
  icon?: React.ElementType;
  description?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className={cn("flex items-center gap-2", error && "text-destructive")}>
        {Icon && <Icon className="h-4 w-4" />}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Validated input component
function ValidatedInput({
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  className,
  min,
  max,
  step,
  disabled
}: {
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          className,
          error && "border-destructive focus-visible:ring-destructive"
        )}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      {error ? (
        <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
      ) : value && !error ? (
        <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
      ) : null}
    </div>
  );
}

// Image upload component
function ImageUpload({
  label,
  currentUrl,
  onUpload,
  onRemove,
  type
}: {
  label: string;
  currentUrl: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
  type: 'logo' | 'favicon';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (type === 'favicon') {
      validTypes.push('image/x-icon', 'image/vnd.microsoft.icon');
    }
    
    if (!validTypes.includes(file.type)) {
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);
    await onUpload(file);
    setIsUploading(false);
    
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        {currentUrl ? (
          <div className="relative group">
            <Avatar className={cn(
              "border-2 border-border",
              type === 'logo' ? 'h-20 w-20 rounded-xl' : 'h-12 w-12'
            )}>
              <AvatarImage src={currentUrl} alt={label} />
              <AvatarFallback className="bg-muted">
                <Image className="h-6 w-6 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className={cn(
            "flex items-center justify-center border-2 border-dashed border-muted-foreground/25 bg-muted/50 rounded-xl",
            type === 'logo' ? 'h-20 w-20' : 'h-12 w-12'
          )}>
            <Image className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={type === 'favicon' ? '.ico,.png,.svg' : '.png,.jpg,.jpeg,.webp,.svg'}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {currentUrl ? 'Alterar' : 'Fazer Upload'}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            {type === 'logo' 
              ? 'PNG, JPG, WebP ou SVG. Máx 2MB.' 
              : 'ICO, PNG ou SVG. Máx 2MB.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminConfiguracoes() {
  const {
    settings,
    isLoading,
    isSaving,
    errors,
    hasChanges,
    updateSettings,
    saveSettings,
    uploadImage,
  } = usePlatformSettings();
  
  const [activeTab, setActiveTab] = useState('general');

  const handleLogoUpload = async (file: File) => {
    const url = await uploadImage(file, 'logo');
    if (url) {
      updateSettings('general', { logoUrl: url });
    }
  };

  const handleFaviconUpload = async (file: File) => {
    const url = await uploadImage(file, 'favicon');
    if (url) {
      updateSettings('general', { faviconUrl: url });
    }
  };

  // Count errors per tab
  const getErrorCount = (category: string): number => {
    return Object.keys(errors).filter(key => key.startsWith(category)).length;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

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
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Alterações não salvas
              </Badge>
            )}
            <Button 
              onClick={saveSettings} 
              disabled={isSaving || Object.keys(errors).length > 0} 
              className="gap-2"
            >
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
        </div>

        {/* Error summary */}
        {Object.keys(errors).length > 0 && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  {Object.keys(errors).length} erro(s) encontrado(s)
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Corrija os campos destacados antes de salvar.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs de Configurações */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-2 bg-transparent p-0">
            {[
              { value: 'general', label: 'Geral', icon: Globe },
              { value: 'payment', label: 'Pagamentos', icon: CreditCard },
              { value: 'games', label: 'Jogos', icon: Gamepad2 },
              { value: 'commissions', label: 'Comissões', icon: Users },
              { value: 'notifications', label: 'Notificações', icon: Bell },
              { value: 'security', label: 'Segurança', icon: Shield },
            ].map((tab) => {
              const errorCount = getErrorCount(tab.value);
              return (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-3 relative"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {errorCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                      {errorCount}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
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
                  <FormField 
                    label="Nome da Plataforma" 
                    error={errors['general.platformName']}
                    required
                  >
                    <ValidatedInput
                      value={settings.general.platformName}
                      onChange={(value) => updateSettings('general', { platformName: value })}
                      error={errors['general.platformName']}
                      placeholder="Ex: A Boa"
                    />
                  </FormField>
                  
                  <FormField 
                    label="Cor Principal" 
                    error={errors['general.primaryColor']}
                    required
                  >
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.general.primaryColor}
                        onChange={(e) => updateSettings('general', { primaryColor: e.target.value })}
                        className="w-14 h-10 p-1 cursor-pointer"
                      />
                      <ValidatedInput
                        value={settings.general.primaryColor}
                        onChange={(value) => updateSettings('general', { primaryColor: value })}
                        error={errors['general.primaryColor']}
                        className="flex-1"
                        placeholder="#10B981"
                      />
                    </div>
                  </FormField>
                </div>

                <FormField label="Descrição">
                  <Textarea
                    value={settings.general.platformDescription}
                    onChange={(e) => updateSettings('general', { platformDescription: e.target.value })}
                    rows={3}
                    placeholder="Descreva sua plataforma..."
                  />
                </FormField>

                <Separator />

                {/* Image Uploads */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <ImageUpload
                    label="Logo da Plataforma"
                    currentUrl={settings.general.logoUrl}
                    onUpload={handleLogoUpload}
                    onRemove={() => updateSettings('general', { logoUrl: '' })}
                    type="logo"
                  />
                  <ImageUpload
                    label="Favicon"
                    currentUrl={settings.general.faviconUrl}
                    onUpload={handleFaviconUpload}
                    onRemove={() => updateSettings('general', { faviconUrl: '' })}
                    type="favicon"
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField 
                    label="Email de Contato" 
                    icon={Mail}
                    error={errors['general.contactEmail']}
                    required
                  >
                    <ValidatedInput
                      type="email"
                      value={settings.general.contactEmail}
                      onChange={(value) => updateSettings('general', { contactEmail: value })}
                      error={errors['general.contactEmail']}
                      placeholder="contato@exemplo.com"
                    />
                  </FormField>
                  
                  <FormField 
                    label="Email de Suporte" 
                    icon={Mail}
                    error={errors['general.supportEmail']}
                    required
                  >
                    <ValidatedInput
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(value) => updateSettings('general', { supportEmail: value })}
                      error={errors['general.supportEmail']}
                      placeholder="suporte@exemplo.com"
                    />
                  </FormField>
                </div>

                <FormField 
                  label="Telefone de Contato" 
                  icon={Phone}
                  error={errors['general.contactPhone']}
                  description="Formato: (11) 99999-9999"
                >
                  <ValidatedInput
                    value={settings.general.contactPhone}
                    onChange={(value) => updateSettings('general', { contactPhone: value })}
                    error={errors['general.contactPhone']}
                    placeholder="(11) 99999-9999"
                  />
                </FormField>
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
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) => updateSettings('general', { maintenanceMode: checked })}
                  />
                </div>
                {settings.general.maintenanceMode && (
                  <FormField label="Mensagem de Manutenção">
                    <Textarea
                      value={settings.general.maintenanceMessage}
                      onChange={(e) => updateSettings('general', { maintenanceMessage: e.target.value })}
                      rows={2}
                      placeholder="Mensagem exibida aos usuários..."
                    />
                  </FormField>
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
                    checked={settings.payment.pixEnabled}
                    onCheckedChange={(checked) => updateSettings('payment', { pixEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Tipo da Chave PIX">
                    <Select
                      value={settings.payment.pixKeyType}
                      onValueChange={(value: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random') => 
                        updateSettings('payment', { pixKeyType: value })
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
                  </FormField>
                  
                  <FormField 
                    label="Chave PIX" 
                    error={errors['payment.pixKey']}
                  >
                    <ValidatedInput
                      value={settings.payment.pixKey}
                      onChange={(value) => updateSettings('payment', { pixKey: value })}
                      error={errors['payment.pixKey']}
                      placeholder="Digite sua chave PIX"
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Nome do Recebedor">
                    <Input
                      value={settings.payment.pixReceiverName}
                      onChange={(e) => updateSettings('payment', { pixReceiverName: e.target.value })}
                      placeholder="Nome completo ou razão social"
                    />
                  </FormField>
                  <FormField label="Cidade">
                    <Input
                      value={settings.payment.pixCity}
                      onChange={(e) => updateSettings('payment', { pixCity: e.target.value })}
                      placeholder="São Paulo"
                    />
                  </FormField>
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
                  <FormField 
                    label="Depósito Mínimo (R$)" 
                    error={errors['payment.minimumDeposit']}
                  >
                    <ValidatedInput
                      type="number"
                      min={1}
                      value={settings.payment.minimumDeposit}
                      onChange={(value) => updateSettings('payment', { minimumDeposit: Number(value) })}
                      error={errors['payment.minimumDeposit']}
                    />
                  </FormField>
                  
                  <FormField 
                    label="Depósito Máximo (R$)" 
                    error={errors['payment.maximumDeposit']}
                  >
                    <ValidatedInput
                      type="number"
                      min={1}
                      value={settings.payment.maximumDeposit}
                      onChange={(value) => updateSettings('payment', { maximumDeposit: Number(value) })}
                      error={errors['payment.maximumDeposit']}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField 
                    label="Saque Mínimo (R$)" 
                    error={errors['payment.minimumWithdrawal']}
                  >
                    <ValidatedInput
                      type="number"
                      min={1}
                      value={settings.payment.minimumWithdrawal}
                      onChange={(value) => updateSettings('payment', { minimumWithdrawal: Number(value) })}
                      error={errors['payment.minimumWithdrawal']}
                    />
                  </FormField>
                  
                  <FormField 
                    label="Taxa de Saque (R$)" 
                    error={errors['payment.withdrawalFee']}
                  >
                    <ValidatedInput
                      type="number"
                      min={0}
                      step="0.01"
                      value={settings.payment.withdrawalFee}
                      onChange={(value) => updateSettings('payment', { withdrawalFee: Number(value) })}
                      error={errors['payment.withdrawalFee']}
                    />
                  </FormField>
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
                    checked={settings.payment.autoApproveWithdrawals}
                    onCheckedChange={(checked) => updateSettings('payment', { autoApproveWithdrawals: checked })}
                  />
                </div>

                {settings.payment.autoApproveWithdrawals && (
                  <FormField label="Limite de Aprovação Automática (R$)">
                    <Input
                      type="number"
                      min={1}
                      value={settings.payment.autoApproveLimit}
                      onChange={(e) => updateSettings('payment', { autoApproveLimit: Number(e.target.value) })}
                    />
                  </FormField>
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
                    checked={settings.games.scratchCardEnabled}
                    onCheckedChange={(checked) => updateSettings('games', { scratchCardEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField 
                    label="Preço Mínimo (R$)" 
                    error={errors['games.scratchCardMinPrice']}
                  >
                    <ValidatedInput
                      type="number"
                      min={0.5}
                      step="0.5"
                      value={settings.games.scratchCardMinPrice}
                      onChange={(value) => updateSettings('games', { scratchCardMinPrice: Number(value) })}
                      error={errors['games.scratchCardMinPrice']}
                    />
                  </FormField>
                  
                  <FormField 
                    label="Preço Máximo (R$)" 
                    error={errors['games.scratchCardMaxPrice']}
                  >
                    <ValidatedInput
                      type="number"
                      min={1}
                      value={settings.games.scratchCardMaxPrice}
                      onChange={(value) => updateSettings('games', { scratchCardMaxPrice: Number(value) })}
                      error={errors['games.scratchCardMaxPrice']}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField 
                    label="Probabilidade Padrão (%)" 
                    error={errors['games.scratchCardDefaultProbability']}
                    description="Chance padrão de vitória ao criar nova raspadinha"
                  >
                    <ValidatedInput
                      type="number"
                      min={1}
                      max={100}
                      value={settings.games.scratchCardDefaultProbability}
                      onChange={(value) => updateSettings('games', { scratchCardDefaultProbability: Number(value) })}
                      error={errors['games.scratchCardDefaultProbability']}
                    />
                  </FormField>
                  
                  <FormField 
                    label="Taxa Máxima de Vitória (%)" 
                    error={errors['games.scratchCardMaxWinRate']}
                    description="Limite máximo permitido para chance de vitória"
                  >
                    <ValidatedInput
                      type="number"
                      min={1}
                      max={100}
                      value={settings.games.scratchCardMaxWinRate}
                      onChange={(value) => updateSettings('games', { scratchCardMaxWinRate: Number(value) })}
                      error={errors['games.scratchCardMaxWinRate']}
                    />
                  </FormField>
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
                    checked={settings.games.raffleEnabled}
                    onCheckedChange={(checked) => updateSettings('games', { raffleEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField 
                    label="Preço Mínimo por Número (R$)" 
                    error={errors['games.raffleMinPrice']}
                  >
                    <ValidatedInput
                      type="number"
                      min={0.5}
                      step="0.5"
                      value={settings.games.raffleMinPrice}
                      onChange={(value) => updateSettings('games', { raffleMinPrice: Number(value) })}
                      error={errors['games.raffleMinPrice']}
                    />
                  </FormField>
                  
                  <FormField 
                    label="Preço Máximo por Número (R$)" 
                    error={errors['games.raffleMaxPrice']}
                  >
                    <ValidatedInput
                      type="number"
                      min={1}
                      value={settings.games.raffleMaxPrice}
                      onChange={(value) => updateSettings('games', { raffleMaxPrice: Number(value) })}
                      error={errors['games.raffleMaxPrice']}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField 
                    label="Mínimo de Números" 
                    error={errors['games.raffleMinNumbers']}
                  >
                    <ValidatedInput
                      type="number"
                      min={10}
                      value={settings.games.raffleMinNumbers}
                      onChange={(value) => updateSettings('games', { raffleMinNumbers: Number(value) })}
                      error={errors['games.raffleMinNumbers']}
                    />
                  </FormField>
                  
                  <FormField 
                    label="Máximo de Números" 
                    error={errors['games.raffleMaxNumbers']}
                  >
                    <ValidatedInput
                      type="number"
                      min={100}
                      value={settings.games.raffleMaxNumbers}
                      onChange={(value) => updateSettings('games', { raffleMaxNumbers: Number(value) })}
                      error={errors['games.raffleMaxNumbers']}
                    />
                  </FormField>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sorteio Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Realizar sorteio automaticamente quando esgotarem os números
                    </p>
                  </div>
                  <Switch
                    checked={settings.games.raffleAutoDrawEnabled}
                    onCheckedChange={(checked) => updateSettings('games', { raffleAutoDrawEnabled: checked })}
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
                    checked={settings.commissions.affiliateEnabled}
                    onCheckedChange={(checked) => updateSettings('commissions', { affiliateEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField 
                    label="Comissão Padrão (%)" 
                    error={errors['commissions.defaultAffiliateCommission']}
                  >
                    <ValidatedInput
                      type="number"
                      min={1}
                      max={100}
                      value={settings.commissions.defaultAffiliateCommission}
                      onChange={(value) => updateSettings('commissions', { defaultAffiliateCommission: Number(value) })}
                      error={errors['commissions.defaultAffiliateCommission']}
                    />
                  </FormField>
                  
                  <FormField 
                    label="Comissão Máxima (%)" 
                    error={errors['commissions.maxAffiliateCommission']}
                  >
                    <ValidatedInput
                      type="number"
                      min={1}
                      max={100}
                      value={settings.commissions.maxAffiliateCommission}
                      onChange={(value) => updateSettings('commissions', { maxAffiliateCommission: Number(value) })}
                      error={errors['commissions.maxAffiliateCommission']}
                    />
                  </FormField>
                  
                  <FormField 
                    label="Saque Mínimo (R$)" 
                    error={errors['commissions.affiliateMinWithdrawal']}
                  >
                    <ValidatedInput
                      type="number"
                      min={1}
                      value={settings.commissions.affiliateMinWithdrawal}
                      onChange={(value) => updateSettings('commissions', { affiliateMinWithdrawal: Number(value) })}
                      error={errors['commissions.affiliateMinWithdrawal']}
                    />
                  </FormField>
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
                    checked={settings.commissions.referralEnabled}
                    onCheckedChange={(checked) => updateSettings('commissions', { referralEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Tipo de Bônus">
                    <Select
                      value={settings.commissions.referralBonusType}
                      onValueChange={(value: 'fixed' | 'percentage') => 
                        updateSettings('commissions', { referralBonusType: value })
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
                  </FormField>
                  
                  <FormField 
                    label={`Valor do Bônus ${settings.commissions.referralBonusType === 'fixed' ? '(R$)' : '(%)'}`}
                    error={errors['commissions.referralBonusAmount']}
                  >
                    <ValidatedInput
                      type="number"
                      min={0}
                      step={settings.commissions.referralBonusType === 'fixed' ? '1' : '0.5'}
                      value={settings.commissions.referralBonusAmount}
                      onChange={(value) => updateSettings('commissions', { referralBonusAmount: Number(value) })}
                      error={errors['commissions.referralBonusAmount']}
                    />
                  </FormField>
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
                    checked={settings.commissions.shareRewardEnabled}
                    onCheckedChange={(checked) => updateSettings('commissions', { shareRewardEnabled: checked })}
                  />
                </div>

                {settings.commissions.shareRewardEnabled && (
                  <FormField 
                    label="Crédito por Compartilhamento (R$)"
                    error={errors['commissions.shareRewardAmount']}
                  >
                    <ValidatedInput
                      type="number"
                      min={0}
                      step="0.5"
                      value={settings.commissions.shareRewardAmount}
                      onChange={(value) => updateSettings('commissions', { shareRewardAmount: Number(value) })}
                      error={errors['commissions.shareRewardAmount']}
                    />
                  </FormField>
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
                    checked={settings.notifications.emailEnabled}
                    onCheckedChange={(checked) => updateSettings('notifications', { emailEnabled: checked })}
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
                      checked={settings.notifications.smsEnabled}
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
                    checked={settings.notifications.pushEnabled}
                    onCheckedChange={(checked) => updateSettings('notifications', { pushEnabled: checked })}
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
                {[
                  { key: 'notifyOnPurchase', label: 'Notificar em Compras' },
                  { key: 'notifyOnWin', label: 'Notificar em Vitórias' },
                  { key: 'notifyOnDeposit', label: 'Notificar em Depósitos' },
                  { key: 'notifyOnWithdrawal', label: 'Notificar em Saques' },
                  { key: 'notifyOnRaffleDraw', label: 'Notificar Sorteios' },
                ].map((item, index) => (
                  <div key={item.key}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex items-center justify-between">
                      <Label>{item.label}</Label>
                      <Switch
                        checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                        onCheckedChange={(checked) => 
                          updateSettings('notifications', { [item.key]: checked })
                        }
                      />
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-mails de Marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar promoções e novidades
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.marketingEmails}
                    onCheckedChange={(checked) => updateSettings('notifications', { marketingEmails: checked })}
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
                      checked={settings.security.twoFactorEnabled}
                      disabled
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField 
                    label="Tempo de Sessão (minutos)" 
                    icon={Clock}
                    error={errors['security.sessionTimeout']}
                  >
                    <ValidatedInput
                      type="number"
                      min={5}
                      max={1440}
                      value={settings.security.sessionTimeout}
                      onChange={(value) => updateSettings('security', { sessionTimeout: Number(value) })}
                      error={errors['security.sessionTimeout']}
                    />
                  </FormField>
                  
                  <FormField 
                    label="Máximo de Tentativas de Login"
                    error={errors['security.maxLoginAttempts']}
                  >
                    <ValidatedInput
                      type="number"
                      min={3}
                      max={10}
                      value={settings.security.maxLoginAttempts}
                      onChange={(value) => updateSettings('security', { maxLoginAttempts: Number(value) })}
                      error={errors['security.maxLoginAttempts']}
                    />
                  </FormField>
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
                <FormField 
                  label="Comprimento Mínimo"
                  error={errors['security.passwordMinLength']}
                >
                  <ValidatedInput
                    type="number"
                    min={6}
                    max={32}
                    value={settings.security.passwordMinLength}
                    onChange={(value) => updateSettings('security', { passwordMinLength: Number(value) })}
                    error={errors['security.passwordMinLength']}
                  />
                </FormField>

                <div className="space-y-4">
                  {[
                    { key: 'requireUppercase', label: 'Exigir Letras Maiúsculas' },
                    { key: 'requireNumbers', label: 'Exigir Números' },
                    { key: 'requireSpecialChars', label: 'Exigir Caracteres Especiais' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label>{item.label}</Label>
                      <Switch
                        checked={settings.security[item.key as keyof typeof settings.security] as boolean}
                        onCheckedChange={(checked) => 
                          updateSettings('security', { [item.key]: checked })
                        }
                      />
                    </div>
                  ))}
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
                    checked={settings.security.adminIpRestriction}
                    onCheckedChange={(checked) => updateSettings('security', { adminIpRestriction: checked })}
                  />
                </div>

                {settings.security.adminIpRestriction && (
                  <FormField 
                    label="IPs Autorizados (um por linha)"
                    description="Deixe em branco para permitir qualquer IP"
                  >
                    <Textarea
                      placeholder="192.168.1.1&#10;10.0.0.1"
                      value={settings.security.ipWhitelist}
                      onChange={(e) => updateSettings('security', { ipWhitelist: e.target.value })}
                      rows={4}
                    />
                  </FormField>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

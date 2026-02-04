import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ImageCropper } from '@/components/ui/image-cropper';
import {
  User, 
  Camera, 
  Mail, 
  Phone, 
  Calendar,
  Save,
  Loader2,
  Shield,
  Trash2,
  MapPin,
  Home,
  Building,
  CreditCard,
  CheckCircle,
  Banknote
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mask functions
function maskPhone(value: string): string {
  const numbers = value.replace(/[^\d]/g, '').slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function maskCEP(value: string): string {
  const numbers = value.replace(/[^\d]/g, '').slice(0, 8);
  return numbers.replace(/(\d{5})(\d)/, '$1-$2');
}

function formatCPF(cpf: string | null): string {
  if (!cpf) return '—';
  const numbers = cpf.replace(/[^\d]/g, '');
  if (numbers.length !== 11) return cpf;
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

interface ViaCepData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export default function Perfil() {
  const { user, profile, updateProfile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Personal data states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Address states
  const [addressCep, setAddressCep] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  
  // PIX key states (for receiving prizes)
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<string>('cpf');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Estados do cropper
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');

  // Initialize states when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone ? maskPhone(profile.phone) : '');
      setAddressCep(profile.address_cep ? maskCEP(profile.address_cep) : '');
      setAddressStreet(profile.address_street || '');
      setAddressNumber(profile.address_number || '');
      setAddressComplement(profile.address_complement || '');
      setAddressNeighborhood(profile.address_neighborhood || '');
      setAddressCity(profile.address_city || '');
      setAddressState(profile.address_state || '');
      setPixKey(profile.pix_key || '');
      setPixKeyType(profile.pix_key_type || 'cpf');
    }
  }, [profile]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle CEP change with ViaCEP integration
  const handleCepChange = async (value: string) => {
    const maskedValue = maskCEP(value);
    setAddressCep(maskedValue);
    
    const cleanCep = maskedValue.replace(/[^\d]/g, '');
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data: ViaCepData = await response.json();
        
        if (!data.erro) {
          setAddressStreet(data.logradouro || '');
          setAddressNeighborhood(data.bairro || '');
          setAddressCity(data.localidade || '');
          setAddressState(data.uf || '');
        }
      } catch (err) {
        console.error('Error fetching CEP:', err);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Abrir cropper ao invés de fazer upload direto
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    
    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperOpen(false);
    setImageToCrop('');
    
    if (!user) return;

    setIsUploading(true);

    try {
      // Criar preview local
      const localPreview = URL.createObjectURL(croppedBlob);
      setPreviewUrl(localPreview);

      // Gerar nome único para o arquivo
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;

      // Fazer upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Adicionar timestamp para evitar cache
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Atualizar perfil com nova URL
      const { error: updateError } = await updateProfile({ avatar_url: avatarUrl });

      if (updateError) throw updateError;

      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi alterada com sucesso.',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setPreviewUrl(null);
      toast({
        title: 'Erro ao enviar foto',
        description: 'Não foi possível atualizar sua foto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setImageToCrop('');
  };

  const handleRemovePhoto = async () => {
    if (!user) return;

    setIsUploading(true);

    try {
      // Listar e remover todos os arquivos do usuário na pasta avatars
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(user.id);
      
      if (files && files.length > 0) {
        const filesToDelete = files.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('avatars').remove(filesToDelete);
      }

      // Atualizar perfil para remover URL
      const { error: updateError } = await updateProfile({ avatar_url: null });

      if (updateError) throw updateError;

      setPreviewUrl(null);

      toast({
        title: 'Foto removida',
        description: 'Sua foto de perfil foi removida.',
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a foto.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, preencha seu nome completo.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    const cleanPhone = phone.replace(/[^\d]/g, '');
    const cleanCep = addressCep.replace(/[^\d]/g, '');

    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone: cleanPhone || null,
      address_cep: cleanCep || null,
      address_street: addressStreet.trim() || null,
      address_number: addressNumber.trim() || null,
      address_complement: addressComplement.trim() || null,
      address_neighborhood: addressNeighborhood.trim() || null,
      address_city: addressCity.trim() || null,
      address_state: addressState.trim() || null,
      pix_key: pixKey.trim() || null,
      pix_key_type: pixKey.trim() ? pixKeyType : null,
    });

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar seus dados. Tente novamente.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
    }

    setIsSaving(false);
  };

  if (!user || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Meu Perfil</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para ver e editar seu perfil
          </p>
          <Button asChild>
            <Link to="/login">Fazer Login</Link>
          </Button>
        </main>
      </div>
    );
  }

  const displayAvatar = previewUrl || profile?.avatar_url;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-3xl">
        <BackButton className="mb-4" />
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Banner para usuários sem foto */}
          {!displayAvatar && (
            <Card className="border-orange-500/50 bg-orange-500/10">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-3 rounded-full bg-orange-500/20">
                  <Camera className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-700 dark:text-orange-400">
                    Complete seu perfil!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Adicione uma foto de perfil para que outros jogadores possam te reconhecer nos sorteios e raspadinhas.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card de Foto */}
          <Card className={!displayAvatar ? 'ring-2 ring-orange-500/50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Foto de Perfil {!displayAvatar && <span className="text-xs text-orange-600 font-normal">(Obrigatório)</span>}
              </CardTitle>
              <CardDescription>
                Sua foto será exibida nos sorteios e no seu perfil público
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-muted">
                    <AvatarImage 
                      src={displayAvatar || undefined} 
                      alt={profile?.full_name} 
                    />
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                      {getInitials(profile?.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                {/* Botões */}
                <div className="flex flex-col gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {displayAvatar ? 'Trocar Foto' : 'Adicionar Foto'}
                  </Button>

                  {displayAvatar && (
                    <Button
                      variant="outline"
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover Foto
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou GIF. Máximo 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>
                Atualize suas informações de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user.email || ''}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone/WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={formatCPF(profile?.cpf || null)}
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      CPF não pode ser alterado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profile?.birth_date 
                          ? format(new Date(profile.birth_date), "dd/MM/yyyy")
                          : '—'
                        }
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
              <CardDescription>
                Mantenha seu endereço atualizado para entrega de prêmios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cep"
                    value={addressCep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className="pl-10"
                  />
                  {isLoadingCep && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Endereço</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="street"
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    placeholder="Rua, Avenida..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={addressComplement}
                    onChange={(e) => setAddressComplement(e.target.value)}
                    placeholder="Apto, Bloco..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={addressNeighborhood}
                  onChange={(e) => setAddressNeighborhood(e.target.value)}
                  placeholder="Bairro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="city"
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      placeholder="Cidade"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Chave PIX para Prêmios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Chave PIX para Prêmios
              </CardTitle>
              <CardDescription>
                Cadastre sua chave PIX para receber os prêmios ganhos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo da chave PIX</Label>
                <Select value={pixKeyType} onValueChange={setPixKeyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="random">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pixKey">Chave PIX</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pixKey"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder={
                      pixKeyType === 'cpf' ? '000.000.000-00' :
                      pixKeyType === 'email' ? 'seu@email.com' :
                      pixKeyType === 'phone' ? '(00) 90000-0000' :
                      'Sua chave aleatória'
                    }
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta chave será usada para enviar seus prêmios via PIX
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botão Salvar */}
          <Button 
            onClick={handleSaveProfile} 
            disabled={isSaving}
            className="w-full gap-2"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Todas as Alterações
              </>
            )}
          </Button>

          {/* Card de Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Membro desde</span>
                  </div>
                  <span className="text-sm font-medium">
                    {profile?.created_at 
                      ? format(new Date(profile.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : '—'
                    }
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Email verificado</span>
                  </div>
                  <span className={`text-sm font-medium flex items-center gap-1 ${user.email_confirmed_at ? 'text-green-600' : 'text-yellow-600'}`}>
                    {user.email_confirmed_at ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Sim
                      </>
                    ) : 'Pendente'}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Aceite LGPD</span>
                  </div>
                  <span className={`text-sm font-medium flex items-center gap-1 ${profile?.lgpd_consent ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {profile?.lgpd_consent ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {profile.lgpd_consent_at 
                          ? format(new Date(profile.lgpd_consent_at), "dd/MM/yyyy")
                          : 'Aceito'
                        }
                      </>
                    ) : '—'}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">ID do usuário</span>
                  </div>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {user.id.slice(0, 8)}...
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal de Crop para Avatar */}
        <ImageCropper
          imageSrc={imageToCrop}
          open={cropperOpen}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
          circularCrop={true}
        />
      </main>
    </div>
  );
}

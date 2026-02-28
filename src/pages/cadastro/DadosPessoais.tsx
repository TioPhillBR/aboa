import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ImageCropper } from '@/components/ui/image-cropper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, Mail, Lock, User, Trophy, Eye, EyeOff, Gift,
  Phone, CreditCard, ArrowRight, Upload, AlertCircle, Banknote
} from 'lucide-react';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { parseLocalDate } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { 
  useRegistration, 
  validateCPF, 
  maskCPF, 
  maskPhone, 
  calculateAge 
} from '@/contexts/RegistrationContext';

export default function DadosPessoais() {
  const navigate = useNavigate();
  const { personalData, setPersonalData, referralCode } = useRegistration();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ageWarning, setAgeWarning] = useState(false);
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [isCheckingCpf, setIsCheckingCpf] = useState(false);
  
  // Image cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle avatar file selection - opens cropper
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('A foto deve ter no máximo 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cropped image
  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
    const previewUrl = URL.createObjectURL(croppedBlob);
    setPersonalData({ 
      avatarFile: file,
      avatarPreview: previewUrl 
    });
    setShowCropper(false);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle birth date change and age validation
  const handleBirthDateChange = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      setPersonalData({ birthDate: isoDate });
      const age = calculateAge(date);
      setAgeWarning(age < 18);
    } else {
      setPersonalData({ birthDate: '' });
      setAgeWarning(false);
    }
  };

  // Handle CPF change with validation
  const handleCpfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = maskCPF(e.target.value);
    setPersonalData({ cpf: maskedValue });
    setCpfError(null);
    
    const cleanCpf = maskedValue.replace(/[^\d]/g, '');
    if (cleanCpf.length === 11) {
      if (!validateCPF(cleanCpf)) {
        setCpfError('CPF inválido');
        return;
      }
      
      // Check if CPF already exists
      setIsCheckingCpf(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('cpf', cleanCpf)
          .maybeSingle();
        
        if (data) {
          setCpfError('Este CPF já está cadastrado');
        }
      } catch (err) {
        console.error('Error checking CPF:', err);
      } finally {
        setIsCheckingCpf(false);
      }
    }
  };

  // Validate personal data - collect all missing fields
  const validatePersonalData = (): boolean => {
    setError(null);
    const missingFields: string[] = [];
    const validationErrors: string[] = [];
    
    // Validate profile photo (required)
    if (!personalData.avatarFile) {
      missingFields.push('Foto de Perfil');
    }
    
    if (!personalData.fullName.trim()) {
      missingFields.push('Nome Completo');
    }
    
    if (!personalData.whatsapp || personalData.whatsapp.replace(/[^\d]/g, '').length < 10) {
      if (!personalData.whatsapp) {
        missingFields.push('WhatsApp');
      } else {
        validationErrors.push('WhatsApp inválido');
      }
    }
    
    const cleanCpf = personalData.cpf.replace(/[^\d]/g, '');
    if (!cleanCpf) {
      missingFields.push('CPF');
    } else if (!validateCPF(cleanCpf)) {
      validationErrors.push('CPF inválido');
    } else if (cpfError) {
      validationErrors.push(cpfError);
    }
    
    if (!personalData.birthDate) {
      missingFields.push('Data de Nascimento');
    } else {
      const age = calculateAge(parseLocalDate(personalData.birthDate));
      if (age < 18) {
        validationErrors.push('Você precisa ter 18 anos ou mais para se cadastrar');
      }
    }
    
    if (!personalData.email) {
      missingFields.push('Email');
    }
    
    if (!personalData.password) {
      missingFields.push('Senha');
    } else if (personalData.password.length < 6) {
      validationErrors.push('A senha deve ter pelo menos 6 caracteres');
    }
    
    if (!personalData.confirmPassword) {
      missingFields.push('Confirmar Senha');
    } else if (personalData.password && personalData.password !== personalData.confirmPassword) {
      validationErrors.push('As senhas não coincidem');
    }
    
    // Validate PIX key
    if (!personalData.pixKey.trim()) {
      missingFields.push('Chave PIX');
    }
    
    // Build error message
    const errorMessages: string[] = [];
    
    if (missingFields.length > 0) {
      errorMessages.push(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }
    
    if (validationErrors.length > 0) {
      errorMessages.push(...validationErrors);
    }
    
    if (errorMessages.length > 0) {
      setError(errorMessages.join('. '));
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (validatePersonalData()) {
      navigate('/cadastro/endereco');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
          <CardDescription>Passo 1 de 2: Dados Pessoais</CardDescription>
          
          {/* Progress bar */}
          <div className="pt-4">
            <Progress value={50} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span className="text-primary font-medium">Dados Pessoais</span>
              <span>Endereço</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {referralCode && (
            <Alert className="bg-primary/10 border-primary/30">
              <Gift className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary font-medium">
                🎁 Você veio por indicação! Você ganhará R$ 5,00 de bônus ao concluir o cadastro!
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {ageWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Menores de 18 anos estão impedidos de jogar. 
                Você precisa ter 18 anos ou mais para se cadastrar.
              </AlertDescription>
            </Alert>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <Label className="text-center">Foto de Perfil *</Label>
            <label htmlFor="avatar-upload" className="relative cursor-pointer group">
              <Avatar className={`h-24 w-24 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${!personalData.avatarFile ? 'ring-2 ring-destructive/50 group-hover:ring-primary' : 'ring-2 ring-primary'}`}>
                <AvatarImage src={personalData.avatarPreview || undefined} />
                <AvatarFallback className="bg-muted">
                  <User className={`h-10 w-10 text-muted-foreground transition-transform duration-300 ${!personalData.avatarFile ? 'group-hover:scale-110' : ''}`} />
                </AvatarFallback>
              </Avatar>
              {/* Overlay on hover */}
              {!personalData.avatarFile && (
                <div className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 p-2 bg-primary rounded-full hover:bg-primary/90 transition-all duration-300 group-hover:scale-110">
                <Upload className="h-4 w-4 text-primary-foreground" />
              </div>
              <input
                ref={fileInputRef}
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
            <p className={`text-xs transition-colors duration-300 ${!personalData.avatarFile ? 'text-destructive group-hover:text-primary' : 'text-muted-foreground'}`}>
              {!personalData.avatarFile ? 'Clique para adicionar foto' : 'Obrigatório • Máximo 5MB'}
            </p>
          </div>

          {/* Image Cropper */}
          {selectedImage && (
            <ImageCropper
              imageSrc={selectedImage}
              open={showCropper}
              onClose={handleCropCancel}
              onCropComplete={handleCropComplete}
              aspectRatio={1}
              circularCrop
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={personalData.fullName}
                onChange={(e) => setPersonalData({ fullName: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="whatsapp"
                type="tel"
                placeholder="(00) 90000-0000"
                value={personalData.whatsapp}
                onChange={(e) => setPersonalData({ whatsapp: maskPhone(e.target.value) })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={personalData.cpf}
                onChange={handleCpfChange}
                className={`pl-10 ${cpfError ? 'border-destructive' : ''}`}
                required
              />
              {isCheckingCpf && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {cpfError && (
              <p className="text-xs text-destructive">{cpfError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de Nascimento *</Label>
            <DatePickerInput
              value={personalData.birthDate ? parseLocalDate(personalData.birthDate) : undefined}
              onChange={handleBirthDateChange}
              maxDate={new Date()}
              placeholder="DD/MM/AAAA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={personalData.email}
                onChange={(e) => setPersonalData({ email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={personalData.password}
                onChange={(e) => setPersonalData({ password: e.target.value })}
                className="pl-10 pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={personalData.confirmPassword}
                onChange={(e) => setPersonalData({ confirmPassword: e.target.value })}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* PIX Key Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Banknote className="h-4 w-4" />
              Chave PIX para receber prêmios
            </div>
            
            <div className="space-y-2">
              <Label>Tipo da chave PIX *</Label>
              <Select 
                value={personalData.pixKeyType} 
                onValueChange={(value: 'cpf' | 'email' | 'phone' | 'random') => setPersonalData({ pixKeyType: value })}
              >
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
              <Label htmlFor="pixKey">Chave PIX *</Label>
              <div className="relative">
                <Banknote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pixKey"
                  value={personalData.pixKey}
                  onChange={(e) => setPersonalData({ pixKey: e.target.value })}
                  placeholder={
                    personalData.pixKeyType === 'cpf' ? '000.000.000-00' :
                    personalData.pixKeyType === 'email' ? 'seu@email.com' :
                    personalData.pixKeyType === 'phone' ? '(00) 90000-0000' :
                    'Sua chave aleatória'
                  }
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Esta chave será usada para enviar seus prêmios via PIX
              </p>
            </div>
          </div>

          <Button 
            type="button" 
            onClick={handleNextStep} 
            className="w-full gap-2"
            disabled={ageWarning}
          >
            Próximo Passo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Faça login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, Mail, Lock, User, Trophy, CheckCircle2, Eye, EyeOff, Gift,
  Phone, Calendar, CreditCard, MapPin, Building, Home, ArrowRight, ArrowLeft,
  Upload, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type WizardStep = 'personal' | 'address';

interface AddressData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

// CPF validation function
function validateCPF(cpf: string): boolean {
  const cpfClean = cpf.replace(/[^\d]/g, '');
  
  if (cpfClean.length !== 11) return false;
  
  // Check for known invalid CPFs (all same digits)
  if (/^(\d)\1{10}$/.test(cpfClean)) return false;
  
  // Calculate first verification digit
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(cpfClean[i]) * (10 - i);
  }
  let digit1 = 11 - (sum1 % 11);
  if (digit1 >= 10) digit1 = 0;
  
  // Calculate second verification digit
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(cpfClean[i]) * (11 - i);
  }
  let digit2 = 11 - (sum2 % 11);
  if (digit2 >= 10) digit2 = 0;
  
  return cpfClean[9] === digit1.toString() && cpfClean[10] === digit2.toString();
}

// CPF mask function
function maskCPF(value: string): string {
  const numbers = value.replace(/[^\d]/g, '').slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Phone mask function
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

// CEP mask function
function maskCEP(value: string): string {
  const numbers = value.replace(/[^\d]/g, '').slice(0, 8);
  return numbers.replace(/(\d{5})(\d)/, '$1-$2');
}

// Calculate age from birth date
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function RegisterForm() {
  const [searchParams] = useSearchParams();
  const referralCodeFromUrl = searchParams.get('ref');
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('personal');
  
  // Personal data
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Address data
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ageWarning, setAgeWarning] = useState(false);
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  const [isCheckingCpf, setIsCheckingCpf] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  // Store referral code in localStorage to persist across signup flow
  useEffect(() => {
    if (referralCodeFromUrl) {
      localStorage.setItem('pending_referral_code', referralCodeFromUrl.toUpperCase());
    }
  }, [referralCodeFromUrl]);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('A foto deve ter no máximo 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle birth date change and age validation
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBirthDate(value);
    
    if (value) {
      const age = calculateAge(new Date(value));
      setAgeWarning(age < 18);
    } else {
      setAgeWarning(false);
    }
  };

  // Handle CPF change with validation
  const handleCpfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = maskCPF(e.target.value);
    setCpf(maskedValue);
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
        const { data, error } = await supabase
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

  // Handle CEP change with ViaCEP integration
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = maskCEP(e.target.value);
    setCep(maskedValue);
    
    const cleanCep = maskedValue.replace(/[^\d]/g, '');
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data: AddressData = await response.json();
        
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setState(data.uf || '');
        } else {
          setError('CEP não encontrado');
        }
      } catch (err) {
        console.error('Error fetching CEP:', err);
        setError('Erro ao buscar CEP');
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const processReferral = async (session: { access_token: string }) => {
    const pendingCode = localStorage.getItem('pending_referral_code');
    if (!pendingCode) return;

    try {
      const { data, error } = await supabase.functions.invoke('process-referral', {
        body: { referralCode: pendingCode },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!error && data?.success) {
        setBonusMessage(data.message);
      }
    } catch (err) {
      console.error('Error processing referral:', err);
    } finally {
      localStorage.removeItem('pending_referral_code');
    }
  };

  // Validate step 1 (personal data)
  const validatePersonalData = (): boolean => {
    setError(null);
    
    if (!fullName.trim()) {
      setError('Nome completo é obrigatório');
      return false;
    }
    
    if (!whatsapp || whatsapp.replace(/[^\d]/g, '').length < 10) {
      setError('WhatsApp inválido');
      return false;
    }
    
    const cleanCpf = cpf.replace(/[^\d]/g, '');
    if (!validateCPF(cleanCpf)) {
      setError('CPF inválido');
      return false;
    }
    
    if (cpfError) {
      setError(cpfError);
      return false;
    }
    
    if (!birthDate) {
      setError('Data de nascimento é obrigatória');
      return false;
    }
    
    const age = calculateAge(new Date(birthDate));
    if (age < 18) {
      setError('Você precisa ter 18 anos ou mais para se cadastrar');
      return false;
    }
    
    if (!email) {
      setError('Email é obrigatório');
      return false;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    
    return true;
  };

  // Validate step 2 (address)
  const validateAddress = (): boolean => {
    setError(null);
    
    if (!cep || cep.replace(/[^\d]/g, '').length !== 8) {
      setError('CEP inválido');
      return false;
    }
    
    if (!street.trim()) {
      setError('Endereço é obrigatório');
      return false;
    }
    
    if (!number.trim()) {
      setError('Número é obrigatório');
      return false;
    }
    
    if (!neighborhood.trim()) {
      setError('Bairro é obrigatório');
      return false;
    }
    
    if (!city.trim()) {
      setError('Cidade é obrigatória');
      return false;
    }
    
    if (!state.trim()) {
      setError('Estado é obrigatório');
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (validatePersonalData()) {
      setCurrentStep('address');
      setError(null);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep('personal');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAddress()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Upload avatar if provided
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
        
        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      // Sign up user
      const { error: signUpError, session } = await signUp(email, password, fullName);

      if (signUpError) {
        setError(signUpError.message || 'Erro ao criar conta. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile with additional data
      if (session?.user) {
        const cleanCpf = cpf.replace(/[^\d]/g, '');
        const cleanPhone = whatsapp.replace(/[^\d]/g, '');
        const cleanCep = cep.replace(/[^\d]/g, '');
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            phone: cleanPhone,
            cpf: cleanCpf,
            birth_date: birthDate,
            avatar_url: avatarUrl,
            address_cep: cleanCep,
            address_street: street,
            address_number: number,
            address_complement: complement || null,
            address_neighborhood: neighborhood,
            address_city: city,
            address_state: state,
          })
          .eq('id', session.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }

        // Process referral
        await processReferral(session);
      }

      setIsSuccess(true);
      
      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Conta criada com sucesso!</CardTitle>
            <CardDescription>
              Você será redirecionado para a página inicial...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bonusMessage && (
              <Alert className="bg-green-500/10 border-green-500/30">
                <Gift className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-600 dark:text-green-400 font-medium">
                  🎉 {bonusMessage}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingCode = referralCodeFromUrl || localStorage.getItem('pending_referral_code');
  const progressValue = currentStep === 'personal' ? 50 : 100;

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
          <CardDescription>
            {currentStep === 'personal' 
              ? 'Passo 1 de 2: Dados Pessoais' 
              : 'Passo 2 de 2: Endereço'}
          </CardDescription>
          
          {/* Progress bar */}
          <div className="pt-4">
            <Progress value={progressValue} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span className={currentStep === 'personal' ? 'text-primary font-medium' : ''}>
                Dados Pessoais
              </span>
              <span className={currentStep === 'address' ? 'text-primary font-medium' : ''}>
                Endereço
              </span>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {pendingCode && (
              <Alert className="bg-primary/10 border-primary/30">
                <Gift className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary font-medium">
                  🎁 Código de indicação: <strong>{pendingCode}</strong> - Você ganhará R$ 5,00 de bônus!
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

            {/* Step 1: Personal Data */}
            {currentStep === 'personal' && (
              <>
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                  <Label className="text-center">Foto de Perfil</Label>
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarPreview || undefined} />
                      <AvatarFallback className="bg-muted">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      <Upload className="h-4 w-4 text-primary-foreground" />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Opcional • Máximo 5MB</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
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
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
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
                      value={cpf}
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
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={handleBirthDateChange}
                      className="pl-10"
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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

                <Button 
                  type="button" 
                  onClick={handleNextStep} 
                  className="w-full gap-2"
                  disabled={ageWarning}
                >
                  Próximo Passo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Step 2: Address */}
            {currentStep === 'address' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cep"
                      type="text"
                      placeholder="00000-000"
                      value={cep}
                      onChange={handleCepChange}
                      className="pl-10"
                      required
                    />
                    {isLoadingCep && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Endereço *</Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="street"
                      type="text"
                      placeholder="Rua, Avenida..."
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      type="text"
                      placeholder="123"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      type="text"
                      placeholder="Apto, Bloco..."
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    type="text"
                    placeholder="Bairro"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="city"
                        type="text"
                        placeholder="Cidade"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="UF"
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                      maxLength={2}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handlePreviousStep} 
                    className="flex-1 gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </form>

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
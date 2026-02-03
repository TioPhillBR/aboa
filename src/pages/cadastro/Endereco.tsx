import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, Trophy, MapPin, Building, Home, ArrowRight, ArrowLeft, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRegistration, maskCEP } from '@/contexts/RegistrationContext';

interface ViaCepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export default function Endereco() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { 
    personalData, 
    addressData, 
    setAddressData, 
    isPersonalDataComplete,
    setBonusMessage 
  } = useRegistration();
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Redirect if personal data is not complete
  useEffect(() => {
    if (!isPersonalDataComplete) {
      navigate('/cadastro/dados-pessoais');
    }
  }, [isPersonalDataComplete, navigate]);

  // Handle CEP change with ViaCEP integration
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = maskCEP(e.target.value);
    setAddressData({ cep: maskedValue });
    
    const cleanCep = maskedValue.replace(/[^\d]/g, '');
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data: ViaCepData = await response.json();
        
        if (!data.erro) {
          setAddressData({
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
          });
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

  // Validate address - collect all missing fields
  const validateAddress = (): boolean => {
    setError(null);
    const missingFields: string[] = [];
    const validationErrors: string[] = [];
    
    if (!addressData.cep) {
      missingFields.push('CEP');
    } else if (addressData.cep.replace(/[^\d]/g, '').length !== 8) {
      validationErrors.push('CEP inválido');
    }
    
    if (!addressData.street.trim()) {
      missingFields.push('Endereço');
    }
    
    if (!addressData.number.trim()) {
      missingFields.push('Número');
    }
    
    if (!addressData.neighborhood.trim()) {
      missingFields.push('Bairro');
    }
    
    if (!addressData.city.trim()) {
      missingFields.push('Cidade');
    }
    
    if (!addressData.state.trim()) {
      missingFields.push('Estado');
    }

    if (!addressData.lgpdConsent) {
      validationErrors.push('Você precisa aceitar os Termos de Uso e Política de Privacidade');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAddress()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Upload avatar if provided
      let avatarUrl: string | null = null;
      if (personalData.avatarFile) {
        const fileExt = personalData.avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, personalData.avatarFile);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      // Sign up user
      const { error: signUpError, session } = await signUp(
        personalData.email, 
        personalData.password, 
        personalData.fullName
      );

      if (signUpError) {
        setError(signUpError.message || 'Erro ao criar conta. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile with additional data
      if (session?.user) {
        const cleanCpf = personalData.cpf.replace(/[^\d]/g, '');
        const cleanPhone = personalData.whatsapp.replace(/[^\d]/g, '');
        const cleanCep = addressData.cep.replace(/[^\d]/g, '');
        
        await supabase
          .from('profiles')
          .update({
            phone: cleanPhone,
            cpf: cleanCpf,
            birth_date: personalData.birthDate,
            avatar_url: avatarUrl,
            address_cep: cleanCep,
            address_street: addressData.street,
            address_number: addressData.number,
            address_complement: addressData.complement || null,
            address_neighborhood: addressData.neighborhood,
            address_city: addressData.city,
            address_state: addressData.state,
            lgpd_consent: addressData.lgpdConsent,
            lgpd_consent_at: addressData.lgpdConsent ? new Date().toISOString() : null,
            pix_key: personalData.pixKey.trim() || null,
            pix_key_type: personalData.pixKey.trim() ? personalData.pixKeyType : null,
          })
          .eq('id', session.user.id);

        // Process referral
        await processReferral(session);
      }

      // Navigate to confirmation page
      navigate('/cadastro/confirmacao');
      
    } catch (err) {
      console.error('Registration error:', err);
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
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
          <CardDescription>Passo 2 de 2: Endereço</CardDescription>
          
          {/* Progress bar */}
          <div className="pt-4">
            <Progress value={100} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Dados Pessoais</span>
              <span className="text-primary font-medium">Endereço</span>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cep"
                  type="text"
                  placeholder="00000-000"
                  value={addressData.cep}
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
                  value={addressData.street}
                  onChange={(e) => setAddressData({ street: e.target.value })}
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
                  value={addressData.number}
                  onChange={(e) => setAddressData({ number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  type="text"
                  placeholder="Apto, Bloco..."
                  value={addressData.complement}
                  onChange={(e) => setAddressData({ complement: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                type="text"
                placeholder="Bairro"
                value={addressData.neighborhood}
                onChange={(e) => setAddressData({ neighborhood: e.target.value })}
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
                    value={addressData.city}
                    onChange={(e) => setAddressData({ city: e.target.value })}
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
                  value={addressData.state}
                  onChange={(e) => setAddressData({ state: e.target.value.toUpperCase().slice(0, 2) })}
                  maxLength={2}
                  required
                />
              </div>
            </div>

            {/* LGPD Consent */}
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 border">
              <Checkbox
                id="lgpdConsent"
                checked={addressData.lgpdConsent}
                onCheckedChange={(checked) => setAddressData({ lgpdConsent: checked === true })}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="lgpdConsent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Aceito os Termos de Uso e Política de Privacidade *
                </label>
                <p className="text-xs text-muted-foreground">
                  Ao marcar esta opção, você concorda com nossa{' '}
                  <Link to="/politica-de-privacidade" className="text-primary hover:underline" target="_blank">
                    Política de Privacidade
                  </Link>
                  {' '}e{' '}
                  <Link to="/termos-de-uso" className="text-primary hover:underline" target="_blank">
                    Termos de Uso
                  </Link>
                  , em conformidade com a LGPD (Lei Geral de Proteção de Dados).
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/cadastro/dados-pessoais')} 
                className="flex-1 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || !addressData.lgpdConsent}>
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

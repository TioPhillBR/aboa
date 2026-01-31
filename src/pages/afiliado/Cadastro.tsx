import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUpload } from '@/components/ui/image-upload';
import { 
  Users, 
  ArrowLeft,
  Loader2,
  Instagram,
  Facebook
} from 'lucide-react';
import { useAffiliates } from '@/hooks/useAffiliates';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function AfiliadoCadastro() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { registerAffiliate, myAffiliateProfile } = useAffiliates();
  
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    phone: '',
    email: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    avatar_url: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Redirect if already an affiliate
  if (myAffiliateProfile) {
    navigate('/afiliado');
    return null;
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      toast.error('Você precisa aceitar os termos para continuar');
      return;
    }

    if (!formData.full_name || !formData.cpf) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await registerAffiliate.mutateAsync({
        full_name: formData.full_name,
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, '') || undefined,
        email: formData.email || undefined,
        address_street: formData.address_street || undefined,
        address_city: formData.address_city || undefined,
        address_state: formData.address_state || undefined,
        address_zip: formData.address_zip.replace(/\D/g, '') || undefined,
        instagram: formData.instagram || undefined,
        facebook: formData.facebook || undefined,
        tiktok: formData.tiktok || undefined,
        avatar_url: formData.avatar_url || undefined,
      });
      navigate('/afiliado');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/afiliado">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>

          <Card>
            <CardHeader className="text-center">
              <div className="relative inline-block mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-30" />
                <div className="relative p-4 rounded-full bg-gradient-primary">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl">Cadastro de Afiliado</CardTitle>
              <CardDescription>
                Preencha seus dados para se tornar um afiliado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="flex justify-center">
                  <ImageUpload
                    label="Foto de Perfil"
                    value={formData.avatar_url}
                    onChange={(url) => handleChange('avatar_url', url)}
                    bucket="avatars"
                    folder="affiliates"
                    aspectRatio="square"
                    className="max-w-[200px]"
                  />
                </div>

                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Dados Pessoais</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="full_name">Nome Completo *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleChange('full_name', e.target.value)}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => handleChange('cpf', formatCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Endereço</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="address_street">Rua/Endereço</Label>
                      <Input
                        id="address_street"
                        value={formData.address_street}
                        onChange={(e) => handleChange('address_street', e.target.value)}
                        placeholder="Rua, número, complemento"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address_city">Cidade</Label>
                      <Input
                        id="address_city"
                        value={formData.address_city}
                        onChange={(e) => handleChange('address_city', e.target.value)}
                        placeholder="Sua cidade"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="address_state">Estado</Label>
                        <Input
                          id="address_state"
                          value={formData.address_state}
                          onChange={(e) => handleChange('address_state', e.target.value.toUpperCase())}
                          placeholder="UF"
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address_zip">CEP</Label>
                        <Input
                          id="address_zip"
                          value={formData.address_zip}
                          onChange={(e) => handleChange('address_zip', formatCEP(e.target.value))}
                          placeholder="00000-000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Redes Sociais</h3>
                  
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="instagram" className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) => handleChange('instagram', e.target.value.replace('@', ''))}
                        placeholder="seu_usuario"
                      />
                    </div>

                    <div>
                      <Label htmlFor="facebook" className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </Label>
                      <Input
                        id="facebook"
                        value={formData.facebook}
                        onChange={(e) => handleChange('facebook', e.target.value)}
                        placeholder="URL do perfil"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tiktok">TikTok</Label>
                      <Input
                        id="tiktok"
                        value={formData.tiktok}
                        onChange={(e) => handleChange('tiktok', e.target.value.replace('@', ''))}
                        placeholder="seu_usuario"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    Li e aceito os termos e condições do programa de afiliados. Entendo que as comissões serão pagas conforme as regras estabelecidas e que preciso manter meus dados atualizados.
                  </Label>
                </div>

                {/* Submit */}
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={registerAffiliate.isPending || !acceptedTerms}
                >
                  {registerAffiliate.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    'Cadastrar como Afiliado'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
